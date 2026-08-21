import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { CoinFlip } from '../tools/CoinFlip';
import { DiceRoller } from '../tools/DiceRoller';

export function CenterDivider() {
  const theme = useTheme();
  const { currentTurn, turnNumber, endTurn, resetGame, displayMode, setDisplayMode, setGameMode,
          toggleSupporter, toggleEnergyAttached, player1, player2 } = useGameStore((s) => s);
  const currentPlayer = currentTurn === 'player1' ? player1 : player2;
  const [showReset, setShowReset] = useState(false);

  const handleEndTurn = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endTurn();
  };

  return (
    <View className={`px-3 py-2 border-t border-b ${theme.centerBorder} ${theme.centerBg}`}>
      <View className="flex-row items-center gap-2 mb-1.5">
        <CoinFlip compact />
        <DiceRoller compact />
      </View>
      <View className="flex-row items-center gap-2">
        {/* Left: turn indicator + reset */}
        <View className="gap-0.5">
          <Text className="text-xs text-gray-500 font-mono">T{turnNumber}</Text>
          <TouchableOpacity onPress={() => setShowReset(true)}>
            <Text className={`text-xs ${theme.centerText}`}>↺ Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Center: End Turn */}
        <TouchableOpacity
          onPress={handleEndTurn}
          className="flex-1 py-2 px-3 bg-blue-700 border border-blue-500 rounded-xl items-center"
        >
          <Text className="text-white text-xs font-black">End {currentPlayer.name} →</Text>
        </TouchableOpacity>

        {/* Right: display mode + Lorcana switch */}
        <View className="gap-0.5 items-end">
          <TouchableOpacity
            onPress={() => setDisplayMode(displayMode === 'faceToFace' ? 'spectator' : 'faceToFace')}
            className="px-1.5 py-0.5 rounded-md border border-gray-700/50"
          >
            <Text className={`text-xs font-bold ${theme.centerText}`}>⇅ Side</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDisplayMode('mini')}
            className="px-1.5 py-0.5 rounded-md border border-gray-700/50"
          >
            <Text className={`text-xs font-bold ${theme.centerText}`}>⊞ Mini</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setGameMode('lorcana')}
            className="px-1.5 py-0.5 rounded-md bg-amber-700/60 border border-amber-500/60"
          >
            <Text className="text-xs font-bold text-amber-300">🪄 Lorcana</Text>
          </TouchableOpacity>
        </View>

        {/* Sup + Nrg toggles */}
        <View className="gap-1">
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleEnergyAttached(currentTurn); }}
            className={`px-2 py-1 rounded-lg border ${!currentPlayer.energyAttached ? 'bg-green-900/60 border-green-600' : 'bg-gray-800/50 border-gray-700'}`}
          >
            <Text className={`text-xs font-black ${!currentPlayer.energyAttached ? 'text-green-300' : 'text-gray-600 line-through'}`}>⚡ Nrg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleSupporter(currentTurn); }}
            className={`px-2 py-1 rounded-lg border ${!currentPlayer.supporterUsed ? 'bg-yellow-900/60 border-yellow-600' : 'bg-gray-800/50 border-gray-700'}`}
          >
            <Text className={`text-xs font-black ${!currentPlayer.supporterUsed ? 'text-yellow-300' : 'text-gray-600 line-through'}`}>★ Sup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showReset && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowReset(false)}>
          <View className="flex-1 bg-black/80 items-center justify-center px-4">
            <View className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-72 items-center">
              <Text className="font-black text-white mb-1">Reset Game?</Text>
              <Text className="text-xs text-gray-500 mb-4">All HP and damage will be cleared.</Text>
              <View className="flex-row gap-2 w-full">
                <TouchableOpacity onPress={() => setShowReset(false)} className="flex-1 py-2 rounded-xl bg-gray-700 items-center">
                  <Text className="text-gray-200 text-sm font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { resetGame(); setShowReset(false); }} className="flex-1 py-2 rounded-xl bg-red-700 items-center">
                  <Text className="text-white text-sm font-black">Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
