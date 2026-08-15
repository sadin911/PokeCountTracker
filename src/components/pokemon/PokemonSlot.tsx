import { useState } from 'react';
import type { PokemonSlot as PokemonSlotType, PlayerId, SlotKey, EnergyType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { useTheme } from '../../hooks/useTheme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { HPBar } from './HPBar';
import { HPPresetPicker } from './HPPresetPicker';
import { DamageCounter } from './DamageCounter';
import { StatusBadge } from './StatusBadge';
import { EnergyTracker } from './EnergyTracker';
import { AbilityTracker } from './AbilityTracker';
import { useDragSwap } from '../../hooks/useDragSwap';
import { CardDetailModal } from '../mobile/CardDetailModal';
import { STATUS_INFO } from '../../constants/statusConditions';
import { PokemonNameInput } from './PokemonNameInput';

interface Props {
  pokemon: PokemonSlotType;
  playerId: PlayerId;
  slot: SlotKey;
  variant: 'active' | 'bench';
}

export function PokemonSlot({ pokemon, playerId, slot, variant }: Props) {
  const { updatePokemon, setEnergyCount } = useGameStore();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [showHPPicker, setShowHPPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragProps = useDragSwap(playerId, slot);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const isKO = pokemon.currentDamage >= pokemon.maxHP && pokemon.maxHP > 0;
  const currentHP = Math.max(0, pokemon.maxHP - pokemon.currentDamage);

  // ── Mobile: simplified card, tap → full modal ──────────────────────────
  if (isMobile) {
    const cardClass = isKO
      ? theme.cardKO
      : variant === 'active'
        ? (pokemon.name ? theme.cardActive : theme.cardActiveEmpty)
        : (pokemon.name ? theme.card : theme.cardEmpty);

    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`flex flex-col gap-1 p-1.5 rounded-xl border h-full w-full select-none active:opacity-80 transition-opacity overflow-hidden ${cardClass}`}
        >
          <div className={`text-xs font-semibold truncate ${pokemon.name ? (variant === 'active' ? theme.activeText : theme.cardText) : theme.cardEmptyText}`}>
            {pokemon.name || (variant === 'active' ? '+ Active' : '+ Add')}
          </div>
          {pokemon.name && (
            <>
              <HPBar maxHP={pokemon.maxHP} currentDamage={pokemon.currentDamage} />
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold font-mono ${isKO ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
                  {isKO ? 'KO!' : `${currentHP}HP`}
                </span>
                {pokemon.status !== 'none' && (
                  <span className="text-[10px] leading-none">{STATUS_INFO[pokemon.status].emoji}</span>
                )}
              </div>
            </>
          )}
        </button>
        {showModal && (
          <CardDetailModal
            pokemon={pokemon}
            playerId={playerId}
            slot={slot}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }
  // ── End mobile ──────────────────────────────────────────────────────────

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
    const commitName = () => {
      if (addingNew && !pokemon.name.trim()) update({ name: 'Pokémon' });
      setAddingNew(false);
      setEditingName(false);
    };

    return (
      <>
        <div
          {...dragProps}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          className={`flex flex-col gap-0.5 p-1.5 rounded-xl border h-full w-full transition-all cursor-grab active:cursor-grabbing select-none overflow-hidden ${
            isKO ? theme.cardKO : dragOver ? theme.cardDrag : pokemon.name ? theme.card : theme.cardEmpty
          }`}
        >
          {/* Name */}
          {editingName ? (
            <PokemonNameInput
              autoFocus
              value={pokemon.name}
              onChange={name => update({ name })}
              onSelectSuggestion={hp => { if (hp) update({ maxHP: hp, currentDamage: 0 }); }}
              onCommit={commitName}
              placeholder="Pokémon name"
              className="bg-transparent text-xs text-gray-100 outline-none w-full font-semibold"
            />
          ) : (
            <button
              onClick={() => { if (!pokemon.name) setAddingNew(true); setEditingName(true); }}
              className={`text-xs font-semibold text-left hover:text-white truncate w-full ${theme.cardText}`}
            >
              {pokemon.name || <span className={theme.cardEmptyText}>+ Add Pokémon</span>}
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
  const commitActiveName = () => {
    if (addingNew && !pokemon.name.trim()) update({ name: 'Pokémon' });
    setAddingNew(false);
    setEditingName(false);
  };

  return (
    <>
      <div
        {...dragProps}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        className={`flex flex-col gap-0.5 p-1.5 rounded-xl border h-full w-full transition-all cursor-grab active:cursor-grabbing select-none overflow-hidden ${
          isKO ? theme.cardKO : dragOver ? theme.cardDrag : pokemon.name ? theme.cardActive : theme.cardActiveEmpty
        }`}
      >
        {/* Name + Status */}
        {editingName ? (
          <PokemonNameInput
            autoFocus
            value={pokemon.name}
            onChange={name => update({ name })}
            onSelectSuggestion={hp => { if (hp) update({ maxHP: hp, currentDamage: 0 }); }}
            onCommit={commitActiveName}
            placeholder="Pokémon name"
            className="bg-transparent text-xs text-gray-100 outline-none w-full font-semibold"
          />
        ) : (
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => { if (!pokemon.name) setAddingNew(true); setEditingName(true); }}
              className={`text-xs font-semibold text-left hover:text-white truncate flex-1 ${theme.activeText}`}
            >
              {pokemon.name || <span className={theme.activeEmptyText}>+ Active</span>}
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
