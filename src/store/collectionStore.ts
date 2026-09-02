import { create } from 'zustand';
import { doc, setDoc, getDocs, deleteDoc, collection } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import pokemonCardData from '../data/pokemonNames.json';
import { parseCollectionText } from '../utils/collectionTextParser';
import type {
  CardVariantKey,
  CardCondition,
  CollectionCardEntry,
  CollectionProfile,
  CollectionFilters,
} from '../types/collection';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface CollectionState {
  profiles: Record<string, CollectionProfile>;
  activeProfileId: string;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  /**
   * The uid whose binders have actually been read into this store.
   *
   * Writes are whole-document, so pushing before the read completes replaces
   * the user's binder with whatever the store happens to hold — which, during
   * the boot window, is the empty guest binder. Nothing writes to a user's
   * cloud binder until this matches the signed-in uid.
   */
  cloudLoadedUid: string | null;

  // Filter persistence
  filters: CollectionFilters;
  setFilters: (filters: Partial<CollectionFilters>) => void;
  resetFilters: () => void;

  // Profile management
  createProfile: (name: string, icon?: string) => string;
  switchProfile: (profileId: string) => void;
  renameProfile: (profileId: string, name: string) => void;
  deleteProfile: (profileId: string) => void;

  // Card collection actions (operates on activeProfile)
  setVariantCount: (cardId: string, variant: CardVariantKey, count: number) => void;
  incrementVariant: (cardId: string, variant: CardVariantKey) => void;
  decrementVariant: (cardId: string, variant: CardVariantKey) => void;
  toggleWishlist: (cardId: string) => void;
  setCardDetails: (
    cardId: string,
    details: { condition?: CardCondition; note?: string }
  ) => void;
  clearCard: (cardId: string) => void;

  // Cloud Sync & Auth Session Actions
  loadUserFromCloud: (uid: string) => Promise<boolean>;
  syncProfileToCloud: (profileId: string) => Promise<void>;
  uploadLocalProfilesToCloud: (uid: string) => Promise<void>;
  forceSyncCloud: (uid: string) => Promise<boolean>;
  resetToGuest: () => void;

  // Backup & Restore
  exportCollectionJSON: () => string;
  importCollectionJSON: (jsonString: string) => { success: boolean; message: string };
  importCollectionText: (
    text: string,
    options?: {
      mode?: 'merge' | 'replace';
      finish?: CardVariantKey;
      profileId?: string;
    }
  ) => {
    success: boolean;
    message: string;
    cardsImportedCount: number;
    distinctCardsCount: number;
    unmatchedLines: string[];
    setsFound: string[];
  };
}

const DEFAULT_PROFILE_ID = 'default-main-profile';
const GUEST_STORAGE_KEY = 'pokecount_guest_profiles_v2';
const USER_CACHE_KEY_PREFIX = 'pokecount_user_cache_';
const FILTERS_STORAGE_KEY = 'pokecount_collection_filters_v1';

/**
 * Version 2 = binder documents are written whole rather than merged.
 *
 * Until v2, syncProfileToCloud used setDoc(..., { merge: true }). Because
 * `cards` is a map field, a merge only ever adds or updates keys — it never
 * removes the ones the client dropped. Clearing a card therefore updated the
 * UI and localStorage but left the entry in Firestore forever, and the next
 * loadUserFromCloud pulled it straight back onto the device.
 */
const BINDER_SCHEMA_VERSION = 2;

/** Total copies across every variant of one entry. */
function entryTotal(entry?: CollectionCardEntry): number {
  if (!entry?.variants) return 0;
  return Object.values(entry.variants).reduce<number>((a, b) => a + (Number(b) || 0), 0);
}

/** An entry carrying no information at all — safe to drop. */
function isEmptyEntry(entry?: CollectionCardEntry): boolean {
  if (!entry) return true;
  return entryTotal(entry) === 0 && !entry.isWishlist && !entry.note;
}

/**
 * Drop entries that say nothing. Pre-v2 documents accumulated these because
 * setCardDetails wrote a zeroed entry for any card that was given a note or
 * condition and then cleared.
 */
function pruneProfile(profile: CollectionProfile): { profile: CollectionProfile; removed: number } {
  const cards: Record<string, CollectionCardEntry> = {};
  let removed = 0;
  for (const [cardId, entry] of Object.entries(profile.cards || {})) {
    if (isEmptyEntry(entry)) removed++;
    else cards[cardId] = entry;
  }
  return { profile: { ...profile, cards }, removed };
}

export const DEFAULT_COLLECTION_FILTERS: CollectionFilters = {
  selectedSet: 'ALL',
  selectedRegulation: 'ALL',
  statusFilter: 'all',
  search: '',
  selectedType: 'ALL',
  selectedCategory: 'ALL',
  selectedStage: 'ALL',
  selectedRarity: 'ALL',
  sortBy: 'number',
  sortOrder: 'asc',
  showFullColor: true,
};

function loadInitialFilters(): CollectionFilters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COLLECTION_FILTERS, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_COLLECTION_FILTERS;
}

function createDefaultProfile(): CollectionProfile {
  return {
    id: DEFAULT_PROFILE_ID,
    name: 'My Main Collection',
    icon: '🎴',
    cards: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function emptyVariants() {
  return { normal: 0, holo: 0, reverse: 0, promo: 0 };
}

// Load initial state for Guest
function loadInitialGuestData(): { profiles: Record<string, CollectionProfile>; activeProfileId: string } {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.profiles && Object.keys(parsed.profiles).length > 0) {
        return {
          profiles: parsed.profiles,
          activeProfileId: parsed.activeProfileId || Object.keys(parsed.profiles)[0],
        };
      }
    }
  } catch (e) {}

  return {
    profiles: { [DEFAULT_PROFILE_ID]: createDefaultProfile() },
    activeProfileId: DEFAULT_PROFILE_ID,
  };
}

// Debounce timer for saving to Firestore
let saveTimeout: any = null;

function triggerSave(get: () => CollectionState, profileId: string) {
  const user = auth.currentUser;
  const state = get();

  if (user) {
    // Save to user local cache
    try {
      localStorage.setItem(
        `${USER_CACHE_KEY_PREFIX}${user.uid}`,
        JSON.stringify({ profiles: state.profiles, activeProfileId: state.activeProfileId })
      );
    } catch (e) {}

    // Debounce save to Firestore
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      state.syncProfileToCloud(profileId);
    }, 600);
  } else {
    // Save to Guest local storage
    try {
      localStorage.setItem(
        GUEST_STORAGE_KEY,
        JSON.stringify({ profiles: state.profiles, activeProfileId: state.activeProfileId })
      );
    } catch (e) {}
  }
}

const initialGuest = loadInitialGuestData();

export const useCollectionStore = create<CollectionState>((set, get) => ({
  profiles: initialGuest.profiles,
  activeProfileId: initialGuest.activeProfileId,
  syncStatus: 'idle',
  lastSyncedAt: null,
  cloudLoadedUid: null,
  filters: loadInitialFilters(),

  setFilters: (newFilters: Partial<CollectionFilters>) => {
    set((state) => {
      const updated = { ...state.filters, ...newFilters };
      try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return { filters: updated };
    });
  },

  resetFilters: () => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(DEFAULT_COLLECTION_FILTERS));
    } catch (e) {}
    set({ filters: DEFAULT_COLLECTION_FILTERS });
  },

  createProfile: (name: string, icon = '📁') => {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const trimmedName = name.trim() || 'New Binder';
    const newProfile: CollectionProfile = {
      id,
      name: trimmedName,
      icon,
      cards: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      profiles: {
        ...state.profiles,
        [id]: newProfile,
      },
      activeProfileId: id,
    }));

    triggerSave(get, id);
    return id;
  },

  switchProfile: (profileId: string) => {
    if (get().profiles[profileId]) {
      set({ activeProfileId: profileId });
      const user = auth.currentUser;
      const key = user ? `${USER_CACHE_KEY_PREFIX}${user.uid}` : GUEST_STORAGE_KEY;
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ profiles: get().profiles, activeProfileId: profileId })
        );
      } catch (e) {}
    }
  },

  renameProfile: (profileId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => {
      const profile = state.profiles[profileId];
      if (!profile) return state;
      return {
        profiles: {
          ...state.profiles,
          [profileId]: {
            ...profile,
            name: trimmed,
            updatedAt: Date.now(),
          },
        },
      };
    });
    triggerSave(get, profileId);
  },

  deleteProfile: (profileId: string) => {
    const user = auth.currentUser;
    const state = get();

    // Check the guard BEFORE touching Firestore. Deleting the remote document
    // first and only then refusing wiped your last binder from the cloud while
    // leaving it on the device — it then vanished for good the next time the
    // local cache was cleared.
    if (Object.keys(state.profiles).length <= 1 || !state.profiles[profileId]) return;

    const newProfiles = { ...state.profiles };
    delete newProfiles[profileId];
    const newActive =
      state.activeProfileId === profileId ? Object.keys(newProfiles)[0] : state.activeProfileId;

    set({ profiles: newProfiles, activeProfileId: newActive });

    // Writing localStorage inside the set() updater made it a side effect in a
    // reducer, which fires twice under StrictMode.
    const key = user ? `${USER_CACHE_KEY_PREFIX}${user.uid}` : GUEST_STORAGE_KEY;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ profiles: newProfiles, activeProfileId: newActive })
      );
    } catch (e) {}

    if (user) {
      deleteDoc(doc(db, 'users', user.uid, 'binders', profileId)).catch(console.error);
    }
  },

  setVariantCount: (cardId: string, variant: CardVariantKey, count: number) => {
    const validCount = Math.max(0, Math.floor(count));
    const activeId = get().activeProfileId;

    set((state) => {
      const profile = state.profiles[state.activeProfileId];
      if (!profile) return state;

      const existingEntry: CollectionCardEntry = profile.cards[cardId] || {
        cardId,
        variants: emptyVariants(),
        updatedAt: Date.now(),
      };

      const newVariants = {
        ...existingEntry.variants,
        [variant]: validCount,
      };

      const total = Object.values(newVariants).reduce((a, b) => a + b, 0);

      const newCards = { ...profile.cards };
      if (total === 0 && !existingEntry.isWishlist && !existingEntry.note) {
        delete newCards[cardId];
      } else {
        newCards[cardId] = {
          ...existingEntry,
          variants: newVariants,
          updatedAt: Date.now(),
        };
      }

      return {
        profiles: {
          ...state.profiles,
          [state.activeProfileId]: {
            ...profile,
            cards: newCards,
            updatedAt: Date.now(),
          },
        },
      };
    });

    triggerSave(get, activeId);
  },

  incrementVariant: (cardId: string, variant: CardVariantKey) => {
    const { profiles, activeProfileId, setVariantCount } = get();
    const profile = profiles[activeProfileId];
    const currentCount = profile?.cards[cardId]?.variants[variant] || 0;
    setVariantCount(cardId, variant, currentCount + 1);
  },

  decrementVariant: (cardId: string, variant: CardVariantKey) => {
    const { profiles, activeProfileId, setVariantCount } = get();
    const profile = profiles[activeProfileId];
    const currentCount = profile?.cards[cardId]?.variants[variant] || 0;
    setVariantCount(cardId, variant, Math.max(0, currentCount - 1));
  },

  toggleWishlist: (cardId: string) => {
    const activeId = get().activeProfileId;

    set((state) => {
      const profile = state.profiles[state.activeProfileId];
      if (!profile) return state;

      const existingEntry: CollectionCardEntry = profile.cards[cardId] || {
        cardId,
        variants: emptyVariants(),
        updatedAt: Date.now(),
      };

      const nextWishlist = !existingEntry.isWishlist;
      const total = Object.values(existingEntry.variants).reduce((a, b) => a + b, 0);

      const newCards = { ...profile.cards };
      if (!nextWishlist && total === 0 && !existingEntry.note) {
        delete newCards[cardId];
      } else {
        newCards[cardId] = {
          ...existingEntry,
          isWishlist: nextWishlist,
          updatedAt: Date.now(),
        };
      }

      return {
        profiles: {
          ...state.profiles,
          [state.activeProfileId]: {
            ...profile,
            cards: newCards,
            updatedAt: Date.now(),
          },
        },
      };
    });

    triggerSave(get, activeId);
  },

  setCardDetails: (cardId: string, details: { condition?: CardCondition; note?: string }) => {
    const activeId = get().activeProfileId;

    set((state) => {
      const profile = state.profiles[state.activeProfileId];
      if (!profile) return state;

      const existingEntry: CollectionCardEntry = profile.cards[cardId] || {
        cardId,
        variants: emptyVariants(),
        updatedAt: Date.now(),
      };

      const updatedEntry: CollectionCardEntry = {
        ...existingEntry,
        condition: details.condition ?? existingEntry.condition,
        note: details.note !== undefined ? details.note : existingEntry.note,
        updatedAt: Date.now(),
      };

      const newCards = { ...profile.cards };
      // Prune like the other mutators do. Without this, giving an unowned card
      // a note and then clearing it left a zeroed entry in the binder forever.
      if (isEmptyEntry(updatedEntry)) delete newCards[cardId];
      else newCards[cardId] = updatedEntry;

      return {
        profiles: {
          ...state.profiles,
          [state.activeProfileId]: {
            ...profile,
            cards: newCards,
            updatedAt: Date.now(),
          },
        },
      };
    });

    triggerSave(get, activeId);
  },

  clearCard: (cardId: string) => {
    const activeId = get().activeProfileId;

    set((state) => {
      const profile = state.profiles[state.activeProfileId];
      if (!profile || !profile.cards[cardId]) return state;

      const newCards = { ...profile.cards };
      delete newCards[cardId];

      return {
        profiles: {
          ...state.profiles,
          [state.activeProfileId]: {
            ...profile,
            cards: newCards,
            updatedAt: Date.now(),
          },
        },
      };
    });

    triggerSave(get, activeId);
  },

  // Cloud Sync Implementation
  syncProfileToCloud: async (profileId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    // The gate. Between Firebase restoring the session and loadUserFromCloud
    // returning, the user looks signed in while the store still holds the empty
    // guest binder. A write here would replace their real binder with it.
    if (get().cloudLoadedUid !== user.uid) {
      console.warn(
        '[collection] skipped a cloud write: binders for this account have not been loaded yet'
      );
      return;
    }

    const profile = get().profiles[profileId];
    if (!profile) return;

    set({ syncStatus: 'syncing' });
    try {
      const docRef = doc(db, 'users', user.uid, 'binders', profileId);
      // Whole-document write, NOT { merge: true }: a merge cannot remove cards
      // the user cleared. The trade-off is that two devices editing the same
      // binder at once become last-write-wins per binder rather than per card,
      // which is the right side of the trade for a personal collection.
      await setDoc(docRef, { ...profile, schemaVersion: BINDER_SCHEMA_VERSION });
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });
    } catch (err) {
      console.error('Failed to sync binder to Firestore:', err);
      set({ syncStatus: 'error' });
    }
  },

  loadUserFromCloud: async (uid: string) => {
    set({ syncStatus: 'syncing' });
    try {
      // 1. Try to load from user local cache first for instant UI response
      let cachedActiveId: string | null = null;
      const cached = localStorage.getItem(`${USER_CACHE_KEY_PREFIX}${uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.profiles && Object.keys(parsed.profiles).length > 0) {
            cachedActiveId = parsed.activeProfileId || null;
            set({
              profiles: parsed.profiles,
              activeProfileId: parsed.activeProfileId || Object.keys(parsed.profiles)[0],
            });
          }
        } catch (e) {}
      }

      // 2. Fetch ground truth from Firestore
      const bindersCol = collection(db, 'users', uid, 'binders');
      const snap = await getDocs(bindersCol);

      if (!snap.empty) {
        const cloudProfiles: Record<string, CollectionProfile> = {};
        snap.forEach((d) => {
          const data = d.data() as CollectionProfile;
          if (data && data.id) {
            cloudProfiles[data.id] = data;
          }
        });

        if (Object.keys(cloudProfiles).length > 0) {
          // One-time migration of pre-v2 binders. Each is pruned of entries
          // that carry no information and rewritten as a whole document, which
          // both cleans up the junk merges accumulated and stamps the binder so
          // this never runs for it again.
          //
          // It cannot undo the damage already done: a card cleared before the
          // fix looks identical to one the user genuinely owns, because the
          // merge preserved its original counts. That intent is not recoverable.
          // What this does is stop the drift and remove the empty entries.
          const stale = Object.values(cloudProfiles).filter(
            (p) => (p.schemaVersion ?? 1) < BINDER_SCHEMA_VERSION
          );

          if (stale.length > 0) {
            let removedTotal = 0;
            await Promise.all(
              stale.map(async (p) => {
                const { profile, removed } = pruneProfile(p);
                removedTotal += removed;
                const migrated = { ...profile, schemaVersion: BINDER_SCHEMA_VERSION };
                cloudProfiles[p.id] = migrated;
                await setDoc(doc(db, 'users', uid, 'binders', p.id), migrated);
              })
            ).catch((err) => {
              // A failed migration is not fatal — the binders still load, and
              // the next sign-in retries. Don't block the user on it.
              console.warn('Binder migration failed, will retry next sign-in:', err);
            });
            console.info(
              `[collection] migrated ${stale.length} binder(s) to schema v${BINDER_SCHEMA_VERSION}` +
                (removedTotal ? `, pruned ${removedTotal} empty entr${removedTotal === 1 ? 'y' : 'ies'}` : '')
            );
          }

          // Keep the binder the user was last looking at. Unconditionally
          // taking the first key reset their selection on every sign-in, in
          // whatever order Firestore happened to return the documents.
          const activeId =
            cachedActiveId && cloudProfiles[cachedActiveId]
              ? cachedActiveId
              : Object.keys(cloudProfiles)[0];
          set({
            profiles: cloudProfiles,
            activeProfileId: activeId,
            syncStatus: 'synced',
            lastSyncedAt: Date.now(),
            cloudLoadedUid: uid,
          });

          // Save to user local cache
          localStorage.setItem(
            `${USER_CACHE_KEY_PREFIX}${uid}`,
            JSON.stringify({ profiles: cloudProfiles, activeProfileId: activeId })
          );
          return true;
        }
      }

      // 3. If cloud has no binders yet, check if we should upload local profiles
      const current = get().profiles;
      const hasCards = Object.values(current).some(
        (p) => Object.keys(p.cards || {}).length > 0
      );

      if (hasCards) {
        // Local edits made before signing in are the only thing there is, so
        // seeding the cloud from them is correct — and makes the store
        // authoritative from here on.
        set({ cloudLoadedUid: uid });
        await get().uploadLocalProfilesToCloud(uid);
      } else {
        // Create initial default profile on cloud
        const defaultProf = createDefaultProfile();
        const docRef = doc(db, 'users', uid, 'binders', defaultProf.id);
        await setDoc(docRef, defaultProf);
        set({
          profiles: { [defaultProf.id]: defaultProf },
          activeProfileId: defaultProf.id,
          syncStatus: 'synced',
          lastSyncedAt: Date.now(),
          cloudLoadedUid: uid,
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to load user binders from cloud:', err);
      set({ syncStatus: 'error' });
      return false;
    }
  },

  uploadLocalProfilesToCloud: async (uid: string) => {
    set({ syncStatus: 'syncing' });
    try {
      const { profiles } = get();
      for (const [id, p] of Object.entries(profiles)) {
        const docRef = doc(db, 'users', uid, 'binders', id);
        await setDoc(docRef, { ...p, schemaVersion: BINDER_SCHEMA_VERSION });
      }
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });

      localStorage.setItem(
        `${USER_CACHE_KEY_PREFIX}${uid}`,
        JSON.stringify({ profiles, activeProfileId: get().activeProfileId })
      );
    } catch (err) {
      console.error('Failed to upload local binders to cloud:', err);
      set({ syncStatus: 'error' });
    }
  },

  forceSyncCloud: async (uid: string) => {
    // Deliberately gated too. If the binders have not been read yet, the safe
    // action is to read them, not to push whatever is in memory over the top.
    if (get().cloudLoadedUid !== uid) {
      console.warn('[collection] force sync skipped: binders have not been loaded yet');
      return false;
    }

    set({ syncStatus: 'syncing' });
    try {
      const { profiles, activeProfileId } = get();
      for (const [id, p] of Object.entries(profiles)) {
        const docRef = doc(db, 'users', uid, 'binders', id);
        await setDoc(docRef, { ...p, schemaVersion: BINDER_SCHEMA_VERSION });
      }
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });

      localStorage.setItem(
        `${USER_CACHE_KEY_PREFIX}${uid}`,
        JSON.stringify({ profiles, activeProfileId })
      );
      return true;
    } catch (err) {
      console.error('Failed to force sync binders to cloud:', err);
      set({ syncStatus: 'error' });
      return false;
    }
  },

  // Reset back to Guest Mode state on Logout
  resetToGuest: () => {
    const guestData = loadInitialGuestData();
    set({
      profiles: guestData.profiles,
      activeProfileId: guestData.activeProfileId,
      syncStatus: 'idle',
      lastSyncedAt: null,
      // Closing the gate matters as much as opening it: this also runs on a
      // transient auth blip, and the next session must re-read before writing.
      cloudLoadedUid: null,
    });
  },

  exportCollectionJSON: () => {
    const state = get();
    const exportPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      activeProfileId: state.activeProfileId,
      profiles: state.profiles,
    };
    return JSON.stringify(exportPayload, null, 2);
  },

  importCollectionJSON: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object' || !data.profiles) {
        return { success: false, message: 'Invalid JSON format for collection backup.' };
      }

      const importedProfiles: Record<string, CollectionProfile> = {};
      for (const [id, p] of Object.entries(data.profiles)) {
        const profile = p as any;
        if (profile && typeof profile === 'object' && profile.name) {
          importedProfiles[id] = {
            id,
            name: String(profile.name),
            icon: profile.icon || '🎴',
            description: profile.description || '',
            cards: profile.cards || {},
            createdAt: profile.createdAt || Date.now(),
            updatedAt: profile.updatedAt || Date.now(),
          };
        }
      }

      if (Object.keys(importedProfiles).length === 0) {
        return { success: false, message: 'No valid profiles found in import data.' };
      }

      const newActive = data.activeProfileId && importedProfiles[data.activeProfileId]
        ? data.activeProfileId
        : Object.keys(importedProfiles)[0];

      set({
        profiles: importedProfiles,
        activeProfileId: newActive,
      });

      // Trigger save for current context (User Cloud or Guest)
      triggerSave(get, newActive);

      return { success: true, message: `Successfully imported ${Object.keys(importedProfiles).length} profile(s)!` };
    } catch (err: any) {
      return { success: false, message: `Error parsing file: ${err?.message || 'Invalid JSON'}` };
    }
  },

  importCollectionText: (text: string, options) => {
    const mode = options?.mode ?? 'merge';
    const finish = options?.finish ?? 'normal';
    const profileId = options?.profileId ?? get().activeProfileId;
    const profile = get().profiles[profileId];

    if (!profile) {
      return {
        success: false,
        message: 'ไม่พบสมุดสะสมที่เลือก (Active binder not found)',
        cardsImportedCount: 0,
        distinctCardsCount: 0,
        unmatchedLines: [],
        setsFound: [],
      };
    }

    const parseResult = parseCollectionText(text, pokemonCardData as any[]);
    if (parseResult.cards.length === 0) {
      return {
        success: false,
        message:
          parseResult.unmatchedLines.length > 0
            ? 'ไม่พบการ์ดที่ตรงกับข้อมูลในระบบจากข้อความที่ระบุ'
            : 'กรุณาระบุรายการการ์ดใต้รหัสชุด (เช่น Set SC1a\n1,3\n20,5\n21)',
        cardsImportedCount: 0,
        distinctCardsCount: 0,
        unmatchedLines: parseResult.unmatchedLines,
        setsFound: parseResult.setsFound,
      };
    }

    const cards = { ...profile.cards };
    for (const item of parseResult.cards) {
      const existingEntry: CollectionCardEntry = cards[item.cardId] || {
        cardId: item.cardId,
        variants: emptyVariants(),
        updatedAt: Date.now(),
      };

      const currentQty = existingEntry.variants[finish] ?? 0;
      const nextQty = mode === 'replace' ? item.quantity : currentQty + item.quantity;
      const newVariants = {
        ...existingEntry.variants,
        [finish]: Math.max(0, nextQty),
      };

      const total = Object.values(newVariants).reduce((a, b) => a + b, 0);
      if (total === 0 && !existingEntry.isWishlist && !existingEntry.note) {
        delete cards[item.cardId];
      } else {
        cards[item.cardId] = {
          ...existingEntry,
          variants: newVariants,
          updatedAt: Date.now(),
        };
      }
    }

    const nextProfile: CollectionProfile = {
      ...profile,
      cards,
      updatedAt: Date.now(),
    };

    set((state) => ({
      profiles: {
        ...state.profiles,
        [profileId]: nextProfile,
      },
    }));

    triggerSave(get, profileId);

    const finishLabels: Record<CardVariantKey, string> = {
      normal: 'Normal (ธรรมดา)',
      holo: 'Holo (โฮโล)',
      reverse: 'Reverse Holo (เรเวิร์ส)',
      promo: 'Promo (โปรโม)',
    };
    const finishLabel = finishLabels[finish] || finish;
    const modeLabel = mode === 'replace' ? 'แทนที่' : 'เพิ่ม';

    return {
      success: true,
      message: `นำเข้าสำเร็จ! ${modeLabel}จำนวนการ์ด ${parseResult.totalQuantity} ใบ (${parseResult.distinctCardsCount} แบบ) ชนิด ${finishLabel} ในชุด: ${parseResult.setsFound.join(', ')}`,
      cardsImportedCount: parseResult.totalQuantity,
      distinctCardsCount: parseResult.distinctCardsCount,
      unmatchedLines: parseResult.unmatchedLines,
      setsFound: parseResult.setsFound,
    };
  },
}));
