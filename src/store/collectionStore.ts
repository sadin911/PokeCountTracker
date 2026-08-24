import { create } from 'zustand';
import { doc, setDoc, getDocs, deleteDoc, collection } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import type {
  CardVariantKey,
  CardCondition,
  CollectionCardEntry,
  CollectionProfile,
} from '../types/collection';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface CollectionState {
  profiles: Record<string, CollectionProfile>;
  activeProfileId: string;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;

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
  resetToGuest: () => void;

  // Backup & Restore
  exportCollectionJSON: () => string;
  importCollectionJSON: (jsonString: string) => { success: boolean; message: string };
}

const DEFAULT_PROFILE_ID = 'default-main-profile';
const GUEST_STORAGE_KEY = 'pokecount_guest_profiles_v2';
const USER_CACHE_KEY_PREFIX = 'pokecount_user_cache_';

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
    if (user) {
      deleteDoc(doc(db, 'users', user.uid, 'binders', profileId)).catch(console.error);
    }

    set((state) => {
      const profileIds = Object.keys(state.profiles);
      if (profileIds.length <= 1) return state;

      const newProfiles = { ...state.profiles };
      delete newProfiles[profileId];

      let newActive = state.activeProfileId;
      if (state.activeProfileId === profileId) {
        newActive = Object.keys(newProfiles)[0];
      }

      const nextState = {
        profiles: newProfiles,
        activeProfileId: newActive,
      };

      const key = user ? `${USER_CACHE_KEY_PREFIX}${user.uid}` : GUEST_STORAGE_KEY;
      try {
        localStorage.setItem(key, JSON.stringify(nextState));
      } catch (e) {}

      return nextState;
    });
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

      const newCards = {
        ...profile.cards,
        [cardId]: {
          ...existingEntry,
          condition: details.condition ?? existingEntry.condition,
          note: details.note !== undefined ? details.note : existingEntry.note,
          updatedAt: Date.now(),
        },
      };

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

    const profile = get().profiles[profileId];
    if (!profile) return;

    set({ syncStatus: 'syncing' });
    try {
      const docRef = doc(db, 'users', user.uid, 'binders', profileId);
      await setDoc(docRef, profile, { merge: true });
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
      const cached = localStorage.getItem(`${USER_CACHE_KEY_PREFIX}${uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.profiles && Object.keys(parsed.profiles).length > 0) {
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
          const activeId = Object.keys(cloudProfiles)[0];
          set({
            profiles: cloudProfiles,
            activeProfileId: activeId,
            syncStatus: 'synced',
            lastSyncedAt: Date.now(),
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
        await setDoc(docRef, p, { merge: true });
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

  // Reset back to Guest Mode state on Logout
  resetToGuest: () => {
    const guestData = loadInitialGuestData();
    set({
      profiles: guestData.profiles,
      activeProfileId: guestData.activeProfileId,
      syncStatus: 'idle',
      lastSyncedAt: null,
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
}));
