import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { THEMES, THEME_ORDER, type ThemeId } from '../../constants/themes';
import { CoinFlip } from '../tools/CoinFlip';
import { DiceRoller } from '../tools/DiceRoller';
import { EndTurnModal } from './EndTurnModal';

interface Props {
  orientation?: 'horizontal' | 'vertical';
}

const MODE_LABELS: Record<string, string> = {
  faceToFace: '⇅ Face-to-Face',
  spectator:  '↓ Same Side',
  landscape:  '⟺ Landscape',
};

// Mini is excluded from the cycle — it has its own dedicated button
const MODE_CYCLE: Record<string, string> = {
  faceToFace: 'spectator',
  spectator:  'landscape',
  landscape:  'faceToFace',
  mini:       'faceToFace', // fallback if somehow in mini
};

function ThemePanel({ themeId, onSelect, onClose, open }: {
  themeId: string;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
  open: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs text-gray-400 mb-4 text-center font-semibold tracking-widest uppercase">Choose Theme</p>
            <div className="flex gap-3">
              {THEME_ORDER.map(id => {
                const t = THEMES[id];
                const active = themeId === id;
                return (
                  <button
                    key={id}
                    onClick={() => onSelect(id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      active ? 'border-white/60 bg-white/10 scale-105' : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl border border-white/20 shadow-lg"
                      style={{ background: t.preview }}
                    />
                    <span className="text-xl">{t.emoji}</span>
                    <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-gray-400'}`}>{t.name}</span>
                    {active && <span className="text-[8px] text-green-400 font-bold">ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useFullscreen() {
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };
  return { isFs, toggle };
}

export function CenterDivider({ orientation = 'horizontal' }: Props) {
  const { currentTurn, turnNumber, player1, player2, resetGame, displayMode, setDisplayMode, theme: themeId, setTheme } = useGameStore();
  const theme = useTheme();
  const [showEndTurn, setShowEndTurn] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const { isFs, toggle: toggleFs } = useFullscreen();

  const currentPlayerName = currentTurn === 'player1' ? player1.name : player2.name;
  const nextMode = MODE_CYCLE[displayMode] as typeof displayMode;

  if (orientation === 'vertical') {
    return (
      <>
        <div className="flex flex-col items-center gap-1.5 h-full py-2 px-1.5 w-14">
          <CoinFlip compact />
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full">
            <div className="text-[10px] text-gray-500 font-mono">T{turnNumber}</div>
            <button
              onClick={() => setShowEndTurn(true)}
              className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 border border-blue-500 rounded-lg text-white text-[10px] font-black transition-all"
            >
              End
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => setShowReset(true)}
                className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
              >↺</button>
              <button
                onClick={() => setDisplayMode(nextMode)}
                title={MODE_LABELS[nextMode]}
                className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
              >⟺</button>
              <button
                onClick={() => setDisplayMode('mini')}
                className="text-[9px] px-1 py-0.5 rounded bg-indigo-700/60 border border-indigo-500/60 text-indigo-300 hover:bg-indigo-600/60 transition-colors font-bold"
                title="Mini mode"
              >⊞</button>
              <button
                onClick={() => setShowThemePanel(true)}
                className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
              >🎨</button>
              <button
                onClick={toggleFs}
                className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
                title={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
              >{isFs ? '⊡' : '⛶'}</button>
            </div>
          </div>
          <DiceRoller compact />
        </div>

        {showEndTurn && (
          <EndTurnModal currentPlayer={currentTurn} onClose={() => setShowEndTurn(false)} />
        )}
        {showReset && <ResetModal onConfirm={() => { resetGame(); setShowReset(false); }} onClose={() => setShowReset(false)} />}
        <ThemePanel themeId={themeId} onSelect={(id) => { setTheme(id); setShowThemePanel(false); }} onClose={() => setShowThemePanel(false)} open={showThemePanel} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <CoinFlip compact />

        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2 w-full">
            <div className="text-[10px] text-gray-500 font-mono">T{turnNumber}</div>
            <button
              onClick={() => setShowEndTurn(true)}
              className="flex-1 py-1.5 px-3 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 border border-blue-500 rounded-xl text-white text-xs font-black transition-all shadow-lg shadow-blue-900/40"
            >
              End {currentPlayerName}'s Turn →
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setShowReset(true)}
              className={`text-[10px] ${theme.centerText} hover:text-gray-300 transition-colors`}
            >↺ Reset</button>
            <span className={`${theme.centerText} text-[10px]`}>·</span>
            <button
              onClick={() => setDisplayMode(nextMode)}
              title={`Switch to ${MODE_LABELS[nextMode]}`}
              className={`text-[10px] ${theme.centerText} hover:text-gray-300 transition-colors`}
            >{MODE_LABELS[displayMode] ?? '⇅ Face-to-Face'}</button>
            <span className={`${theme.centerText} text-[10px]`}>·</span>
            <button
              onClick={() => setDisplayMode('mini')}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-700/60 border border-indigo-500/60 text-indigo-300 hover:bg-indigo-600/60 transition-colors font-bold"
              title="Switch to Mini mode"
            >⊞ Mini</button>
            <span className={`${theme.centerText} text-[10px]`}>·</span>
            <button
              onClick={() => setShowThemePanel(true)}
              className={`text-[10px] ${theme.centerText} hover:text-gray-300 transition-colors`}
              title="Change theme"
            >🎨</button>
            <span className={`${theme.centerText} text-[10px]`}>·</span>
            <button
              onClick={toggleFs}
              className={`text-[10px] ${theme.centerText} hover:text-gray-300 transition-colors`}
              title={isFs ? 'Exit fullscreen' : 'Enter fullscreen'}
            >{isFs ? '⊡' : '⛶'}</button>
          </div>
        </div>

        <DiceRoller compact />
      </div>

      {showEndTurn && (
        <EndTurnModal currentPlayer={currentTurn} onClose={() => setShowEndTurn(false)} />
      )}
      {showReset && <ResetModal onConfirm={() => { resetGame(); setShowReset(false); }} onClose={() => setShowReset(false)} />}
      <ThemePanel themeId={themeId} onSelect={(id) => { setTheme(id); setShowThemePanel(false); }} onClose={() => setShowThemePanel(false)} open={showThemePanel} />
    </>
  );
}

function ResetModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-72 text-center shadow-2xl">
        <div className="text-2xl mb-2">♻️</div>
        <h3 className="font-black text-white mb-1">Reset Game?</h3>
        <p className="text-xs text-gray-500 mb-4">All HP, damage, and status will be cleared.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-black">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
