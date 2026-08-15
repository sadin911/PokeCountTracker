import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { PlayerBoard } from '../player/PlayerBoard';
import { CenterDivider } from './CenterDivider';

export function GameBoard() {
  const displayMode = useGameStore(s => s.displayMode);
  const theme = useTheme();

  if (displayMode === 'landscape') {
    return (
      <div className="flex flex-row h-full overflow-hidden p-2 gap-0" style={{ background: theme.appBg }}>
        <div className="flex-1 min-w-0 overflow-hidden">
          <PlayerBoard playerId="player1" />
        </div>
        <div className={`flex-shrink-0 border-l border-r ${theme.centerBorder} ${theme.centerBg}`}>
          <CenterDivider orientation="vertical" />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <PlayerBoard playerId="player2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-2 gap-1.5" style={{ background: theme.appBg }}>
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayerBoard playerId="player1" flipped />
      </div>
      <div className={`flex-shrink-0 border-t border-b ${theme.centerBorder} ${theme.centerBg}`}>
        <CenterDivider />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayerBoard playerId="player2" />
      </div>
    </div>
  );
}
