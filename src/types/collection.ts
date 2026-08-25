export type CardVariantKey = 'normal' | 'holo' | 'reverse' | 'promo';

export interface CardVariantCount {
  normal: number;
  holo: number;
  reverse: number;
  promo: number;
}

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP';

export interface CollectionCardEntry {
  cardId: string;
  variants: CardVariantCount;
  isWishlist?: boolean;
  condition?: CardCondition;
  note?: string;
  updatedAt: number;
}

export interface CollectionProfile {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  cards: Record<string, CollectionCardEntry>;
  createdAt: number;
  updatedAt: number;
}

export type CollectionStatusFilter = 'all' | 'owned' | 'missing' | 'wishlist' | 'duplicates';

export type CollectionSortBy = 'number' | 'name' | 'hp' | 'quantity';
export type SortOrder = 'asc' | 'desc';

export interface CollectionFilters {
  selectedSet: string;
  statusFilter: CollectionStatusFilter;
  search: string;
  selectedType: string;
  selectedCategory: string;
  selectedStage: string;
  selectedRarity: string;
  sortBy: CollectionSortBy;
  sortOrder: SortOrder;
  showFullColor: boolean;
}

export type CardRarityClass =
  | 'ALL'
  | 'SAR'
  | 'AR'
  | 'SR'
  | 'UR'
  | 'EX'
  | 'VMAX'
  | 'VSTAR'
  | 'V'
  | 'PROMO'
  | 'REGULAR';

export interface SetProgress {
  setId: string;
  setName: string;
  totalCards: number;
  uniqueOwned: number;
  totalCount: number;
  percentage: number;
}

export interface CollectionStats {
  totalProfiles: number;
  activeProfileName: string;
  totalUniqueOwned: number;
  totalCardsCount: number;
  wishlistCount: number;
  duplicatesCount: number;
  overallPercentage: number;
}
