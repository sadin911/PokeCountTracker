import { View } from 'react-native';
import { useGameStore } from '../src/store/gameStore';
import { GameBoard } from '../src/components/layout/GameBoard';
import { LorcanaGameBoard } from '../src/components/lorcana/LorcanaGameBoard';

export default function Index() {
  const gameMode = useGameStore((s) => s.gameMode);
  return (
    <View className="flex-1 bg-gray-950">
      {gameMode === 'lorcana' ? <LorcanaGameBoard /> : <GameBoard />}
    </View>
  );
}
