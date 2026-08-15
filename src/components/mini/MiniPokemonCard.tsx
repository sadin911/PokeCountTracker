import { useState } from 'react';
import type { PokemonSlot as PokemonSlotType, PlayerId, SlotKey } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { StatusBadge } from '../pokemon/StatusBadge';
import { PokemonNameInput } from '../pokemon/PokemonNameInput';
import { STATUS_INFO } from '../../constants/statusConditions';

interface Props {
  pokemon: PokemonSlotType;
  playerId: PlayerId;
  slot: SlotKey;
  isActive?: boolean;
}

export function MiniPokemonCard({ pokemon, playerId, slot, isActive }: Props) {
  const { updatePokemon, clearPokemon } = useGameStore();
  const [editingName, setEditingName] = useState(false);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const addDamage = (amt: number) =>
    update({ currentDamage: Math.max(0, pokemon.currentDamage + amt) });

  const chips = Math.floor(pokemon.currentDamage / 10);
  const statusInfo = pokemon.status !== 'none' ? STATUS_INFO[pokemon.status] : null;

  // Empty slot — waiting for a pokemon
  if (!pokemon.name && !editingName) {
    return (
      <button
        onClick={() => setEditingName(true)}
        className="flex items-center justify-center h-full w-full rounded-xl border border-dashed border-gray-700/50 text-gray-700 text-sm active:border-gray-500 active:text-gray-500 transition-colors"
      >
        {isActive ? '⚔' : '+'}
      </button>
    );
  }

  // Name input for empty slot
  if (!pokemon.name && editingName) {
    return (
      <div className="flex items-center justify-center h-full w-full p-2 rounded-xl border border-blue-700 bg-blue-950/30">
        <PokemonNameInput
          autoFocus
          value={pokemon.name}
          onChange={name => update({ name })}
          onSelectSuggestion={hp => { if (hp) update({ maxHP: hp }); }}
          onCommit={() => setEditingName(false)}
          placeholder="Name…"
          className="bg-transparent text-xs text-white outline-none w-full font-bold text-center"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col gap-1 p-1.5 rounded-xl border h-full overflow-hidden ${
      isActive
        ? 'bg-blue-950/30 border-blue-800/50'
        : 'bg-gray-800/40 border-gray-700/50'
    }`}>
      {/* Remove ✕ */}
      <button
        onClick={() => clearPokemon(playerId, slot)}
        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-gray-700/40 text-gray-600 text-[8px] hover:bg-red-900/60 hover:text-red-400 active:scale-90 transition-all"
      >✕</button>

      {/* Name row */}
      {editingName ? (
        <PokemonNameInput
          autoFocus
          value={pokemon.name}
          onChange={name => update({ name })}
          onSelectSuggestion={hp => { if (hp) update({ maxHP: hp }); }}
          onCommit={() => setEditingName(false)}
          placeholder="Name…"
          className="bg-transparent text-[9px] text-gray-100 outline-none w-full font-bold pr-5"
        />
      ) : (
        <button onClick={() => setEditingName(true)} className="text-left pr-5 w-full">
          <span className="text-[9px] font-bold text-gray-200 truncate block leading-tight">
            {statusInfo && <span className="mr-0.5">{statusInfo.emoji}</span>}
            {pokemon.name}
          </span>
        </button>
      )}

      {/* Damage chips — each circle = 10 dmg, tap to remove */}
      <div className="flex-1 flex flex-wrap gap-0.5 content-start overflow-hidden">
        {chips > 0 && Array.from({ length: Math.min(chips, 25) }).map((_, i) => (
          <button
            key={i}
            onClick={() => addDamage(-10)}
            className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/50 hover:bg-red-400 active:scale-75 transition-all flex-shrink-0"
            title="-10 dmg"
          />
        ))}
        {chips > 25 && (
          <span className="text-[8px] text-red-400 font-black self-center">+{chips - 25}</span>
        )}
      </div>

      {/* Damage number */}
      {pokemon.currentDamage > 0 && (
        <div className="text-center font-black text-base text-red-300 font-mono leading-none">
          {pokemon.currentDamage}
        </div>
      )}

      {/* Status badge + ±10 buttons */}
      <div className="flex items-center gap-0.5">
        <StatusBadge status={pokemon.status} onChange={status => update({ status })} compact />
        <button
          onClick={() => addDamage(-10)}
          className="flex-1 py-0.5 rounded bg-gray-700/60 border border-gray-600/40 text-red-300 text-[9px] font-black active:scale-95 transition-transform"
        >−10</button>
        <button
          onClick={() => addDamage(10)}
          className="flex-1 py-0.5 rounded bg-gray-700/60 border border-gray-600/40 text-green-300 text-[9px] font-black active:scale-95 transition-transform"
        >+10</button>
      </div>
    </div>
  );
}
