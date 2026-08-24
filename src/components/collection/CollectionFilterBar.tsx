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
  { key: 'all', label: 'ทั้งหมด', icon: '🎴' },
  { key: 'owned', label: 'มีแล้ว', icon: '✅' },
  { key: 'missing', label: 'ยังไม่มี', icon: '⏳' },
  { key: 'wishlist', label: 'Wishlist', icon: '⭐' },
  { key: 'duplicates', label: 'มีซ้ำ', icon: '🔁' },
];

const CATEGORIES = [
  { id: 'ALL', label: 'ทุกหมวด' },
  { id: 'Pokemon', label: 'โปเกมอน' },
  { id: 'Trainer', label: 'เทรนเนอร์' },
  { id: 'Energy', label: 'พลังงาน' },
];

const STAGES = [
  { id: 'ALL', label: 'ทุกสเตจ' },
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
    <div className="bg-slate-900/80 border-b border-slate-800 p-3 sm:p-4 space-y-3">
      {/* Top Row: Search + Set Selector + Status Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search & Set Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อการ์ด หรือเลข..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Set Selector Dropdown */}
          <div className="relative w-full sm:w-72">
            <select
              value={selectedSet}
              onChange={(e) => onSelectSet(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500 truncate"
            >
              <option value="ALL">📦 ทุกชุดการ์ด (All Expansions)</option>
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
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onStatusFilterChange(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
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
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
        {/* Category & Stage Dropdowns */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-500"
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
            className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            {STAGES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Type Chips */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[320px] sm:max-w-none scrollbar-none">
            <button
              onClick={() => onTypeChange('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                selectedType === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              ทุกธาตุ
            </button>
            {ENERGY_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => onTypeChange(t.type === selectedType ? 'ALL' : t.type)}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all ${
                  selectedType === t.type
                    ? 'ring-2 ring-amber-400 bg-slate-700 scale-110'
                    : 'bg-slate-800 hover:bg-slate-700 opacity-70 hover:opacity-100'
                }`}
                title={t.type}
              >
                {t.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Sort & Filter Count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>เรียง:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as CollectionSortBy, sortOrder)}
              className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none"
            >
              <option value="number">หมายเลขการ์ด</option>
              <option value="name">ชื่อการ์ด (ก-ฮ)</option>
              <option value="hp">ค่า HP</option>
              <option value="quantity">จำนวนที่มี</option>
            </select>
            <button
              onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              title="สลับลำดับ น้อยไปมาก / มากไปน้อย"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 pl-1 border-l border-slate-700">
            {totalFiltered.toLocaleString()} ใบ
          </span>
        </div>
      </div>
    </div>
  );
}
