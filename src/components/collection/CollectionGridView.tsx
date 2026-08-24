import { useState, useEffect } from 'react';
import { CollectionCardItem } from './CollectionCardItem';
import { CardCollectionModal } from './CardCollectionModal';
import { useCollectionStore } from '../../store/collectionStore';
import type { CardVariantCount, SetProgress } from '../../types/collection';

interface Props {
  cards: any[];
  currentSetProgress?: SetProgress | null;
}

const ITEMS_PER_PAGE = 48;

export function CollectionGridView({ cards, currentSetProgress }: Props) {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profile = useCollectionStore((s) => s.profiles[activeProfileId]);
  const incrementVariant = useCollectionStore((s) => s.incrementVariant);
  const toggleWishlist = useCollectionStore((s) => s.toggleWishlist);

  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  // Reset pagination when card list changes
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [cards]);

  const displayedCards = cards.slice(0, displayLimit);
  const hasMore = displayLimit < cards.length;

  const handleQuickAdd = (card: any) => {
    incrementVariant(card.id, 'normal');
  };

  return (
    <div className="flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-4">
      {/* Set Progress Header (If specific set is selected) */}
      {currentSetProgress && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-1 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-xs">
                {currentSetProgress.setId}
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {currentSetProgress.setName}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              สะสมได้แล้ว <span className="text-amber-400 font-bold">{currentSetProgress.uniqueOwned}</span> จากทั้งหมด{' '}
              <span className="text-slate-200 font-bold">{currentSetProgress.totalCards}</span> แบบ (รวม{' '}
              {currentSetProgress.totalCount} ใบ)
            </p>
          </div>

          {/* Progress Bar & Percentage Pill */}
          <div className="w-full sm:w-72 flex items-center gap-3">
            <div className="flex-1 bg-slate-950 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentSetProgress.percentage}%` }}
              />
            </div>
            <span className="text-xs font-black text-amber-300 min-w-[45px] text-right">
              {currentSetProgress.percentage}%
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {cards.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <span className="text-4xl">🔍</span>
          <h3 className="text-base font-bold text-slate-300">ไม่พบการ์ดที่ตรงกับเงื่อนไขการค้นหา</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือเปลี่ยนตัวกรองสถานะ/หมวดหมู่เพื่อดูการ์ดอื่น ๆ
          </p>
        </div>
      ) : (
        <>
          {/* Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
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
                  onSelect={(c) => setSelectedCard(c)}
                  onQuickAdd={handleQuickAdd}
                  onToggleWishlist={toggleWishlist}
                />
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 pb-8 text-center">
              <button
                onClick={() => setDisplayLimit((prev) => prev + ITEMS_PER_PAGE)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 shadow-md transition-all"
              >
                โหลดการ์ดเพิ่มเติม ({displayedCards.length} / {cards.length} ใบ)
              </button>
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
