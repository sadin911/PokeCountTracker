import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { PlayerId } from '../../types/game';
import { useLorcanaStore } from '../../store/lorcanaStore';

interface Props {
  playerId: PlayerId;
  isCurrentTurn: boolean;
  flipped?: boolean;
}

export function LorcanaPlayerPanel({ playerId, isCurrentTurn, flipped = false }: Props) {
  const player = useLorcanaStore((s) => playerId === 'player1' ? s.lp1 : s.lp2);
  const { lSetName, lSetLore, lSetInkwell } = useLorcanaStore();
  const [editingName, setEditingName] = useState(false);

  const isWinner = player.lore >= 20;

  const handleLore = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (player.lore + delta >= 20) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    lSetLore(playerId, player.lore + delta);
  };

  const handleInk = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    lSetInkwell(playerId, player.inkwell + delta);
  };

  return (
    <View
      className="flex-1 items-center justify-center px-6 py-4 gap-4"
      style={flipped ? { transform: [{ rotate: '180deg' }] } : undefined}
    >
      {/* Player name */}
      <View className="flex-row items-center gap-2">
        <View className={`w-2.5 h-2.5 rounded-full ${isCurrentTurn ? 'bg-amber-400' : 'bg-gray-600'}`} />
        {editingName ? (
          <TextInput
            autoFocus
            className="text-base font-bold text-white border-b border-gray-500 min-w-20"
            value={player.name}
            onChangeText={(t) => lSetName(playerId, t)}
            onBlur={() => setEditingName(false)}
            onSubmitEditing={() => setEditingName(false)}
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingName(true)}>
            <Text className={`text-base font-bold ${isCurrentTurn ? 'text-amber-300' : 'text-gray-400'}`}>
              {player.name}{isCurrentTurn ? ' ▶' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lore counter */}
      <View className="items-center gap-1">
        <Text className="text-xs text-amber-400/70 font-bold tracking-widest uppercase">✦ Lore</Text>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => handleLore(-1)}
            className="w-12 h-12 rounded-2xl bg-gray-800/70 border border-gray-700 items-center justify-center"
          >
            <Text className="text-gray-300 text-2xl font-black">−</Text>
          </TouchableOpacity>

          <View className="items-center min-w-20">
            <Text className={`text-7xl font-black font-mono leading-none ${
              isWinner ? 'text-yellow-300' : isCurrentTurn ? 'text-amber-300' : 'text-gray-200'
            }`}>{player.lore}</Text>
            <Text className="text-sm text-gray-500 font-mono">/ 20</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleLore(1)}
            className="w-12 h-12 rounded-2xl bg-amber-800/60 border border-amber-700 items-center justify-center"
          >
            <Text className="text-amber-300 text-2xl font-black">+</Text>
          </TouchableOpacity>
        </View>
        {isWinner && <Text className="text-lg">✨ Winner! ✨</Text>}
      </View>

      {/* Inkwell counter */}
      <View className="flex-row items-center gap-3">
        <Text className="text-sm text-blue-400/80">💧 Inkwell</Text>
        <TouchableOpacity
          onPress={() => handleInk(-1)}
          className="w-8 h-8 rounded-xl bg-gray-800/70 border border-gray-700 items-center justify-center"
        >
          <Text className="text-gray-400 text-lg font-black">−</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-black font-mono text-blue-300 w-8 text-center">{player.inkwell}</Text>
        <TouchableOpacity
          onPress={() => handleInk(1)}
          className="w-8 h-8 rounded-xl bg-blue-900/50 border border-blue-700 items-center justify-center"
        >
          <Text className="text-blue-300 text-lg font-black">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
