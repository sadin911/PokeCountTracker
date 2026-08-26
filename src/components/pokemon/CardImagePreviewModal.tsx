import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';

interface Props {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const resolvedUrl = resolveCardImageUrl(imageUrl);

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

          {/* Card Image Container with Ambient Glow */}
          <div className="relative w-full flex items-center justify-center">
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-cyan-500/20 rounded-[32px] blur-2xl opacity-75 pointer-events-none" />

            <div
              onClick={() => setIsZoomed((prev) => !prev)}
              className={`relative w-full ${
                isZoomed
                  ? 'max-w-[460px] sm:max-w-[560px] md:max-w-[620px]'
                  : 'max-w-[340px] sm:max-w-[420px] md:max-w-[460px]'
              } aspect-[63/88] max-h-[82vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] border-2 border-slate-700/80 bg-slate-950 flex items-center justify-center transition-all duration-300 cursor-zoom-in group`}
              title={isZoomed ? 'คลิกเพื่อย่อกลับขนาดปกติ' : 'คลิกเพื่อขยายดูรายละเอียดชัดเจน'}
            >
              <img
                src={resolvedUrl}
                alt={cardName || 'Pokemon Card'}
                onError={(e) => handleCardImageError(e, imageUrl, officialImageUrl)}
                className={`w-full h-full object-contain transition-transform duration-300 ${
                  isZoomed ? 'scale-105' : 'group-hover:scale-[1.02]'
                }`}
              />

              {/* Zoom hint badge on hover */}
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
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

