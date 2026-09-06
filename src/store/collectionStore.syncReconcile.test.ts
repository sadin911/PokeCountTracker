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

import { reconcileProfiles, useCollectionStore } from './collectionStore';
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

  it('resolves conflicting card edits by taking the newer updatedAt timestamp', () => {
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
    expect(merged.cards['TH-25'].variants.normal).toBe(1);
    expect(merged.cards['TH-25'].updatedAt).toBe(3000);
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
});

describe('useCollectionStore.reconcileWithCloud', () => {
  beforeEach(() => {
    setDocMock.mockClear();
    getDocsMock.mockClear();

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
});
