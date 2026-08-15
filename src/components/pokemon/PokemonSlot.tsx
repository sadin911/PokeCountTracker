import { useState, useRef } from 'react';
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
  const { updatePokemon, clearPokemon, setEnergyCount } = useGameStore();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [showHPPicker, setShowHPPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressTriggered = useRef(false);
  const dragProps = useDragSwap(playerId, slot);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const isKO = pokemon.currentDamage >= pokemon.maxHP && pokemon.maxHP > 0;
  const currentHP = Math.max(0, pokemon.maxHP - pokemon.currentDamage);

  // ── Mobile: simplified card, tap → modal, long press → remove ───────────
  if (isMobile) {
    const cardClass = isKO
      ? theme.cardKO
      : variant === 'active'
        ? (pokemon.name ? theme.cardActive : theme.cardActiveEmpty)
        : (pokemon.name ? theme.card : theme.cardEmpty);

    const handleTouchStart = () => {
      longPressTriggered.current = false;
      if (!pokemon.name) return;
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        clearPokemon(playerId, slot);
        navigator.vibrate?.(60);
      }, 600);
    };
    const handleTouchMove = () => clearTimeout(longPressTimer.current);
    const handleTouchEnd = () => clearTimeout(longPressTimer.current);
    const handleClick = () => {
      if (longPressTriggered.current) { longPressTriggered.current = false; return; }
      setShowModal(true);
    };

    return (
      <>
        <button
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!pokemon.name) return;
    e.preventDefault();
    // Adjust so menu doesn't overflow bottom/right edge
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 60);
    setContextMenu({ x, y });
  };

  // Context menu overlay (shared between bench & active)
  const contextMenuEl = contextMenu ? (
    <>
      <div className="fixed inset-0 z-[70]" onClick={() => setContextMenu(null)} onContextMenu={e => { e.preventDefault(); setContextMenu(null); }} />
      <div
        className="fixed z-[71] bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden min-w-[170px]"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-950/60 flex items-center gap-2 transition-colors"
          onClick={() => { clearPokemon(playerId, slot); setContextMenu(null); }}
        >
          <span className="text-xs">✕</span> Remove Pokémon
        </button>
      </div>
    </>
  ) : null;

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
          onContextMenu={handleContextMenu}
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
        {contextMenuEl}
      </>
    );
  }

  // Active slot
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
        onContextMenu={handleContextMenu}
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
      {contextMenuEl}
    </>
  );
}
