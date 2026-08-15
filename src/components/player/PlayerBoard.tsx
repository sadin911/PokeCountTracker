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

function ActiveSection({ playerId }: { playerId: PlayerId }) {
  const active = useGameStore(s => s[playerId].activePokemon);
  return (
    <div className="grid grid-cols-5 gap-1.5">
      <div className="col-span-2">
        <TurnEnergyButton playerId={playerId} />
      </div>
      <div className="aspect-[63/88]">
        <PokemonSlot pokemon={active} playerId={playerId} slot="active" variant="active" />
      </div>
      <div className="col-span-2">
        <TurnSupporterButton playerId={playerId} />
      </div>
    </div>
  );
}

export function PlayerBoard({ playerId, flipped = false }: Props) {
  const currentTurn = useGameStore(s => s.currentTurn);
  const displayMode = useGameStore(s => s.displayMode);
  const isCurrentTurn = currentTurn === playerId;

  // Landscape: both panels side-by-side, content centered vertically
  if (displayMode === 'landscape') {
    return (
      <div className="flex flex-col h-full overflow-hidden p-1">
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-h-0">
          <div className="flex-shrink-0">
            <ActiveSection playerId={playerId} />
          </div>
          <div className="flex-shrink-0">
            <BenchRow playerId={playerId} />
          </div>
        </div>
        <div className="flex-shrink-0">
          <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
        </div>
      </div>
    );
  }

  // faceToFace / spectator: P1 rotated, content toward center divider
  const layoutClass = flipped
    ? displayMode === 'faceToFace'
      ? 'flex-col rotate-180'
      : 'flex-col-reverse'
    : 'flex-col';

  return (
    <div className={`flex gap-1.5 h-full overflow-hidden ${layoutClass}`}>
      <div className="flex-shrink-0">
        <ActiveSection playerId={playerId} />
      </div>
      <div className="flex-shrink-0">
        <BenchRow playerId={playerId} />
      </div>
      <div className="mt-auto flex-shrink-0">
        <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
      </div>
    </div>
  );
}
