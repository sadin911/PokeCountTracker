import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLongPress } from '../../hooks/useLongPress';

interface Props {
  damage: number; maxHP: number;
  onAdd: (amount: number) => void;
  compact?: boolean;
}

export function DamageCounter({ damage, maxHP, onAdd, compact = false }: Props) {
  const tap = (amt: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd(amt);
  };
  const longMinus = useLongPress(() => tap(-10));
  const longPlus = useLongPress(() => tap(10));
  const isKO = damage >= maxHP && maxHP > 0;

  if (compact) {
    return (
      <View className="flex-row items-center gap-1">
        <Pressable onPress={() => tap(-10)} className="w-5 h-5 rounded bg-gray-700 items-center justify-center">
          <Text className="text-gray-300 text-xs font-bold">−</Text>
        </Pressable>
        <Text className={`text-xs font-bold font-mono w-8 text-center ${isKO ? 'text-red-400' : 'text-gray-200'}`}>
          {isKO ? 'KO' : damage}
        </Text>
        <Pressable onPress={() => tap(10)} className="w-5 h-5 rounded bg-gray-700 items-center justify-center">
          <Text className="text-gray-300 text-xs font-bold">+</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-0.5">
      <Pressable onPress={() => tap(-30)} className="px-1.5 py-1.5 rounded-md bg-gray-700/60">
        <Text className="text-xs font-bold text-gray-500">-30</Text>
      </Pressable>
      <Pressable {...longMinus} className="h-7 w-7 rounded-lg bg-gray-700 items-center justify-center">
        <Text className="text-gray-200 text-sm font-bold">−</Text>
      </Pressable>
      <View className="flex-1 items-center">
        {isKO
          ? <Text className="text-base font-black text-red-400">KO!</Text>
          : <Text className="text-base font-black text-white font-mono">{damage}<Text className="text-xs text-gray-500 font-normal"> dmg</Text></Text>
        }
      </View>
      <Pressable {...longPlus} className="h-7 w-7 rounded-lg bg-gray-700 items-center justify-center">
        <Text className="text-gray-200 text-sm font-bold">+</Text>
      </Pressable>
      {[30, 60, 90].map((amt) => (
        <Pressable key={amt} onPress={() => tap(amt)} className="px-1.5 py-1.5 rounded-md bg-gray-700/60">
          <Text className="text-xs font-bold text-gray-500">+{amt}</Text>
        </Pressable>
      ))}
    </View>
  );
}
