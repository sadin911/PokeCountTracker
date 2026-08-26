import translations from '../data/pokemonNameTranslations.json';

const pokemonMap: Record<string, string> = translations.pokemon || {};
const trainerMap: Record<string, string> = translations.trainers || {};

function cleanString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[-.:_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface PhraseEntry {
  key: string;
  value: string;
}

const phraseEntries: PhraseEntry[] = [];
for (const [k, v] of Object.entries(pokemonMap)) {
  phraseEntries.push({ key: cleanString(k), value: v });
}
for (const [k, v] of Object.entries(trainerMap)) {
  phraseEntries.push({ key: cleanString(k), value: v });
}
// Sort by longest key first
phraseEntries.sort((a, b) => b.key.length - a.key.length);

// Reverse map: Thai Name -> English Name
const thaiToEnPokemonMap: Record<string, string> = {};
for (const [en, th] of Object.entries(pokemonMap)) {
  thaiToEnPokemonMap[th] = en.charAt(0).toUpperCase() + en.slice(1);
}

const thaiToEnTrainerMap: Record<string, string> = {};
for (const [en, th] of Object.entries(trainerMap)) {
  const titleCase = en
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  thaiToEnTrainerMap[th] = titleCase;
}

// Special suffix / keyword translations
const SUFFIX_MAP: Record<string, string[]> = {
  ex: ['ex'],
  v: ['v'],
  vmax: ['vmax'],
  vstar: ['vstar'],
  gx: ['gx'],
  radiant: ['ส่องประกาย', 'เรเดียนต์'],
  mega: ['เมก้า'],
  m: ['เมก้า'],
  alolan: ['อโลลา'],
  galarian: ['กาลาร์'],
  hisuian: ['ฮิซุย'],
  paldean: ['พัลเดีย'],
  ancient: ['โบราณ'],
  future: ['อนาคต'],
};

/**
 * Extracts candidate translated token groups for a given search query
 */
export function getTranslatedTokenGroups(query: string): string[][] {
  const q = cleanString(query);
  if (!q) return [];

  const rawTokens = q.split(' ').filter(Boolean);
  if (rawTokens.length === 0) return [];

  const candidateGroups: string[][] = [];

  // 1. Sliding window phrase matching on tokens (Length 4 down to 1)
  const mappedTokens: string[] = [];
  let i = 0;
  while (i < rawTokens.length) {
    let matched = false;
    for (let len = Math.min(4, rawTokens.length - i); len >= 1; len--) {
      const phrase = rawTokens.slice(i, i + len).join(' ');
      const found = phraseEntries.find((p) => p.key === phrase);
      if (found) {
        mappedTokens.push(found.value);
        i += len;
        matched = true;
        break;
      }
      if (len === 1 && SUFFIX_MAP[phrase]) {
        mappedTokens.push(SUFFIX_MAP[phrase][0]);
        i += 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      mappedTokens.push(rawTokens[i]);
      i++;
    }
  }

  if (mappedTokens.length > 0) {
    candidateGroups.push(mappedTokens);

    // If radiant was part of tokens, also test alternative 'เรเดียนต์'
    if (mappedTokens.includes('ส่องประกาย')) {
      candidateGroups.push(mappedTokens.map((t) => (t === 'ส่องประกาย' ? 'เรเดียนต์' : t)));
    }
  }

  // 2. Prefix matching for single word (>= 3 chars)
  if (rawTokens.length === 1 && q.length >= 3) {
    for (const { key, value } of phraseEntries) {
      if (key.startsWith(q) || key.includes(q)) {
        candidateGroups.push([value]);
      }
    }
  }

  return candidateGroups;
}

/**
 * Robust Card Search Matcher
 * Matches query against Card Name (Thai & English), Collector Number, Set ID, Set Name.
 */
export function matchesCardSearch(card: any, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;

  const rawClean = cleanString(rawQuery);
  const cardName = cleanString(card.name || '');
  const colNum = cleanString(card.collectorNumber || card.localId || '');
  const setId = cleanString(card.set?.id || '');
  const setName = cleanString(card.set?.name || '');

  // 1. Direct substring match on card attributes
  if (
    cardName.includes(rawClean) ||
    colNum.includes(rawClean) ||
    setId.includes(rawClean) ||
    setName.includes(rawClean)
  ) {
    return true;
  }

  // 2. Translated token sets: check if all tokens in any candidate group are present in cardName
  const candidateTokenGroups = getTranslatedTokenGroups(rawQuery);
  for (const tokenGroup of candidateTokenGroups) {
    if (tokenGroup.length > 0 && tokenGroup.every((t) => cardName.includes(cleanString(t)))) {
      return true;
    }
  }

  return false;
}

/**
 * Returns English translation / Romanized name for display if available
 */
export function getEnglishCardName(card: any): string | null {
  if (!card || !card.name) return null;
  const name = card.name.trim();

  // 1. Direct trainer match
  if (thaiToEnTrainerMap[name]) {
    return thaiToEnTrainerMap[name];
  }

  // 2. Direct Pokemon match
  if (thaiToEnPokemonMap[name]) {
    return thaiToEnPokemonMap[name];
  }

  // 3. Substring match for Pokemon with suffixes like "ex", "VMAX", "VSTAR", "V", "เมก้า"
  const baseName = name
    .replace(/(ex|EX|VMAX|VSTAR|V-UNION|V|GX)/g, '')
    .replace(/^(เมก้า|ส่องประกาย|เรเดียนต์|ฮิซุย|กาลาร์|อโลลา|พัลเดีย)\s*/, '')
    .trim();

  if (thaiToEnPokemonMap[baseName]) {
    const enBase = thaiToEnPokemonMap[baseName];
    let prefix = '';
    if (name.startsWith('เมก้า')) prefix = 'Mega ';
    else if (name.startsWith('ส่องประกาย') || name.startsWith('เรเดียนต์')) prefix = 'Radiant ';
    else if (name.startsWith('ฮิซุย')) prefix = 'Hisuian ';
    else if (name.startsWith('กาลาร์')) prefix = 'Galarian ';
    else if (name.startsWith('อโลลา')) prefix = 'Alolan ';
    else if (name.startsWith('พัลเดีย')) prefix = 'Paldean ';

    let suffix = '';
    if (name.includes('VMAX')) suffix = ' VMAX';
    else if (name.includes('VSTAR')) suffix = ' VSTAR';
    else if (name.includes('ex') || name.includes('EX')) suffix = ' ex';
    else if (name.includes('V-UNION')) suffix = ' V-UNION';
    else if (name.endsWith('V') || name.includes(' V ')) suffix = ' V';
    else if (name.includes('GX')) suffix = ' GX';

    return `${prefix}${enBase}${suffix}`.trim();
  }

  return null;
}
