import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CoinFlip({ compact = false }: { compact?: boolean }) {
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [key, setKey] = useState(0);

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    setShowOverlay(true);
    setResult(null);
    setKey(k => k + 1);
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
      setResult(outcome);
      setFlipping(false);
    }, 900);
  };

  const isHeads = result === 'heads';

  return (
    <>
      {/* Full-screen result overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-pointer select-none"
            onClick={() => { if (!flipping) setShowOverlay(false); }}
          >
            <div className="flex flex-col items-center gap-8">
              {/* Large coin */}
              <motion.div
                key={`coin-${key}`}
                className="text-[140px] leading-none"
                animate={flipping
                  ? { rotateY: [0, 360, 720, 1080] }
                  : { rotateY: 0, scale: [1, 1.15, 1] }
                }
                transition={flipping
                  ? { duration: 0.85, ease: 'easeInOut' }
                  : { duration: 0.4, ease: 'easeOut' }
                }
              >
                🪙
              </motion.div>

              {/* Result label */}
              <AnimatePresence mode="wait">
                {result && !flipping && (
                  <motion.div
                    key={result}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className={`text-6xl font-black px-10 py-5 rounded-3xl border-2 ${
                      isHeads
                        ? 'bg-green-900/90 text-green-300 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.35)]'
                        : 'bg-red-900/90 text-red-300 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
                    }`}
                  >
                    {isHeads ? '✓ HEADS' : '✕ TAILS'}
                  </motion.div>
                )}

                {flipping && (
                  <motion.div
                    key="flipping"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-gray-500 text-lg font-semibold tracking-widest"
                  >
                    FLIPPING...
                  </motion.div>
                )}
              </AnimatePresence>

              {result && !flipping && (
                <p className="text-gray-600 text-sm tracking-wide">Tap anywhere to close</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact button (in CenterDivider) */}
      {compact ? (
        <button
          onClick={flip}
          disabled={flipping}
          className="relative w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center text-xl hover:bg-yellow-500/30 active:scale-95 transition-all disabled:opacity-50 select-none"
        >
          🪙
          {result && !flipping && (
            <span className={`absolute -bottom-1 -right-1 text-[8px] font-black leading-none px-0.5 py-px rounded ${
              isHeads ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {isHeads ? 'H' : 'T'}
            </span>
          )}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={flip}
            disabled={flipping}
            className="w-14 h-14 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center text-2xl hover:bg-yellow-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            🪙
          </button>
          {result && !flipping && (
            <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
              isHeads ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
            }`}>
              {isHeads ? 'HEADS' : 'TAILS'}
            </span>
          )}
          <span className="text-xs text-gray-500">Coin Flip</span>
        </div>
      )}
    </>
  );
}
