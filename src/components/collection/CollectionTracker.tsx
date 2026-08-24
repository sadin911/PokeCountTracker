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
  if (card.rarityCode) return card.rarityCode;

  const name = card.name || '';
  const setId = (card.set?.id || '').toUpperCase();
  const col = (card.collectorNumber || card.localId || '').toUpperCase();

  // 1. Promo
  if (setId.includes('-P') || setId.includes('PROMO') || col.includes('PROMO') || col.startsWith('P-')) {
    return 'PROMO';
  }

  // 2. Token / Code check
  if (col.includes('SAR')) return 'SAR';
  if (col.includes('AR') || col.includes('CHR')) return 'AR';
  if (col.includes('UR') || col.includes('MUR') || col.includes('HR')) return 'UR';
  if (col.includes('SR') || col.includes('CSR')) return 'SR';

  // 3. Secret Rare Range Detection (num > total)
  const match = col.match(/^0*(\d+)[-/]0*(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (num > total) {
      const diff = num - total;
      if (setId.startsWith('SV') || setId.startsWith('MA')) {
        if (!name.includes('ex') && !name.includes('EX') && card.category === 'Pokemon') {
          return 'AR';
        }
        if (diff > 35) return 'UR';
        if (diff > 15) return 'SAR';
        return 'SR';
      }
      if (diff > 12) return 'UR';
      return 'SR';
    }
  }

  // 4. Base set High Rarity:
  if (name.includes('ex') || name.includes('EX')) return 'EX';
  if (name.includes('VMAX')) return 'VMAX';
  if (name.includes('VSTAR')) return 'VSTAR';
  if (/(?:[\u0E00-\u0E7F]|\s)V(?:$|[\s\(\[\{【])/i.test(name) || name.endsWith('V')) return 'V';

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
  const [showFullColor, setShowFullColor] = useState<boolean>(false);

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
        showFullColor={showFullColor}
        onToggleFullColor={() => setShowFullColor(!showFullColor)}
        totalFiltered={filteredCards.length}
      />

      {/* Main Binder Grid */}
      <CollectionGridView
        cards={filteredCards}
        currentSetProgress={currentSetProgress}
        showFullColor={showFullColor}
      />
    </div>
  );
}
