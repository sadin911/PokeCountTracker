import { useGameStore } from '../../store/gameStore';
import { PlayerBoard } from '../player/PlayerBoard';
import { CenterDivider } from './CenterDivider';

export function GameBoard() {
  const displayMode = useGameStore(s => s.displayMode);

  if (displayMode === 'landscape') {
    return (
      <div className="flex flex-row h-full overflow-hidden bg-gray-950 p-2 gap-0">
        {/* Player 1 — left, normal orientation */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <PlayerBoard playerId="player1" />
        </div>

        {/* Vertical center divider */}
        <div className="flex-shrink-0 border-l border-r border-gray-700/50 bg-gray-900/50">
          <CenterDivider orientation="vertical" />
        </div>

        {/* Player 2 — right, normal orientation */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <PlayerBoard playerId="player2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-950 p-2 gap-1.5">
      {/* Player 1 — top, rotated 180° in faceToFace or reversed in spectator */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayerBoard playerId="player1" flipped />
      </div>

      {/* Center divider */}
      <div className="flex-shrink-0 border-t border-b border-gray-700/50 bg-gray-900/50">
        <CenterDivider />
      </div>

      {/* Player 2 — bottom, normal */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayerBoard playerId="player2" />
      </div>
    </div>
  );
}
