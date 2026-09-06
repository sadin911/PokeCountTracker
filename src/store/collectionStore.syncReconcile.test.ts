import { describe, it, expect, vi, beforeEach } from 'vitest';

const setDocMock = vi.hoisted(() => vi.fn(async () => undefined));
const getDocsMock = vi.hoisted(() =>
  vi.fn(async () => ({
    empty: false,
    forEach: (cb: (doc: any) => void) => {
      cb({
        data: () => ({
          id: 'default-profile',
          name: 'My Main Collection',
          cards: {
            'TH-25': {
              cardId: 'TH-25',
              variants: { normal: 2, holo: 0, reverse: 0, promo: 0 },
              updatedAt: 2000,
            },
          },
          createdAt: 1000,
          updatedAt: 2000,
          schemaVersion: 2,
        }),
      });
    },
  }))
);

vi.mock('firebase/firestore', () => ({
  doc: (...segments: unknown[]) => ({ path: segments.slice(1).join('/') }),
  collection: (...segments: unknown[]) => ({ path: segments.slice(1).join('/') }),
  setDoc: setDocMock,
  getDocs: getDocsMock,
  deleteDoc: vi.fn(async () => undefined),
}));

vi.mock('../utils/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } },
}));

import {
  reconcileProfiles,
  sanitizeForFirestore,
  harvestAllLocalProfiles,
  SAFEGUARD_STORAGE_KEY,
  useCollectionStore,
} from './collectionStore';
import type { CollectionProfile, CollectionCardEntry } from '../types/collection';

function makeProfile(
  id: string,
  cards: Record<string, CollectionCardEntry> = {},
  updatedAt: number = Date.now()
): CollectionProfile {
  return {
    id,
    name: 'Test Binder',
    icon: '🎴',
    cards,
    createdAt: 1000,
    updatedAt,
    schemaVersion: 2,
  };
}

function installMemoryStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    get length() {
      return data.size;
    },
    key: (index: number) => Array.from(data.keys())[index] ?? null,
  });
}

describe('reconcileProfiles (Smart Card-Level Reconciliation)', () => {
  it('preserves cards that only exist in Cloud (e.g. imported from Chrome desktop)', () => {
    const localProf = makeProfile('binder-1', {}, 1000);
    const cloudProf = makeProfile(
      'binder-1',
      {
        'TH-25': {
          cardId: 'TH-25',
          variants: { normal: 2, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 2000,
        },
      },
      2000
    );

    const { merged, hasChanges } = reconcileProfiles(localProf, cloudProf);
    expect(merged.cards['TH-25']).toBeDefined();
    expect(merged.cards['TH-25'].variants.normal).toBe(2);
    expect(hasChanges).toBe(true);
  });

  it('preserves cards that only exist in Local (e.g. added on PWA before sync)', () => {
    const localProf = makeProfile(
      'binder-1',
      {
        'TH-6': {
          cardId: 'TH-6',
          variants: { normal: 0, holo: 1, reverse: 0, promo: 0 },
          updatedAt: 2000,
        },
      },
      2000
    );
    const cloudProf = makeProfile('binder-1', {}, 1000);

    const { merged, hasChanges } = reconcileProfiles(localProf, cloudProf);
    expect(merged.cards['TH-6']).toBeDefined();
    expect(merged.cards['TH-6'].variants.holo).toBe(1);
    expect(hasChanges).toBe(true);
  });

  it('resolves conflicting card edits by taking the newer updatedAt timestamp while preserving highest variant counts via Math.max', () => {
    const localProf = makeProfile(
      'binder-1',
      {
        'TH-25': {
          cardId: 'TH-25',
          variants: { normal: 1, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 3000, // Newer local edit
        },
      },
      3000
    );
    const cloudProf = makeProfile(
      'binder-1',
      {
        'TH-25': {
          cardId: 'TH-25',
          variants: { normal: 5, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 2000, // Older cloud edit
        },
      },
      2000
    );

    const { merged } = reconcileProfiles(localProf, cloudProf);
    // Math.max guarantees highest variant count is preserved (5) rather than wiping copies
    expect(merged.cards['TH-25'].variants.normal).toBe(5);
    expect(merged.cards['TH-25'].updatedAt).toBeGreaterThanOrEqual(3000);
  });

  it('safely merges non-conflicting simultaneous edits across different cards', () => {
    const localProf = makeProfile(
      'binder-1',
      {
        'TH-1': {
          cardId: 'TH-1',
          variants: { normal: 1, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 2000,
        },
      },
      2000
    );
    const cloudProf = makeProfile(
      'binder-1',
      {
        'TH-2': {
          cardId: 'TH-2',
          variants: { normal: 3, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 2100,
        },
      },
      2100
    );

    const { merged } = reconcileProfiles(localProf, cloudProf);
    expect(merged.cards['TH-1']).toBeDefined();
    expect(merged.cards['TH-1'].variants.normal).toBe(1);
    expect(merged.cards['TH-2']).toBeDefined();
    expect(merged.cards['TH-2'].variants.normal).toBe(3);
  });

  it('guarantees NO undefined fields in merged card entries (avoids Firestore invalid data crash)', () => {
    const localProf = makeProfile('binder-1', {
      'TH-1': {
        cardId: 'TH-1',
        variants: { normal: 1, holo: 0, reverse: 0, promo: 0 },
        updatedAt: 1000,
        // isWishlist and note are omitted / undefined
      },
    });
    const cloudProf = makeProfile('binder-1', {
      'TH-2': {
        cardId: 'TH-2',
        variants: { normal: 2, holo: 0, reverse: 0, promo: 0 },
        updatedAt: 2000,
        // isWishlist and note are omitted / undefined
      },
    });

    const { merged } = reconcileProfiles(localProf, cloudProf);
    for (const card of Object.values(merged.cards)) {
      expect(Object.prototype.hasOwnProperty.call(card, 'isWishlist')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(card, 'note')).toBe(false);
      expect(card.isWishlist).toBeUndefined(); // Accessing returns undefined, but the key does not exist!
      expect(JSON.stringify(card)).not.toContain('"isWishlist":');
      expect(JSON.stringify(card)).not.toContain('"note":');
    }
  });

  it('merges variant quantities using Math.max across local and cloud', () => {
    const localProf = makeProfile('binder-1', {
      'TH-1': {
        cardId: 'TH-1',
        variants: { normal: 3, holo: 0, reverse: 2, promo: 0 },
        updatedAt: 1000,
      },
    });
    const cloudProf = makeProfile('binder-1', {
      'TH-1': {
        cardId: 'TH-1',
        variants: { normal: 1, holo: 4, reverse: 1, promo: 1 },
        updatedAt: 1000,
      },
    });

    const { merged } = reconcileProfiles(localProf, cloudProf);
    expect(merged.cards['TH-1'].variants.normal).toBe(3); // max(3, 1)
    expect(merged.cards['TH-1'].variants.holo).toBe(4); // max(0, 4)
    expect(merged.cards['TH-1'].variants.reverse).toBe(2); // max(2, 1)
    expect(merged.cards['TH-1'].variants.promo).toBe(1); // max(0, 1)
  });
});

describe('sanitizeForFirestore', () => {
  it('recursively strips undefined values so Firestore never rejects the document', () => {
    const dirty = {
      id: 'test',
      name: 'Binder',
      cards: {
        'TH-1': {
          cardId: 'TH-1',
          variants: { normal: 1, holo: 0, reverse: 0, promo: 0 },
          isWishlist: undefined,
          note: undefined,
          condition: undefined,
        },
      },
      extra: undefined,
    };

    const cleaned = sanitizeForFirestore(dirty);
    expect(cleaned).toEqual({
      id: 'test',
      name: 'Binder',
      cards: {
        'TH-1': {
          cardId: 'TH-1',
          variants: { normal: 1, holo: 0, reverse: 0, promo: 0 },
        },
      },
    });
    expect(Object.prototype.hasOwnProperty.call(cleaned, 'extra')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(cleaned.cards['TH-1'], 'isWishlist')).toBe(false);
  });
});

describe('harvestAllLocalProfiles & Safeguard Backup', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('harvests profiles from user cache and guest profiles into memory and writes a durable safeguard', () => {
    const inMemProfiles = {
      'binder-inmem': makeProfile('binder-inmem', {
        'TH-1': {
          cardId: 'TH-1',
          variants: { normal: 1, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 100,
        },
      }),
    };

    const cachedUserProfiles = {
      'binder-cached': makeProfile('binder-cached', {
        'TH-2': {
          cardId: 'TH-2',
          variants: { normal: 2, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 200,
        },
      }),
    };

    const guestProfiles = {
      'binder-guest': makeProfile('binder-guest', {
        'TH-3': {
          cardId: 'TH-3',
          variants: { normal: 3, holo: 0, reverse: 0, promo: 0 },
          updatedAt: 300,
        },
      }),
    };

    localStorage.setItem('pokecount_user_cache_test-user-123', JSON.stringify(cachedUserProfiles));
    localStorage.setItem('pokecount_guest_profiles_v2', JSON.stringify(guestProfiles));

    const harvested = harvestAllLocalProfiles('test-user-123', inMemProfiles);

    expect(harvested['binder-inmem']).toBeDefined();
    expect(harvested['binder-cached']).toBeDefined();
    expect(harvested['binder-guest']).toBeDefined();

    // Check safeguard backup in localStorage
    const safeguardRaw = localStorage.getItem(SAFEGUARD_STORAGE_KEY);
    expect(safeguardRaw).not.toBeNull();
    const safeguard = JSON.parse(safeguardRaw!);
    expect(safeguard.profiles['binder-inmem']).toBeDefined();
    expect(safeguard.profiles['binder-cached']).toBeDefined();
    expect(safeguard.profiles['binder-guest']).toBeDefined();
  });
});

describe('useCollectionStore.reconcileWithCloud & loadUserFromCloud', () => {
  beforeEach(() => {
    installMemoryStorage();
    setDocMock.mockClear();
    getDocsMock.mockClear();
    localStorage.clear();

    useCollectionStore.setState({
      profiles: {
        'default-profile': makeProfile('default-profile', {
          'TH-10': {
            cardId: 'TH-10',
            variants: { normal: 1, holo: 0, reverse: 0, promo: 0 },
            updatedAt: 1500,
          },
        }),
      },
      activeProfileId: 'default-profile',
      cloudLoadedUid: 'test-user-123',
    });
  });

  it('forceSyncCloud delegates to reconcileWithCloud, merges cards and succeeds', async () => {
    const res = await useCollectionStore.getState().forceSyncCloud('test-user-123');
    expect(res).toBe(true);
    expect(useCollectionStore.getState().syncStatus).toBe('synced');

    const state = useCollectionStore.getState();
    const activeCards = state.profiles['default-profile'].cards;
    // Both TH-10 (from local) and TH-25 (from cloud) should be present in the merged profile!
    expect(activeCards['TH-10']).toBeDefined();
    expect(activeCards['TH-25']).toBeDefined();
    expect(setDocMock).toHaveBeenCalled();
  });

  it('loadUserFromCloud runs two-way reconciliation and does NOT wipe local cards', async () => {
    await useCollectionStore.getState().loadUserFromCloud('test-user-123');

    const state = useCollectionStore.getState();
    const activeCards = state.profiles['default-profile'].cards;
    // Local cards on iPhone (TH-10) MUST remain intact after loadUserFromCloud!
    expect(activeCards['TH-10']).toBeDefined();
    expect(activeCards['TH-25']).toBeDefined();
  });
});
