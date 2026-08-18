import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function CoinFace({ side, size = 200 }: { side: 'heads' | 'tails'; size?: number }) {
  const h = side === 'heads';
  const gid = `cg-${side}`;
  const stars = [0, 72, 144, 216, 288];
  const dots  = [0, 60, 120, 180, 240, 300];

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={gid} cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor={h ? '#fef9c3' : '#f1f5f9'} />
          <stop offset="45%"  stopColor={h ? '#fbbf24' : '#94a3b8'} />
          <stop offset="100%" stopColor={h ? '#92400e' : '#334155'} />
        </radialGradient>
        <radialGradient id={`${gid}-hi`} cx="30%" cy="25%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Drop shadow */}
      <ellipse cx="100" cy="197" rx="78" ry="7" fill="rgba(0,0,0,0.45)" />

      {/* Outer edge */}
      <circle cx="100" cy="97" r="92" fill={h ? '#78350f' : '#0f172a'} />

      {/* Main face */}
      <circle cx="100" cy="97" r="88" fill={`url(#${gid})`} />

      {/* Milled edge notches */}
      {Array.from({ length: 40 }).map((_, i) => {
        const a = (i / 40) * Math.PI * 2;
        return (
          <line key={i}
            x1={100 + 82 * Math.cos(a)} y1={97 + 82 * Math.sin(a)}
            x2={100 + 89 * Math.cos(a)} y2={97 + 89 * Math.sin(a)}
            stroke={h ? '#92400e' : '#1e293b'} strokeWidth="2.8"
          />
        );
      })}

      {/* Re-cover face over notch overlap */}
      <circle cx="100" cy="97" r="81" fill={`url(#${gid})`} />

      {/* Inner decorative ring */}
      <circle cx="100" cy="97" r="73" fill="none"
        stroke={h ? '#b4530955' : '#47556955'} strokeWidth="2" strokeDasharray="6 3" />

      {/* Shadow letter (depth) */}
      <text x="102" y="100" dominantBaseline="central" textAnchor="middle"
        fontSize="90" fontWeight="900" fontFamily="Georgia,serif"
        fill={h ? '#78350f' : '#0f172a'} opacity="0.3">
        {h ? 'H' : 'T'}
      </text>
      {/* Main letter */}
      <text x="100" y="97" dominantBaseline="central" textAnchor="middle"
        fontSize="90" fontWeight="900" fontFamily="Georgia,serif"
        fill={h ? '#fef9c3' : '#f1f5f9'}>
        {h ? 'H' : 'T'}
      </text>

      {/* Decorations around ring */}
      {h
        ? stars.map((deg, i) => {
            const rad = (deg - 90) * Math.PI / 180;
            return (
              <text key={i}
                x={100 + 57 * Math.cos(rad)} y={97 + 57 * Math.sin(rad)}
                dominantBaseline="central" textAnchor="middle"
                fontSize="13" fill="#b45309">★</text>
            );
          })
        : dots.map((deg, i) => {
            const rad = (deg - 90) * Math.PI / 180;
            return (
              <circle key={i}
                cx={100 + 57 * Math.cos(rad)} cy={97 + 57 * Math.sin(rad)}
                r="5" fill={i % 2 === 0 ? '#334155' : '#475569'} />
            );
          })
      }

      {/* Specular highlight */}
      <circle cx="100" cy="97" r="81" fill={`url(#${gid}-hi)`} />
    </svg>
  );
}

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
              {/* Coin: spinning emoji while flipping, SVG face after landing */}
              <AnimatePresence mode="wait">
                {flipping ? (
                  <motion.div
                    key={`spin-${key}`}
                    className="text-[140px] leading-none"
                    animate={{ rotateY: [0, 360, 720, 1080] }}
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    🪙
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key={`face-${result}-${key}`}
                    initial={{ rotateY: 90, scale: 0.7 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                  >
                    <CoinFace side={result} size={210} />
                  </motion.div>
                ) : (
                  <motion.div key="idle" className="text-[140px] leading-none">
                    🪙
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result badge */}
              <AnimatePresence mode="wait">
                {result && !flipping && (
                  <motion.div
                    key={result}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className={`text-[10rem] font-black leading-none w-52 h-52 flex items-center justify-center rounded-full border-4 ${
                      isHeads
                        ? 'bg-green-900/90 text-green-300 border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.4)]'
                        : 'bg-red-900/90 text-red-300 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]'
                    }`}
                  >
                    {isHeads ? 'H' : 'T'}
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

      {/* Compact button */}
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
