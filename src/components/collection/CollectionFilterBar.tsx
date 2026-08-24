import { ENERGY_TYPES } from '../../constants/energyTypes';
import type { CollectionStatusFilter, CollectionSortBy, SortOrder } from '../../types/collection';

interface SetOption {
  id: string;
  name: string;
  count: number;
  owned: number;
}

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

  sortBy: CollectionSortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: CollectionSortBy, sortOrder: SortOrder) => void;

  totalFiltered: number;
}

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
  sortBy,
  sortOrder,
  onSortChange,
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

          {/* Set Selector Dropdown */}
          <div className="relative w-full sm:w-96">
            <select
              value={selectedSet}
              onChange={(e) => onSelectSet(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/90 rounded-xl text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-500 truncate shadow-inner"
            >
              <option value="ALL">📦 ทุกชุดการ์ด (All 80+ Expansions)</option>
              {sets.map((s) => {
                const pct = s.count > 0 ? Math.round((s.owned / s.count) * 100) : 0;
                return (
                  <option key={s.id} value={s.id}>
                    [{s.id}] {s.name} ({s.owned}/{s.count} • {pct}%)
                  </option>
                );
              })}
            </select>
          </div>
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

      {/* Bottom Row: Energy Type Chips + Category & Stage Filter + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/70 text-xs">
        {/* Category & Stage Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
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

        {/* Right: Sort & Filter Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold">เรียงตาม:</span>
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
              {sortOrder === 'asc' ? '▲ น้อย→มาก' : '▼ มาก→น้อย'}
            </button>
          </div>

          <span className="text-xs font-black text-amber-400 pl-2 border-l border-slate-700">
            แสดง {totalFiltered.toLocaleString()} ใบ
          </span>
        </div>
      </div>
    </div>
  );
}
