import { useState } from 'react';
import { ENERGY_TYPES } from '../../constants/energyTypes';
import type { CollectionStatusFilter, CollectionSortBy, SortOrder } from '../../types/collection';
import { REGULATION_SERIES_OPTIONS } from '../../types/collection';
import { SearchableSetSelect, type SetOption } from '../common/SearchableSetSelect';

interface Props {
  sets: SetOption[];
  selectedSet: string;
  onSelectSet: (setId: string) => void;

  selectedRegulation: string;
  onRegulationChange: (reg: string) => void;

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
  { id: 'HR', label: '🌈 HR (Hyper Rare / Rainbow)' },
  { id: 'UR', label: '👑 UR / MUR (Gold / การ์ดสีทอง)' },
  { id: 'EX', label: '⚡ โปเกมอน ex / เมก้า ex (Pokémon ex)' },
  { id: 'VMAX', label: '🔥 โปเกมอน VMAX' },
  { id: 'VSTAR', label: '⭐ โปเกมอน VSTAR' },
  { id: 'V', label: '⚡ โปเกมอน V' },
  { id: 'PROMO', label: '🎁 การ์ดโปรโม (Promo)' },
  { id: 'REGULAR', label: '⚪ โปเกมอนทั่วไป (Common / Rare)' },
];

const QUICK_RARITIES = [
  { id: 'ALL', label: 'ทั้งหมด' },
  { id: 'SAR', label: '🌟 SAR' },
  { id: 'AR', label: '🎨 AR' },
  { id: 'SR', label: '💎 SR' },
  { id: 'HR', label: '🌈 HR' },
  { id: 'UR', label: '👑 UR' },
  { id: 'EX', label: '⚡ ex' },
  { id: 'PROMO', label: '🎁 Promo' },
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
  selectedRegulation,
  onRegulationChange,
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
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);

  // Count active non-default filters
  const activeFilterCount = [
    selectedRegulation !== 'ALL',
    selectedRarity !== 'ALL',
    selectedCategory !== 'ALL',
    selectedStage !== 'ALL',
    selectedType !== 'ALL',
    statusFilter !== 'all',
    search.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/90 px-3 sm:px-8 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3 shadow-md">
      {/* Top Row: Search & Set Selector */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 sm:gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อการ์ด, เลขการ์ด หรือชื่อชุด..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 sm:py-2.5 bg-slate-950 border border-slate-700/90 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1 rounded-md hover:bg-slate-800 transition-colors"
                title="ล้างข้อความค้นหา"
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

        {/* Quick Total Count, Advanced Mobile Toggle, and Vivid Color Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-2 flex-wrap sm:flex-nowrap">
          {/* Mobile Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedMobile(!showAdvancedMobile)}
            className={`lg:hidden flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
              showAdvancedMobile || activeFilterCount > 0
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <span>⚙️</span>
            <span>ตัวกรองละเอียด</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* High-Visibility Vivid Full-Color Toggle Button */}
          <button
            type="button"
            onClick={onToggleFullColor}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer border ${
              showFullColor
                ? 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 text-white border-pink-400/80 shadow-pink-500/30 ring-2 ring-pink-400/50 scale-[1.02]'
                : 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 hover:from-purple-900/40 hover:to-indigo-900/40 text-purple-200 border-purple-500/60 hover:border-purple-400 shadow-purple-950/50'
            }`}
            title={showFullColor ? 'คลิกเพื่อกลับไปโหมดปกติ (การ์ดที่ยังไม่มีจะแสดงเป็นสีจาง)' : 'คลิกเพื่อเปิดโหมดสีสดใสชัดเจนทุกใบ (เพื่อรับชมภาพการ์ด)'}
          >
            <span className={`text-sm sm:text-base ${showFullColor ? 'animate-bounce' : ''}`}>🎨</span>
            <div className="flex flex-col text-left leading-tight">
              <span className={`text-[11px] sm:text-xs font-black tracking-wide ${showFullColor ? 'text-yellow-200' : 'text-purple-200'}`}>
                โหมดชมการ์ดสีสด
              </span>
              <span className="text-[9px] font-bold text-slate-300 hidden sm:inline">
                {showFullColor ? '✨ สีสดชัดทุกใบ (ON)' : '👁️ ชมภาพสีชัด (OFF)'}
              </span>
            </div>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                showFullColor
                  ? 'bg-white/30 text-white shadow-sm'
                  : 'bg-purple-950/90 text-purple-300 border border-purple-800'
              }`}
            >
              {showFullColor ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Total Count Badge */}
          <span className="text-xs font-black text-amber-400 px-2.5 py-2 bg-slate-950 rounded-xl border border-slate-800 whitespace-nowrap shadow-inner">
            {totalFiltered.toLocaleString()} ใบ
          </span>
        </div>
      </div>

      {/* Row 2: Status Filter Tabs (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onStatusFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shadow-sm ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Row 3: Regulation Series Quick Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap shrink-0">
          ซีรีส์ Regulation:
        </span>
        {REGULATION_SERIES_OPTIONS.map((reg) => {
          const isSelected = selectedRegulation === reg.id;
          const isStd = reg.id === 'STANDARD';
          return (
            <button
              key={reg.id}
              onClick={() => onRegulationChange(reg.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                isSelected
                  ? isStd
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/20 scale-105'
                    : 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20 scale-105'
                  : isStd
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
              title={reg.label}
            >
              {reg.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Row 4: Category Quick Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap shrink-0">
          หมวดหมู่:
        </span>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20 scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Row 5: Quick Rarity Chips Bar (Visible on Mobile & Desktop for 1-Tap Filter) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap shrink-0">
          ความหายาก:
        </span>
        {QUICK_RARITIES.map((qr) => {
          const isSelected = selectedRarity === qr.id;
          return (
            <button
              key={qr.id}
              onClick={() => onRarityChange(qr.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20 scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              {qr.label}
            </button>
          );
        })}
      </div>

      {/* Row 5: Advanced Filter Row (Visible by default on Desktop, Collapsible on Mobile) */}
      <div className={`${showAdvancedMobile ? 'flex' : 'hidden lg:flex'} flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/70 text-xs animate-fade-in`}>
        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Regulation Series Dropdown */}
          <select
            value={selectedRegulation}
            onChange={(e) => onRegulationChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-400 shadow-inner"
          >
            {REGULATION_SERIES_OPTIONS.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.label}
              </option>
            ))}
          </select>

          {/* Full Rarity Class Selector Dropdown */}
          <select
            value={selectedRarity}
            onChange={(e) => onRarityChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-400 shadow-inner"
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
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500 shadow-inner"
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
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500 shadow-inner"
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
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
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
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all ${
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

        {/* Sort Controls & Reset Filters */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold hidden sm:inline">เรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as CollectionSortBy, sortOrder)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs font-semibold focus:outline-none shadow-inner"
            >
              <option value="number">หมายเลขการ์ด (No.)</option>
              <option value="name">ชื่อการ์ด (ก-ฮ)</option>
              <option value="hp">ค่า HP</option>
              <option value="quantity">จำนวนที่มี (Count)</option>
            </select>
            <button
              onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-700"
              title="สลับลำดับ น้อยไปมาก / มากไปน้อย"
            >
              {sortOrder === 'asc' ? '▲' : '▼'}
            </button>
          </div>

          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              title="ล้างตัวกรองทั้งหมด"
            >
              <span>✕</span>
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
