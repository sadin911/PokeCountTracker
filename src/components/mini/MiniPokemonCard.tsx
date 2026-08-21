import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { PokemonSlot as PokemonSlotType, PlayerId, SlotKey } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { HPPresetPicker } from '../pokemon/HPPresetPicker';

interface Props { pokemon: PokemonSlotType; playerId: PlayerId; slot: SlotKey; isActive?: boolean; }

export function MiniPokemonCard({ pokemon, playerId, slot, isActive }: Props) {
  const { updatePokemon, clearPokemon } = useGameStore();
  const [showPicker, setShowPicker] = useState(false);

  const update = (changes: Partial<PokemonSlotType>) => updatePokemon(playerId, slot, changes);
  const addDamage = (amt: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, pokemon.currentDamage + amt);
    if (next >= pokemon.maxHP && pokemon.maxHP > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    update({ currentDamage: next });
  };

  const currentHP = Math.max(0, pokemon.maxHP - pokemon.currentDamage);
  const isKO = pokemon.name !== '' && pokemon.currentDamage >= pokemon.maxHP;
  const hpPct = pokemon.maxHP > 0 ? currentHP / pokemon.maxHP : 1;
  const hpColor = hpPct > 0.5 ? 'text-green-400' : hpPct > 0.25 ? 'text-yellow-400' : 'text-red-400';

  if (pokemon.name === '') {
    return (
      <>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className={`flex-1 items-center justify-center rounded-xl border border-dashed ${isActive ? 'border-blue-700/50' : 'border-gray-700/50'}`}
        >
          <Text className="text-lg">{isActive ? '⚔' : '+'}</Text>
          <Text className="text-xs text-gray-600 font-bold">Set HP</Text>
        </TouchableOpacity>
        {showPicker && (
          <HPPresetPicker
            currentMaxHP={0}
            onSelect={(hp) => { update({ maxHP: hp, currentDamage: 0, name: 'Pokémon' }); setShowPicker(false); }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <View className={`flex-1 rounded-xl border p-1 gap-0.5 ${isKO ? 'bg-red-950/50 border-red-700' : isActive ? 'bg-blue-950/30 border-blue-800/50' : 'bg-gray-800/40 border-gray-700/50'}`}>
        {/* HP label + delete */}
        <View className="flex-row items-center gap-0.5">
          <TouchableOpacity onPress={() => setShowPicker(true)} className="flex-1">
            <Text className="text-xs font-black text-gray-300">{pokemon.maxHP}<Text className="text-xs font-normal text-gray-600"> HP</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => clearPokemon(playerId, slot)} className="w-5 h-5 rounded bg-red-900/70 items-center justify-center">
            <Text className="text-red-300 text-xs font-black">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Current HP */}
        <View className="flex-1 items-center justify-center">
          {isKO
            ? <Text className="text-sm font-black text-red-400">KO!</Text>
            : <Text className={`text-base font-black font-mono ${hpColor}`}>{currentHP}</Text>
          }
        </View>

        {/* ±10 */}
        <View className="flex-row gap-0.5">
          <TouchableOpacity onPress={() => addDamage(10)} className="flex-1 py-0.5 rounded bg-gray-700/60 items-center">
            <Text className="text-red-300 text-xs font-black">−10</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addDamage(-10)} className="flex-1 py-0.5 rounded bg-gray-700/60 items-center">
            <Text className="text-green-300 text-xs font-black">+10</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showPicker && (
        <HPPresetPicker
          currentMaxHP={pokemon.maxHP}
          onSelect={(hp) => { update({ maxHP: hp, currentDamage: 0 }); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
