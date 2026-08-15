import type { StatusCondition } from '../types/game';

export interface StatusInfo {
  condition: StatusCondition;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  rule: string;
}

export const STATUS_INFO: Record<StatusCondition, StatusInfo> = {
  none:       { condition: 'none',       label: 'OK',        emoji: '✅', color: 'text-gray-400',   bgColor: 'bg-gray-700',    borderColor: 'border-gray-600',   rule: '' },
  poisoned:   { condition: 'poisoned',   label: 'Poisoned',  emoji: '☠️', color: 'text-purple-300', bgColor: 'bg-purple-900',  borderColor: 'border-purple-500', rule: 'Place 1 damage counter (10 dmg) between each turn.' },
  burned:     { condition: 'burned',     label: 'Burned',    emoji: '🔥', color: 'text-orange-300', bgColor: 'bg-orange-900',  borderColor: 'border-orange-500', rule: 'Place 2 damage counters (20 dmg) between each turn. Flip — heads: remove Burned.' },
  asleep:     { condition: 'asleep',     label: 'Asleep',    emoji: '💤', color: 'text-blue-300',   bgColor: 'bg-blue-900',    borderColor: 'border-blue-500',   rule: 'Cannot attack or retreat. Flip between turns — heads: wake up.' },
  paralyzed:  { condition: 'paralyzed',  label: 'Paralyzed', emoji: '⚡', color: 'text-yellow-300', bgColor: 'bg-yellow-900',  borderColor: 'border-yellow-500', rule: 'Cannot attack or retreat. Auto-removed at end of Paralyzed player\'s turn.' },
  confused:   { condition: 'confused',   label: 'Confused',  emoji: '😵', color: 'text-pink-300',   bgColor: 'bg-pink-900',    borderColor: 'border-pink-500',   rule: 'To attack: flip — tails: 30 dmg to own Active, attack fails.' },
};

export const STATUS_ORDER: StatusCondition[] = [
  'none', 'poisoned', 'burned', 'asleep', 'paralyzed', 'confused'
];
