import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { PlayerHeader } from '../player/PlayerHeader';
import { MiniPokemonCard } from './MiniPokemonCard';

export function MiniGameBoard() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { currentTurn, turnNumber, endTurn, resetGame, setDisplayMode, setGameMode,
          toggleSupporter, toggleEnergyAttached, player1, player2 } = useGameStore((s) => s);
  const currentPlayer = currentTurn === 'player1' ? player1 : player2;

  const renderPlayerSection = (playerId: 'player1' | 'player2', flipped: boolean) => {
    const player = playerId === 'player1' ? player1 : player2;
    return (
      <View className="flex-1" style={flipped ? { transform: [{ rotate: '180deg' }] } : undefined}>
        <PlayerHeader playerId={playerId} isCurrentTurn={currentTurn === playerId} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 px-1 py-1">
          <View className="flex-row gap-1 h-full">
            {/* Active */}
            <View className="w-16">
              <MiniPokemonCard pokemon={player.activePokemon} playerId={playerId} slot="active" isActive />
            </View>
            {/* Bench */}
            {player.bench.map((p, i) => (
              <View key={p.id} className="w-14">
                <MiniPokemonCard pokemon={p} playerId={playerId} slot={i as 0|1|2|3|4} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View className={`flex-1 ${theme.appBg}`} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {renderPlayerSection('player1', true)}

      {/* Mini center bar */}
      <View className={`flex-row items-center gap-2 px-3 py-1.5 border-t border-b ${theme.centerBorder} ${theme.centerBg}`}>
        <Text className="text-xs text-gray-500 font-mono">T{turnNumber}</Text>
        <TouchableOpacity
          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); endTurn(); }}
          className="flex-1 py-1.5 bg-blue-700 border border-blue-500 rounded-xl items-center"
        >
          <Text className="text-white text-xs font-black">End {currentPlayer.name} →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleEnergyAttached(currentTurn); }}
          className={`px-2 py-1 rounded-lg border ${!currentPlayer.energyAttached ? 'bg-green-900/60 border-green-600' : 'bg-gray-800/50 border-gray-700'}`}
        >
          <Text className={`text-xs font-black ${!currentPlayer.energyAttached ? 'text-green-300' : 'text-gray-600 line-through'}`}>⚡</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleSupporter(currentTurn); }}
          className={`px-2 py-1 rounded-lg border ${!currentPlayer.supporterUsed ? 'bg-yellow-900/60 border-yellow-600' : 'bg-gray-800/50 border-gray-700'}`}
        >
          <Text className={`text-xs font-black ${!currentPlayer.supporterUsed ? 'text-yellow-300' : 'text-gray-600 line-through'}`}>★</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDisplayMode('faceToFace')} className="px-2 py-1 rounded-lg bg-gray-700/60 border border-gray-600">
          <Text className="text-xs text-gray-300 font-bold">Exit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGameMode('lorcana')} className="px-2 py-1 rounded-lg bg-amber-700/60 border border-amber-500/60">
          <Text className="text-xs text-amber-300 font-bold">🪄</Text>
        </TouchableOpacity>
      </View>

      {renderPlayerSection('player2', false)}
    </View>
  );
}
