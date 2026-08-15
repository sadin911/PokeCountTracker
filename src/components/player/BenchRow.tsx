import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { PokemonSlot } from '../pokemon/PokemonSlot';

interface Props {
  playerId: PlayerId;
}

export function BenchRow({ playerId }: Props) {
  const bench = useGameStore(s => s[playerId].bench);

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {bench.map((pokemon, i) => (
        <div key={pokemon.id} className="aspect-[63/88]">
          <PokemonSlot
            pokemon={pokemon}
            playerId={playerId}
            slot={i as 0 | 1 | 2 | 3 | 4}
            variant="bench"
          />
        </div>
      ))}
    </div>
  );
}
