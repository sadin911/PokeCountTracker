import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerId } from '../types/game';

export interface LorcanaPlayer {
  name: string;
  lore: number;
  inkwell: number;
  inkPlayed: boolean;
}

interface LorcanaState {
  lp1: LorcanaPlayer;
  lp2: LorcanaPlayer;
  lCurrentTurn: PlayerId;
  lTurnNumber: number;
}

interface LorcanaStore extends LorcanaState {
  lSetName: (player: PlayerId, name: string) => void;
  lSetLore: (player: PlayerId, count: number) => void;
  lSetInkwell: (player: PlayerId, count: number) => void;
  lToggleInkPlayed: (player: PlayerId) => void;
  lEndTurn: () => void;
  lReset: () => void;
}

function makePlayer(name: string): LorcanaPlayer {
  return { name, lore: 0, inkwell: 0, inkPlayed: false };
}

function initialState(): LorcanaState {
  return {
    lp1: makePlayer('Player 1'),
    lp2: makePlayer('Player 2'),
    lCurrentTurn: 'player1',
    lTurnNumber: 1,
  };
}

function lp(state: LorcanaStore, id: PlayerId): LorcanaPlayer {
  return id === 'player1' ? state.lp1 : state.lp2;
}

function lpKey(id: PlayerId): 'lp1' | 'lp2' {
  return id === 'player1' ? 'lp1' : 'lp2';
}

export const useLorcanaStore = create<LorcanaStore>()(
  persist(
    (set) => ({
      ...initialState(),

      lSetName: (id, name) =>
        set((s) => ({ [lpKey(id)]: { ...lp(s, id), name } })),

      lSetLore: (id, count) =>
        set((s) => ({ [lpKey(id)]: { ...lp(s, id), lore: Math.max(0, Math.min(20, count)) } })),

      lSetInkwell: (id, count) =>
        set((s) => ({ [lpKey(id)]: { ...lp(s, id), inkwell: Math.max(0, count) } })),

      lToggleInkPlayed: (id) =>
        set((s) => ({ [lpKey(id)]: { ...lp(s, id), inkPlayed: !lp(s, id).inkPlayed } })),

      lEndTurn: () =>
        set((s) => {
          const cur = s.lCurrentTurn;
          const next: PlayerId = cur === 'player1' ? 'player2' : 'player1';
          return {
            [lpKey(cur)]: { ...lp(s, cur), inkPlayed: false },
            lCurrentTurn: next,
            lTurnNumber: s.lTurnNumber + 1,
          };
        }),

      lReset: () => set(initialState()),
    }),
    {
      name: 'lorcana-tracker-game',
      version: 1,
    }
  )
);
