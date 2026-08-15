import { useState } from 'react';
import type { PokemonSlot as PokemonSlotType, PlayerId, SlotKey, EnergyType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { HPBar } from './HPBar';
import { HPPresetPicker } from './HPPresetPicker';
import { DamageCounter } from './DamageCounter';
import { StatusBadge } from './StatusBadge';
import { EnergyTracker } from './EnergyTracker';
import { AbilityTracker } from './AbilityTracker';
import { useDragSwap } from '../../hooks/useDragSwap';

interface Props {
  pokemon: PokemonSlotType;
  playerId: PlayerId;
  slot: SlotKey;
  variant: 'active' | 'bench';
}

export function PokemonSlot({ pokemon, playerId, slot, variant }: Props) {
  const { updatePokemon, setEnergyCount } = useGameStore();
  const [showHPPicker, setShowHPPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragProps = useDragSwap(playerId, slot);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const isKO = pokemon.currentDamage >= pokemon.maxHP && pokemon.maxHP > 0;

  const handleDragOver = (e: React.DragEvent) => {
    dragProps.onDragOver(e);
    setDragOver(true);
  };
  const handleDrop = (e: React.DragEvent) => {
    setDragOver(false);
    dragProps.onDrop(e);
  };
  const handleDragLeave = () => setDragOver(false);

  if (variant === 'bench') {
    return (
      <>
        <div
          {...dragProps}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          className={`flex flex-col gap-0.5 p-1.5 rounded-xl border h-full w-full transition-all cursor-grab active:cursor-grabbing select-none overflow-hidden ${
            isKO
              ? 'bg-red-950/60 border-red-700'
              : dragOver
              ? 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-400'
              : pokemon.name
              ? 'bg-gray-800/70 border-gray-600 hover:border-gray-500'
              : 'bg-gray-800/30 border-gray-700/50 border-dashed hover:border-gray-600'
          }`}
        >
          {/* Name */}
          {editingName ? (
            <input
              autoFocus
              className="bg-transparent text-xs text-gray-100 outline-none w-full font-semibold"
              value={pokemon.name}
              onChange={e => update({ name: e.target.value })}
              onBlur={() => {
                if (addingNew && !pokemon.name.trim()) update({ name: 'Pokémon' });
                setAddingNew(false);
                setEditingName(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (addingNew && !pokemon.name.trim()) update({ name: 'Pokémon' });
                  setAddingNew(false);
                  setEditingName(false);
                }
              }}
              placeholder="Pokémon name"
            />
          ) : (
            <button
              onClick={() => { if (!pokemon.name) setAddingNew(true); setEditingName(true); }}
              className="text-xs font-semibold text-left text-gray-200 hover:text-white truncate w-full"
            >
              {pokemon.name || <span className="text-gray-600">+ Add Pokémon</span>}
            </button>
          )}

          {pokemon.name && (
            <>
              <button onClick={() => setShowHPPicker(true)} className="text-left">
                <HPBar maxHP={pokemon.maxHP} currentDamage={pokemon.currentDamage} />
              </button>
              {/* Damage + Status in one row to save vertical space */}
              <div className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0">
                  <DamageCounter
                    damage={pokemon.currentDamage}
                    maxHP={pokemon.maxHP}
                    onAdd={amt => update({ currentDamage: Math.max(0, pokemon.currentDamage + amt) })}
                    compact
                  />
                </div>
                <StatusBadge
                  status={pokemon.status}
                  onChange={status => update({ status })}
                  compact
                />
              </div>
              <EnergyTracker
                energies={pokemon.energies}
                onUpdate={(type, count) => setEnergyCount(playerId, slot, type, count)}
                compact
              />
              <AbilityTracker
                abilityUsed={pokemon.abilityUsed}
                attackUsed={pokemon.attackUsed}
                onToggleAbility={() => update({ abilityUsed: !pokemon.abilityUsed })}
                onToggleAttack={() => update({ attackUsed: !pokemon.attackUsed })}
                compact
              />
            </>
          )}
        </div>

        {showHPPicker && (
          <HPPresetPicker
            currentMaxHP={pokemon.maxHP}
            onSelect={hp => { update({ maxHP: hp, currentDamage: 0 }); setShowHPPicker(false); }}
            onClose={() => setShowHPPicker(false)}
          />
        )}
      </>
    );
  }

  // Active slot — same compact size as bench, blue border to distinguish
  return (
    <>
      <div
        {...dragProps}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        className={`flex flex-col gap-0.5 p-1.5 rounded-xl border h-full w-full transition-all cursor-grab active:cursor-grabbing select-none overflow-hidden ${
          isKO
            ? 'bg-red-950/60 border-red-600'
            : dragOver
            ? 'bg-blue-900/40 border-blue-400 ring-2 ring-blue-400'
            : pokemon.name
            ? 'bg-gray-800/80 border-blue-500/50 ring-1 ring-blue-500/20'
            : 'bg-gray-800/30 border-blue-500/30 border-dashed'
        }`}
      >
        {/* Name + Status */}
        {editingName ? (
          <input
            autoFocus
            className="bg-transparent text-xs text-gray-100 outline-none w-full font-semibold"
            value={pokemon.name}
            onChange={e => update({ name: e.target.value })}
            onBlur={() => {
              if (addingNew && !pokemon.name.trim()) update({ name: 'Pokémon' });
              setAddingNew(false);
              setEditingName(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (addingNew && !pokemon.name.trim()) update({ name: 'Pokémon' });
                setAddingNew(false);
                setEditingName(false);
              }
            }}
            placeholder="Pokémon name"
          />
        ) : (
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => { if (!pokemon.name) setAddingNew(true); setEditingName(true); }}
              className="text-xs font-semibold text-left text-blue-200 hover:text-white truncate flex-1"
            >
              {pokemon.name || <span className="text-blue-500/60">+ Active</span>}
            </button>
            <StatusBadge status={pokemon.status} onChange={status => update({ status })} compact />
          </div>
        )}

        {pokemon.name && (
          <>
            <button onClick={() => setShowHPPicker(true)} className="text-left">
              <HPBar maxHP={pokemon.maxHP} currentDamage={pokemon.currentDamage} />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 min-w-0">
                <DamageCounter
                  damage={pokemon.currentDamage}
                  maxHP={pokemon.maxHP}
                  onAdd={amt => update({ currentDamage: Math.max(0, pokemon.currentDamage + amt) })}
                  compact
                />
              </div>
            </div>
            <EnergyTracker
              energies={pokemon.energies}
              onUpdate={(type: EnergyType, count: number) => setEnergyCount(playerId, slot, type, count)}
              compact
            />
            <AbilityTracker
              abilityUsed={pokemon.abilityUsed}
              attackUsed={pokemon.attackUsed}
              onToggleAbility={() => update({ abilityUsed: !pokemon.abilityUsed })}
              onToggleAttack={() => update({ attackUsed: !pokemon.attackUsed })}
              compact
            />
          </>
        )}
      </div>

      {showHPPicker && (
        <HPPresetPicker
          currentMaxHP={pokemon.maxHP}
          onSelect={hp => { update({ maxHP: hp, currentDamage: 0 }); setShowHPPicker(false); }}
          onClose={() => setShowHPPicker(false)}
        />
      )}
    </>
  );
}
