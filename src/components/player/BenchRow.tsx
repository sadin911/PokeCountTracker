import { View, ScrollView } from 'react-native';
import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { PokemonSlot } from '../pokemon/PokemonSlot';

export function BenchRow({ playerId }: { playerId: PlayerId }) {
  const bench = useGameStore((s) => s[playerId].bench);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2 py-1 max-h-24">
      <View className="flex-row gap-1.5">
        {bench.map((pokemon, i) => (
          <View key={pokemon.id} className="w-20 h-20">
            <PokemonSlot pokemon={pokemon} playerId={playerId} slot={i as 0 | 1 | 2 | 3 | 4} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
