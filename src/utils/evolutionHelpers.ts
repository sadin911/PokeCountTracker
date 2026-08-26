import pokemonCardData from '../data/pokemonNames.json';
import evoDataRaw from '../data/evolutionLines.json';
import translations from '../data/pokemonNameTranslations.json';
import { getEnglishCardName } from './searchHelpers';

const evoMap = evoDataRaw as Record<string, string[]>;
const thToEnPokemon: Record<string, string> = {};
for (const [en, th] of Object.entries(translations.pokemon || {})) {
  thToEnPokemon[th] = en.charAt(0).toUpperCase() + en.slice(1);
}

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

function cleanThaiStem(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[ก-ฮ]์/g, '') // remove consonant + thanthakhat (e.g. ร์, ท์, ซ์)
    .replace(/[์็่้๊๋]/g, '') // remove stray tone marks
    .replace(/\s+/g, '')
    .trim();
}

function getEnglishNameForPokemon(name: string): string | null {
  if (thToEnPokemon[name]) return thToEnPokemon[name];
  const base = name
    .replace(/(ex|EX|VMAX|VSTAR|V-UNION|V|GX)/g, '')
    .replace(/^(เมก้า|ส่องประกาย|เรเดียนต์|ฮิซุย|กาลาร์|อโลลา|พัลเดีย)\s*/, '')
    .trim();
  if (thToEnPokemon[base]) return thToEnPokemon[base];

  const stem = cleanThaiStem(base || name);
  for (const [th, en] of Object.entries(thToEnPokemon)) {
    if (cleanThaiStem(th) === stem) return en;
  }
  return null;
}

/**
 * Computes the deduplicated evolution chain steps for a given Pokémon card
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
  const speciesMap = new Map<string, {
    name: string;
    stage: string;
    englishName: string | null;
    cardsCount: number;
    representativeCard: any;
    allCards: any[];
  }>();

  for (const name of relatedNames) {
    const matching = allPokemonCards.filter((c) => c.name === name);
    if (matching.length === 0) continue;

    // Pick best representative card
    const rep =
      matching.find((c) => c.id === currentCard.id) ||
      matching.find((c) => c.stage && (c.imageUrl || c.imageUrlHigh)) ||
      matching[0];

    const stage =
      rep.stage ||
      (name.includes('ex') || name.includes('V') || name.includes('เมก้า')
        ? 'ร่างพิเศษ'
        : 'พื้นฐาน');

    const enName = getEnglishNameForPokemon(name) || getEnglishCardName(rep) || cleanThaiStem(name);
    const formType = name.includes('ex')
      ? 'ex'
      : name.includes('VMAX')
      ? 'vmax'
      : name.includes('เมก้า')
      ? 'mega'
      : 'base';

    const groupKey = `${cleanThaiStem(enName)}_${stage}_${formType}`;

    if (speciesMap.has(groupKey)) {
      const existing = speciesMap.get(groupKey)!;
      existing.allCards.push(...matching);
      existing.cardsCount = existing.allCards.length;
      // Prefer current card's name and representative if it matches this group
      if (matching.some((c) => c.id === currentCard.id) || name === rawName) {
        existing.name = name;
        existing.representativeCard = rep;
      }
    } else {
      speciesMap.set(groupKey, {
        name,
        stage,
        englishName: getEnglishNameForPokemon(name) || getEnglishCardName(rep),
        cardsCount: matching.length,
        representativeCard: rep,
        allCards: [...matching],
      });
    }
  }

  // If only 1 step found and it's the card itself, check if there's any stem matches in dataset
  if (speciesMap.size <= 1 && baseName.length >= 4) {
    const stemMatches = allPokemonCards.filter(
      (c) => c.name.includes(baseName)
    );
    for (const card of stemMatches) {
      const enName = getEnglishNameForPokemon(card.name) || cleanThaiStem(card.name);
      const stage = card.stage || 'ร่างพิเศษ';
      const formType = card.name.includes('ex') ? 'ex' : 'base';
      const groupKey = `${cleanThaiStem(enName)}_${stage}_${formType}`;

      if (!speciesMap.has(groupKey)) {
        const matching = allPokemonCards.filter((c) => c.name === card.name);
        speciesMap.set(groupKey, {
          name: card.name,
          stage,
          englishName: getEnglishNameForPokemon(card.name) || getEnglishCardName(card),
          cardsCount: matching.length,
          representativeCard: card,
          allCards: matching,
        });
      }
    }
  }

  const chain = Array.from(speciesMap.values()).sort((a, b) => {
    const orderA = STAGE_ORDER[a.stage] || 5;
    const orderB = STAGE_ORDER[b.stage] || 5;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, 'th');
  });

  // Calculate isCurrent strictly: Exactly ONE step is active!
  let activeIndex = chain.findIndex((step) =>
    step.allCards.some((c) => c.id === currentCard.id)
  );

  if (activeIndex === -1) {
    activeIndex = chain.findIndex(
      (step) =>
        step.name === rawName ||
        cleanThaiStem(step.name) === cleanThaiStem(rawName)
    );
  }

  return chain.map((step, idx) => ({
    ...step,
    isCurrent: idx === activeIndex,
  }));
}
