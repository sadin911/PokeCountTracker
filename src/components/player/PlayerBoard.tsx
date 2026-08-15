import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { PlayerHeader } from './PlayerHeader';
import { BenchRow } from './BenchRow';
import { PokemonSlot } from '../pokemon/PokemonSlot';
import { TurnEnergyButton, TurnSupporterButton } from './TurnTrackers';

interface Props {
  playerId: PlayerId;
  flipped?: boolean;
}

export function PlayerBoard({ playerId, flipped = false }: Props) {
  const active = useGameStore(s => s[playerId].activePokemon);
  const currentTurn = useGameStore(s => s.currentTurn);
  const displayMode = useGameStore(s => s.displayMode);
  const isCurrentTurn = currentTurn === playerId;

  const layoutClass = flipped
    ? displayMode === 'faceToFace'
      ? 'flex-col rotate-180'
      : 'flex-col-reverse'
    : 'flex-col';

  return (
    <div className={`flex gap-1.5 h-full overflow-hidden ${layoutClass}`}>
      {/* Active + side trackers in a 5-col grid — all rows share the same height */}
      <div className="flex-shrink-0">
        <div className="grid grid-cols-5 gap-1.5">
          {/* Energy attachment tracker — left 2 cols */}
          <div className="col-span-2">
            <TurnEnergyButton playerId={playerId} />
          </div>

          {/* Active Pokemon — center col, sets row height via aspect ratio */}
          <div className="aspect-[63/88]">
            <PokemonSlot pokemon={active} playerId={playerId} slot="active" variant="active" />
          </div>

          {/* Supporter tracker — right 2 cols */}
          <div className="col-span-2">
            <TurnSupporterButton playerId={playerId} />
          </div>
        </div>
      </div>

      {/* Bench — 5 cards same size as active */}
      <div className="flex-shrink-0">
        <BenchRow playerId={playerId} />
      </div>

      {/* Header — pushed to outer edge */}
      <div className="mt-auto flex-shrink-0">
        <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
      </div>
    </div>
  );
}
