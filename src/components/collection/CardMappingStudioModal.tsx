import { useState, useMemo, useEffect } from 'react';
import pokemonCardData from '../../data/pokemonNames.json';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import {
  getEnglishMatchForThaiCard,
  saveCardMapping,
  resetCardMapping,
  toggleMappingVerification,
  getCustomOverrides,
  type EnCardMapping,
} from '../../utils/thaiEnglishCardMatcher';

interface Props {
  onClose: () => void;
}

export function CardMappingStudioModal({ onClose }: Props) {
  // Filters & State
  const [filterTab, setFilterTab] = useState<'all' | 'review' | 'unmatched' | 'verified' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  // Custom overrides trigger state for re-rendering
  const [overridesVersion, setOverridesVersion] = useState(0);

  // Lazy loaded English catalog for re-matching
  const [enCatalog, setEnCatalog] = useState<any[] | null>(null);
  const [loadingEn, setLoadingEn] = useState(false);

  // Re-match modal state
  const [editingThaiCard, setEditingThaiCard] = useState<any | null>(null);
  const [enSearchQuery, setEnSearchQuery] = useState('');

  // Load English catalog on demand when modal opens or re-match starts
  useEffect(() => {
    if (!enCatalog && !loadingEn) {
      setLoadingEn(true);
      import('../../data/pokemonCardsEn.json')
        .then((m) => {
          setEnCatalog(m.default || m);
        })
        .catch((err) => {
          console.error('Failed to load English catalog:', err);
        })
        .finally(() => {
          setLoadingEn(false);
        });
    }
  }, [enCatalog, loadingEn]);

  // Extract unique sets from Thai cards
  const thaiSets = useMemo(() => {
    const sets = new Map<string, string>();
    (pokemonCardData as any[]).forEach((c) => {
      if (c.set?.id) sets.set(c.set.id, c.set.name || c.set.id);
    });
    return Array.from(sets.entries());
  }, []);

  // Filtered Thai Cards with their mappings
  const items = useMemo(() => {
    void overridesVersion; // trigger re-computation
    const overrides = getCustomOverrides();

    return (pokemonCardData as any[]).map((c) => {
      const mapping = overrides[c.id] || getEnglishMatchForThaiCard(c.id);
      return {
        thaiCard: c,
        mapping,
        isCustom: !!overrides[c.id]?.userOverridden,
      };
    });
  }, [overridesVersion]);

  // Apply Search, Set & Tab Filters
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter(({ thaiCard, mapping, isCustom }) => {
      // Set filter
      if (selectedSet !== 'ALL' && thaiCard.set?.id !== selectedSet) {
        return false;
      }

      // Tab filter
      if (filterTab === 'review') {
        if (!mapping || mapping.confidence >= 85 || mapping.verified) return false;
      } else if (filterTab === 'unmatched') {
        if (mapping) return false;
      } else if (filterTab === 'verified') {
        if (!mapping?.verified) return false;
      } else if (filterTab === 'custom') {
        if (!isCustom) return false;
      }

      // Search filter
      if (q) {
        const matchThName = (thaiCard.name || '').toLowerCase().includes(q);
        const matchThNum = (thaiCard.collectorNumber || '').toLowerCase().includes(q);
        const matchThId = (thaiCard.id || '').toLowerCase().includes(q);
        const matchEnName = (mapping?.enName || '').toLowerCase().includes(q);
        const matchEnSet = (mapping?.enSetName || '').toLowerCase().includes(q);

        if (!matchThName && !matchThNum && !matchThId && !matchEnName && !matchEnSet) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedSet, filterTab, searchQuery]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE) || 1;

  // Stats
  const stats = useMemo(() => {
    let matched = 0;
    let highConf = 0;
    let reviewNeeded = 0;
    let customCount = 0;

    items.forEach(({ mapping, isCustom }) => {
      if (mapping) {
        matched++;
        if (mapping.confidence >= 85 || mapping.verified) {
          highConf++;
        } else {
          reviewNeeded++;
        }
      }
      if (isCustom) customCount++;
    });

    return {
      total: items.length,
      matched,
      unmatched: items.length - matched,
      highConf,
      reviewNeeded,
      customCount,
      percentage: Math.round((matched / items.length) * 100),
    };
  }, [items]);

  // Re-match Candidates
  const enCandidates = useMemo(() => {
    if (!enCatalog || !editingThaiCard) return [];
    const q = enSearchQuery.trim().toLowerCase();
    if (!q) {
      // Default to search by translated or related name
      return enCatalog.slice(0, 30);
    }
    return enCatalog
      .filter((c) => {
        const nameMatch = (c.name || '').toLowerCase().includes(q);
        const setMatch = (c.set?.name || '').toLowerCase().includes(q) || (c.set?.id || '').toLowerCase().includes(q);
        const numMatch = (c.localId || '').toLowerCase() === q;
        return nameMatch || setMatch || numMatch;
      })
      .slice(0, 50);
  }, [enCatalog, editingThaiCard, enSearchQuery]);

  const handleSelectEnCard = (enCard: any) => {
    if (!editingThaiCard) return;

    const newMapping: EnCardMapping = {
      enCardId: enCard.id,
      enName: enCard.name,
      enSetId: enCard.set.id,
      enSetName: enCard.set.name,
      enNumber: enCard.localId,
      enImageUrl: enCard.imageUrl,
      confidence: 100,
      matchMethod: 'manual_override',
      verified: true,
      matchedAt: new Date().toISOString(),
      userOverridden: true,
    };

    saveCardMapping(editingThaiCard.id, newMapping);
    setEditingThaiCard(null);
    setOverridesVersion((v) => v + 1);
  };

  const handleResetMapping = (thaiCardId: string) => {
    resetCardMapping(thaiCardId);
    setOverridesVersion((v) => v + 1);
  };

  const handleToggleVerify = (thaiCardId: string, current: boolean) => {
    toggleMappingVerification(thaiCardId, current);
    setOverridesVersion((v) => v + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md shadow-indigo-500/20">
              🔄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Thai ⇄ English Card Mapping Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  v3.0 Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ระบบเชื่อมโยงฐานข้อมูลการ์ดไทยและการ์ดอังกฤษสำหรับวิเคราะห์ Meta Decks ระดับสากล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="mapping-studio-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* METRICS & SUMMARY BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-5 sm:px-8 py-3 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] font-bold block uppercase">จับคู่แล้ว (Matched)</span>
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
              {stats.matched.toLocaleString()}{' '}
              <span className="text-xs font-medium text-slate-400">({stats.percentage}%)</span>
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] font-bold block uppercase">แม่นยำสูง (High Conf)</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {stats.highConf.toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] font-bold block uppercase">รอตรวจสอบ (Review)</span>
            <span className="text-base font-black text-amber-500">
              {stats.reviewNeeded.toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] font-bold block uppercase">ยังไม่พบคู่ (Unmatched)</span>
            <span className="text-base font-black text-slate-500">
              {stats.unmatched.toLocaleString()}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px] font-bold block uppercase">แก้ไขเอง (Custom)</span>
            <span className="text-base font-black text-purple-500">
              {stats.customCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* CONTROLS & FILTERS */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setFilterTab('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({stats.total.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('review');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterTab === 'review'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ⚠️ รอตรวจสอบ ({stats.reviewNeeded})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('unmatched');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterTab === 'unmatched'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ❓ ยังไม่พบคู่ ({stats.unmatched})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('custom');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterTab === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ✏️ แก้ไขเอง ({stats.customCount})
            </button>
          </div>

          {/* Search & Set Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedSet}
              onChange={(e) => {
                setSelectedSet(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none shrink-0"
            >
              <option value="ALL">ทุกชุดการ์ดไทย ({thaiSets.length} ชุด)</option>
              {thaiSets.map(([id, name]) => (
                <option key={id} value={id}>
                  {id} - {name}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="ค้นหาชื่อการ์ด / เลข..."
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARD MAPPING GRID */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {paginatedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="font-bold">ไม่พบการ์ดตามเงื่อนไขที่เลือก</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedItems.map(({ thaiCard, mapping, isCustom }) => {
                const thaiImg = resolveCardImageUrl(thaiCard.imageUrlHigh || thaiCard.imageUrl);
                const enImg = mapping?.enImageUrl;
                const conf = mapping?.confidence || 0;

                return (
                  <div
                    key={thaiCard.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCustom
                        ? 'border-purple-500/40 bg-purple-500/5'
                        : mapping
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60'
                        : 'border-rose-500/30 bg-rose-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Thai Side */}
                      <div className="w-1/2 flex items-center gap-2.5">
                        <div className="w-12 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                          <img
                            src={thaiImg}
                            alt={thaiCard.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // If Thai card image fails, fallback to officialImageUrl, or mapped counterpart image if available
                              const fallbackUrl = thaiCard.officialImageUrl || mapping?.enImageUrl;
                              handleCardImageError(e, thaiCard.imageUrl, fallbackUrl);
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block truncate">
                            {thaiCard.set?.id || 'TH'} · {thaiCard.collectorNumber}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {thaiCard.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {thaiCard.hp ? `${thaiCard.hp} HP` : thaiCard.category}
                            {thaiCard.regulationMark && ` · Mark ${thaiCard.regulationMark}`}
                          </span>
                        </div>
                      </div>

                      {/* Center Indicator */}
                      <div className="flex flex-col items-center justify-center shrink-0 px-1">
                        <span className="text-xs">⇄</span>
                        {mapping ? (
                          <span
                            className={`text-[9px] font-black px-1 rounded ${
                              conf >= 90
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : conf >= 70
                                ? 'text-amber-500 bg-amber-500/10'
                                : 'text-rose-500 bg-rose-500/10'
                            }`}
                          >
                            {conf}%
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-rose-500">None</span>
                        )}
                      </div>

                      {/* English Side */}
                      <div className="w-1/2 flex items-center gap-2.5">
                        {mapping ? (
                          <>
                            <div className="w-12 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                              <img
                                src={enImg}
                                alt={mapping.enName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => handleCardImageError(e, enImg, mapping.enOfficialImageUrl)}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-sky-500 block truncate">
                                {mapping.enSetId.toUpperCase()} · #{mapping.enNumber}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {mapping.enName}
                              </h4>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {mapping.enSetName}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 text-center py-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                            <span className="text-[11px] text-slate-400 block">ยังไม่พบคู่</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[9px] font-bold">
                            User Edit
                          </span>
                        )}
                        {mapping?.verified && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleResetMapping(thaiCard.id)}
                            title="รีเซ็ตกลับไปใช้ผลลัพธ์ของ AI"
                            className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-rose-500"
                          >
                            ↺ รีเซ็ต
                          </button>
                        )}
                        {mapping && (
                          <button
                            type="button"
                            onClick={() => handleToggleVerify(thaiCard.id, !!mapping.verified)}
                            className="px-2 py-0.5 rounded text-[10px] text-slate-500 hover:text-emerald-600"
                          >
                            {mapping.verified ? 'ปลดตรวจ' : '✓ ตรวจแล้ว'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingThaiCard(thaiCard);
                            setEnSearchQuery(mapping?.enName || '');
                          }}
                          className="px-2.5 py-0.8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] transition-colors"
                        >
                          ✏️ แก้ไขคู่
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            แสดง {((page - 1) * PAGE_SIZE + 1).toLocaleString()} -{' '}
            {Math.min(page * PAGE_SIZE, filteredItems.length).toLocaleString()} จาก{' '}
            {filteredItems.length.toLocaleString()} รายการ
          </span>

          <div className="flex items-center gap-1.5 font-bold">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              ย้อนกลับ
            </button>
            <span className="px-2 font-black text-slate-700 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>

        {/* RE-MATCH PICKER MODAL (SUB-MODAL) */}
        {editingThaiCard && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    เลือกการ์ดภาษาอังกฤษเพื่อจับคู่กับ:
                  </h3>
                  <span className="text-xs font-bold text-indigo-500">
                    {editingThaiCard.name} ({editingThaiCard.set?.id} #{editingThaiCard.collectorNumber})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingThaiCard(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  value={enSearchQuery}
                  onChange={(e) => setEnSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหาชื่อการ์ดภาษาอังกฤษ เช่น Charizard, Iono, Boss..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {enCandidates.map((enCard) => (
                  <button
                    key={enCard.id}
                    type="button"
                    onClick={() => handleSelectEnCard(enCard)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-800/60 text-left flex items-center gap-3 transition-all hover:shadow-md group"
                  >
                    <div className="w-12 h-16 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                      <img
                        src={enCard.imageUrl}
                        alt={enCard.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => handleCardImageError(e, enCard.imageUrl, enCard.officialImageUrl)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase text-sky-500 block truncate">
                        {enCard.set?.name} · #{enCard.localId}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-500">
                        {enCard.name}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        {enCard.hp ? `${enCard.hp} HP` : enCard.category}
                        {enCard.regulationMark && ` · Mark ${enCard.regulationMark}`}
                      </span>
                    </div>
                    <span className="text-xs text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      เลือก ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
