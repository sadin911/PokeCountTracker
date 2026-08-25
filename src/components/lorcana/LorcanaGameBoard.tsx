import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useLorcanaStore } from '../../store/lorcanaStore';
import { useTheme } from '../../hooks/useTheme';
import { LorcanaPlayerPanel } from './LorcanaPlayerPanel';
import { CoinFlip } from '../tools/CoinFlip';
import { DiceRoller } from '../tools/DiceRoller';

function LorcanaEndTurnModal({ onClose }: { onClose: () => void }) {
  const { lCurrentTurn, lEndTurn } = useLorcanaStore();
  const player = useLorcanaStore(s => lCurrentTurn === 'player1' ? s.lp1 : s.lp2);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl"
      >
        <h2 className="text-lg font-black text-white mb-1">End {player.name}'s Turn</h2>
        <p className="text-xs text-gray-500 mb-4">Ink play resets for the next turn.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold">Back</button>
          <button onClick={() => { lEndTurn(); onClose(); }} className="flex-1 py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-sm font-black">End Turn →</button>
        </div>
      </motion.div>
    </div>
  );
}

interface CenterProps {
  faceToFace: boolean;
  onToggle: () => void;
}

function LorcanaCenter({ faceToFace, onToggle }: CenterProps) {
  const theme = useTheme();
  const { lCurrentTurn, lTurnNumber, lToggleInkPlayed, lReset } = useLorcanaStore();
  const currentPlayer = useLorcanaStore(s => lCurrentTurn === 'player1' ? s.lp1 : s.lp2);
  const { setGameMode } = useGameStore();
  const [showEndTurn, setShowEndTurn] = useState(false);
  const [showReset, setShowReset] = useState(false);

  return (
    <>
      <div className={`flex items-center gap-2 px-3 py-2 border-t border-b ${theme.centerBorder} ${theme.centerBg}`}>
        <CoinFlip compact />

        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          <div className="flex items-center gap-2 w-full">
            <span className="text-[10px] text-gray-500 font-mono">T{lTurnNumber}</span>
            <button
              onClick={() => setShowEndTurn(true)}
              className="flex-1 py-1.5 px-3 bg-amber-800 hover:bg-amber-700 active:bg-amber-900 border border-amber-600 rounded-xl text-white text-xs font-black transition-all"
            >
              End {currentPlayer.name}'s Turn →
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px]">
            <button
              onClick={() => setShowReset(true)}
              className={`${theme.centerText} hover:text-gray-300 transition-colors`}
            >↺ Reset</button>
            <span className={theme.centerText}>·</span>
            <button
              onClick={onToggle}
              className={`px-1.5 py-0.5 rounded-md border font-bold transition-colors ${
                faceToFace
                  ? 'bg-amber-700/60 border-amber-500/60 text-amber-300'
                  : `${theme.centerText} border-gray-700/50 hover:text-gray-200`
              }`}
            >{faceToFace ? '⇅ Face-to-Face' : '↓ Same Side'}</button>
            <span className={theme.centerText}>·</span>
            <button
              onClick={() => setGameMode('deck')}
              className="px-1.5 py-0.5 rounded-md bg-purple-700/60 border border-purple-500/60 text-purple-300 hover:bg-purple-600/60 transition-colors font-bold"
            >🃏 จัดเด็ค</button>
            <span className={theme.centerText}>·</span>
            <button
              onClick={() => setGameMode('collection')}
              className="px-1.5 py-0.5 rounded-md bg-rose-700/60 border border-rose-500/60 text-rose-300 hover:bg-rose-600/60 transition-colors font-bold"
            >📚 สมุดสะสม</button>
            <span className={theme.centerText}>·</span>
            <button
              onClick={() => setGameMode('pokemon')}
              className="px-1.5 py-0.5 rounded-md bg-indigo-700/60 border border-indigo-500/60 text-indigo-300 hover:bg-indigo-600/60 transition-colors font-bold"
            >🎮 Battle</button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => lToggleInkPlayed(lCurrentTurn)}
            className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-colors ${
              !currentPlayer.inkPlayed
                ? 'bg-blue-900/60 border-blue-600 text-blue-300 shadow-md shadow-blue-900/40'
                : 'bg-gray-800/50 border-gray-700/40 text-gray-600 line-through'
            }`}
          >💧 Ink</button>
          <DiceRoller compact />
        </div>
      </div>

      {showEndTurn && <LorcanaEndTurnModal onClose={() => setShowEndTurn(false)} />}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-72 text-center shadow-2xl">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-black text-white mb-1">Reset Game?</h3>
            <p className="text-xs text-gray-500 mb-4">All lore and ink will be cleared.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold">Cancel</button>
              <button onClick={() => { lReset(); setShowReset(false); }} className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-black">Reset</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function LorcanaGameBoard() {
  const theme = useTheme();
  const lCurrentTurn = useLorcanaStore(s => s.lCurrentTurn);
  const [faceToFace, setFaceToFace] = useState(true);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden p-2 sm:p-4" style={{ background: theme.appBg }}>
      {/* Player 1 — top half */}
      <div className="flex-1 min-h-0 flex flex-col justify-center max-w-4xl mx-auto w-full">
        <LorcanaPlayerPanel
          playerId="player1"
          isCurrentTurn={lCurrentTurn === 'player1'}
          flipped={faceToFace}
        />
      </div>

      {/* Center divider */}
      <div className="flex-shrink-0 w-full">
        <div className="max-w-4xl mx-auto w-full">
          <LorcanaCenter faceToFace={faceToFace} onToggle={() => setFaceToFace(f => !f)} />
        </div>
      </div>

      {/* Player 2 — bottom half */}
      <div className="flex-1 min-h-0 flex flex-col justify-center max-w-4xl mx-auto w-full">
        <LorcanaPlayerPanel
          playerId="player2"
          isCurrentTurn={lCurrentTurn === 'player2'}
        />
      </div>
    </div>
  );
}
