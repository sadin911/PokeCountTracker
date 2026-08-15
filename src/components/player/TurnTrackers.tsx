import type { PlayerId } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface Props {
  playerId: PlayerId;
}

export function TurnEnergyButton({ playerId }: Props) {
  const attached = useGameStore(s => s[playerId].energyAttached);
  const toggle = useGameStore(s => s.toggleEnergyAttached);
  const ready = !attached;

  return (
    <button
      onClick={() => toggle(playerId)}
      className="w-full h-full flex flex-col items-center justify-center gap-1.5 select-none active:scale-95 transition-all"
    >
      {/* Energy orb icon */}
      <div className={`relative flex items-center justify-center rounded-full transition-all w-10 h-10
        ${ready
          ? 'bg-emerald-500/20 ring-2 ring-emerald-400/60 shadow-md shadow-emerald-500/30'
          : 'bg-gray-800/40 ring-1 ring-gray-600/30'
        }`}
      >
        <span className={`text-2xl leading-none ${ready ? '' : 'grayscale opacity-30'}`}>⚡</span>
        {!ready && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-700 rounded-full text-[8px] text-white flex items-center justify-center font-black">✓</span>
        )}
      </div>

      <div className="text-center leading-tight">
        <div className={`text-[9px] font-black tracking-widest uppercase ${ready ? 'text-emerald-300' : 'text-gray-600'}`}>
          Energy
        </div>
        <div className={`text-[8px] font-semibold ${ready ? 'text-emerald-500/80' : 'text-gray-600 line-through'}`}>
          {ready ? 'Attach' : 'Done'}
        </div>
      </div>

      <div className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600/40'}`} />
    </button>
  );
}

export function TurnSupporterButton({ playerId }: Props) {
  const used = useGameStore(s => s[playerId].supporterUsed);
  const toggle = useGameStore(s => s.toggleSupporter);
  const ready = !used;

  return (
    <button
      onClick={() => toggle(playerId)}
      className="w-full h-full flex flex-col items-center justify-center gap-1.5 select-none active:scale-95 transition-all"
    >
      {/* Card icon with star */}
      <div className={`relative flex items-center justify-center rounded-lg border-2 transition-all w-10 h-10
        ${ready
          ? 'bg-amber-500/20 border-amber-400/60 shadow-md shadow-amber-500/30'
          : 'bg-gray-800/40 border-gray-600/30'
        }`}
      >
        <span className={`text-2xl leading-none ${ready ? 'text-amber-300' : 'grayscale opacity-30'}`}>★</span>
        {!ready && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-700 rounded-full text-[8px] text-white flex items-center justify-center font-black">✓</span>
        )}
      </div>

      <div className="text-center leading-tight">
        <div className={`text-[9px] font-black tracking-widest uppercase ${ready ? 'text-amber-300' : 'text-gray-600'}`}>
          Supporter
        </div>
        <div className={`text-[8px] font-semibold ${ready ? 'text-amber-500/80' : 'text-gray-600 line-through'}`}>
          {ready ? 'Play card' : 'Used'}
        </div>
      </div>

      <div className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-amber-400 animate-pulse' : 'bg-gray-600/40'}`} />
    </button>
  );
}
