import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'https://api.tcgdex.net/v2/th';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function runBatch(tasks, concurrency = 6) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = await Promise.allSettled(tasks.slice(i, i + concurrency).map(fn => fn()));
    results.push(...batch);
  }
  return results;
}

async function main() {
  console.log('Fetching Thai set list from TCGdex...');
  const sets = await fetchJSON(`${BASE}/sets`);
  console.log(`Found ${sets.length} sets`);

  const names = new Set();
  let populated = 0;

  const tasks = sets.map(set => async () => {
    try {
      const data = await fetchJSON(`${BASE}/sets/${set.id}`);
      if (data.cards && data.cards.length > 0) {
        data.cards.forEach(card => { if (card.name) names.add(card.name.trim()); });
        populated++;
        process.stdout.write(`\r  ${populated} sets done, ${names.size} unique names...`);
      }
    } catch {
      // skip unavailable sets
    }
  });

  await runBatch(tasks, 6);
  console.log(`\nTotal: ${names.size} unique Thai card names from ${populated} sets`);

  const sorted = Array.from(names).sort((a, b) => a.localeCompare(b, 'th'));

  mkdirSync('./src/data', { recursive: true });
  writeFileSync('./src/data/pokemonNames.json', JSON.stringify(sorted));
  console.log('Saved → src/data/pokemonNames.json');
}

main().catch(err => { console.error(err); process.exit(1); });
