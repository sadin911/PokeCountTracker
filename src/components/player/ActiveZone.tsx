import { View } from 'react-native';
import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { PokemonSlot } from '../pokemon/PokemonSlot';

export function ActiveZone({ playerId }: { playerId: PlayerId }) {
  const pokemon = useGameStore((s) => s[playerId].activePokemon);
  return (
    <View className="flex-1 px-3 py-2">
      <PokemonSlot pokemon={pokemon} playerId={playerId} slot="active" isActive size="large" />
    </View>
  );
}
