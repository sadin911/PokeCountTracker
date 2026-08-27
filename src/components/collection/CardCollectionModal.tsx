import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useCollectionStore } from '../../store/collectionStore';
import { useDeckStore } from '../../store/deckStore';
import { useCommunityStore } from '../../store/communityStore';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { getEnglishCardName } from '../../utils/searchHelpers';
import { isCardFoil } from '../../utils/cardFoil';
import { useFoilTilt } from '../../hooks/useFoilTilt';
import { EvolutionChainSection } from '../pokemon/EvolutionChainSection';
import { CardImagePreviewModal } from '../pokemon/CardImagePreviewModal';
import type { CardVariantKey, CardCondition } from '../../types/collection';

interface Props {
  card: any;
  onClose: () => void;
  deckId?: string;
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
function getApplicableVariants(card: any, variants: Record<string, number> | Partial<Record<CardVariantKey, number>>): VariantDef[] {
  const list: VariantDef[] = [];
  const setId = (card.set?.id || '').toUpperCase();
  const col = (card.collectorNumber || card.localId || '').toUpperCase();
  const name = (card.name || '').toLowerCase();
  const rarity = (card.rarityCode || '').toUpperCase();

  const isPromo =
    setId.includes('-P') ||
    setId.includes('PROMO') ||
    col.includes('PROMO') ||
    col.startsWith('P-') ||
    setId === 'PROMO';

  const isHighRarity =
    rarity === 'SR' ||
    rarity === 'HR' ||
    rarity === 'UR' ||
    rarity === 'SAR' ||
    rarity === 'AR' ||
    name.includes(' ex') ||
    name.includes('ex') ||
    name.includes('vmax') ||
    name.includes('vstar') ||
    name.includes(' v');

  if (isPromo) {
    list.push(ALL_VARIANTS_MAP.promo);
    if ((variants.normal ?? 0) > 0) list.push(ALL_VARIANTS_MAP.normal);
    if ((variants.holo ?? 0) > 0) list.push(ALL_VARIANTS_MAP.holo);
    return list;
  }

  if (isHighRarity) {
    list.push(ALL_VARIANTS_MAP.holo);
    if ((variants.normal ?? 0) > 0) list.push(ALL_VARIANTS_MAP.normal);
    if ((variants.reverse ?? 0) > 0) list.push(ALL_VARIANTS_MAP.reverse);
    return list;
  }

  list.push(ALL_VARIANTS_MAP.normal);
  list.push(ALL_VARIANTS_MAP.reverse);
  list.push(ALL_VARIANTS_MAP.holo);

  return list;
}

export function CardCollectionModal({ card: initialCard, onClose, deckId }: Props) {
  const [activeCard, setActiveCard] = useState(initialCard);
  const [showZoom, setShowZoom] = useState(false);

  useEffect(() => {
    setActiveCard(initialCard);
  }, [initialCard]);

  const activeProfileId = useCollectionStore((s) => s.activeProfileId);
  const profile = useCollectionStore((s) => s.profiles[activeProfileId]);
  const setVariantCount = useCollectionStore((s) => s.setVariantCount);
  const incrementVariant = useCollectionStore((s) => s.incrementVariant);
  const decrementVariant = useCollectionStore((s) => s.decrementVariant);
  const toggleWishlist = useCollectionStore((s) => s.toggleWishlist);
  const setCardDetails = useCollectionStore((s) => s.setCardDetails);
  const clearCard = useCollectionStore((s) => s.clearCard);

  // Deck Store Integration (if opened within a Deck context)
  const deck = useDeckStore((s) => (deckId ? s.decks[deckId] : undefined));
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck);
  const removeCardFromDeck = useDeckStore((s) => s.removeCardFromDeck);

  const getCardStats = useCommunityStore((s) => s.getCardStats);
  const communityStats = getCardStats(activeCard.id);

  const cardEntry = profile?.cards[activeCard.id];
  const variants = cardEntry?.variants || { normal: 0, holo: 0, reverse: 0, promo: 0 };
  const totalCount = variants.normal + variants.holo + variants.reverse + variants.promo;
  const isWishlist = !!cardEntry?.isWishlist;
  const currentCondition = cardEntry?.condition || 'NM';
  const currentNote = cardEntry?.note || '';

  const isFoil = useMemo(() => isCardFoil(activeCard, variants), [activeCard, variants]);
  const tilt = useFoilTilt<HTMLDivElement>(isFoil, { gyro: true });

  const applicableVariants = useMemo(() => {
    return getApplicableVariants(activeCard, variants);
  }, [activeCard, variants]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] transition-colors duration-200">
        {/* Left: Card Preview & Info */}
        <div className="md:w-5/12 bg-slate-100 dark:bg-slate-950 p-5 sm:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/90 relative">
          <div
            ref={tilt.ref}
            onPointerMove={isFoil ? tilt.onPointerMove : undefined}
            onPointerLeave={isFoil ? tilt.onPointerLeave : undefined}
            onTouchStart={isFoil ? tilt.onTouchStart : undefined}
            onTouchMove={isFoil ? tilt.onTouchMove : undefined}
            onTouchEnd={isFoil ? tilt.onTouchEnd : undefined}
            onClick={() => setShowZoom(true)}
            className={`relative group max-w-[260px] w-full aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/80 ring-1 cursor-zoom-in transition-all duration-200 select-none touch-none ${
              isFoil
                ? 'foil-3d ring-amber-400/80 hover:ring-amber-300 hover:shadow-amber-500/20'
                : 'ring-slate-300 dark:ring-slate-700/60 hover:ring-2 hover:ring-purple-400 dark:hover:ring-amber-400/80 hover:shadow-purple-500/10'
            }`}
            title="คลิกเพื่อขยายดูภาพการ์ดใหญ่เต็มจอ (Fullscreen)"
          >
            <img
              src={resolveCardImageUrl(activeCard.imageUrlHigh || activeCard.imageUrl, true)}
              alt={activeCard.name}
              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02] pointer-events-none"
              onError={(e) => handleCardImageError(e, activeCard.imageUrl, activeCard.officialImageUrl)}
            />

            {/* Holographic / Foil Shimmer Overlay */}
            {isFoil && <div className="foil-holo" aria-hidden="true" />}

            {totalCount > 0 && (
              <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/40 flex items-center gap-1 z-10 pointer-events-none">
                <span>มีสะสม {totalCount} ใบ</span>
              </div>
            )}
          </div>

          {/* iOS Gyroscope Permission / Activation Gesture Button */}
          {isFoil && tilt.gyro.needsGesture && (
            <button
              type="button"
              onClick={tilt.gyro.enable}
              className="mt-2.5 w-full max-w-[260px] py-2 px-3 rounded-xl border border-amber-400/50 bg-amber-400/10 dark:bg-amber-500/15 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-400/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>✨</span>
              <span>เอียงโทรศัพท์เพื่อดูประกายการ์ด 3D</span>
            </button>
          )}

          {/* Dedicated Fullscreen Button */}
          <button
            type="button"
            onClick={() => setShowZoom(true)}
            className="mt-3 w-full max-w-[260px] py-2 px-3 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 text-purple-700 dark:text-amber-300 hover:text-purple-900 dark:hover:text-amber-200 border border-slate-200 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-amber-500/50 shadow-sm dark:shadow-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all group"
            title="ขยายภาพการ์ดขนาดใหญ่ เต็มจอ"
          >
            <span className="text-sm group-hover:scale-125 transition-transform">🔍</span>
            <span>ดูการ์ดขนาดใหญ่ (Fullscreen)</span>
          </button>

          <div className="mt-3 text-center w-full">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{activeCard.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {activeCard.set?.name || 'การ์ดเสริม'} · {activeCard.collectorNumber || activeCard.localId}
            </p>
          </div>
        </div>

        {/* Right: Quantities & Details (Full Width Spacious Layout) */}
        <div className="md:w-7/12 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            {/* Header with Set Badges, Wishlist Button and Prominent Close Button */}

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-black">
                    {activeCard.set?.id || 'PROMO'}
                  </span>
                  {activeCard.regulationMark && (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                      Reg [{activeCard.regulationMark}]
                    </span>
                  )}
                  {activeCard.category && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 text-xs font-medium">
                      {activeCard.category}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-2 leading-snug">
                  {activeCard.name}
                  {getEnglishCardName(activeCard) && (
                    <span className="ml-2 text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400 font-sans">
                      ({getEnglishCardName(activeCard)})
                    </span>
                  )}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWishlist(activeCard.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap ${
                    isWishlist
                      ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/60 shadow-amber-500/15'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-amber-600 dark:hover:text-amber-300 hover:border-slate-400'
                  }`}
                  title="ปักหมุดเป็นการ์ดที่ตามหา (Wishlist)"
                >
                  <span className="text-sm">⭐</span>
                  <span className="hidden sm:inline">{isWishlist ? 'ใน Wishlist' : '+ Wishlist'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-rose-500/60 flex items-center gap-1.5 text-xs font-black transition-all shadow-sm active:scale-95 group"
                  title="ปิดหน้าต่าง (ESC)"
                >
                  <span className="text-sm group-hover:rotate-90 transition-transform duration-200">✕</span>
                  <span>ปิด</span>
                </button>
              </div>
            </div>

            {/* Deck Context Integration (If opened from Deck Editor) */}
            {deck && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/90 to-purple-950/80 border border-indigo-500/40 shadow-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xl shrink-0">
                    🃏
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider truncate">
                      ใส่ในเด็ค: {deck.name}
                    </div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {(deck.cards[activeCard.id]?.count || 0) > 0 ? (
                        <span className="text-emerald-300">
                          ในเด็คนี้มี {deck.cards[activeCard.id]?.count} ใบ
                          {totalCount < (deck.cards[activeCard.id]?.count || 0) ? (
                            <span className="ml-1.5 text-rose-400 font-bold text-[11px]">
                              (⚠️ มีในสมุด {totalCount} ใบ ขาด {(deck.cards[activeCard.id]?.count || 0) - totalCount} ใบ)
                            </span>
                          ) : (
                            <span className="ml-1.5 text-emerald-400 font-bold text-[11px]">(✅ มีในสมุดพอแล้ว)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">ยังไม่ได้ใส่การ์ดนี้ในเด็ค</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeCardFromDeck(deck.id, activeCard.id)}
                    disabled={!deck.cards[activeCard.id]?.count}
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-black text-sm flex items-center justify-center transition-all shadow-inner active:scale-95 cursor-pointer"
                    title="ถอดออกจากเด็ค (-1)"
                  >
                    −
                  </button>
                  <span className="w-7 text-center font-mono font-black text-base text-white">
                    {deck.cards[activeCard.id]?.count || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => addCardToDeck(deck.id, activeCard.id, 1)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-indigo-900 font-black text-xs shadow-md flex items-center gap-1 transition-all cursor-pointer"
                    title="เพิ่มเข้าเด็ค (+1)"
                  >
                    <span>+ ใส่เด็ค</span>
                  </button>
                </div>
              </div>
            )}

            {/* Community Ownership Stats Section */}
            {communityStats.totalUsers > 0 && (
              <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 shadow-sm dark:shadow-inner">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👥</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">สถิติผู้ครอบครองในการ์ดนี้</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${communityStats.badgeColor}`}>
                    {communityStats.tierLabel}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800/80">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, Math.max(communityStats.count > 0 ? 3 : 0, communityStats.percentage))}%`,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        communityStats.percentage < 10
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : communityStats.percentage < 25
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-400'
                          : communityStats.percentage < 50
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      มีผู้สะสม <strong className="text-slate-900 dark:text-white font-bold">{communityStats.count.toLocaleString()}</strong> คนครอบครอง
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-black font-mono">
                      {communityStats.percentage}% <span className="text-slate-400 dark:text-slate-500 font-normal text-[10px]">({communityStats.totalUsers.toLocaleString()} คนทั้งหมด)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Applicable Variants List (1 Full-Width Row per Variant) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                          ? 'bg-amber-50/80 dark:bg-slate-800/90 border-amber-300 dark:border-amber-500/50 shadow-sm dark:shadow-md dark:shadow-amber-500/5 ring-1 ring-amber-400/20'
                          : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Variant Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-2xl flex-shrink-0">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
                            {label}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {desc}
                          </p>
                        </div>
                      </div>

                      {/* Stepper Controls */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => decrementVariant(activeCard.id, key)}
                          disabled={count === 0}
                          className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center transition-all shadow-sm"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={count}
                          onChange={(e) => setVariantCount(activeCard.id, key, parseInt(e.target.value, 10) || 0)}
                          className="w-12 text-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl py-1.5 text-sm font-black text-amber-600 dark:text-amber-300 focus:outline-none focus:border-amber-500 shadow-inner"
                        />
                        <button
                          onClick={() => incrementVariant(activeCard.id, key)}
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

            {/* Evolution Chain Section (For Pokemon) */}
            {activeCard.category === 'Pokemon' && (
              <EvolutionChainSection
                currentCard={activeCard}
                onSelectCard={(selectedCard) => setActiveCard(selectedCard)}
              />
            )}

            {/* Condition & Note Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Condition Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    สภาพการ์ด (Condition)
                  </label>
                  <select
                    value={currentCondition}
                    onChange={(e) => setCardDetails(activeCard.id, { condition: e.target.value as CardCondition })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500 shadow-inner"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label} ({c.desc})
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
                    onChange={(e) => setCardDetails(activeCard.id, { note: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {totalCount > 0 || isWishlist ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการลบการ์ดนี้ออกจากคอลเลกชันใช่หรือไม่?')) {
                    clearCard(activeCard.id);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-all flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30"
              >
                <span>🗑️</span>
                <span>ล้างออกจากสมุด</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>✕</span>
                <span>ปิด</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>บันทึกเรียบร้อย</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Card Image Zoom Modal */}
      {showZoom && (
        <CardImagePreviewModal
          cardId={activeCard.id}
          imageUrl={activeCard.imageUrlHigh || activeCard.imageUrl}
          officialImageUrl={activeCard.officialImageUrl}
          cardName={activeCard.name}
          setInfo={activeCard.set?.id || activeCard.set?.name}
          collectorNumber={activeCard.collectorNumber || activeCard.localId}
          rarityCode={activeCard.rarityCode}
          onClose={() => setShowZoom(false)}
        />
      )}
    </div>,
    document.body
  );
}

