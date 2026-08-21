import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';

export function PlayerHeader({ playerId, isCurrentTurn }: { playerId: PlayerId; isCurrentTurn: boolean }) {
  const player = useGameStore((s) => s[playerId]);
  const { setPrizeCards, setPlayerName } = useGameStore();
  const [editingName, setEditingName] = useState(false);
  const theme = useTheme();

  return (
    <View className={`flex-row items-center gap-2 px-3 py-1.5 rounded-xl ${isCurrentTurn ? theme.headerOn : theme.headerOff}`}>
      <View className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCurrentTurn ? theme.headerDot : theme.headerDotOff}`} />

      {editingName ? (
        <TextInput
          autoFocus
          className="flex-1 text-sm font-bold text-white"
          value={player.name}
          onChangeText={(t) => setPlayerName(playerId, t)}
          onBlur={() => setEditingName(false)}
          onSubmitEditing={() => setEditingName(false)}
          returnKeyType="done"
        />
      ) : (
        <TouchableOpacity onPress={() => setEditingName(true)} className="flex-1">
          <Text className={`text-sm font-bold ${isCurrentTurn ? theme.headerNameOn : theme.headerNameOff}`}>
            {player.name}{isCurrentTurn ? ' ▶' : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* Prize cards */}
      <View className="flex-row items-center gap-1">
        <Text className="text-xs text-gray-500">Prize:</Text>
        <View className="flex-row gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setPrizeCards(playerId, i < player.prizeCards ? i : i + 1)}
              className={`w-3 h-3 rounded-sm border ${i < player.prizeCards ? 'bg-yellow-500 border-yellow-400' : 'bg-gray-700 border-gray-600'}`}
            />
          ))}
        </View>
        <Text className="text-xs font-mono text-gray-400 w-3">{player.prizeCards}</Text>
      </View>
    </View>
  );
}
