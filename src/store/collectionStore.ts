import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CardVariantKey,
  CardCondition,
  CollectionCardEntry,
  CollectionProfile,
} from '../types/collection';

interface CollectionState {
  profiles: Record<string, CollectionProfile>;
  activeProfileId: string;

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

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      profiles: {
        [DEFAULT_PROFILE_ID]: createDefaultProfile(),
      },
      activeProfileId: DEFAULT_PROFILE_ID,

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
      },

      deleteProfile: (profileId: string) => {
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
      },

      setCardDetails: (cardId: string, details: { condition?: CardCondition; note?: string }) => {
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
      },

      clearCard: (cardId: string) => {
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
