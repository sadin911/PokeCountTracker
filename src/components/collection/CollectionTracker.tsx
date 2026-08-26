import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import pokemonCardData from '../../data/pokemonNames.json';
import { useCollectionStore } from '../../store/collectionStore';
import { useAuthStore } from '../../store/authStore';
import { CollectionHeader } from './CollectionHeader';
import { CollectionFilterBar } from './CollectionFilterBar';
import { CollectionGridView } from './CollectionGridView';
import type {
  CollectionStats,
  SetProgress,
} from '../../types/collection';

import { getCardRarityClass } from '../../utils/rarity';
import { createCardMatcher } from '../../utils/searchHelpers';
export { getCardRarityClass };

export function CollectionTracker() {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profiles = useCollectionStore((s) => s.profiles);
  const loadUserFromCloud = useCollectionStore((s) => s.loadUserFromCloud);
  const activeProfile = profiles[activeProfileId];

  const user = useAuthStore((s) => s.user);

  // Automatically sync/load user binders when logged in
  useEffect(() => {
    if (user?.uid) {
      loadUserFromCloud(user.uid);
    }
  }, [user?.uid]);

  // Filters state from store (persisted across tab switches and page navigations)
  const filters = useCollectionStore((s) => s.filters);
  const setFilters = useCollectionStore((s) => s.setFilters);

  const {
    selectedSet,
    statusFilter,
    search,
    selectedType,
    selectedCategory,
    selectedStage,
    selectedRarity,
    sortBy,
    sortOrder,
    showFullColor,
  } = filters;

  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Track scrolling for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos =
        window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShowBackToTop(scrollPos > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Build Sets List with Completion Counts
  const setsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; owned: number }>();

    for (const card of pokemonCardData as any[]) {
      const setId = card.set?.id || 'PROMO';
      const setName = card.set?.name || 'การ์ดโปรโม / อื่น ๆ';

      if (!map.has(setId)) {
        map.set(setId, { id: setId, name: setName, count: 0, owned: 0 });
      }

      const item = map.get(setId)!;
      item.count++;

      const entry = activeProfile?.cards[card.id];
      if (entry && Object.values(entry.variants || {}).some((v) => v > 0)) {
        item.owned++;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [activeProfile]);

  // 2. Compute Overall Collection Stats
  const overallStats: CollectionStats = useMemo(() => {
    const cards = activeProfile?.cards || {};
    let totalUniqueOwned = 0;
    let totalCardsCount = 0;
    let wishlistCount = 0;
    let duplicatesCount = 0;

    for (const entry of Object.values(cards)) {
      const variants = entry.variants || { normal: 0, holo: 0, reverse: 0, promo: 0 };
      const sum = variants.normal + variants.holo + variants.reverse + variants.promo;
      if (sum > 0) {
        totalUniqueOwned++;
        totalCardsCount += sum;
        if (sum > 1) {
          duplicatesCount += sum - 1;
        }
      }
      if (entry.isWishlist) {
        wishlistCount++;
      }
    }

    const totalDatasetCards = (pokemonCardData as any[]).length;
    const overallPercentage =
      totalDatasetCards > 0 ? Math.round((totalUniqueOwned / totalDatasetCards) * 100) : 0;

    return {
      totalProfiles: Object.keys(profiles).length,
      activeProfileName: activeProfile?.name || 'My Collection',
      totalUniqueOwned,
      totalCardsCount,
      wishlistCount,
      duplicatesCount,
      overallPercentage,
    };
  }, [activeProfile, profiles]);

  // 3. Current Set Progress (if a specific set is chosen)
  const currentSetProgress: SetProgress | null = useMemo(() => {
    if (selectedSet === 'ALL') return null;
    const s = setsList.find((x) => x.id === selectedSet);
    if (!s) return null;

    let totalCountInSet = 0;
    for (const card of pokemonCardData as any[]) {
      if ((card.set?.id || 'PROMO') === selectedSet) {
        const entry = activeProfile?.cards[card.id];
        if (entry) {
          totalCountInSet += Object.values(entry.variants || {}).reduce((a, b) => a + b, 0);
        }
      }
    }

    return {
      setId: s.id,
      setName: s.name,
      totalCards: s.count,
      uniqueOwned: s.owned,
      totalCount: totalCountInSet,
      percentage: s.count > 0 ? Math.round((s.owned / s.count) * 100) : 0,
    };
  }, [selectedSet, setsList, activeProfile]);

  const deferredSearch = useDeferredValue(search);
  const cardMatcher = useMemo(() => createCardMatcher(deferredSearch), [deferredSearch]);

  // 4. Filter and Sort Cards
  const filteredCards = useMemo(() => {
    const rawList = pokemonCardData as any[];
    const cardsState = activeProfile?.cards || {};
    const hasSearch = deferredSearch.trim().length > 0;

    const filtered = rawList.filter((card) => {
      const entry = cardsState[card.id];
      const variants = entry?.variants || { normal: 0, holo: 0, reverse: 0, promo: 0 };
      const totalOwned = variants.normal + variants.holo + variants.reverse + variants.promo;
      const isOwned = totalOwned > 0;
      const isWishlist = !!entry?.isWishlist;

      // Status Filter
      if (statusFilter === 'owned' && !isOwned) return false;
      if (statusFilter === 'missing' && isOwned) return false;
      if (statusFilter === 'wishlist' && !isWishlist) return false;
      if (statusFilter === 'duplicates' && totalOwned <= 1) return false;

      // Set Filter
      const cardSetId = card.set?.id || 'PROMO';
      if (selectedSet !== 'ALL' && cardSetId !== selectedSet) return false;

      // Category Filter
      if (selectedCategory !== 'ALL' && card.category !== selectedCategory) return false;

      // Stage Filter
      if (selectedStage !== 'ALL' && card.stage !== selectedStage) return false;

      // Rarity Class Filter
      if (selectedRarity !== 'ALL') {
        const cardRarity = getCardRarityClass(card);
        if (cardRarity !== selectedRarity) return false;
      }

      // Type Filter
      if (selectedType !== 'ALL') {
        const types = card.types || [];
        if (!types.includes(selectedType)) return false;
      }

      // Search Query (Card Name EN/TH, Collector Number, Set ID, Set Name)
      if (hasSearch) {
        if (!cardMatcher(card)) return false;
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '', 'th');
      } else if (sortBy === 'hp') {
        comparison = (a.hp || 0) - (b.hp || 0);
      } else if (sortBy === 'quantity') {
        const aCount = Object.values(cardsState[a.id]?.variants || {}).reduce((s, v) => s + v, 0);
        const bCount = Object.values(cardsState[b.id]?.variants || {}).reduce((s, v) => s + v, 0);
        comparison = aCount - bCount;
      } else {
        // Number / Default
        const aNum = parseInt(String(a.localId).replace(/\D/g, ''), 10) || 0;
        const bNum = parseInt(String(b.localId).replace(/\D/g, ''), 10) || 0;
        comparison = aNum - bNum;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    activeProfile,
    statusFilter,
    selectedSet,
    selectedCategory,
    selectedStage,
    selectedRarity,
    selectedType,
    search,
    sortBy,
    sortOrder,
  ]);

  const resetFilters = useCollectionStore((s) => s.resetFilters);
  const isFiltered =
    selectedSet !== 'ALL' ||
    statusFilter !== 'all' ||
    search.trim() !== '' ||
    selectedType !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedStage !== 'ALL' ||
    selectedRarity !== 'ALL';

  // Stable key identifying current filter/search/sort criteria
  const filterKey = `${selectedSet}_${statusFilter}_${selectedType}_${selectedCategory}_${selectedStage}_${selectedRarity}_${sortBy}_${sortOrder}_${search.trim()}_${activeProfileId}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <CollectionHeader stats={overallStats} />

      {/* Filter and Search Bar */}
      <CollectionFilterBar
        sets={setsList}
        selectedSet={selectedSet}
        onSelectSet={(val) => setFilters({ selectedSet: val })}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => setFilters({ statusFilter: val })}
        search={search}
        onSearchChange={(val) => setFilters({ search: val })}
        selectedType={selectedType}
        onTypeChange={(val) => setFilters({ selectedType: val })}
        selectedCategory={selectedCategory}
        onCategoryChange={(val) => setFilters({ selectedCategory: val })}
        selectedStage={selectedStage}
        onStageChange={(val) => setFilters({ selectedStage: val })}
        selectedRarity={selectedRarity}
        onRarityChange={(val) => setFilters({ selectedRarity: val })}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => setFilters({ sortBy: sb, sortOrder: so })}
        showFullColor={showFullColor}
        onToggleFullColor={() => setFilters({ showFullColor: !showFullColor })}
        onResetFilters={resetFilters}
        isFiltered={isFiltered}
        totalFiltered={filteredCards.length}
      />

      {/* Main Binder Grid */}
      <CollectionGridView
        cards={filteredCards}
        currentSetProgress={currentSetProgress}
        showFullColor={showFullColor}
        filterKey={filterKey}
      />

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-black text-xs sm:text-sm border border-amber-500/40 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-2 group ring-1 ring-white/15"
          title="Scroll back to top"
        >
          <span className="text-base group-hover:-translate-y-0.5 transition-transform font-black">↑</span>
          <span>Back to Top</span>
        </button>
      )}
    </div>
  );
}
