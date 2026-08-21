import { View } from 'react-native';
import type { PlayerId } from '../../types/game';
import { PlayerHeader } from './PlayerHeader';
import { ActiveZone } from './ActiveZone';
import { BenchRow } from './BenchRow';

interface Props { playerId: PlayerId; isCurrentTurn: boolean; flipped?: boolean; }

export function PlayerBoard({ playerId, isCurrentTurn, flipped = false }: Props) {
  return (
    <View className="flex-1" style={flipped ? { transform: [{ rotate: '180deg' }] } : undefined}>
      <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
      <BenchRow playerId={playerId} />
      <ActiveZone playerId={playerId} />
    </View>
  );
}
