import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cards = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/pokemonNames.json'), 'utf8'));
const hrCards = cards.filter(c => c.rarityCode === 'HR');

console.log(`Found ${hrCards.length} HR cards:`);
hrCards.slice(0, 10).forEach(c => {
  console.log({
    id: c.id,
    name: c.name,
    set: c.set?.id,
    col: c.collectorNumber,
    imageUrl: c.imageUrl,
    officialImageUrl: c.officialImageUrl,
  });
});
