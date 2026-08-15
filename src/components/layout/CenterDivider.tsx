import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
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

const MODE_CYCLE: Record<string, string> = {
  faceToFace: 'spectator',
  spectator:  'landscape',
  landscape:  'faceToFace',
};

export function CenterDivider({ orientation = 'horizontal' }: Props) {
  const { currentTurn, turnNumber, player1, player2, resetGame, displayMode, setDisplayMode } = useGameStore();
  const [showEndTurn, setShowEndTurn] = useState(false);
  const [showReset, setShowReset] = useState(false);

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
                className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
              >↺</button>
              <button
                onClick={() => setDisplayMode(nextMode)}
                title={MODE_LABELS[nextMode]}
                className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
              >⟺</button>
            </div>
          </div>
          <DiceRoller compact />
        </div>

        {showEndTurn && (
          <EndTurnModal currentPlayer={currentTurn} onClose={() => setShowEndTurn(false)} />
        )}
        {showReset && <ResetModal onConfirm={() => { resetGame(); setShowReset(false); }} onClose={() => setShowReset(false)} />}
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
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
            >↺ Reset</button>
            <span className="text-gray-700 text-[10px]">·</span>
            <button
              onClick={() => setDisplayMode(nextMode)}
              title={`Switch to ${MODE_LABELS[nextMode]}`}
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
            >{MODE_LABELS[displayMode]}</button>
          </div>
        </div>

        <DiceRoller compact />
      </div>

      {showEndTurn && (
        <EndTurnModal currentPlayer={currentTurn} onClose={() => setShowEndTurn(false)} />
      )}
      {showReset && <ResetModal onConfirm={() => { resetGame(); setShowReset(false); }} onClose={() => setShowReset(false)} />}
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
