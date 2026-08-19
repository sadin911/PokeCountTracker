import { useState } from 'react';
import type { PokemonSlot as PokemonSlotType, PlayerId, SlotKey } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { StatusBadge } from '../pokemon/StatusBadge';
import { HPPresetPicker, type CardMatchResult } from '../pokemon/HPPresetPicker';
import { EvolutionModal } from '../pokemon/EvolutionModal';
import { CardImagePreviewModal } from '../pokemon/CardImagePreviewModal';
import { ENERGY_MAP } from '../../constants/energyTypes';
import type { EnergyType } from '../../types/game';

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
  const [showEvoModal, setShowEvoModal] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const addDamage = (amt: number) =>
    update({ currentDamage: Math.max(0, pokemon.currentDamage + amt) });

  const hasCard = pokemon.name !== '';
  const chips = Math.floor(pokemon.currentDamage / 10);
  const currentHP = Math.max(0, pokemon.maxHP - pokemon.currentDamage);
  const isKO = hasCard && pokemon.currentDamage >= pokemon.maxHP && pokemon.maxHP > 0;
  const hpPct = pokemon.maxHP > 0 ? currentHP / pokemon.maxHP : 1;
  const hpColor = hpPct > 0.5 ? 'text-green-400' : hpPct > 0.25 ? 'text-yellow-400' : 'text-red-400';

  const onPickHP = (hp: number, card?: CardMatchResult) => {
    update({
      maxHP: hp,
      currentDamage: 0,
      name: card?.name || (pokemon.name ? pokemon.name : 'Pokémon'),
      imageUrl: card?.imageUrl !== undefined ? card.imageUrl : pokemon.imageUrl,
      officialImageUrl: card?.officialImageUrl !== undefined ? card.officialImageUrl : pokemon.officialImageUrl,
      types: card?.types !== undefined ? card.types : pokemon.types,
    });
    setShowPicker(false);
  };

  const onEvolve = (card: any) => {
    update({
      name: card.name,
      maxHP: card.hp,
      imageUrl: card.imageUrl,
      officialImageUrl: card.officialImageUrl,
      types: card.types,
      status: 'none', // Clears all status conditions upon evolution per TCG rules
      abilityUsed: false,
      attackUsed: false,
    });
    setShowEvoModal(false);
  };

  const firstType = pokemon.types?.[0] as EnergyType | undefined;
  const typeInfo = firstType ? ENERGY_MAP[firstType] : null;

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
                ? 'border-blue-700/50 text-blue-700 active:border-blue-500 active:text-blue-500 hover:bg-blue-950/20'
                : 'border-gray-700/50 text-gray-700 active:border-gray-500 active:text-gray-500 hover:bg-gray-800/20'
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
    ? 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-950/40'
    : isDragSource
      ? 'opacity-50 border-yellow-500 bg-yellow-950/20'
      : isSelected
        ? 'ring-2 ring-yellow-400 border-yellow-500 bg-yellow-950/40'
        : isKO
          ? 'bg-red-950/60 border-red-700'
          : swapMode
            ? 'border-yellow-500/40 bg-yellow-950/20'
            : isActive
              ? 'bg-blue-950/40 border-blue-800/60'
              : 'bg-gray-850/80 border-gray-700/60';

  return (
    <>
      <div className={`relative flex flex-col gap-0.5 p-1 rounded-xl border h-full overflow-hidden transition-all shadow-md group ${borderStyle}`}>
        {/* Subtle background image if card has artwork */}
        {pokemon.imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-top opacity-15 pointer-events-none filter blur-[0.5px]"
            style={{ backgroundImage: `url(${pokemon.imageUrl})` }}
          />
        )}

        {/* Top row: swap + Name/HP + Evolve 🧬 + delete */}
        <div className="relative flex items-center gap-0.5 flex-shrink-0 z-10">
          {/* Swap ⇄ */}
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
                    : 'bg-gray-700/60 text-gray-400 hover:text-gray-200'
            }`}
            title="Drag or tap to swap"
          >⇄</button>

          {/* Name and HP — tap to change */}
          <button
            onClick={() => setShowPicker(true)}
            className="flex-1 text-left min-w-0 overflow-hidden px-0.5 group/btn"
          >
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[9px] font-bold text-gray-200 truncate leading-tight group-hover/btn:text-blue-300">
                {pokemon.name !== 'Pokémon' ? pokemon.name : `${pokemon.maxHP} HP`}
              </span>
              {typeInfo && (
                <span className="text-[8px] flex-shrink-0 leading-none">
                  {typeInfo.emoji}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[8px] font-black text-gray-400 leading-none">
                {pokemon.maxHP} HP
              </span>
              <span className="text-[7px] text-gray-500 leading-none">✎</span>
            </div>
          </button>

          {/* Evolve 🧬 Button */}
          <button
            onClick={() => setShowEvoModal(true)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-purple-950/80 border border-purple-800/80 text-purple-200 text-xs font-bold hover:bg-purple-900 active:scale-90 transition-all shadow-sm"
            title="พัฒนาร่าง (Evolve)"
          >
            🧬
          </button>

          {/* Zoom 🔍 Card Image Button */}
          {pokemon.imageUrl && (
            <button
              onClick={() => setShowZoom(true)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-200 text-xs font-bold hover:bg-blue-900 active:scale-90 transition-all shadow-sm"
              title="ขยายภาพการ์ด (Zoom)"
            >
              🔍
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => clearPokemon(playerId, slot)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-black hover:bg-red-800 active:scale-90 transition-all"
            title="Remove"
          >✕</button>
        </div>

        {/* Damage chips */}
        <div className="relative flex-1 flex flex-wrap gap-0.5 content-start overflow-hidden min-h-0 z-10">
          {chips > 0 && Array.from({ length: Math.min(chips, 24) }).map((_, i) => (
            <button
              key={i}
              onClick={() => addDamage(-10)}
              className="w-3 h-3 rounded-full bg-red-500/90 border border-red-400/50 hover:bg-red-400 active:scale-75 transition-all flex-shrink-0 shadow-sm"
            />
          ))}
          {chips > 24 && (
            <span className="text-[7px] text-red-400 font-black self-center">+{chips - 24}</span>
          )}
        </div>

        {/* Current HP */}
        <div className="relative text-center flex-shrink-0 z-10">
          {isKO ? (
            <span className="text-sm font-black text-red-400 animate-pulse">KO!</span>
          ) : (
            <span className={`text-base font-black font-mono leading-none drop-shadow-sm ${hpColor}`}>
              {currentHP}
            </span>
          )}
        </div>

        {/* Status + ±10 */}
        <div className="relative flex items-center gap-0.5 flex-shrink-0 z-10">
          <StatusBadge status={pokemon.status} onChange={status => update({ status })} compact />
          <button
            onClick={() => addDamage(10)}
            className="flex-1 py-0.5 rounded bg-gray-700/70 border border-gray-600/50 text-red-300 text-[9px] font-black active:scale-95 transition-transform hover:bg-gray-600"
          >−10</button>
          <button
            onClick={() => addDamage(-10)}
            className="flex-1 py-0.5 rounded bg-gray-700/70 border border-gray-600/50 text-green-300 text-[9px] font-black active:scale-95 transition-transform hover:bg-gray-600"
          >+10</button>
        </div>
      </div>

      {showPicker && (
        <HPPresetPicker currentMaxHP={pokemon.maxHP} onSelect={onPickHP} onClose={() => setShowPicker(false)} />
      )}

      {showEvoModal && (
        <EvolutionModal
          pokemon={pokemon}
          onSelectEvolution={onEvolve}
          onClose={() => setShowEvoModal(false)}
        />
      )}

      {showZoom && pokemon.imageUrl && (
        <CardImagePreviewModal
          imageUrl={pokemon.imageUrl}
          officialImageUrl={pokemon.officialImageUrl || null}
          cardName={pokemon.name}
          onClose={() => setShowZoom(false)}
        />
      )}
    </>
  );
}
