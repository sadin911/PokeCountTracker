import { ENERGY_TYPES } from '../../constants/energyTypes';
import type { CollectionStatusFilter, CollectionSortBy, SortOrder } from '../../types/collection';
import { SearchableSetSelect, type SetOption } from '../common/SearchableSetSelect';

interface Props {
  sets: SetOption[];
  selectedSet: string;
  onSelectSet: (setId: string) => void;

  statusFilter: CollectionStatusFilter;
  onStatusFilterChange: (status: CollectionStatusFilter) => void;

  search: string;
  onSearchChange: (val: string) => void;

  selectedType: string;
  onTypeChange: (val: string) => void;

  selectedCategory: string;
  onCategoryChange: (val: string) => void;

  selectedStage: string;
  onStageChange: (val: string) => void;

  selectedRarity: string;
  onRarityChange: (val: string) => void;

  sortBy: CollectionSortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: CollectionSortBy, sortOrder: SortOrder) => void;

  showFullColor: boolean;
  onToggleFullColor: () => void;

  onResetFilters?: () => void;
  isFiltered?: boolean;

  totalFiltered: number;
}

export const RARITY_CLASSES = [
  { id: 'ALL', label: 'ทุกระดับความหายาก (All Classes)' },
  { id: 'SAR', label: '🌟 SAR (Special Art Rare)' },
  { id: 'AR', label: '🎨 AR / CHR (Art Rare)' },
  { id: 'SR', label: '💎 SR / CSR (Super Rare)' },
  { id: 'UR', label: '👑 UR / MUR / HR (Gold & Rainbow)' },
  { id: 'EX', label: '⚡ โปเกมอน ex / เมก้า ex (Pokémon ex)' },
  { id: 'VMAX', label: '🔥 โปเกมอน VMAX' },
  { id: 'VSTAR', label: '⭐ โปเกมอน VSTAR' },
  { id: 'V', label: '⚡ โปเกมอน V' },
  { id: 'PROMO', label: '🎁 การ์ดโปรโม (Promo)' },
  { id: 'REGULAR', label: '⚪ โปเกมอนทั่วไป (Common / Rare)' },
];

const STATUS_TABS: { key: CollectionStatusFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'ทั้งหมด (All)', icon: '🎴' },
  { key: 'owned', label: 'มีแล้ว (Owned)', icon: '✅' },
  { key: 'missing', label: 'ยังไม่มี (Missing)', icon: '⏳' },
  { key: 'wishlist', label: 'Wishlist (อยากได้)', icon: '⭐' },
  { key: 'duplicates', label: 'มีซ้ำ (Trade)', icon: '🔁' },
];

const CATEGORIES = [
  { id: 'ALL', label: 'ทุกหมวดหมู่' },
  { id: 'Pokemon', label: 'โปเกมอน (Pokémon)' },
  { id: 'Trainer', label: 'เทรนเนอร์ (Trainer)' },
  { id: 'Energy', label: 'พลังงาน (Energy)' },
];

const STAGES = [
  { id: 'ALL', label: 'ทุกสเตจ (All Stages)' },
  { id: 'พื้นฐาน', label: 'พื้นฐาน (Basic)' },
  { id: 'ร่าง 1', label: 'ร่าง 1 (Stage 1)' },
  { id: 'ร่าง 2', label: 'ร่าง 2 (Stage 2)' },
];

export function CollectionFilterBar({
  sets,
  selectedSet,
  onSelectSet,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  selectedStage,
  onStageChange,
  selectedRarity,
  onRarityChange,
  sortBy,
  sortOrder,
  onSortChange,
  showFullColor,
  onToggleFullColor,
  onResetFilters,
  isFiltered = false,
  totalFiltered,
}: Props) {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800/90 px-4 sm:px-8 py-3 space-y-3 shadow-md">
      {/* Top Row: Search + Set Selector + Status Tabs */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Search & Set Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อการ์ด, เลขการ์ด หรือชื่อชุดการ์ด (เช่น อัคคีสีคราม, ทริปเปิล, SV1a)..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-700/90 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Searchable Set Selector Dropdown */}
          <SearchableSetSelect
            sets={sets}
            selectedSet={selectedSet}
            onSelectSet={onSelectSet}
            accentColor="amber"
            showProgress={true}
            className="w-full sm:w-96"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onStatusFilterChange(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Rarity Class + Category + Stage + Energy Type Chips + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/70 text-xs">
        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Rarity Class Selector */}
          <select
            value={selectedRarity}
            onChange={(e) => onRarityChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-amber-500/50 text-amber-300 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner"
          >
            {RARITY_CLASSES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500 shadow-inner"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Stage */}
          <select
            value={selectedStage}
            onChange={(e) => onStageChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500 shadow-inner"
          >
            {STAGES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[340px] sm:max-w-none scrollbar-none py-0.5">
            <button
              onClick={() => onTypeChange('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${
                selectedType === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              ทุกธาตุ
            </button>
            {ENERGY_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => onTypeChange(t.type === selectedType ? 'ALL' : t.type)}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
                  selectedType === t.type
                    ? 'ring-2 ring-amber-400 bg-slate-700 scale-110 shadow-md'
                    : 'bg-slate-800/90 hover:bg-slate-700 opacity-75 hover:opacity-100'
                }`}
                title={t.type}
              >
                {t.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Full Color Toggle + Sort + Filter Count */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Full Color Toggle Button */}
          <button
            type="button"
            onClick={onToggleFullColor}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
              showFullColor
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40 shadow-amber-500/10'
                : 'bg-slate-950 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
            title={showFullColor ? 'คลิกเพื่อกลับไปโหมดปกติ (การ์ดที่ไม่มีเป็นสีจาง)' : 'คลิกเพื่อเปิดโหมดสีสดใสชัดเจนทุกใบ (เพื่อรับชม)'}
          >
            <span>{showFullColor ? '🎨' : '👁️'}</span>
            <span>{showFullColor ? 'สีสดชัดทุกใบ (ON)' : 'โหมดชมการ์ดสีชัด'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold hidden sm:inline">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as CollectionSortBy, sortOrder)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none shadow-inner"
            >
              <option value="number">หมายเลขการ์ด (No.)</option>
              <option value="name">ชื่อการ์ด (ก-ฮ)</option>
              <option value="hp">ค่า HP</option>
              <option value="quantity">จำนวนที่มี (Count)</option>
            </select>
            <button
              onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-700"
              title="สลับลำดับ น้อยไปมาก / มากไปน้อย"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              title="ล้างตัวกรองทั้งหมด"
            >
              <span>✕</span>
              <span>ล้างตัวกรอง</span>
            </button>
          )}

          <span className="text-xs font-black text-amber-400 pl-2 border-l border-slate-700 whitespace-nowrap">
            {totalFiltered.toLocaleString()} ใบ
          </span>
        </div>
      </div>
    </div>
  );
}
