import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
import { isCardFoil } from '../../utils/cardFoil';
import { useFoilTilt } from '../../hooks/useFoilTilt';
import { useCommunityStore } from '../../store/communityStore';

interface Props {
  cardId?: string;
  imageUrl: string | null;
  officialImageUrl?: string | null;
  cardName?: string;
  setInfo?: string;
  collectorNumber?: string;
  rarityCode?: string;
  onClose: () => void;
  onSelect?: () => void;
}

export function CardImagePreviewModal({
  cardId,
  imageUrl,
  officialImageUrl,
  cardName,
  setInfo,
  collectorNumber,
  rarityCode,
  onClose,
  onSelect,
}: Props) {
  const [isZoomed, setIsZoomed] = useState(false);
  const getCardStats = useCommunityStore((s) => s.getCardStats);
  const stats = cardId ? getCardStats(cardId) : null;

  const isFoil = useMemo(
    () => isCardFoil({ id: cardId, name: cardName, rarityCode }),
    [cardId, cardName, rarityCode]
  );
  const tilt = useFoilTilt<HTMLDivElement>(isFoil, { gyro: true });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const resolvedUrl = resolveCardImageUrl(imageUrl, true);

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-2 sm:p-4 select-none overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative max-w-lg sm:max-w-xl md:max-w-2xl w-full flex flex-col items-center gap-3 my-auto py-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar with Card Info & Quick Actions */}
          <div className="w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] flex items-center justify-between gap-2 px-1 text-white">
            <div className="flex items-center gap-2 truncate">
              {setInfo && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black shrink-0">
                  {setInfo}
                </span>
              )}
              {collectorNumber && (
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {collectorNumber}
                </span>
              )}
              {rarityCode && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-black shrink-0">
                  {rarityCode}
                </span>
              )}
              {stats && stats.totalUsers > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 border flex items-center gap-1 ${stats.badgeColor}`}
                  title={`มีผู้สะสมในระบบ ${stats.count} คน (${stats.percentage}% ของผู้ใช้ทั้งหมด ${stats.totalUsers} คน)`}
                >
                  <span>👥</span>
                  <span>{stats.count} คน ({stats.percentage}%)</span>
                </span>
              )}
              {cardName && (
                <span className="text-sm font-black text-white truncate drop-shadow-md">
                  {cardName}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-rose-500 text-white flex items-center justify-center text-sm font-black border border-slate-700/80 shadow-md active:scale-95 transition-all group shrink-0"
              title="ปิดหน้าต่าง (ESC)"
            >
              <span className="group-hover:rotate-90 transition-transform duration-200">✕</span>
            </button>
          </div>

          {/* Card Image Container */}
          <div className="relative w-full flex items-center justify-center">
            <div
              ref={tilt.ref}
              onPointerMove={isFoil ? tilt.onPointerMove : undefined}
              onPointerLeave={isFoil ? tilt.onPointerLeave : undefined}
              onTouchStart={isFoil ? tilt.onTouchStart : undefined}
              onTouchMove={isFoil ? tilt.onTouchMove : undefined}
              onTouchEnd={isFoil ? tilt.onTouchEnd : undefined}
              onClick={() => setIsZoomed((prev) => !prev)}
              className={`relative w-full select-none touch-none ${
                isZoomed
                  ? 'max-w-[460px] sm:max-w-[560px] md:max-w-[620px]'
                  : 'max-w-[340px] sm:max-w-[420px] md:max-w-[460px]'
              } aspect-[63/88] max-h-[82vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black border-2 border-slate-700/80 bg-slate-950 flex items-center justify-center transition-all duration-300 cursor-zoom-in group ${
                isFoil ? 'foil-3d border-amber-400/60' : ''
              }`}
              title={isZoomed ? 'คลิกเพื่อย่อกลับขนาดปกติ' : 'คลิกเพื่อขยายดูรายละเอียดชัดเจน'}
            >
              <img
                src={resolvedUrl}
                alt={cardName || 'Pokemon Card'}
                onError={(e) => handleCardImageError(e, imageUrl, officialImageUrl)}
                className={`w-full h-full object-contain transition-transform duration-300 pointer-events-none ${
                  isZoomed ? 'scale-105' : 'group-hover:scale-[1.02]'
                }`}
              />

              {/* 3D Dynamic Specular Sheen Layer */}
              {isFoil && <div className="foil-holo" aria-hidden="true" />}

              {/* Zoom hint badge on hover */}
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span>{isZoomed ? '🔍 100%' : '🔍 150%'}</span>
                <span className="hidden sm:inline">{isZoomed ? 'ย่อขนาด' : 'ขยายใหญ่'}</span>
              </div>
            </div>
          </div>

          {/* iOS Gyroscope Permission / Activation Gesture Button */}
          {isFoil && tilt.gyro.needsGesture && (
            <button
              type="button"
              onClick={tilt.gyro.enable}
              className="py-2 px-4 rounded-xl border border-amber-400/50 bg-amber-400/10 dark:bg-amber-500/15 text-xs font-bold text-amber-300 hover:bg-amber-400/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>✨</span>
              <span>เอียงโทรศัพท์เพื่อดูประกายการ์ด 3D</span>
            </button>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2.5 w-full max-w-[340px] sm:max-w-[420px] md:max-w-[460px]">
            <button
              type="button"
              onClick={() => setIsZoomed((prev) => !prev)}
              className="py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-black border border-slate-700 shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span>🔍</span>
              <span>{isZoomed ? 'ขนาดปกติ (100%)' : 'ขยายใหญ่พิเศษ (150%)'}</span>
            </button>

            {onSelect && (
              <button
                type="button"
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                <span>✓</span>
                <span>เลือกการ์ดใบนี้</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`${onSelect ? 'px-5' : 'flex-1'} py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs sm:text-sm font-black border border-slate-600 shadow-lg transition-all flex items-center justify-center gap-1.5`}
            >
              <span>✕</span>
              <span>ปิดหน้าต่าง</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

