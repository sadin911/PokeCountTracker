import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useCollectionStore } from './collectionStore';

export interface CardOwnershipStat {
  count: number;
  totalUsers: number;
  percentage: number;
  tier: 'ultra_rare' | 'rare' | 'uncommon' | 'popular' | 'unclaimed';
  tierLabel: string;
  badgeColor: string;
}

interface CommunityState {
  totalUsers: number;
  cardOwners: Record<string, number>;
  loading: boolean;
  lastFetchedAt: number | null;

  fetchCommunityStats: (force?: boolean) => Promise<void>;
  getCardStats: (cardId?: string | null) => CardOwnershipStat;
}

const CACHE_KEY = 'pokecount_community_stats_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function loadCachedStats(): { totalUsers: number; cardOwners: Record<string, number>; lastFetchedAt: number | null } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalUsers === 'number' && parsed.cardOwners) {
        return {
          totalUsers: parsed.totalUsers,
          cardOwners: parsed.cardOwners,
          lastFetchedAt: parsed.lastFetchedAt || null,
        };
      }
    }
  } catch (e) {}
  return { totalUsers: 0, cardOwners: {}, lastFetchedAt: null };
}

const initialCache = loadCachedStats();

export const useCommunityStore = create<CommunityState>((set, get) => ({
  totalUsers: initialCache.totalUsers,
  cardOwners: initialCache.cardOwners,
  loading: false,
  lastFetchedAt: initialCache.lastFetchedAt,

  fetchCommunityStats: async (force: boolean = false) => {
    const { lastFetchedAt, loading } = get();
    const now = Date.now();

    if (loading) return;
    if (!force && lastFetchedAt && now - lastFetchedAt < CACHE_TTL_MS && get().totalUsers > 0) {
      return;
    }

    set({ loading: true });
    try {
      const docRef = doc(db, 'community_stats', 'ownership');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        const totalUsers = data?.totalUsers || 0;
        const cardOwners = data?.cardOwners || {};

        const newState = {
          totalUsers,
          cardOwners,
          loading: false,
          lastFetchedAt: now,
        };

        set(newState);

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(newState));
        } catch (e) {}
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.warn('Failed to fetch community card stats from Firestore:', err);
      set({ loading: false });
    }
  },

  getCardStats: (cardId?: string | null): CardOwnershipStat => {
    if (!cardId) {
      return {
        count: 0,
        totalUsers: 0,
        percentage: 0,
        tier: 'unclaimed',
        tierLabel: 'ยังไม่มีข้อมูล',
        badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
      };
    }

    const { cardOwners, totalUsers } = get();
    let count = cardOwners[cardId] || 0;

    // Check if the current active user owns at least 1 copy in their profiles
    let currentUserOwns = false;
    try {
      const profiles = useCollectionStore.getState().profiles;
      if (profiles) {
        for (const profile of Object.values(profiles)) {
          const cardEntry = profile?.cards?.[cardId];
          if (cardEntry?.variants) {
            const vCount = Object.values(cardEntry.variants).reduce((a, b) => a + (Number(b) || 0), 0);
            if (vCount > 0) {
              currentUserOwns = true;
              break;
            }
          }
        }
      }
    } catch (e) {}

    // If current user owns it and it was not counted in global tally, add 1 to count
    if (currentUserOwns && count === 0) {
      count = 1;
    }

    // Effective total users (must be at least totalUsers or at least 1 if someone owns it)
    const effectiveTotal = Math.max(totalUsers, count > 0 ? 1 : 0);
    const percentage = effectiveTotal > 0 ? Math.round((count / effectiveTotal) * 100) : 0;

    if (count === 0) {
      return {
        count: 0,
        totalUsers: effectiveTotal || 1,
        percentage: 0,
        tier: 'unclaimed',
        tierLabel: '✨ ยังไม่มีใครครอบครอง (0%)',
        badgeColor: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
      };
    }

    if (percentage < 10) {
      return {
        count,
        totalUsers: effectiveTotal,
        percentage,
        tier: 'ultra_rare',
        tierLabel: '💎 แรร์มาก (Ultra Rare)',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10',
      };
    }

    if (percentage < 25) {
      return {
        count,
        totalUsers: effectiveTotal,
        percentage,
        tier: 'rare',
        tierLabel: '⭐ แรร์ (Rare)',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-purple-500/10',
      };
    }

    if (percentage < 50) {
      return {
        count,
        totalUsers: effectiveTotal,
        percentage,
        tier: 'uncommon',
        tierLabel: '🎴 ปานกลาง (Uncommon)',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/10',
      };
    }

    return {
      count,
      totalUsers: effectiveTotal,
      percentage,
      tier: 'popular',
      tierLabel: '🔥 ยอดนิยม (Popular)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10',
    };
  },
}));
