import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { PlayerHeader } from './PlayerHeader';
import { BenchRow } from './BenchRow';
import { PokemonSlot } from '../pokemon/PokemonSlot';
import { TurnEnergyButton, TurnSupporterButton } from './TurnTrackers';
import { STATUS_INFO } from '../../constants/statusConditions';

function StatusReminders({ playerId }: { playerId: PlayerId }) {
  const player = useGameStore(s => s[playerId]);
  const allPokemon = [player.activePokemon, ...player.bench];
  const affected = allPokemon.filter(p => p.name && p.status !== 'none');
  if (affected.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-1 py-1 overflow-y-auto">
      {affected.map(p => {
        const si = STATUS_INFO[p.status];
        return (
          <div key={p.id} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg bg-gray-800/50 border-l-2 ${si.borderColor}`}>
            <span className="text-base leading-none mt-px flex-shrink-0">{si.emoji}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-gray-200 truncate">{p.name}</span>
                <span className={`text-[9px] font-bold px-1 rounded ${si.bgColor} ${si.color}`}>{si.label}</span>
              </div>
              {si.rule && <p className="text-[9px] text-gray-300 leading-snug mt-0.5">{si.rule}</p>}
              {si.cure && (
                <p className="text-[9px] text-gray-500 leading-snug mt-0.5">
                  <span className="text-green-600 font-bold">Cure: </span>{si.cure}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
          <StatusReminders playerId={playerId} />
        </div>
        <div className="flex-shrink-0">
          <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
        </div>
      </div>
    );
  }

  // faceToFace: P1 rotated 180° so each player reads from their own side
  // spectator (same side): both sections use same flex-col order — no rotation, no reversal
  const layoutClass = flipped
    ? displayMode === 'faceToFace'
      ? 'flex-col rotate-180'
      : 'flex-col'
    : 'flex-col';

  return (
    <div className={`flex gap-1.5 h-full overflow-hidden ${layoutClass}`}>
      <div className="flex-shrink-0">
        <ActiveSection playerId={playerId} />
      </div>
      <div className="flex-shrink-0">
        <BenchRow playerId={playerId} />
      </div>
      <div className="flex-1 min-h-0">
        <StatusReminders playerId={playerId} />
      </div>
      <div className="flex-shrink-0">
        <PlayerHeader playerId={playerId} isCurrentTurn={isCurrentTurn} />
      </div>
    </div>
  );
}
