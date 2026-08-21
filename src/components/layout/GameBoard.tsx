import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

export function GameBoard() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View className={`flex-1 ${theme.appBg}`} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Text className="text-white text-center mt-10">Pokémon Board (coming soon)</Text>
    </View>
  );
}
