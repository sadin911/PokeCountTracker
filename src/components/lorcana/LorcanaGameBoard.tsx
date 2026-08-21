import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLorcanaStore } from '../../store/lorcanaStore';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { LorcanaPlayerPanel } from './LorcanaPlayerPanel';

function EndTurnModal({ onClose }: { onClose: () => void }) {
  const { lCurrentTurn, lEndTurn } = useLorcanaStore();
  const player = useLorcanaStore((s) => lCurrentTurn === 'player1' ? s.lp1 : s.lp2);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 items-center justify-center px-4">
        <View className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm">
          <Text className="text-lg font-black text-white mb-1">End {player.name}'s Turn</Text>
          <Text className="text-xs text-gray-500 mb-4">Ink play resets for the next turn.</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-700 items-center">
              <Text className="text-gray-200 text-sm font-bold">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                lEndTurn(); onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-amber-700 items-center"
            >
              <Text className="text-white text-sm font-black">End Turn →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function LorcanaGameBoard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { lCurrentTurn, lTurnNumber, lToggleInkPlayed, lReset } = useLorcanaStore();
  const currentPlayer = useLorcanaStore((s) => lCurrentTurn === 'player1' ? s.lp1 : s.lp2);
  const { setGameMode } = useGameStore();
  const [faceToFace, setFaceToFace] = useState(true);
  const [showEndTurn, setShowEndTurn] = useState(false);
  const [showReset, setShowReset] = useState(false);

  return (
    <View className={`flex-1 ${theme.appBg}`} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Player 1 */}
      <View className="flex-1">
        <LorcanaPlayerPanel playerId="player1" isCurrentTurn={lCurrentTurn === 'player1'} flipped={faceToFace} />
      </View>

      {/* Center bar */}
      <View className={`border-t border-b ${theme.centerBorder} ${theme.centerBg} px-3 py-2`}>
        <View className="flex-row items-center gap-2">
          {/* Turn + End Turn */}
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-gray-500 font-mono">T{lTurnNumber}</Text>
              <TouchableOpacity
                onPress={() => setShowEndTurn(true)}
                className="flex-1 py-1.5 px-3 bg-amber-800 border border-amber-600 rounded-xl items-center"
              >
                <Text className="text-white text-xs font-black">End {currentPlayer.name}'s Turn →</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-center gap-3">
              <TouchableOpacity onPress={() => setShowReset(true)}>
                <Text className={`text-xs ${theme.centerText}`}>↺ Reset</Text>
              </TouchableOpacity>
              <Text className={`text-xs ${theme.centerText}`}>·</Text>
              <TouchableOpacity
                onPress={() => setFaceToFace((f) => !f)}
                className={`px-1.5 py-0.5 rounded-md border ${faceToFace ? 'bg-amber-700/60 border-amber-500/60' : 'border-gray-700/50'}`}
              >
                <Text className={`text-xs font-bold ${faceToFace ? 'text-amber-300' : theme.centerText}`}>
                  {faceToFace ? '⇅ Face-to-Face' : '↓ Same Side'}
                </Text>
              </TouchableOpacity>
              <Text className={`text-xs ${theme.centerText}`}>·</Text>
              <TouchableOpacity
                onPress={() => setGameMode('pokemon')}
                className="px-1.5 py-0.5 rounded-md bg-indigo-700/60 border border-indigo-500/60"
              >
                <Text className="text-xs font-bold text-indigo-300">🎮 Pokémon</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ink button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              lToggleInkPlayed(lCurrentTurn);
            }}
            className={`px-3 py-1.5 rounded-xl border-2 ${!currentPlayer.inkPlayed ? 'bg-blue-900/60 border-blue-600' : 'bg-gray-800/50 border-gray-700/40'}`}
          >
            <Text className={`text-sm font-black ${!currentPlayer.inkPlayed ? 'text-blue-300' : 'text-gray-600 line-through'}`}>
              💧 Ink
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Player 2 */}
      <View className="flex-1">
        <LorcanaPlayerPanel playerId="player2" isCurrentTurn={lCurrentTurn === 'player2'} />
      </View>

      {showEndTurn && <EndTurnModal onClose={() => setShowEndTurn(false)} />}
      {showReset && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowReset(false)}>
          <View className="flex-1 bg-black/80 items-center justify-center px-4">
            <View className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-72 items-center">
              <Text className="text-2xl mb-2">✨</Text>
              <Text className="font-black text-white mb-1">Reset Game?</Text>
              <Text className="text-xs text-gray-500 mb-4">All lore and ink will be cleared.</Text>
              <View className="flex-row gap-2 w-full">
                <TouchableOpacity onPress={() => setShowReset(false)} className="flex-1 py-2 rounded-xl bg-gray-700 items-center">
                  <Text className="text-gray-200 text-sm font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { lReset(); setShowReset(false); }} className="flex-1 py-2 rounded-xl bg-red-700 items-center">
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
