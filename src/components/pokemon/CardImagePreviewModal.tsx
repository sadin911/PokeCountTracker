import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { resolveCardImageUrl, handleCardImageError } from '../../utils/cardImage';

interface Props {
  imageUrl: string | null;
  officialImageUrl?: string | null;
  cardName?: string;
  onClose: () => void;
  onSelect?: () => void;
}

export function CardImagePreviewModal({ imageUrl, officialImageUrl, cardName, onClose, onSelect }: Props) {
  useModalBackHandler(!!imageUrl, onClose, 'card-image-preview-modal');

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

            {/* Close button on top-right of image */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center text-sm font-bold backdrop-blur-md border border-white/20 active:scale-95 transition-all"
              title="ปิด"
            >
              ✕
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2.5 w-full max-w-[320px] sm:max-w-[360px]">
            {onSelect && (
              <button
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg transition-all"
              >
                ✓ เลือกการ์ดใบนี้
              </button>
            )}
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-750 active:scale-95 text-gray-300 hover:text-white text-xs sm:text-sm font-bold border border-gray-700 transition-all"
            >
              ปิด
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
