import { useState } from 'react';
import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { PlayerHeader } from '../player/PlayerHeader';
import { MiniPokemonCard } from './MiniPokemonCard';
import { CoinFlip } from '../tools/CoinFlip';
import { DiceRoller } from '../tools/DiceRoller';
import { EndTurnModal } from '../layout/EndTurnModal';

function MiniPlayerSection({ playerId }: { playerId: PlayerId }) {
  const player = useGameStore(s => s[playerId]);
  const currentTurn = useGameStore(s => s.currentTurn);
  const isCurrentTurn = currentTurn === playerId;

  return (
    <div className="flex flex-col h-full gap-1">
      <div className="flex-shrink-0">
        <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-6 gap-1">
        <MiniPokemonCard
          pokemon={player.activePokemon}
          playerId={playerId}
          slot="active"
          isActive
        />
        {player.bench.map((p, i) => (
          <MiniPokemonCard
            key={i}
            pokemon={p}
            playerId={playerId}
            slot={i as 0 | 1 | 2 | 3 | 4}
          />
        ))}
      </div>
    </div>
  );
}

function MiniSharedZone() {
  const {
    currentTurn, turnNumber, player1, player2,
    resetGame, setDisplayMode,
    toggleEnergyAttached, toggleSupporter,
  } = useGameStore();
  const theme = useTheme();
  const [showEndTurn, setShowEndTurn] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const currentPlayerName = currentTurn === 'player1' ? player1.name : player2.name;

  const TrackerPair = ({ pid, label }: { pid: PlayerId; label: string }) => {
    const p = pid === 'player1' ? player1 : player2;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] text-gray-600 font-bold">{label}</span>
        <button
          onClick={() => toggleEnergyAttached(pid)}
          className={`px-2 py-0.5 rounded text-[9px] font-black border transition-colors ${
            !p.energyAttached
              ? 'bg-emerald-900/40 border-emerald-700/60 text-emerald-400'
              : 'bg-gray-800/40 border-gray-700/40 text-gray-600 line-through'
          }`}
        >⚡Nrg</button>
        <button
          onClick={() => toggleSupporter(pid)}
          className={`px-2 py-0.5 rounded text-[9px] font-black border transition-colors ${
            !p.supporterUsed
              ? 'bg-amber-900/40 border-amber-700/60 text-amber-400'
              : 'bg-gray-800/40 border-gray-700/40 text-gray-600 line-through'
          }`}
        >★ Sup</button>
      </div>
    );
  };

  return (
    <>
      <div className={`flex items-center gap-2 px-2 py-1.5 border-t border-b ${theme.centerBorder} ${theme.centerBg}`}>
        {/* P1 trackers */}
        <TrackerPair pid="player1" label="P1" />

        <CoinFlip compact />

        {/* Center — turn + end */}
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 w-full">
            <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">T{turnNumber}</span>
            <button
              onClick={() => setShowEndTurn(true)}
              className="flex-1 py-1.5 px-2 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 border border-blue-500 rounded-xl text-white text-[11px] font-black transition-all shadow-lg shadow-blue-900/40"
            >End {currentPlayerName}'s Turn →</button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowReset(true)}
              className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
            >↺ Reset</button>
            <span className={`text-[9px] ${theme.centerText}`}>·</span>
            <button
              onClick={() => setDisplayMode('faceToFace')}
              className={`text-[9px] ${theme.centerText} hover:text-gray-300 transition-colors`}
              title="Exit Mini mode"
            >⊞ Mini ×</button>
          </div>
        </div>

        <DiceRoller compact />

        {/* P2 trackers */}
        <TrackerPair pid="player2" label="P2" />
      </div>

      {showEndTurn && (
        <EndTurnModal currentPlayer={currentTurn} onClose={() => setShowEndTurn(false)} />
      )}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-72 text-center shadow-2xl">
            <div className="text-2xl mb-2">♻️</div>
            <h3 className="font-black text-white mb-1">Reset Game?</h3>
            <p className="text-xs text-gray-500 mb-4">All HP, damage, and status will be cleared.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold"
              >Cancel</button>
              <button
                onClick={() => { resetGame(); setShowReset(false); }}
                className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-black"
              >Reset</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MiniGameBoard() {
  const theme = useTheme();

  return (
    <div className="flex flex-col h-full overflow-hidden p-2 gap-1" style={{ background: theme.appBg }}>
      {/* P1 — rotated so they can read from the opposite side of the table */}
      <div className="flex-1 min-h-0 rotate-180">
        <MiniPlayerSection playerId="player1" />
      </div>

      {/* Shared center zone */}
      <MiniSharedZone />

      {/* P2 — normal orientation */}
      <div className="flex-1 min-h-0">
        <MiniPlayerSection playerId="player2" />
      </div>
    </div>
  );
}
