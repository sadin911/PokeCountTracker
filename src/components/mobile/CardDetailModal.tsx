import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PlayerId, SlotKey, PokemonSlot as PokemonSlotType, EnergyType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { HPPresetPicker } from '../pokemon/HPPresetPicker';
import { PokemonNameInput } from '../pokemon/PokemonNameInput';
import { EnergyTracker } from '../pokemon/EnergyTracker';
import { AbilityTracker } from '../pokemon/AbilityTracker';
import { STATUS_INFO, STATUS_ORDER } from '../../constants/statusConditions';

interface Props {
  pokemon: PokemonSlotType;
  playerId: PlayerId;
  slot: SlotKey;
  onClose: () => void;
}

export function CardDetailModal({ pokemon, playerId, slot, onClose }: Props) {
  const { updatePokemon, setEnergyCount } = useGameStore();
  const [showHPPicker, setShowHPPicker] = useState(false);
  const [editingName, setEditingName] = useState(!pokemon.name);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const addDamage = (amt: number) =>
    update({ currentDamage: Math.max(0, pokemon.currentDamage + amt) });

  const currentHP = Math.max(0, pokemon.maxHP - pokemon.currentDamage);
  const isKO = pokemon.currentDamage >= pokemon.maxHP && pokemon.maxHP > 0;
  const hpPct = pokemon.maxHP > 0 ? Math.max(0, (currentHP / pokemon.maxHP) * 100) : 100;
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444';
  const slotLabel = slot === 'active' ? 'Active' : `Bench ${(slot as number) + 1}`;
  const playerLabel = playerId === 'player1' ? 'P1' : 'P2';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="relative bg-gray-900 rounded-t-3xl max-h-[92dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <PokemonNameInput
                autoFocus
                value={pokemon.name}
                onChange={name => update({ name })}
                onSelectSuggestion={hp => { if (hp) update({ maxHP: hp, currentDamage: 0 }); }}
                onCommit={() => { if (pokemon.name.trim()) setEditingName(false); }}
                placeholder="Enter Pokémon name…"
                className="bg-gray-800 text-white text-lg font-bold outline-none rounded-xl px-3 py-2 w-full"
              />
            ) : (
              <button onClick={() => setEditingName(true)} className="text-left w-full">
                <div className="text-white font-bold text-lg leading-tight truncate">{pokemon.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">{playerLabel} · {slotLabel} — tap to rename</div>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-800 text-gray-400 text-lg font-bold hover:text-white active:bg-gray-700"
          >✕</button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">

          {/* HP */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">HP</span>
              <button
                onClick={() => setShowHPPicker(true)}
                className="text-xs text-gray-400 border border-gray-700 rounded-lg px-2.5 py-1.5 hover:text-white hover:border-gray-500 active:bg-gray-800"
              >
                Max {pokemon.maxHP} ✎
              </button>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${hpPct}%`, background: hpColor }}
              />
            </div>
            <div className="flex justify-between items-baseline">
              <span className={`font-black text-2xl ${isKO ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {isKO ? 'KO!' : `${currentHP} HP`}
              </span>
              <span className="text-gray-600 font-mono text-sm">{pokemon.currentDamage} dmg taken</span>
            </div>
          </div>

          {/* Damage counter */}
          {pokemon.name && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Damage</div>
              {/* Primary ±10 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={() => addDamage(-10)}
                  className="py-5 rounded-2xl bg-red-950/60 border border-red-800/50 text-red-300 text-2xl font-black active:scale-95 transition-transform"
                >−10</button>
                <button
                  onClick={() => addDamage(10)}
                  className="py-5 rounded-2xl bg-green-950/60 border border-green-800/50 text-green-300 text-2xl font-black active:scale-95 transition-transform"
                >+10</button>
              </div>
              {/* Quick adds */}
              <div className="grid grid-cols-6 gap-2">
                {[-90, -60, -30, 30, 60, 90].map(amt => (
                  <button
                    key={amt}
                    onClick={() => addDamage(amt)}
                    className={`py-3 rounded-xl border text-xs font-bold active:scale-95 transition-transform ${
                      amt < 0
                        ? 'bg-gray-800/80 border-red-900/50 text-red-400'
                        : 'bg-gray-800/80 border-green-900/50 text-green-400'
                    }`}
                  >{amt > 0 ? `+${amt}` : amt}</button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          {pokemon.name && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Status Condition</div>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_ORDER.map(cond => {
                  const si = STATUS_INFO[cond];
                  const active = pokemon.status === cond;
                  return (
                    <button
                      key={cond}
                      onClick={() => update({ status: cond })}
                      className={`py-4 rounded-2xl border flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                        active
                          ? `${si.bgColor} ${si.borderColor} ${si.color} shadow-lg`
                          : 'bg-gray-800/60 border-gray-700 text-gray-500'
                      }`}
                    >
                      <span className="text-2xl leading-none">{si.emoji}</span>
                      <span className="text-[11px] font-bold">{si.label}</span>
                    </button>
                  );
                })}
              </div>
              {pokemon.status !== 'none' && (
                <p className="text-[11px] text-gray-500 mt-2 px-1">{STATUS_INFO[pokemon.status].rule}</p>
              )}
            </div>
          )}

          {/* Energy */}
          {pokemon.name && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Energy</div>
              <EnergyTracker
                energies={pokemon.energies}
                onUpdate={(type: EnergyType, count: number) => setEnergyCount(playerId, slot, type, count)}
                compact
              />
            </div>
          )}

          {/* Ability / Attack */}
          {pokemon.name && (
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Actions</div>
              <AbilityTracker
                abilityUsed={pokemon.abilityUsed}
                attackUsed={pokemon.attackUsed}
                onToggleAbility={() => update({ abilityUsed: !pokemon.abilityUsed })}
                onToggleAttack={() => update({ attackUsed: !pokemon.attackUsed })}
              />
            </div>
          )}

          {/* Safe area bottom pad */}
          <div className="h-6" />
        </div>
      </motion.div>

      {showHPPicker && (
        <HPPresetPicker
          currentMaxHP={pokemon.maxHP}
          onSelect={hp => { update({ maxHP: hp, currentDamage: 0 }); setShowHPPicker(false); }}
          onClose={() => setShowHPPicker(false)}
        />
      )}
    </div>
  );
}
