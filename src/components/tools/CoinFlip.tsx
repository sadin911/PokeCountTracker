import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, withTiming, withSequence, useAnimatedStyle, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export function CoinFlip({ compact = false }: { compact?: boolean }) {
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const rotateY = useSharedValue(0);

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const outcome: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    rotateY.value = withSequence(
      withTiming(360 * 3 + (outcome === 'heads' ? 0 : 180), { duration: 900, easing: Easing.out(Easing.cubic) }),
      withTiming(outcome === 'heads' ? 0 : 180, { duration: 0 })
    );
    setTimeout(() => { setResult(outcome); setFlipping(false); }, 950);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value}deg` }],
  }));

  return (
    <TouchableOpacity onPress={flip} className="items-center gap-1">
      <Animated.View style={animStyle} className="w-10 h-10 rounded-full bg-yellow-500 border-2 border-yellow-400 items-center justify-center">
        <Text className="text-xl">{result === 'tails' ? '🌙' : '⭐'}</Text>
      </Animated.View>
      {result && !compact && (
        <Text className={`text-xs font-black ${result === 'heads' ? 'text-yellow-300' : 'text-blue-300'}`}>
          {result.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}
