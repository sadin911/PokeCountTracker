import { useState, useRef, useEffect, useMemo } from 'react';

export interface SetOption {
  id: string;
  name: string;
  count?: number;
  owned?: number;
}

export interface SearchableSetSelectProps {
  sets: SetOption[];
  selectedSet: string;
  onSelectSet: (setId: string) => void;
  placeholder?: string;
  className?: string;
  accentColor?: 'amber' | 'indigo';
  showProgress?: boolean;
}

export function SearchableSetSelect({
  sets,
  selectedSet,
  onSelectSet,
  placeholder = 'เลือกชุดการ์ด...',
  className = '',
  accentColor = 'amber',
  showProgress = true,
}: SearchableSetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Selected set object
  const selectedSetObj = useMemo(
    () => sets.find((s) => s.id === selectedSet),
    [sets, selectedSet]
  );

  // Filter sets by search term
  const filteredSets = useMemo(() => {
    if (!searchTerm.trim()) return sets;
    const term = searchTerm.trim().toLowerCase();
    return sets.filter(
      (s) =>
        s.id.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term)
    );
  }, [sets, searchTerm]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (ESC to close, Enter to pick first item)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      if (filteredSets.length > 0) {
        onSelectSet(filteredSets[0].id);
        setIsOpen(false);
      } else if (!searchTerm.trim()) {
        onSelectSet('ALL');
        setIsOpen(false);
      }
    }
  };

  const isAmber = accentColor === 'amber';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between gap-2 transition-all shadow-inner text-left group ${
          isOpen
            ? isAmber
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-indigo-500 ring-2 ring-indigo-500/20'
            : selectedSet !== 'ALL'
            ? isAmber
              ? 'border-amber-500/60 hover:border-amber-400 text-amber-300'
              : 'border-indigo-500/60 hover:border-indigo-400 text-indigo-300'
            : 'border-slate-700/90 hover:border-slate-600 text-slate-200'
        }`}
        title="คลิกเพื่อค้นหาและเลือกชุดการ์ด"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base shrink-0">
            {selectedSet === 'ALL' ? '📦' : '🗂️'}
          </span>
          <div className="min-w-0 flex-1 truncate">
            {selectedSet === 'ALL' ? (
              <span className="font-semibold text-slate-300">
                ทุกชุดการ์ด (All {sets.length} Sets)
              </span>
            ) : selectedSetObj ? (
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                    isAmber
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}
                >
                  {selectedSetObj.id}
                </span>
                <span className="truncate font-bold text-white">
                  {selectedSetObj.name}
                </span>
                {showProgress &&
                  selectedSetObj.count !== undefined &&
                  selectedSetObj.owned !== undefined && (
                    <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
                      ({selectedSetObj.owned}/{selectedSetObj.count} •{' '}
                      {selectedSetObj.count > 0
                        ? Math.round(
                            (selectedSetObj.owned / selectedSetObj.count) * 100
                          )
                        : 0}
                      %)
                    </span>
                  )}
              </div>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedSet !== 'ALL' && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSet('ALL');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onSelectSet('ALL');
                }
              }}
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition-colors"
              title="รีเซ็ตเป็นทุกชุดการ์ด"
            >
              ✕
            </span>
          )}
          <span
            className={`text-[10px] text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : 'group-hover:text-slate-200'
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 w-full sm:min-w-[420px] max-w-[95vw] bg-slate-900/98 backdrop-blur-xl border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-150 animate-in fade-in zoom-in-95 ${
            isAmber
              ? 'border-amber-500/40 ring-1 ring-amber-500/20'
              : 'border-indigo-500/40 ring-1 ring-indigo-500/20'
          }`}
          style={{ maxHeight: '420px' }}
        >
          {/* Popover Header with Search Box */}
          <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="พิมพ์ค้นหารหัสหรือชื่อชุด (เช่น SV1a, อัคคี, MA1)..."
                className={`w-full pl-8 pr-8 py-2 bg-slate-900 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                  isAmber
                    ? 'border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40'
                    : 'border-indigo-500/50 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/40'
                }`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>
                {searchTerm.trim()
                  ? `พบ ${filteredSets.length} ชุดการ์ด`
                  : `ชุดการ์ดทั้งหมด ${sets.length} ชุด`}
              </span>
              <span className="text-[10px] text-slate-500">
                กด ESC เพื่อปิด • Enter เพื่อเลือก
              </span>
            </div>
          </div>

          {/* Sets List Scroll Container */}
          <div className="overflow-y-auto overflow-x-hidden p-1.5 space-y-1 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* Option: ALL SETS */}
            {(!searchTerm.trim() ||
              'ทุกชุดการ์ด all sets'.includes(searchTerm.toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onSelectSet('ALL');
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                  selectedSet === 'ALL'
                    ? isAmber
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-black'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-black'
                    : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>ทุกชุดการ์ด (All Sets)</span>
                </div>
                {selectedSet === 'ALL' && (
                  <span className="text-xs font-black text-amber-400">✓</span>
                )}
              </button>
            )}

            {/* Filtered Individual Sets */}
            {filteredSets.map((s) => {
              const isSelected = selectedSet === s.id;
              const pct =
                s.count !== undefined && s.count > 0 && s.owned !== undefined
                  ? Math.round((s.owned / s.count) * 100)
                  : 0;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectSet(s.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? isAmber
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-black shadow-sm'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-black shadow-sm'
                      : 'hover:bg-slate-800/80 text-slate-200 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                        isSelected
                          ? isAmber
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-indigo-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {s.id}
                    </span>
                    <span className="truncate">{s.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {showProgress &&
                      s.count !== undefined &&
                      s.owned !== undefined && (
                        <div className="text-right">
                          <span
                            className={`text-[11px] font-bold ${
                              pct === 100
                                ? 'text-emerald-400'
                                : pct > 0
                                ? 'text-amber-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {s.owned}/{s.count}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({pct}%)
                          </span>
                        </div>
                      )}
                    {isSelected && (
                      <span className="text-xs font-black text-amber-400 ml-1">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredSets.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p className="text-base mb-1">🔍</p>
                <p>ไม่พบชุดการ์ดที่ตรงกับ &quot;{searchTerm}&quot;</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-amber-400 hover:underline text-xs font-bold"
                >
                  ล้างคำค้นหา
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
