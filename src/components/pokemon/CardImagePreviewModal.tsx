import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';

interface Props {
  imageUrl: string | null;
  officialImageUrl?: string | null;
  cardName?: string;
  onClose: () => void;
  onSelect?: () => void;
}

export function CardImagePreviewModal({ imageUrl, officialImageUrl, cardName, onClose, onSelect }: Props) {
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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative max-w-sm sm:max-w-md w-full flex flex-col items-center gap-3"
          onClick={e => e.stopPropagation()}
        >
          {/* Card Image Container with Shadow */}
          <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-gray-700/80 bg-gray-950 flex items-center justify-center">
            <img
              src={resolvedUrl}
              alt={cardName || 'Pokemon Card'}
              onError={e => handleCardImageError(e, imageUrl, officialImageUrl)}
              className="w-full h-full object-contain"
            />

            {/* Prominent Close button on top-right of image */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/80 hover:bg-rose-500 text-white flex items-center justify-center text-base font-black backdrop-blur-md border border-white/30 shadow-2xl active:scale-95 transition-all group"
              title="ปิดหน้าต่าง (ESC)"
            >
              <span className="group-hover:rotate-90 transition-transform duration-200">✕</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2.5 w-full max-w-[320px] sm:max-w-[360px]">
            {onSelect && (
              <button
                type="button"
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                <span>✓</span>
                <span>เลือกการ์ดใบนี้</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`${onSelect ? 'px-6' : 'w-full'} py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs sm:text-sm font-black border border-slate-600 shadow-lg transition-all flex items-center justify-center gap-1.5`}
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
