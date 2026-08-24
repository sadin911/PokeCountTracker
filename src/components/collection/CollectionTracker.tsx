import { useState, useMemo, useEffect } from 'react';
import pokemonCardData from '../../data/pokemonNames.json';
import { useCollectionStore } from '../../store/collectionStore';
import { useAuthStore } from '../../store/authStore';
import { CollectionHeader } from './CollectionHeader';
import { CollectionFilterBar } from './CollectionFilterBar';
import { CollectionGridView } from './CollectionGridView';
import type {
  CollectionStatusFilter,
  CollectionSortBy,
  SortOrder,
  CollectionStats,
  SetProgress,
} from '../../types/collection';

// Helper to determine Card Rarity Class
export function getCardRarityClass(card: any): string {
  const name = card.name || '';
  const setId = (card.set?.id || '').toUpperCase();
  const col = (card.collectorNumber || card.localId || '').toUpperCase();

  // 1. Promo
  if (setId.includes('-P') || setId.includes('PROMO') || col.includes('PROMO') || col.startsWith('P-')) {
    return 'PROMO';
  }

  // 2. Secret Rare / Super Rare (Collector number > Total e.g. 155/154, 075/073 or SAR/UR/SR/HR/AR/MUR/CSR/CHR)
  const match = col.match(/(\d+)[-/](\d+)/);
  if (match && parseInt(match[1], 10) > parseInt(match[2], 10)) {
    return 'SECRET';
  }
  if (
    col.includes('MUR') ||
    col.includes('UR') ||
    col.includes('SAR') ||
    col.includes('HR') ||
    col.includes('SR') ||
    col.includes('AR') ||
    col.includes('CSR') ||
    col.includes('CHR')
  ) {
    return 'SECRET';
  }

  // 3. Pokemon ex (Mega / Tera / ex)
  if (name.includes('ex') || name.includes('EX')) {
    return 'EX';
  }

  // 4. VMAX
  if (name.includes('VMAX')) {
    return 'VMAX';
  }

  // 5. VSTAR
  if (name.includes('VSTAR')) {
    return 'VSTAR';
  }

  // 6. Pokemon V
  if (/(?:[\u0E00-\u0E7F]|\s)V(?:$|[\s\(\[\{【])/i.test(name) || name.endsWith('V')) {
    return 'V';
  }

  // 7. Radiant / Ace Spec
  if (
    name.includes('ส่องประกาย') ||
    name.includes('Radiant') ||
    name.includes('ACE SPEC') ||
    name.includes('เอซสเปก')
  ) {
    return 'SECRET';
  }

  return 'REGULAR';
}

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

  // Filters state
  const [selectedSet, setSelectedSet] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<CollectionStatusFilter>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<CollectionSortBy>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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

  // 4. Filter and Sort Cards
  const filteredCards = useMemo(() => {
    const rawList = pokemonCardData as any[];
    const cardsState = activeProfile?.cards || {};

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

      // Search Query (Card Name, Collector Number, Set ID, Set Name)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = (card.name || '').toLowerCase().includes(q);
        const numMatch = (card.collectorNumber || card.localId || '').toLowerCase().includes(q);
        const setIdMatch = (card.set?.id || '').toLowerCase().includes(q);
        const setNameMatch = (card.set?.name || '').toLowerCase().includes(q);
        if (!nameMatch && !numMatch && !setIdMatch && !setNameMatch) return false;
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <CollectionHeader stats={overallStats} />

      {/* Filter and Search Bar */}
      <CollectionFilterBar
        sets={setsList}
        selectedSet={selectedSet}
        onSelectSet={setSelectedSet}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStage={selectedStage}
        onStageChange={setSelectedStage}
        selectedRarity={selectedRarity}
        onRarityChange={setSelectedRarity}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => {
          setSortBy(sb);
          setSortOrder(so);
        }}
        totalFiltered={filteredCards.length}
      />

      {/* Main Binder Grid */}
      <CollectionGridView cards={filteredCards} currentSetProgress={currentSetProgress} />
    </div>
  );
}
