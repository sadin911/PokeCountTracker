import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { PlayerHeader } from './PlayerHeader';
import { BenchRow } from './BenchRow';
import { PokemonSlot } from '../pokemon/PokemonSlot';

interface Props {
  playerId: PlayerId;
  flipped?: boolean;
}

export function PlayerBoard({ playerId, flipped = false }: Props) {
  const active = useGameStore(s => s[playerId].activePokemon);
  const currentTurn = useGameStore(s => s.currentTurn);
  const displayMode = useGameStore(s => s.displayMode);
  const isCurrentTurn = currentTurn === playerId;

  // faceToFace: P1 rotated 180° so both players face each other across the device
  // spectator: P1 reversed (flex-col-reverse) so both halves read top-to-bottom from same side
  // landscape: P1 not flipped at all (each player reads their own half left-to-right)
  const layoutClass = flipped
    ? displayMode === 'faceToFace'
      ? 'flex-col rotate-180'
      : 'flex-col-reverse'
    : 'flex-col';

  return (
    <div className={`flex gap-1.5 h-full overflow-hidden ${layoutClass}`}>
      {/* Active — same card size as bench, centered in grid-cols-5 */}
      <div className="flex-shrink-0">
        <div className="grid grid-cols-5 gap-1.5">
          <div /><div />
          <div className="aspect-[63/88]">
            <PokemonSlot pokemon={active} playerId={playerId} slot="active" variant="active" />
          </div>
          <div /><div />
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
