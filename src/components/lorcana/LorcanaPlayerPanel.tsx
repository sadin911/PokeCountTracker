import { useState } from 'react';
import type { PlayerId } from '../../types/game';
import { useLorcanaStore } from '../../store/lorcanaStore';

interface Props {
  playerId: PlayerId;
  isCurrentTurn: boolean;
  flipped?: boolean;
}

export function LorcanaPlayerPanel({ playerId, isCurrentTurn, flipped = false }: Props) {
  const player = useLorcanaStore(s => playerId === 'player1' ? s.lp1 : s.lp2);
  const { lSetName, lSetLore, lSetInkwell } = useLorcanaStore();
  const [editingName, setEditingName] = useState(false);

  const isWinner = player.lore >= 20;

  return (
    <div
      className={`flex flex-col items-center justify-center h-full gap-4 px-6 py-4 ${flipped ? 'rotate-180' : ''}`}
    >
      {/* Player name */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          isCurrentTurn ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'
        }`} />
        {editingName ? (
          <input
            autoFocus
            className="bg-transparent text-base font-bold text-white outline-none border-b border-gray-500"
            value={player.name}
            onChange={e => lSetName(playerId, e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className={`text-base font-bold ${isCurrentTurn ? 'text-amber-300' : 'text-gray-400'} hover:text-white transition-colors`}
          >
            {player.name}
            {isCurrentTurn && <span className="ml-1.5 text-amber-500 text-sm">▶</span>}
          </button>
        )}
      </div>

      {/* Lore counter — big focal point */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-amber-400/70 font-bold tracking-widest uppercase">✦ Lore</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => lSetLore(playerId, player.lore - 1)}
            className="w-12 h-12 rounded-2xl bg-gray-800/70 border border-gray-700 text-gray-300 text-2xl font-black hover:bg-gray-700 active:scale-90 transition-all"
          >−</button>
          <div className={`flex flex-col items-center min-w-[5rem] ${isWinner ? 'animate-pulse' : ''}`}>
            <span className={`text-7xl font-black font-mono leading-none ${
              isWinner ? 'text-yellow-300' : isCurrentTurn ? 'text-amber-300' : 'text-gray-200'
            }`}>
              {player.lore}
            </span>
            <span className="text-sm text-gray-500 font-mono">/ 20</span>
          </div>
          <button
            onClick={() => lSetLore(playerId, player.lore + 1)}
            className="w-12 h-12 rounded-2xl bg-amber-800/60 border border-amber-700 text-amber-300 text-2xl font-black hover:bg-amber-700/80 active:scale-90 transition-all"
          >+</button>
        </div>
        {isWinner && (
          <span className="text-lg animate-bounce">✨ Winner! ✨</span>
        )}
      </div>

      {/* Inkwell counter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-blue-400/80">💧 Inkwell</span>
        <button
          onClick={() => lSetInkwell(playerId, player.inkwell - 1)}
          className="w-8 h-8 rounded-xl bg-gray-800/70 border border-gray-700 text-gray-400 text-lg font-black hover:bg-gray-700 active:scale-90 transition-all"
        >−</button>
        <span className="text-2xl font-black font-mono text-blue-300 w-8 text-center">{player.inkwell}</span>
        <button
          onClick={() => lSetInkwell(playerId, player.inkwell + 1)}
          className="w-8 h-8 rounded-xl bg-blue-900/50 border border-blue-700 text-blue-300 text-lg font-black hover:bg-blue-800/60 active:scale-90 transition-all"
        >+</button>
      </div>
    </div>
  );
}
