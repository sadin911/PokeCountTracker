import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function DiceRoller({ compact = false }: { compact?: boolean }) {
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const scale = useSharedValue(1);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const outcome = Math.floor(Math.random() * 6) + 1;
    scale.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 100 })
    );
    setTimeout(() => { setResult(outcome); setRolling(false); }, 450);
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity onPress={roll} className="items-center gap-1">
      <Animated.View style={animStyle} className="w-10 h-10 rounded-xl bg-gray-700 border border-gray-600 items-center justify-center">
        <Text className="text-2xl">{result ? FACES[result - 1] : '🎲'}</Text>
      </Animated.View>
      {result && !compact && (
        <Text className="text-xs font-black text-white">{result}</Text>
      )}
    </TouchableOpacity>
  );
}
