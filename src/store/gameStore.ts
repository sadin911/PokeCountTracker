import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, PlayerState, PokemonSlot, PlayerId, SlotKey, EnergyType, StatusCondition } from '../types/game';

function makePokemon(id: string): PokemonSlot {
  return {
    id,
    name: '',
    maxHP: 100,
    currentDamage: 0,
    status: 'none',
    energies: {},
    abilityUsed: false,
    attackUsed: false,
  };
}

function makePlayer(name: string, prefix: string): PlayerState {
  return {
    name,
    activePokemon: makePokemon(`${prefix}-active`),
    bench: [
      makePokemon(`${prefix}-bench-0`),
      makePokemon(`${prefix}-bench-1`),
      makePokemon(`${prefix}-bench-2`),
      makePokemon(`${prefix}-bench-3`),
      makePokemon(`${prefix}-bench-4`),
    ] as PlayerState['bench'],
    supporterUsed: false,
    prizeCards: 6,
  };
}

function initialState(): GameState {
  return {
    player1: makePlayer('Player 1', 'p1'),
    player2: makePlayer('Player 2', 'p2'),
    currentTurn: 'player1',
    turnNumber: 1,
  };
}

function getSlot(player: PlayerState, slot: SlotKey): PokemonSlot {
  return slot === 'active' ? player.activePokemon : player.bench[slot];
}

function setSlot(player: PlayerState, slot: SlotKey, pokemon: PokemonSlot): PlayerState {
  if (slot === 'active') {
    return { ...player, activePokemon: pokemon };
  }
  const bench = [...player.bench] as PlayerState['bench'];
  bench[slot] = pokemon;
  return { ...player, bench };
}

type DisplayMode = 'faceToFace' | 'spectator' | 'landscape';

interface GameStore extends GameState {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;

  // Pokemon mutations
  updatePokemon: (player: PlayerId, slot: SlotKey, changes: Partial<PokemonSlot>) => void;
  setEnergyCount: (player: PlayerId, slot: SlotKey, type: EnergyType, count: number) => void;
  swapSlots: (player: PlayerId, from: SlotKey, to: SlotKey) => void;

  // Player mutations
  toggleSupporter: (player: PlayerId) => void;
  setPrizeCards: (player: PlayerId, count: number) => void;
  setPlayerName: (player: PlayerId, name: string) => void;

  // Turn management
  endTurn: () => void;

  // Game control
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState(),

      displayMode: 'faceToFace' as DisplayMode,
      setDisplayMode: (mode) => set({ displayMode: mode }),

      updatePokemon: (playerId, slot, changes) =>
        set((state) => {
          const player = state[playerId];
          const current = getSlot(player, slot);
          const updated = { ...current, ...changes };
          return { [playerId]: setSlot(player, slot, updated) };
        }),

      setEnergyCount: (playerId, slot, type, count) =>
        set((state) => {
          const player = state[playerId];
          const current = getSlot(player, slot);
          const energies = { ...current.energies };
          if (count <= 0) {
            delete energies[type];
          } else {
            energies[type] = count;
          }
          return { [playerId]: setSlot(player, slot, { ...current, energies }) };
        }),

      swapSlots: (playerId, from, to) =>
        set((state) => {
          const player = state[playerId];
          const fromPokemon = getSlot(player, from);
          const toPokemon = getSlot(player, to);
          let updated = setSlot(player, from, toPokemon);
          updated = setSlot(updated, to, fromPokemon);
          return { [playerId]: updated };
        }),

      toggleSupporter: (playerId) =>
        set((state) => ({
          [playerId]: {
            ...state[playerId],
            supporterUsed: !state[playerId].supporterUsed,
          },
        })),

      setPrizeCards: (playerId, count) =>
        set((state) => ({
          [playerId]: { ...state[playerId], prizeCards: Math.max(0, Math.min(6, count)) },
        })),

      setPlayerName: (playerId, name) =>
        set((state) => ({
          [playerId]: { ...state[playerId], name },
        })),

      endTurn: () =>
        set((state) => {
          const currentPlayerId = state.currentTurn;
          const nextPlayerId: PlayerId = currentPlayerId === 'player1' ? 'player2' : 'player1';
          const currentPlayer = state[currentPlayerId];

          // Reset current player's turn-based toggles and remove Paralysis from their Active
          const resetPokemon = (p: PokemonSlot): PokemonSlot => ({
            ...p,
            abilityUsed: false,
            attackUsed: false,
            status: p.status === 'paralyzed' ? 'none' : p.status,
          });

          const updatedPlayer: PlayerState = {
            ...currentPlayer,
            supporterUsed: false,
            activePokemon: resetPokemon(currentPlayer.activePokemon),
            bench: currentPlayer.bench.map(resetPokemon) as PlayerState['bench'],
          };

          return {
            [currentPlayerId]: updatedPlayer,
            currentTurn: nextPlayerId,
            turnNumber: state.turnNumber + 1,
          };
        }),

      resetGame: () => set(initialState()),
    }),
    {
      name: 'pokecounttracker-game',
      version: 0,
    }
  )
);

// Selectors
export const selectPlayer = (state: GameStore, id: PlayerId) => state[id];
export const selectCurrentTurn = (state: GameStore) => state.currentTurn;
export const selectTurnNumber = (state: GameStore) => state.turnNumber;

// Status condition damage helper
export function getStatusDamage(status: StatusCondition): number {
  if (status === 'poisoned') return 10;
  if (status === 'burned') return 20;
  return 0;
}
