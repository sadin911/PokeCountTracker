import pokemonCardData from '../data/pokemonNames.json';
import evoDataRaw from '../data/evolutionLines.json';
import { getEnglishCardName } from './searchHelpers';

const evoMap = evoDataRaw as Record<string, string[]>;

export interface EvolutionStep {
  name: string;
  stage: string;
  englishName: string | null;
  cardsCount: number;
  representativeCard: any;
  isCurrent: boolean;
  allCards: any[];
}

const STAGE_ORDER: Record<string, number> = {
  'พื้นฐาน': 1,
  'ร่าง 1': 2,
  'ร่าง 2': 3,
  'ร่างพิเศษ': 4,
};

/**
 * Computes the full evolution chain steps for a given Pokémon card
 */
export function getEvolutionChain(currentCard: any): EvolutionStep[] {
  if (!currentCard || currentCard.category !== 'Pokemon') return [];

  const rawName = (currentCard.name || '').trim();
  const baseName = rawName
    .replace(/(ex|EX|VMAX|VSTAR|V-UNION|V|GX)/g, '')
    .replace(/^(เมก้า|ส่องประกาย|เรเดียนต์|ฮิซุย|กาลาร์|อโลลา|พัลเดีย)\s*/, '')
    .trim();

  // Find all connected names from evoMap
  const relatedNames = new Set<string>();
  relatedNames.add(rawName);
  relatedNames.add(baseName);

  if (evoMap[rawName]) {
    evoMap[rawName].forEach((n) => relatedNames.add(n));
  }
  if (evoMap[baseName]) {
    evoMap[baseName].forEach((n) => relatedNames.add(n));
  }

  // 2-hop search to connect full 3-stage evolutionary lines
  for (const n of Array.from(relatedNames)) {
    if (evoMap[n]) {
      evoMap[n].forEach((sub) => relatedNames.add(sub));
    }
  }

  // Find cards in dataset for each related name
  const allPokemonCards = (pokemonCardData as any[]).filter((c) => c.category === 'Pokemon');
  const stageGroups = new Map<string, EvolutionStep>();

  for (const name of relatedNames) {
    const matching = allPokemonCards.filter((c) => c.name === name || c.name.startsWith(name));
    if (matching.length > 0) {
      // Pick best representative card (prefer cards with stage and high quality image)
      const rep =
        matching.find((c) => c.id === currentCard.id) ||
        matching.find((c) => c.stage && (c.imageUrl || c.imageUrlHigh)) ||
        matching[0];

      const stage =
        rep.stage ||
        (name.includes('ex') || name.includes('V') || name.includes('เมก้า')
          ? 'ร่างพิเศษ'
          : 'พื้นฐาน');

      if (!stageGroups.has(name)) {
        stageGroups.set(name, {
          name,
          stage,
          englishName: getEnglishCardName(rep),
          cardsCount: matching.length,
          representativeCard: rep,
          isCurrent: matching.some((c) => c.id === currentCard.id) || name === rawName,
          allCards: matching,
        });
      }
    }
  }

  // If only 1 step found and it's the card itself, check if there's any stem matches in dataset
  if (stageGroups.size <= 1 && baseName.length >= 4) {
    const stemMatches = allPokemonCards.filter(
      (c) => c.name.includes(baseName) && !stageGroups.has(c.name)
    );
    for (const card of stemMatches) {
      if (!stageGroups.has(card.name)) {
        const matching = allPokemonCards.filter((c) => c.name === card.name);
        stageGroups.set(card.name, {
          name: card.name,
          stage: card.stage || 'ร่างพิเศษ',
          englishName: getEnglishCardName(card),
          cardsCount: matching.length,
          representativeCard: card,
          isCurrent: card.id === currentCard.id,
          allCards: matching,
        });
      }
    }
  }

  const chain = Array.from(stageGroups.values()).sort((a, b) => {
    const orderA = STAGE_ORDER[a.stage] || 5;
    const orderB = STAGE_ORDER[b.stage] || 5;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, 'th');
  });

  return chain;
}
