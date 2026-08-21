import { useColorScheme } from 'react-native';

export function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme !== 'light';
  return {
    appBg: dark ? 'bg-gray-950' : 'bg-gray-100',
    centerBg: dark ? 'bg-gray-900' : 'bg-gray-200',
    centerBorder: dark ? 'border-gray-700' : 'border-gray-300',
    centerText: dark ? 'text-gray-500' : 'text-gray-500',
    headerOn: dark ? 'bg-blue-950' : 'bg-blue-100',
    headerOff: dark ? 'bg-gray-900' : 'bg-gray-200',
    headerDot: 'bg-blue-400',
    headerDotOff: dark ? 'bg-gray-700' : 'bg-gray-400',
    headerNameOn: 'text-white',
    headerNameOff: dark ? 'text-gray-400' : 'text-gray-600',
    headerTurnBadge: 'text-blue-400',
  };
}
