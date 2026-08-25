import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useCollectionStore } from '../../store/collectionStore';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import type { CardVariantKey, CardCondition } from '../../types/collection';

interface Props {
  card: any;
  onClose: () => void;
}

interface VariantDef {
  key: CardVariantKey;
  label: string;
  icon: string;
  desc: string;
  color: string;
}

const ALL_VARIANTS_MAP: Record<CardVariantKey, VariantDef> = {
  normal: {
    key: 'normal',
    label: 'การ์ดธรรมดา (Normal)',
    icon: '⚪',
    desc: 'การ์ดทั่วไปไม่มีฟอยล์สะท้อนแสง',
    color: 'slate',
  },
  holo: {
    key: 'holo',
    label: 'การ์ดฟอยล์ (Holo / Special Foil)',
    icon: '✨',
    desc: 'ฟอยล์สะท้อนแสง / การ์ดระดับสูง',
    color: 'amber',
  },
  reverse: {
    key: 'reverse',
    label: 'รีเวิร์ส / มิลเลอร์ฟอยล์ (Mirror Foil)',
    icon: '🌟',
    desc: 'ฟอยล์สะท้อนแสงลายมิลเลอร์ทั่วทั้งใบ',
    color: 'cyan',
  },
  promo: {
    key: 'promo',
    label: 'การ์ดโปรโม (Promo / Event Stamp)',
    icon: '🎁',
    desc: 'การ์ดแจกพิเศษ / ตราปั๊มกิจกรรม',
    color: 'purple',
  },
};

const CONDITIONS: { key: CardCondition; label: string; desc: string }[] = [
  { key: 'NM', label: 'NM (Near Mint)', desc: 'สภาพสมบูรณ์เหมือนใหม่' },
  { key: 'LP', label: 'LP (Light Played)', desc: 'มีรอยขอบเล็กน้อย' },
  { key: 'MP', label: 'MP (Moderately Played)', desc: 'มีรอยใช้งานปานกลาง' },
  { key: 'HP', label: 'HP (Heavily Played)', desc: 'มีตำหนิชัดเจน' },
];

/**
 * Smart detection of applicable variants for a card in Thai Pokémon TCG
 */
function getApplicableVariants(card: any, currentVariants: Record<CardVariantKey, number>): VariantDef[] {
  const name = (card.name || '').toLowerCase();
  const setId = (card.set?.id || '').toUpperCase();
  const colNum = (card.collectorNumber || card.localId || '').toUpperCase();

  const isPromo =
    setId === 'PROMO' ||
    colNum.includes('PROMO') ||
    colNum.startsWith('P-') ||
    colNum.startsWith('S-P') ||
    colNum.startsWith('SV-P') ||
    colNum.startsWith('M-P');

  const isHighRarity =
    name.includes(' ex') ||
    name.includes('ex') ||
    name.includes('vmax') ||
    name.includes('vstar') ||
    name.includes(' v') ||
    name.includes('radiant') ||
    name.includes('ประกายแสง') ||
    name.includes('เอซสเปก') ||
    name.includes('ace spec') ||
    colNum.includes('MUR') ||
    colNum.includes('SAR') ||
    colNum.includes('UR') ||
    colNum.includes('HR') ||
    colNum.includes('SR') ||
    colNum.includes('AR') ||
    colNum.includes('CHR') ||
    colNum.includes('CSR');

  let list: VariantDef[] = [];

  if (isPromo) {
    list = [ALL_VARIANTS_MAP.promo];
  } else if (isHighRarity) {
    // Ultra Rare / Secret Rare only exist in Foil
    list = [
      {
        key: 'holo',
        label: 'จำนวนการ์ด (Card Quantity)',
        icon: '✨',
        desc: 'การ์ดฟอยล์พิเศษ (Special Foil)',
        color: 'amber',
      },
    ];
  } else {
    // Standard cards in booster sets have Normal and Mirror/Reverse
    list = [ALL_VARIANTS_MAP.normal, ALL_VARIANTS_MAP.reverse, ALL_VARIANTS_MAP.holo];
  }

  // Ensure any variant with existing count > 0 is preserved
  for (const [k, count] of Object.entries(currentVariants)) {
    const key = k as CardVariantKey;
    if (count > 0 && !list.some((v) => v.key === key)) {
      list.push(ALL_VARIANTS_MAP[key]);
    }
  }

  return list;
}

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

  const applicableVariants = useMemo(() => {
    return getApplicableVariants(card, variants);
  }, [card, variants]);

  // Intercept back button to close modal
  useModalBackHandler(true, onClose, 'card-collection-modal');

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/90 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        {/* Left: Card Preview & Info */}
        <div className="md:w-5/12 bg-slate-950 p-5 sm:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800/90 relative">
          <div className="relative group max-w-[260px] w-full aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-slate-700/60">
            <img
              src={imgUrl}
              alt={card.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                totalCount === 0 ? 'grayscale-[40%] opacity-90' : 'brightness-105'
              }`}
              onError={(e) => handleCardImageError(e, card.imageUrl, card.officialImageUrl)}
            />
            {totalCount > 0 && (
              <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/40 flex items-center gap-1">
                <span>มีสะสม {totalCount} ใบ</span>
              </div>
            )}
          </div>

          <div className="mt-4 text-center w-full">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">{card.name}</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {card.set?.name || 'การ์ดเสริม'} · {card.collectorNumber || card.localId}
            </p>
          </div>
        </div>

        {/* Right: Quantities & Details (Full Width Spacious Layout) */}
        <div className="md:w-7/12 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            {/* Header with Set Badges and Wishlist Button */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                    {card.set?.id || 'PROMO'}
                  </span>
                  {card.regulationMark && (
                    <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold font-mono">
                      Reg [{card.regulationMark}]
                    </span>
                  )}
                  {card.category && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-400 text-xs font-medium">
                      {card.category}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white mt-2 leading-snug">{card.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWishlist(card.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap ${
                    isWishlist
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-amber-500/15'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300 hover:border-slate-600'
                  }`}
                  title="ปักหมุดเป็นการ์ดที่ตามหา (Wishlist)"
                >
                  <span className="text-sm">⭐</span>
                  <span>{isWishlist ? 'ใน Wishlist' : '+ Wishlist'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-black transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Applicable Variants List (1 Full-Width Row per Variant) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                จำนวนการ์ดที่มี (Card Quantity)
              </label>

              <div className="space-y-2">
                {applicableVariants.map(({ key, label, icon, desc }) => {
                  const count = variants[key] || 0;
                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        count > 0
                          ? 'bg-slate-800/90 border-amber-500/50 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Variant Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl flex-shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-100 leading-snug">
                            {label}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                            {desc}
                          </p>
                        </div>
                      </div>

                      {/* Stepper Controls */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => decrementVariant(card.id, key)}
                          disabled={count === 0}
                          className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-black text-sm flex items-center justify-center transition-all shadow-inner"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={count}
                          onChange={(e) => setVariantCount(card.id, key, parseInt(e.target.value, 10) || 0)}
                          className="w-12 text-center bg-slate-950 border border-slate-700 rounded-xl py-1.5 text-sm font-black text-amber-300 focus:outline-none focus:border-amber-500 shadow-inner"
                        />
                        <button
                          onClick={() => incrementVariant(card.id, key)}
                          className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center transition-all shadow-md shadow-amber-500/20"
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
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Condition Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    สภาพการ์ด (Condition)
                  </label>
                  <select
                    value={currentCondition}
                    onChange={(e) => setCardDetails(card.id, { condition: e.target.value as CardCondition })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-500 shadow-inner"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label} - {c.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Card Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    บันทึกช่วยจำ (Note)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เก็บในอัลบั้ม A, มีรอยมุมขวา..."
                    value={currentNote}
                    onChange={(e) => setCardDetails(card.id, { note: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {totalCount > 0 || isWishlist ? (
              <button
                onClick={() => {
                  if (confirm('คุณต้องการลบการ์ดนี้ออกจากคอลเลกชันใช่หรือไม่?')) {
                    clearCard(card.id);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-all flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>ล้างออกจากสมุด</span>
              </button>
            ) : <div />}

            <button
              onClick={onClose}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
            >
              บันทึกเรียบร้อย
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
