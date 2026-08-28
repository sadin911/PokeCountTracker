import { useState, useMemo } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import { calculateMissingCards, generateShoppingListText } from '../../utils/deckCalculator';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { CardCollectionModal } from '../collection/CardCollectionModal';
import type { Deck, EquivalentOwnedCard } from '../../types/deck';

interface Props {
  deck: Deck;
  cardDataMap: Map<string, any>;
  onClose: () => void;
}

export function MissingCardsModal({ deck, cardDataMap, onClose }: Props) {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profile = useCollectionStore((s) => s.profiles[activeProfileId]);
  const userCollectionCards = profile?.cards || {};

  const [calculationMode, setCalculationMode] = useState<'equivalent' | 'exact'>('equivalent');
  const [filterTab, setFilterTab] = useState<'missing' | 'complete' | 'all'>('missing');
  const [copied, setCopied] = useState(false);
  const [selectedCardForCollection, setSelectedCardForCollection] = useState<any | null>(null);

  const report = useMemo(() => {
    return calculateMissingCards(deck, cardDataMap, userCollectionCards, calculationMode);
  }, [deck, cardDataMap, userCollectionCards, calculationMode]);

  const handleCopyShoppingList = () => {
    const text = generateShoppingListText(deck.name, report);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const displayedItems =
    filterTab === 'missing'
      ? report.missingItems
      : filterTab === 'complete'
      ? report.completeItems
      : [...report.missingItems, ...report.completeItems];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
              🧮
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>คำนวณการ์ดที่ขาด:</span>
                <span className="text-amber-400">{deck.name}</span>
              </h3>
              <p className="text-xs text-slate-400">
                เปรียบเทียบกับสมุดสะสมโปรไฟล์ "{profile?.name || 'My Collection'}" · แตะการ์ดเพื่อเติมเข้าสมุดสะสมได้ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-black border border-slate-700 hover:border-rose-400 shadow-md transition-all active:scale-95 group"
            title="ปิดหน้าต่าง (ESC)"
          >
            <span className="text-sm font-black group-hover:rotate-90 transition-transform">✕</span>
            <span>ปิด</span>
          </button>
        </div>

        {/* Mode Selector & Summary Bar */}
        <div className="p-6 bg-slate-950/40 border-b border-slate-800 space-y-4">
          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 px-2 flex items-center gap-1.5">
              <span>⚙️</span>
              <span>เงื่อนไขการคำนวณ:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setCalculationMode('equivalent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  calculationMode === 'equivalent'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>✨</span>
                <span>รวมชื่อเดียวกัน (ทุกชุด/ทุกแรร์)</span>
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('exact')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  calculationMode === 'exact'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🎯</span>
                <span>ตรงชุด/ตรงภาพเป๊ะๆ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase">ต้องใช้ทั้งหมด</div>
              <div className="text-lg sm:text-2xl font-black text-white mt-0.5">
                {report.totalCardsNeeded} <span className="text-xs font-normal text-slate-400">ใบ</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-[10px] sm:text-xs text-emerald-400 font-bold uppercase">มีในคอลเลกชัน</div>
              <div className="text-lg sm:text-2xl font-black text-emerald-300 mt-0.5">
                {report.totalCardsOwned} <span className="text-xs font-normal text-emerald-400">ใบ</span>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border ${
                report.totalCardsMissing > 0
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-emerald-500/15 border-emerald-500/40'
              }`}
            >
              <div
                className={`text-[10px] sm:text-xs font-bold uppercase ${
                  report.totalCardsMissing > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {report.totalCardsMissing > 0 ? 'ขาดอีก' : 'สถานะ'}
              </div>
              <div
                className={`text-lg sm:text-2xl font-black mt-0.5 ${
                  report.totalCardsMissing > 0 ? 'text-rose-300' : 'text-emerald-300'
                }`}
              >
                {report.totalCardsMissing > 0 ? (
                  <>
                    {report.totalCardsMissing}{' '}
                    <span className="text-xs font-normal text-rose-400">ใบ</span>
                  </>
                ) : (
                  'ครบ 100% ✨'
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-extrabold">
              <span className="text-slate-300">ความพร้อมของเด็ค</span>
              <span className="text-amber-400">{report.completionPercentage}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden shadow-inner p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 shadow-lg"
                style={{ width: `${report.completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Row: Tabs & Copy Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterTab('missing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  filterTab === 'missing'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ขาด ({report.missingItems.length})
              </button>
              <button
                onClick={() => setFilterTab('complete')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  filterTab === 'complete'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ครบแล้ว ({report.completeItems.length})
              </button>
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  filterTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ทั้งหมด ({report.missingItems.length + report.completeItems.length})
              </button>
            </div>

            <button
              onClick={handleCopyShoppingList}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                copied
                  ? 'bg-emerald-500 text-slate-950 scale-105'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:scale-105 active:scale-95'
              }`}
            >
              <span>{copied ? '✅' : '📋'}</span>
              <span>{copied ? 'คัดลอกรายการแล้ว!' : 'คัดลอกรายการการ์ดที่ขาด'}</span>
            </button>
          </div>
        </div>

        {/* Card List Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {displayedItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-4xl">✨</span>
              <p className="text-sm font-bold text-slate-300">
                {filterTab === 'missing'
                  ? 'ยินดีด้วย! คุณมีการ์ดในเด็คนี้ครบ 100% แล้ว'
                  : 'ไม่มีรายการการ์ดในหมวดนี้'}
              </p>
            </div>
          ) : (
            displayedItems.map((item) => {
              const imgUrl = resolveCardImageUrl(item.imageUrl);
              const isMissing = item.missingCount > 0;
              const fullCard = cardDataMap.get(item.cardId) || {
                id: item.cardId,
                name: item.name,
                imageUrl: item.imageUrl,
                category: item.category,
                set: { id: item.setId },
                collectorNumber: item.collectorNumber,
              };

              // Alternate prints in user collection
              const otherPrints = (item.equivalentCardsOwned || []).filter(
                (c: EquivalentOwnedCard) => !c.isExact && c.count > 0
              );

              return (
                <div
                  key={item.cardId}
                  onClick={() => setSelectedCardForCollection(fullCard)}
                  className={`group p-3 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer select-none active:scale-[0.99] ${
                    isMissing
                      ? 'bg-slate-900/90 hover:bg-slate-850 border-rose-500/30 hover:border-rose-500/70 hover:shadow-lg hover:shadow-rose-950/30'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-950/30'
                  }`}
                  title="คลิกเพื่อเปิดหน้าจัดการการ์ด / เติมเข้าสมุดสะสม"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-950 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleCardImageError(e, item.imageUrl)}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 font-bold text-amber-400">
                            {item.setId}
                          </span>
                          <span>{item.collectorNumber}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5 group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>
                            {item.category === 'Pokemon' ? '👾 โปเกมอน' : item.category === 'Trainer' ? '🎒 เทรนเนอร์' : '⚡ พลังงาน'}
                          </span>
                          <span className="text-amber-400/80 font-semibold group-hover:text-amber-300">
                            · แตะเพื่อเติมเข้าสมุด ➔
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Badges & Quick Action */}
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <div className="text-slate-400 text-[10px]">
                          {calculationMode === 'equivalent' ? 'ในเด็ค / มีรวม' : 'ในเด็ค / มีตรงชุด'}
                        </div>
                        <div className="font-mono font-bold text-slate-200">
                          <span className="text-amber-400 font-black">{item.countNeeded}</span> /{' '}
                          {calculationMode === 'equivalent' ? item.totalEquivalentOwned : item.exactOwned}
                        </div>
                      </div>

                      {isMissing ? (
                        <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 group-hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-black text-xs sm:text-sm shadow-sm flex items-center gap-1">
                          <span>ขาดอีก</span>
                          <span className="text-rose-400 font-extrabold text-base">{item.missingCount}</span>
                          <span>ใบ</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-black text-xs shadow-sm">
                          {calculationMode === 'equivalent' && item.exactOwned < item.countNeeded
                            ? 'ครบแล้ว (มีชุดอื่น) ✨'
                            : 'ครบแล้ว ✅'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alternate Printings Owned Strip */}
                  {otherPrints.length > 0 && (
                    <div
                      className="pt-2 mt-1 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <span>📦</span>
                        <span>มีชุดอื่นในคอลเลกชัน:</span>
                      </span>
                      {otherPrints.map((alt) => {
                        const altCard = cardDataMap.get(alt.cardId) || {
                          id: alt.cardId,
                          name: item.name,
                          imageUrl: alt.imageUrl,
                          set: { id: alt.setId, name: alt.setName },
                          collectorNumber: alt.collectorNumber,
                        };
                        return (
                          <button
                            key={alt.cardId}
                            type="button"
                            onClick={() => setSelectedCardForCollection(altCard)}
                            className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 font-mono transition-all flex items-center gap-1"
                            title={`เปิดจัดการ ${alt.setName} (${alt.setId} ${alt.collectorNumber})`}
                          >
                            <span className="text-amber-400 font-bold">{alt.setId}</span>
                            <span>{alt.collectorNumber}</span>
                            <span className="text-emerald-400 font-bold">x{alt.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs sm:text-sm font-black border border-slate-600 shadow-lg transition-all flex items-center gap-1.5"
          >
            <span>✕</span>
            <span>ปิดหน้าต่าง</span>
          </button>
        </div>
      </div>

      {/* Card Collection & Management Modal */}
      {selectedCardForCollection && (
        <CardCollectionModal
          card={selectedCardForCollection}
          deckId={deck.id}
          onClose={() => setSelectedCardForCollection(null)}
        />
      )}
    </div>
  );
}
