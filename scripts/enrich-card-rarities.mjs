import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('src/data/pokemonNames.json', 'utf8'));

// Load TCGdex cards if available
let tcgdex = [];
try {
  tcgdex = JSON.parse(fs.readFileSync('data/pokemon-tcg-th/all_cards.json', 'utf8'));
} catch (e) {}

const tcgMap = new Map();
tcgdex.forEach(c => {
  if (c.rarity) {
    if (c.id) tcgMap.set(c.id, c.rarity);
    if (c.set?.id && c.localId) tcgMap.set(`${c.set.id}-${c.localId}`, c.rarity);
  }
});

export function classifyRarity(card) {
  const name = (card.name || '').trim();
  const setId = (card.set?.id || '').toUpperCase();
  const col = (card.collectorNumber || card.localId || '').toUpperCase();
  const category = card.category || '';

  // 1. Promo Cards
  if (setId.includes('-P') || setId.includes('PROMO') || col.includes('PROMO') || col.startsWith('P-')) {
    return 'PROMO';
  }

  // 2. ACE SPEC
  if (name.includes('ACE SPEC') || name.includes('เอซสเปก') || col.includes('ACE')) {
    return 'ACE_SPEC';
  }

  // 3. Radiant / โปเกมอนส่องประกาย
  if (name.includes('ส่องประกาย') || name.includes('Radiant')) {
    return 'RADIANT';
  }

  // 4. Check explicit TCGdex or collector token
  const tcgR = tcgMap.get(`${card.set?.id}-${card.localId}`) || tcgMap.get(card.id);
  if (tcgR === 'Special illustration rare' || col.includes('SAR')) return 'SAR';
  if (tcgR === 'Illustration rare' || col.includes('AR') || col.includes('CHR')) return 'AR';
  if (tcgR === 'Ultra Rare' || col.includes('MUR') || col.includes('UR')) return 'UR';
  if (col.includes('HR')) return 'UR'; // Group Hyper Rare with Gold / Ultra Rare
  if (col.includes('CSR')) return 'SR';
  if (col.includes('SR')) return 'SR';

  // 5. Secret Rare Range Detection (num > total)
  const match = col.match(/^0*(\d+)[-/]0*(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (num > total) {
      const diff = num - total;

      // Scarlet & Violet era (SV, MA, etc.)
      if (setId.startsWith('SV') || setId.startsWith('MA')) {
        // In SV sets:
        // AR: First batch of secret cards that are regular Pokemon without 'ex'
        if (!name.includes('ex') && !name.includes('EX') && category === 'Pokemon') {
          return 'AR';
        }
        // SR: Full Art Pokemon ex or Supporter Trainer in first SR section
        if (diff > 35 || name.includes('UR') || name.includes('MUR')) {
          return 'UR';
        }
        if (diff > 15) {
          return 'SAR';
        }
        return 'SR';
      }

      // Sword & Shield era (S, SC, SH)
      if (setId.startsWith('S')) {
        if (diff > 25) return 'UR';
        if (diff > 12) return 'UR'; // HR Rainbow
        return 'SR';
      }

      // Sun & Moon (SM, AS)
      if (setId.startsWith('SM') || setId.startsWith('AS')) {
        if (diff > 20) return 'UR';
        return 'SR';
      }

      return 'SR';
    }
  }

  // 6. Base set High Rarity:
  if (name.includes('ex') || name.includes('EX')) return 'EX';
  if (name.includes('VMAX')) return 'VMAX';
  if (name.includes('VSTAR')) return 'VSTAR';
  if (/(?:[\u0E00-\u0E7F]|\s)V(?:$|[\s\(\[\{【])/i.test(name) || name.endsWith('V')) return 'V';

  return 'REGULAR';
}

const breakdown = {};
const enriched = data.map(card => {
  const rarityCode = classifyRarity(card);
  breakdown[rarityCode] = (breakdown[rarityCode] || 0) + 1;
  return {
    ...card,
    rarityCode,
  };
});

console.log('Enriched Breakdown:', breakdown);

fs.writeFileSync('src/data/pokemonNames.json', JSON.stringify(enriched, null, 2), 'utf8');
console.log('Successfully updated src/data/pokemonNames.json with rarityCode!');
