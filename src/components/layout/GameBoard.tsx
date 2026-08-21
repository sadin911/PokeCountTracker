import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { PlayerBoard } from '../player/PlayerBoard';
import { CenterDivider } from './CenterDivider';

export function GameBoard() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const currentTurn = useGameStore((s) => s.currentTurn);

  return (
    <View className={`flex-1 ${theme.appBg}`} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <PlayerBoard playerId="player1" isCurrentTurn={currentTurn === 'player1'} flipped />
      <CenterDivider />
      <PlayerBoard playerId="player2" isCurrentTurn={currentTurn === 'player2'} />
    </View>
  );
}
