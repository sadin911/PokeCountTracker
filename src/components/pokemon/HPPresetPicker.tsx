import { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Pressable } from 'react-native';
import { HP_PRESETS } from '../../constants/hpPresets';

interface Props { currentMaxHP: number; onSelect: (hp: number) => void; onClose: () => void; }

export function HPPresetPicker({ currentMaxHP, onSelect, onClose }: Props) {
  const [custom, setCustom] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustom = () => {
    const n = parseInt(custom, 10);
    if (!isNaN(n) && n > 0) onSelect(n);
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose}>
        <View className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 rounded-t-2xl p-4 max-h-96">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-black text-base">Set Max HP</Text>
            <TouchableOpacity onPress={onClose}><Text className="text-gray-400">✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {HP_PRESETS.map((hp) => (
                <TouchableOpacity
                  key={hp}
                  onPress={() => onSelect(hp)}
                  className={`px-3 py-1.5 rounded-lg border ${hp === currentMaxHP ? 'bg-blue-700 border-blue-500' : 'bg-gray-800 border-gray-600'}`}
                >
                  <Text className={`text-sm font-bold ${hp === currentMaxHP ? 'text-white' : 'text-gray-300'}`}>{hp}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {showCustom ? (
              <View className="flex-row gap-2">
                <TextInput
                  autoFocus keyboardType="number-pad"
                  placeholder="Custom HP" placeholderTextColor="#6b7280"
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  value={custom} onChangeText={setCustom} onSubmitEditing={handleCustom}
                />
                <TouchableOpacity onPress={handleCustom} className="px-4 py-2 rounded-lg bg-blue-700">
                  <Text className="text-white font-bold">Set</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowCustom(true)} className="py-2 rounded-lg bg-gray-800 border border-gray-600 items-center">
                <Text className="text-gray-400 text-sm">Custom…</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}
