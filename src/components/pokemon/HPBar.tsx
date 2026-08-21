import { View } from 'react-native';

interface Props { current: number; max: number; }

export function HPBar({ current, max }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 1;
  const color = pct > 0.5 ? 'bg-green-500' : pct > 0.25 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <View className="h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
      <View className={`h-full rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
    </View>
  );
}
