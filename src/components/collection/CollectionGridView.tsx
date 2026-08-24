import { useState, useEffect, useRef } from 'react';
import { CollectionCardItem } from './CollectionCardItem';
import { CardCollectionModal } from './CardCollectionModal';
import { useCollectionStore } from '../../store/collectionStore';
import type { CardVariantCount, SetProgress } from '../../types/collection';

interface Props {
  cards: any[];
  currentSetProgress?: SetProgress | null;
  showFullColor?: boolean;
}

const ITEMS_PER_PAGE = 60;

export function CollectionGridView({ cards, currentSetProgress, showFullColor }: Props) {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profile = useCollectionStore((s) => s.profiles[activeProfileId]);
  const incrementVariant = useCollectionStore((s) => s.incrementVariant);
  const toggleWishlist = useCollectionStore((s) => s.toggleWishlist);

  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset pagination when card list changes
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [cards]);

  const displayedCards = cards.slice(0, displayLimit);
  const hasMore = displayLimit < cards.length;

  // Auto Infinite Scroll with IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setDisplayLimit((prev) => Math.min(prev + ITEMS_PER_PAGE, cards.length));
        }
      },
      {
        root: null,
        rootMargin: '400px', // Trigger before reaching the absolute bottom
        threshold: 0.1,
      }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, cards.length]);

  const handleQuickAdd = (card: any) => {
    const name = (card.name || '').toLowerCase();
    const setId = (card.set?.id || '').toUpperCase();
    const colNum = (card.collectorNumber || card.localId || '').toUpperCase();

    if (setId === 'PROMO' || colNum.includes('PROMO') || colNum.startsWith('P-')) {
      incrementVariant(card.id, 'promo');
    } else if (
      name.includes(' ex') ||
      name.includes('ex') ||
      name.includes('vmax') ||
      name.includes('vstar') ||
      name.includes(' v') ||
      name.includes('radiant') ||
      colNum.includes('MUR') ||
      colNum.includes('SAR') ||
      colNum.includes('UR') ||
      colNum.includes('HR') ||
      colNum.includes('SR') ||
      colNum.includes('AR')
    ) {
      incrementVariant(card.id, 'holo');
    } else {
      incrementVariant(card.id, 'normal');
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-4">
      {/* Set Progress Header (If specific set is selected) */}
      {currentSetProgress && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 w-full md:w-auto">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20">
                {currentSetProgress.setId}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                {currentSetProgress.setName}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              สะสมได้แล้ว <span className="text-amber-400 font-extrabold">{currentSetProgress.uniqueOwned}</span> จากทั้งหมด{' '}
              <span className="text-slate-100 font-extrabold">{currentSetProgress.totalCards}</span> แบบ (รวม{' '}
              <span className="text-cyan-300 font-bold">{currentSetProgress.totalCount}</span> ใบ)
            </p>
          </div>

          {/* Progress Bar & Percentage Pill */}
          <div className="w-full md:w-80 flex items-center gap-3.5">
            <div className="flex-1 bg-slate-950 rounded-full h-4 p-0.5 overflow-hidden border border-slate-700 shadow-inner">
              <div
                className="bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${currentSetProgress.percentage}%` }}
              />
            </div>
            <span className="text-sm font-black text-amber-300 min-w-[50px] text-right">
              {currentSetProgress.percentage}%
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {cards.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <span className="text-5xl">🔍</span>
          <h3 className="text-lg font-bold text-slate-200">ไม่พบการ์ดที่ตรงกับเงื่อนไขการค้นหา</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ลองเปลี่ยนคำค้นหา หรือเลือกชุดการ์ด / ธาตุ / สถานะอื่นเพื่อดูการ์ด
          </p>
        </div>
      ) : (
        <>
          {/* Card Grid - Full Screen Multi-Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 sm:gap-4">
            {displayedCards.map((card) => {
              const entry = profile?.cards[card.id];
              const variants: CardVariantCount = entry?.variants || {
                normal: 0,
                holo: 0,
                reverse: 0,
                promo: 0,
              };

              return (
                <CollectionCardItem
                  key={card.id}
                  card={card}
                  variants={variants}
                  isWishlist={entry?.isWishlist}
                  showFullColor={showFullColor}
                  onSelect={(c) => setSelectedCard(c)}
                  onQuickAdd={handleQuickAdd}
                  onToggleWishlist={toggleWishlist}
                />
              );
            })}
          </div>

          {/* Auto Load Sentinel & Indicator */}
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="py-10 text-center flex flex-col items-center justify-center gap-2 text-slate-400"
            >
              <div className="w-7 h-7 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-400">
                กำลังโหลดการ์ดเพิ่มเติม... ({displayedCards.length} / {cards.length} ใบ)
              </p>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs font-semibold">
              ✨ แสดงการ์ดครบทั้งหมด {cards.length.toLocaleString()} ใบแล้ว
            </div>
          )}
        </>
      )}

      {/* Card Detail / Variant Edit Modal */}
      {selectedCard && (
        <CardCollectionModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
