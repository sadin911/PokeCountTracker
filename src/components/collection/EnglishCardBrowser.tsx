import { useState, useMemo, useEffect, useRef } from 'react';
import { CardCollectionModal } from './CardCollectionModal';
import { getThaiCardIdForEnglishCard } from '../../utils/thaiEnglishCardMatcher';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';
import setsEnMetadata from '../../data/pokemonSetsEn.json';

interface Props {
  onBackToThai: () => void;
}

const ITEMS_PER_PAGE = 60;

export function EnglishCardBrowser({ onBackToThai }: Props) {
  const [cardsEn, setCardsEn] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSet, setSelectedSet] = useState<string>('ALL');
  const [selectedReg, setSelectedReg] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'ALL' | 'MATCHED' | 'UNMATCHED'>('ALL');

  // Pagination & Modal
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load English dataset dynamically
  useEffect(() => {
    import('../../data/pokemonCardsEn.json')
      .then((m) => {
        setCardsEn(m.default || m);
      })
      .catch((err) => {
        console.error('Failed to load English cards:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sets dropdown options
  const setsList = useMemo(() => {
    const futureSets = new Set(['me5', 'me4', 'me3', 'me2pt5']);
    return (setsEnMetadata as any[]).map((s) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      total: s.total,
      isUpcoming: futureSets.has(s.id),
    }));
  }, []);

  // Filter cards
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return cardsEn.filter((card) => {
      // Set filter
      if (selectedSet !== 'ALL' && card.set?.id !== selectedSet) return false;

      // Regulation filter
      if (selectedReg !== 'ALL' && card.regulationMark !== selectedReg) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && card.category !== selectedCategory) return false;

      // Type filter
      if (selectedType !== 'ALL' && !(card.types || []).includes(selectedType)) return false;

      // Match status filter
      if (matchStatusFilter !== 'ALL') {
        const hasMatch = !!getThaiCardIdForEnglishCard(card.id);
        if (matchStatusFilter === 'MATCHED' && !hasMatch) return false;
        if (matchStatusFilter === 'UNMATCHED' && hasMatch) return false;
      }

      // Search query
      if (q) {
        const nameMatch = (card.name || '').toLowerCase().includes(q);
        const setMatch = (card.set?.name || '').toLowerCase().includes(q);
        const numMatch = (card.localId || '').toLowerCase() === q;
        const artistMatch = (card.artist || '').toLowerCase().includes(q);
        if (!nameMatch && !setMatch && !numMatch && !artistMatch) return false;
      }

      return true;
    });
  }, [cardsEn, selectedSet, selectedReg, selectedCategory, selectedType, matchStatusFilter, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [selectedSet, selectedReg, selectedCategory, selectedType, matchStatusFilter, searchQuery]);

  const displayedCards = filteredCards.slice(0, displayLimit);
  const hasMore = displayLimit < filteredCards.length;

  // Infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDisplayLimit((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredCards.length));
        }
      },
      { rootMargin: '1200px 0px', threshold: 0.01 }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, filteredCards.length]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Banner: Switch Back to Thai */}
      <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🇺🇸</span>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
              English Pokémon TCG Catalog (คลังการ์ดภาษาอังกฤษ)
            </h2>
            <p className="text-[11px] text-sky-100 font-medium">
              ฐานข้อมูลการ์ดภาษาอังกฤษฉบับสมบูรณ์ (Sword & Shield จนถึงปัจจุบัน) เพื่อดูสถิติและจับคู่กับการ์ดไทย
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToThai}
          className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <span>🇹🇭</span>
          <span className="hidden sm:inline">สลับกลับไป</span>
          <span>การ์ดไทย</span>
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sets dropdown */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none w-full sm:w-auto"
            >
              <option value="ALL">ทุกชุดภาษาอังกฤษ ({setsList.length} ชุด)</option>
              {setsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.isUpcoming ? `⏳ [รอเปิดตัว] ${s.name}` : s.name} ({s.id.toUpperCase()})
                </option>
              ))}
            </select>

            {/* Regulation Marks */}
            <select
              value={selectedReg}
              onChange={(e) => setSelectedReg(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="ALL">ทุก Mark</option>
              <option value="I">Mark [I]</option>
              <option value="H">Mark [H]</option>
              <option value="G">Mark [G]</option>
              <option value="F">Mark [F]</option>
              <option value="E">Mark [E]</option>
              <option value="D">Mark [D]</option>
            </select>

            {/* Energy Types */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="ALL">ทุกธาตุ (Type)</option>
              <option value="Colorless">⚪ ไร้สี (Colorless)</option>
              <option value="Grass">🌿 พืช (Grass)</option>
              <option value="Fire">🔥 ไฟ (Fire)</option>
              <option value="Water">💧 น้ำ (Water)</option>
              <option value="Lightning">⚡ สายฟ้า (Lightning)</option>
              <option value="Psychic">🔮 พลังจิต (Psychic)</option>
              <option value="Fighting">🥊 ต่อสู้ (Fighting)</option>
              <option value="Darkness">🌑 ความมืด (Darkness)</option>
              <option value="Metal">⚙️ โลหะ (Metal)</option>
              <option value="Dragon">🐉 มังกร (Dragon)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อการ์ด / เลข เช่น Pikachu, 125..."
              className="w-full h-9 pl-8 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-sky-500"
            />
            <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-bold">
            {['ALL', 'Pokemon', 'Trainer', 'Energy'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'ทั้งหมด' : cat}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Match status */}
            <button
              type="button"
              onClick={() => setMatchStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] ${
                matchStatusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              สถานะ: ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setMatchStatusFilter('MATCHED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                matchStatusFilter === 'MATCHED' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              <span>✓ มีคู่การ์ดไทย</span>
            </button>
            <button
              type="button"
              onClick={() => setMatchStatusFilter('UNMATCHED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                matchStatusFilter === 'UNMATCHED' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              <span>? ยังไม่พบคู่</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-bold">
            แสดง {displayedCards.length.toLocaleString()} จาก {filteredCards.length.toLocaleString()} การ์ด
          </div>
        </div>
      </div>

      {/* CARD GRID */}
      <div className="p-3 sm:p-6 flex-1">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <p className="font-bold text-sm">กำลังโหลดคลังการ์ดภาษาอังกฤษ 11,303 ใบ...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <span className="text-4xl block mb-2">🔍</span>
            <p className="font-bold">ไม่พบการ์ดภาษาอังกฤษตามเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {displayedCards.map((card) => {
              const thCardId = getThaiCardIdForEnglishCard(card.id);

              return (
                <div
                  key={card.id}
                  data-testid="en-card-item"
                  data-en-id={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-500/60 transition-all cursor-pointer flex flex-col"
                >
                  {/* Card Image */}
                  <div className="aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <img
                      src={resolveCardImageUrl(card.imageUrl)}
                      alt={card.name}
                      loading="lazy"
                      onError={(e) => handleCardImageError(e, card.imageUrl, card.officialImageUrl)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Upcoming Art Placeholder Overlay for Unreleased Future Sets */}
                    {['me5', 'me4', 'me3', 'me2pt5'].includes(card.set?.id) && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                        <span className="text-2xl mb-1">⏳</span>
                        <span className="text-[10px] font-black text-amber-300 tracking-tight">
                          รอภาพเปิดตัว
                        </span>
                        <span className="text-[8px] text-slate-300 font-mono">
                          {card.set?.releaseDate}
                        </span>
                      </div>
                    )}

                    {/* Matched Thai Indicator Badge */}
                    <div className="absolute top-2 right-2">
                      {thCardId ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white text-[9px] font-black shadow-sm backdrop-blur-sm">
                          🇹🇭 มีคู่ไทย
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-900/80 text-slate-400 text-[9px] font-bold shadow-sm backdrop-blur-sm">
                          ยังไม่พบคู่
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Meta */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-sky-500 font-black uppercase tracking-wider">
                        <span>{card.set?.id}</span>
                        <span>#{card.localId}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5 group-hover:text-sky-500 transition-colors">
                        {card.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>{card.hp ? `${card.hp} HP` : card.category}</span>
                      {card.regulationMark && (
                        <span className="font-mono font-bold">[{card.regulationMark}]</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Indicator */}
        {hasMore && (
          <div ref={sentinelRef} className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <span className="text-xs font-bold">กำลังโหลดการ์ดเพิ่มเติม...</span>
          </div>
        )}
      </div>

      {/* Card Collection / Detail Modal */}
      {selectedCard && (
        <CardCollectionModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
