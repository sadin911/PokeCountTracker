import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';
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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 select-none overflow-y-auto overscroll-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-full flex flex-col items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header info */}
          <div className="flex items-center justify-between w-full max-w-[340px] sm:max-w-[420px] md:max-w-[460px] px-1 text-white">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-sm sm:text-base font-black truncate">{cardName || 'Pokemon Card'}</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                {setInfo && <span>{setInfo}</span>}
                {collectorNumber && <span>#{collectorNumber}</span>}
                {rarityCode && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                    {rarityCode}
                  </span>
                )}
              </div>
              {stats && stats.count > 0 && (
                <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-slate-300">
                  <span>มีผู้สะสม {stats.count} คน ({stats.percentage}%)</span>
                </div>
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

          {/* Fullscreen Card Image Container */}
          <div className="relative w-full flex items-center justify-center">
            <div
              onClick={() => setIsZoomed((prev) => !prev)}
              className={`relative w-full ${
                isZoomed
                  ? 'max-w-[460px] sm:max-w-[560px] md:max-w-[620px]'
                  : 'max-w-[340px] sm:max-w-[420px] md:max-w-[460px]'
              } aspect-[63/88] max-h-[82vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black border-2 border-slate-700/80 bg-slate-950 flex items-center justify-center transition-all duration-300 cursor-zoom-in group`}
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

              {/* Zoom hint badge */}
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span>{isZoomed ? '🔍 100%' : '🔍 150%'}</span>
                <span className="hidden sm:inline">{isZoomed ? 'ย่อขนาด' : 'ขยายใหญ่'}</span>
              </div>
            </div>
          </div>

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
