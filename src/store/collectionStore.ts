import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

  // Cloud Sync Actions
  loadUserFromCloud: (uid: string) => Promise<boolean>;
  syncProfileToCloud: (profileId: string) => Promise<void>;
  uploadLocalProfilesToCloud: (uid: string) => Promise<void>;

  // Backup & Restore
  exportCollectionJSON: () => string;
  importCollectionJSON: (jsonString: string) => { success: boolean; message: string };
}

const DEFAULT_PROFILE_ID = 'default-main-profile';

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

// Debounce timer for saving to Firestore
let saveTimeout: any = null;

function triggerCloudSync(get: () => CollectionState, profileId: string) {
  const user = auth.currentUser;
  if (!user) return;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    get().syncProfileToCloud(profileId);
  }, 600);
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      profiles: {
        [DEFAULT_PROFILE_ID]: createDefaultProfile(),
      },
      activeProfileId: DEFAULT_PROFILE_ID,
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

        triggerCloudSync(get, id);
        return id;
      },

      switchProfile: (profileId: string) => {
        if (get().profiles[profileId]) {
          set({ activeProfileId: profileId });
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
        triggerCloudSync(get, profileId);
      },

      deleteProfile: (profileId: string) => {
        const user = auth.currentUser;
        if (user) {
          // Delete from Firestore
          deleteDoc(doc(db, 'users', user.uid, 'binders', profileId)).catch(console.error);
        }

        set((state) => {
          const profileIds = Object.keys(state.profiles);
          if (profileIds.length <= 1) return state; // Don't delete last profile

          const newProfiles = { ...state.profiles };
          delete newProfiles[profileId];

          let newActive = state.activeProfileId;
          if (state.activeProfileId === profileId) {
            newActive = Object.keys(newProfiles)[0];
          }

          return {
            profiles: newProfiles,
            activeProfileId: newActive,
          };
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

        triggerCloudSync(get, activeId);
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

        triggerCloudSync(get, activeId);
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

        triggerCloudSync(get, activeId);
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

        triggerCloudSync(get, activeId);
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
              return true;
            }
          }

          // If cloud has no binders yet, upload local guest data
          await get().uploadLocalProfilesToCloud(uid);
          set({ syncStatus: 'synced', lastSyncedAt: Date.now() });
          return false;
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
        } catch (err) {
          console.error('Failed to upload local binders to cloud:', err);
          set({ syncStatus: 'error' });
        }
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

          // If logged in, sync all imported profiles to cloud
          const user = auth.currentUser;
          if (user) {
            get().uploadLocalProfilesToCloud(user.uid);
          }

          return { success: true, message: `Successfully imported ${Object.keys(importedProfiles).length} profile(s)!` };
        } catch (err: any) {
          return { success: false, message: `Error parsing file: ${err?.message || 'Invalid JSON'}` };
        }
      },
    }),
    {
      name: 'pokecount_collection_profiles_v1',
    }
  )
);
