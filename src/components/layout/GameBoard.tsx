import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { PlayerBoard } from '../player/PlayerBoard';
import { CenterDivider } from './CenterDivider';
import { MiniGameBoard } from '../mini/MiniGameBoard';

export function GameBoard() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { currentTurn, displayMode } = useGameStore((s) => ({ currentTurn: s.currentTurn, displayMode: s.displayMode }));

  if (displayMode === 'mini') return <MiniGameBoard />;

  return (
    <View className={`flex-1 ${theme.appBg}`} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <PlayerBoard playerId="player1" isCurrentTurn={currentTurn === 'player1'} flipped={displayMode === 'faceToFace'} />
      <CenterDivider />
      <PlayerBoard playerId="player2" isCurrentTurn={currentTurn === 'player2'} />
    </View>
  );
}
