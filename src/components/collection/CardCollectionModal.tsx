import { createPortal } from 'react-dom';
import { useCollectionStore } from '../../store/collectionStore';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import type { CardVariantKey, CardCondition } from '../../types/collection';

interface Props {
  card: any;
  onClose: () => void;
}

const VARIANTS: { key: CardVariantKey; label: string; icon: string; desc: string; color: string }[] = [
  { key: 'normal', label: 'ธรรมดา (Normal)', icon: '⚪', desc: 'การ์ดธรรมดาไม่มีฟอยล์', color: 'slate' },
  { key: 'holo', label: 'ฟอยล์ (Holo)', icon: '✨', desc: 'ฟอยล์สะท้อนแสงในกรอบรูป', color: 'amber' },
  { key: 'reverse', label: 'รีเวิร์ส (Reverse Holo)', icon: '🌟', desc: 'ฟอยล์สะท้อนแสงทั่วทั้งใบการ์ด', color: 'cyan' },
  { key: 'promo', label: 'โปรโม (Promo / Special)', icon: '🎁', desc: 'การ์ดแจกพิเศษ / ปั๊มตรา', color: 'purple' },
];

const CONDITIONS: { key: CardCondition; label: string; desc: string }[] = [
  { key: 'NM', label: 'NM (Near Mint)', desc: 'สภาพสมบูรณ์เหมือนใหม่' },
  { key: 'LP', label: 'LP (Light Played)', desc: 'มีรอยเล็กน้อยมาก' },
  { key: 'MP', label: 'MP (Mod Played)', desc: 'มีรอยปานกลาง' },
  { key: 'HP', label: 'HP (Heavy Played)', desc: 'มีตำหนิเห็นชัด' },
];

export function CardCollectionModal({ card, onClose }: Props) {
  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profile = useCollectionStore((s) => s.profiles[activeProfileId]);
  const setVariantCount = useCollectionStore((s) => s.setVariantCount);
  const incrementVariant = useCollectionStore((s) => s.incrementVariant);
  const decrementVariant = useCollectionStore((s) => s.decrementVariant);
  const toggleWishlist = useCollectionStore((s) => s.toggleWishlist);
  const setCardDetails = useCollectionStore((s) => s.setCardDetails);
  const clearCard = useCollectionStore((s) => s.clearCard);

  const cardEntry = profile?.cards[card.id];
  const variants = cardEntry?.variants || { normal: 0, holo: 0, reverse: 0, promo: 0 };
  const isWishlist = !!cardEntry?.isWishlist;
  const currentCondition = cardEntry?.condition || 'NM';
  const currentNote = cardEntry?.note || '';

  const totalCount = Object.values(variants).reduce((a, b) => a + b, 0);

  const imgUrl = resolveCardImageUrl(card.imageUrlHigh || card.imageUrl);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        {/* Left: High-Res Card Image & Visuals */}
        <div className="md:w-5/12 bg-slate-950 p-4 sm:p-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 relative">
          <div className="relative group max-w-[240px] w-full aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-xl shadow-black/60 ring-1 ring-slate-700/50">
            <img
              src={imgUrl}
              alt={card.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                totalCount === 0 ? 'grayscale-[50%] opacity-85' : 'brightness-105'
              }`}
              onError={(e) => handleCardImageError(e, card.imageUrl, card.officialImageUrl)}
            />
            {totalCount > 0 && (
              <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1">
                <span>มี {totalCount} ใบ</span>
              </div>
            )}
          </div>

          <div className="mt-3 text-center w-full">
            <h3 className="text-sm font-bold text-white leading-tight">{card.name}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {card.set?.name || 'Expansion'} · {card.collectorNumber || card.localId}
            </p>
          </div>
        </div>

        {/* Right: Controls & Variant Quantities */}
        <div className="md:w-7/12 p-4 sm:p-5 overflow-y-auto flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header & Wishlist Button */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px] font-bold">
                    {card.set?.id || 'PROMO'}
                  </span>
                  {card.regulationMark && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                      Reg [{card.regulationMark}]
                    </span>
                  )}
                  {card.category && (
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 text-[10px]">
                      {card.category}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-extrabold text-white mt-1">{card.name}</h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleWishlist(card.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isWishlist
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/10'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300'
                  }`}
                  title="ปักหมุดเป็นการ์ดที่ตามหา (Wishlist)"
                >
                  <span>⭐</span>
                  <span>{isWishlist ? 'ใน Wishlist' : '+ Wishlist'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Variant Quantities Section */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                จำนวนการ์ดแยกตามเวอร์ชัน (Variants)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VARIANTS.map(({ key, label, icon, desc }) => {
                  const count = variants[key] || 0;
                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        count > 0
                          ? 'bg-slate-800/90 border-amber-500/40 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span>{icon}</span>
                          <span className="text-xs font-bold text-slate-200 truncate">{label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{desc}</p>
                      </div>

                      {/* Counter Controls */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => decrementVariant(card.id, key)}
                          disabled={count === 0}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold text-xs flex items-center justify-center transition-all"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={count}
                          onChange={(e) => setVariantCount(card.id, key, parseInt(e.target.value, 10) || 0)}
                          className="w-8 text-center bg-slate-950 border border-slate-700 rounded py-0.5 text-xs font-black text-amber-300 focus:outline-none"
                        />
                        <button
                          onClick={() => incrementVariant(card.id, key)}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center transition-all shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Condition & Note Section */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Condition Selector */}
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">สภาพการ์ด (Condition)</label>
                  <select
                    value={currentCondition}
                    onChange={(e) => setCardDetails(card.id, { condition: e.target.value as CardCondition })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label} - {c.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Card Note */}
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">บันทึกช่วยจำ (Note)</label>
                  <input
                    type="text"
                    placeholder="เช่น เก็บในอัลบั้ม A, มีรอยมุมขวา..."
                    value={currentNote}
                    onChange={(e) => setCardDetails(card.id, { note: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {totalCount > 0 || isWishlist ? (
              <button
                onClick={() => {
                  if (confirm('คุณต้องการลบการ์ดนี้ออกจากคอลเลกชันใช่หรือไม่?')) {
                    clearCard(card.id);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-all flex items-center gap-1"
              >
                <span>🗑️ ลบจากสมุด</span>
              </button>
            ) : <div />}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              เสร็จสิ้น
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
