import { useState } from 'react';
import type { PokemonSlot as PokemonSlotType, PlayerId, SlotKey } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { StatusBadge } from '../pokemon/StatusBadge';
import { HPPresetPicker } from '../pokemon/HPPresetPicker';

interface Props {
  pokemon: PokemonSlotType;
  playerId: PlayerId;
  slot: SlotKey;
  isActive?: boolean;
  isSelected?: boolean;   // tap-selected for swap
  swapMode?: boolean;     // another slot tap-selected — can swap here
  onSelect?: () => void;  // tap handler on ⇄
  isDragSource?: boolean; // being touch-dragged
  isDragTarget?: boolean; // current touch-drag drop target
  onSwapStart?: (e: React.TouchEvent) => void; // ⇄ touchstart → initiate drag
}

export function MiniPokemonCard({
  pokemon, playerId, slot, isActive,
  isSelected = false, swapMode = false, onSelect,
  isDragSource = false, isDragTarget = false, onSwapStart,
}: Props) {
  const { updatePokemon, clearPokemon } = useGameStore();
  const [showPicker, setShowPicker] = useState(false);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const addDamage = (amt: number) =>
    update({ currentDamage: Math.max(0, pokemon.currentDamage + amt) });

  const hasCard = pokemon.name !== '';
  const chips = Math.floor(pokemon.currentDamage / 10);
  const currentHP = Math.max(0, pokemon.maxHP - pokemon.currentDamage);
  const isKO = hasCard && pokemon.currentDamage >= pokemon.maxHP;
  const hpPct = pokemon.maxHP > 0 ? currentHP / pokemon.maxHP : 1;
  const hpColor = hpPct > 0.5 ? 'text-green-400' : hpPct > 0.25 ? 'text-yellow-400' : 'text-red-400';

  const onPickHP = (hp: number) => {
    update({ maxHP: hp, currentDamage: 0, name: 'Pokémon' });
    setShowPicker(false);
  };

  // ── Empty slot ──────────────────────────────────────────────────────────────
  if (!hasCard) {
    return (
      <>
        <button
          onClick={() => {
            // When another card is selected, tap here = move it here
            if (swapMode && onSelect) {
              onSelect();
            } else {
              setShowPicker(true);
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 h-full w-full rounded-xl border border-dashed transition-all ${
            swapMode
              ? 'border-yellow-500/80 text-yellow-500 bg-yellow-950/30 scale-[0.97]'
              : isActive
                ? 'border-blue-700/50 text-blue-700 active:border-blue-500 active:text-blue-500'
                : 'border-gray-700/50 text-gray-700 active:border-gray-500 active:text-gray-500'
          }`}
        >
          <span className="text-lg leading-none">
            {swapMode ? '⇄' : isActive ? '⚔' : '+'}
          </span>
          <span className="text-[8px] font-bold leading-none">
            {swapMode ? 'Move' : 'Set HP'}
          </span>
        </button>
        {showPicker && (
          <HPPresetPicker currentMaxHP={0} onSelect={onPickHP} onClose={() => setShowPicker(false)} />
        )}
      </>
    );
  }

  // ── Occupied card ───────────────────────────────────────────────────────────
  const borderStyle = isDragTarget
    ? 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-950/30'
    : isDragSource
      ? 'opacity-50 border-yellow-500 bg-yellow-950/20'
      : isSelected
        ? 'ring-2 ring-yellow-400 border-yellow-500 bg-yellow-950/30'
        : isKO
          ? 'bg-red-950/50 border-red-700'
          : swapMode
            ? 'border-yellow-500/40 bg-yellow-950/10'
            : isActive
              ? 'bg-blue-950/30 border-blue-800/50'
              : 'bg-gray-800/40 border-gray-700/50';

  return (
    <>
      <div className={`relative flex flex-col gap-0.5 p-1 rounded-xl border h-full overflow-hidden transition-all ${borderStyle}`}>

        {/* Top row: swap + HP + delete */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Swap ⇄ — tap = select, touch+drag = drag swap */}
          <button
            onClick={onSelect}
            onTouchStart={onSwapStart}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 transition-all active:scale-90 cursor-grab active:cursor-grabbing ${
              isDragSource || isDragTarget
                ? 'bg-emerald-500 text-black font-black'
                : isSelected
                  ? 'bg-yellow-400 text-black font-black'
                  : swapMode
                    ? 'bg-yellow-800/60 text-yellow-400'
                    : 'bg-gray-700/50 text-gray-500 hover:text-gray-300'
            }`}
            title="Drag or tap to swap"
          >⇄</button>

          {/* HP — tap to change */}
          <button onClick={() => setShowPicker(true)} className="flex-1 text-left min-w-0 overflow-hidden">
            <span className="text-[9px] font-black text-gray-300 leading-none truncate block">
              {pokemon.maxHP}
              <span className="text-[7px] font-normal text-gray-600 ml-0.5">HP ✎</span>
            </span>
          </button>

          {/* Delete — bigger */}
          <button
            onClick={() => clearPokemon(playerId, slot)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/70 border border-red-700/70 text-red-300 text-sm font-black hover:bg-red-700 active:scale-90 transition-all"
            title="Remove"
          >✕</button>
        </div>

        {/* Damage chips */}
        <div className="flex-1 flex flex-wrap gap-0.5 content-start overflow-hidden min-h-0">
          {chips > 0 && Array.from({ length: Math.min(chips, 24) }).map((_, i) => (
            <button
              key={i}
              onClick={() => addDamage(-10)}
              className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/50 hover:bg-red-400 active:scale-75 transition-all flex-shrink-0"
            />
          ))}
          {chips > 24 && (
            <span className="text-[7px] text-red-400 font-black self-center">+{chips - 24}</span>
          )}
        </div>

        {/* Current HP */}
        <div className="text-center flex-shrink-0">
          {isKO ? (
            <span className="text-sm font-black text-red-400 animate-pulse">KO!</span>
          ) : (
            <span className={`text-base font-black font-mono leading-none ${hpColor}`}>
              {currentHP}
            </span>
          )}
        </div>

        {/* Status + ±10 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <StatusBadge status={pokemon.status} onChange={status => update({ status })} compact />
          <button
            onClick={() => addDamage(10)}
            className="flex-1 py-0.5 rounded bg-gray-700/60 border border-gray-600/40 text-red-300 text-[9px] font-black active:scale-95 transition-transform"
          >−10</button>
          <button
            onClick={() => addDamage(-10)}
            className="flex-1 py-0.5 rounded bg-gray-700/60 border border-gray-600/40 text-green-300 text-[9px] font-black active:scale-95 transition-transform"
          >+10</button>
        </div>
      </div>

      {showPicker && (
        <HPPresetPicker currentMaxHP={pokemon.maxHP} onSelect={onPickHP} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}
