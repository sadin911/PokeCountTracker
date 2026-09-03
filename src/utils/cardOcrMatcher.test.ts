import { describe, it, expect } from 'vitest';
import { matchOcrToCard } from './cardOcrMatcher';

const mockCatalog = [
  {
    id: 'TH-1',
    set: { id: 'SC1a', name: 'Legendary Clash' },
    collectorNumber: '001-154',
    localId: '1',
    name: 'สไตรค์',
  },
  {
    id: 'SV8a-025',
    set: { id: 'SV8a', name: 'Terastal Festival' },
    collectorNumber: '025/187',
    localId: '25',
    name: 'พิคาชู ex',
  },
  {
    id: 'SV-P-001',
    set: { id: 'SV-P', name: 'Promos' },
    collectorNumber: '001',
    localId: '1',
    name: 'พิคาชู โปรโม',
  },
];

describe('cardOcrMatcher', () => {
  it('matches standard set and collector number snippet', () => {
    const text = 'SV8a 025/187';
    const result = matchOcrToCard(text, mockCatalog);
    expect(result.card).toBeDefined();
    expect(result.card?.id).toBe('SV8a-025');
    expect(result.extractedSet).toBe('SV8a');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('matches snippet containing regulation and rarity mark', () => {
    const text = 'SV8a F 025/187 RR';
    const result = matchOcrToCard(text, mockCatalog);
    expect(result.card?.id).toBe('SV8a-025');
  });

  it('matches hyphenated code format', () => {
    const text = 'SC1a-001';
    const result = matchOcrToCard(text, mockCatalog);
    expect(result.card?.id).toBe('TH-1');
  });

  it('extracts card code from noisy footer text', () => {
    const noisyText = '©2024 Pokémon/Nintendo/Creatures/GAME FREAK sv8a 025/187 R illus. 5ban Graphics';
    const result = matchOcrToCard(noisyText, mockCatalog);
    expect(result.card?.id).toBe('SV8a-025');
  });

  it('auto-corrects 5 to S for set code', () => {
    const confusedText = '5V8a 025/187';
    const result = matchOcrToCard(confusedText, mockCatalog);
    expect(result.card?.id).toBe('SV8a-025');
  });

  it('returns null card for irrelevant text', () => {
    const randomText = 'HP 120 Lightning Thunderbolt Attack';
    const result = matchOcrToCard(randomText, mockCatalog);
    expect(result.card).toBeNull();
  });
});
