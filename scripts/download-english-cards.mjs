// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'data', 'pokemonCardsEn.json');
const SETS_OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'data', 'pokemonSetsEn.json');

const SET_IDS = [
  // Scarlet & Violet era (Standard Legal G, H, I)
  'sv1', 'sv2', 'sv3', 'sv3pt5', 'sv4', 'sv4pt5', 'sv5', 'sv6', 'sv6pt5', 'sv7', 'sv8', 'sv8pt5', 'sv9', 'sv10', 'sve', 'svp',
  // Sword & Shield era (D, E, F)
  'swsh1', 'swsh2', 'swsh3', 'swsh35', 'swsh4', 'swsh45', 'swsh45sv', 'swsh5', 'swsh6', 'swsh7', 'swsh8',
  'swsh9', 'swsh9tg', 'swsh10', 'swsh10tg', 'swsh11', 'swsh11tg', 'swsh12', 'swsh12tg', 'swsh12pt5', 'swsh12pt5gg', 'swshp'
];

const RAW_BASE_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function main() {
  console.log(`[EN-Cards] Fetching English sets metadata...`);
  const allSets = await fetchJson(`${RAW_BASE_URL}/sets/en.json`);
  const targetSetMap = new Map(allSets.map(s => [s.id, s]));

  const validSets = SET_IDS.map(id => targetSetMap.get(id)).filter(Boolean);
  await fs.writeFile(SETS_OUTPUT_FILE, JSON.stringify(validSets, null, 2), 'utf-8');
  console.log(`[EN-Cards] Saved ${validSets.length} sets metadata to ${SETS_OUTPUT_FILE}`);

  console.log(`[EN-Cards] Downloading cards for ${SET_IDS.length} sets...`);
  const allCards = [];

  for (const setId of SET_IDS) {
    const setMeta = targetSetMap.get(setId) || { id: setId, name: setId };
    const url = `${RAW_BASE_URL}/cards/en/${setId}.json`;
    try {
      console.log(` -> Fetching ${setId} (${setMeta.name})...`);
      const cards = await fetchJson(url);
      
      const normalized = cards.map(c => {
        const hpNum = c.hp ? parseInt(c.hp, 10) : undefined;
        const category = c.supertype === 'Pokémon' ? 'Pokemon' : c.supertype;
        const stage = c.subtypes?.[0] || 'Basic';
        return {
          id: `EN-${c.id}`,
          rawId: c.id,
          localId: c.number,
          name: c.name,
          supertype: c.supertype,
          category,
          stage,
          subtypes: c.subtypes || [],
          hp: isNaN(hpNum) ? undefined : hpNum,
          types: c.types || [],
          set: {
            id: setId,
            name: setMeta.name || setId,
            series: setMeta.series || 'Scarlet & Violet',
            releaseDate: setMeta.releaseDate || ''
          },
          collectorNumber: `${c.number}/${setMeta.printedTotal || setMeta.total || ''}`,
          regulationMark: c.regulationMark || '',
          rarity: c.rarity || 'Common',
          imageUrl: c.images?.small || c.images?.large || '',
          imageUrlHigh: c.images?.large || c.images?.small || '',
          artist: c.artist || ''
        };
      });

      allCards.push(...normalized);
      console.log(`    ✓ ${setId}: ${normalized.length} cards`);
    } catch (err) {
      console.warn(`    ⚠️ Failed to fetch ${setId}: ${err.message}`);
    }
  }

  console.log(`[EN-Cards] Total English cards collected: ${allCards.length}`);
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allCards, null, 2), 'utf-8');
  console.log(`[EN-Cards] Saved normalized cards to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
