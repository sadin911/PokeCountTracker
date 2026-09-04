// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const THAI_CARDS_FILE = path.join(ROOT_DIR, 'src', 'data', 'pokemonNames.json');
const EN_CARDS_FILE = path.join(ROOT_DIR, 'src', 'data', 'pokemonCardsEn.json');
const TRANSLATIONS_FILE = path.join(ROOT_DIR, 'src', 'data', 'pokemonNameTranslations.json');
const OUTPUT_MAP_FILE = path.join(ROOT_DIR, 'src', 'data', 'thaiEnglishCardMap.json');

// Extended Dictionary for Trainer & Energy cards
const TRAINER_TRANSLATIONS = {
  "คำสั่งของบอส": "Boss's Orders",
  "ไอโอโน": "Iono",
  "นันจาโม": "Iono",
  "เพพเพอร์": "Arven",
  "ศุภโชคของศาสตราจารย์โอลิม": "Professor Sada's Vitality",
  "การวิจัยของศาสตราจารย์": "Professor's Research",
  "เนสต์บอล": "Nest Ball",
  "ไฮเปอร์บอล": "Ultra Ball",
  "บัดดี้โปฟฟิน": "Buddy-Buddy Poffin",
  "โปฟฟินเพื่อนรัก": "Buddy-Buddy Poffin",
  "ไพรม์แคตเชอร์": "Prime Catcher",
  "เคาน์เตอร์แคตเชอร์": "Counter Catcher",
  "สวิตช์": "Switch",
  "ลูกอมประหลาด": "Rare Candy",
  "ซูเปอร์เบ็ด": "Super Rod",
  "เชือกสลับตัว": "Escape Rope",
  "โปเกสต็อป": "PokéStop",
  "เรือแคนูซุปเปอร์สคูป": "Super Scoop Up",
  "เข็มขัดผู้กล้า": "Hero's Cape",
  "เครื่องยึดเกาะสูงสุด": "Maximum Belt",
  "หมวกกันกระทบ": "Rigid Band",
  "กลองปลุกใจ": "Awakening Drum",
  "ไซเฟอร์มาเนียก": "Ciphermaniac's Codebreaking",
  "เซวาสเทียน": "Salvatore",
  "เอริกะ": "Erika's Invitation",
  "เคียรา": "Kieran",
  "คาร์ไมน์": "Carmine",
  "บริอาห์": "Briar",
  "เทราปาโกส": "Terapagos",
  "อัจฉริยะ": "Night Stretcher",
  "สายยืดหยุ่นยามค่ำคืน": "Night Stretcher",
  "แก้วล้ำค่า": "Earthen Vessel",
  "ภาชนะดินเผา": "Earthen Vessel",
  "ถังน้ำอเนกประสงค์": "Capacious Bucket",
  "เกลือทะเลบำบัด": "Ancient Booster Energy Capsule",
  "แคปซูลเสริมกำลังอดีต": "Ancient Booster Energy Capsule",
  "แคปซูลเสริมกำลังอนาคต": "Future Booster Energy Capsule"
};

function normalizeText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  console.log('[Matcher] Loading datasets...');
  const thaiCards = JSON.parse(await fs.readFile(THAI_CARDS_FILE, 'utf-8'));
  const enCards = JSON.parse(await fs.readFile(EN_CARDS_FILE, 'utf-8'));
  const translationsData = JSON.parse(await fs.readFile(TRANSLATIONS_FILE, 'utf-8'));

  // Build reverse lookup: Thai Pokemon name -> English name
  const thaiToEnName = new Map();
  if (translationsData?.pokemon) {
    for (const [enName, thName] of Object.entries(translationsData.pokemon)) {
      thaiToEnName.set(thName.trim(), enName.trim());
    }
  }

  // Pre-index English cards for fast multi-index searching
  // Map by: normName -> array of cards
  const enByName = new Map();
  // Map by: normName + normRegMark -> array of cards
  const enByNameAndReg = new Map();
  // Map by: normName + hp + type -> array of cards
  const enBySpec = new Map();

  for (const card of enCards) {
    const norm = normalizeText(card.name);
    if (!enByName.has(norm)) enByName.set(norm, []);
    enByName.get(norm).push(card);

    const regKey = `${norm}_${card.regulationMark || ''}`;
    if (!enByNameAndReg.has(regKey)) enByNameAndReg.set(regKey, []);
    enByNameAndReg.get(regKey).push(card);

    const typeStr = (card.types || []).sort().join('-');
    const specKey = `${norm}_${card.hp || 0}_${typeStr}`;
    if (!enBySpec.has(specKey)) enBySpec.set(specKey, []);
    enBySpec.get(specKey).push(card);
  }

  console.log(`[Matcher] Pre-indexed ${enCards.length} English cards. Matching ${thaiCards.length} Thai cards...`);

  const resultMap = {};
  let matchCount = 0;
  let highConfCount = 0;

  for (const thCard of thaiCards) {
    const thName = thCard.name || '';
    
    // Find expected English name candidate
    let expectedEnName = '';
    let isSpecialVariant = false;
    let suffix = '';

    if (thName.includes(' ex')) {
      suffix = ' ex';
      isSpecialVariant = true;
    } else if (thName.includes(' VSTAR')) {
      suffix = ' VSTAR';
      isSpecialVariant = true;
    } else if (thName.includes(' VMAX')) {
      suffix = ' VMAX';
      isSpecialVariant = true;
    } else if (thName.includes(' V')) {
      suffix = ' V';
      isSpecialVariant = true;
    } else if (thName.includes(' คากายากุ') || thName.includes('เปล่งประกาย')) {
      suffix = ' Radiant';
      isSpecialVariant = true;
    }

    const cleanThBase = thName
      .replace(/ ex/g, '')
      .replace(/ VSTAR/g, '')
      .replace(/ VMAX/g, '')
      .replace(/ V/g, '')
      .replace(/ คากายากุ/g, '')
      .replace(/เปล่งประกาย/g, '')
      .trim();

    if (TRAINER_TRANSLATIONS[cleanThBase] || TRAINER_TRANSLATIONS[thName]) {
      expectedEnName = TRAINER_TRANSLATIONS[thName] || TRAINER_TRANSLATIONS[cleanThBase];
    } else if (thaiToEnName.has(cleanThBase)) {
      const enBase = thaiToEnName.get(cleanThBase);
      expectedEnName = suffix.includes('Radiant') 
        ? `Radiant ${enBase}` 
        : `${enBase}${suffix}`;
    }

    if (!expectedEnName) {
      // Direct phonetic / english letters in Thai card name
      const enLetters = thName.match(/[a-zA-Z]+/g);
      if (enLetters && enLetters.join(' ').length > 3) {
        expectedEnName = enLetters.join(' ');
      }
    }

    if (!expectedEnName) {
      continue;
    }

    const normExpected = normalizeText(expectedEnName);
    const thReg = thCard.regulationMark || '';
    const thHp = thCard.hp || 0;
    const thTypeStr = (thCard.types || []).sort().join('-');
    const thRarity = thCard.rarityCode || 'REGULAR';

    // Candidate lookup strategies
    let candidates = enByNameAndReg.get(`${normExpected}_${thReg}`) || [];
    if (candidates.length === 0) {
      candidates = enByName.get(normExpected) || [];
    }

    if (candidates.length === 0) {
      continue;
    }

    // Score candidates
    let bestCandidate = null;
    let highestScore = -1;

    for (const en of candidates) {
      let score = 50; // base score for name match

      // Regulation mark match
      if (thReg && en.regulationMark === thReg) {
        score += 20;
      }

      // HP match
      if (thHp && en.hp === thHp) {
        score += 15;
      }

      // Type match
      const enTypeStr = (en.types || []).sort().join('-');
      if (thTypeStr && enTypeStr === thTypeStr) {
        score += 10;
      }

      // Category / Supertype match
      if (thCard.category && en.category && thCard.category === en.category) {
        score += 5;
      }

      // Rarity alignment: AR / SAR / UR
      const enRarity = (en.rarity || '').toUpperCase();
      if ((thRarity === 'SAR' || thRarity === 'SR') && (enRarity.includes('SPECIAL') || enRarity.includes('ULTRA') || enRarity.includes('ILLUSTRATION'))) {
        score += 10;
      } else if (thRarity === 'AR' && enRarity.includes('ILLUSTRATION')) {
        score += 10;
      } else if (thRarity === 'UR' && (enRarity.includes('HYPER') || enRarity.includes('GOLD'))) {
        score += 10;
      } else if (thRarity === 'REGULAR' && (enRarity.includes('COMMON') || enRarity.includes('UNCOMMON') || enRarity.includes('RARE') || enRarity.includes('DOUBLE'))) {
        score += 5;
      }

      if (score > highestScore) {
        highestScore = score;
        bestCandidate = en;
      }
    }

    if (bestCandidate && highestScore >= 60) {
      const confidence = Math.min(100, Math.round(highestScore));
      resultMap[thCard.id] = {
        enCardId: bestCandidate.id,
        enName: bestCandidate.name,
        enSetId: bestCandidate.set.id,
        enSetName: bestCandidate.set.name,
        enNumber: bestCandidate.localId,
        enImageUrl: bestCandidate.imageUrl,
        confidence,
        matchMethod: 'hybrid_cv_heuristic',
        verified: confidence >= 95,
        matchedAt: new Date().toISOString()
      };
      matchCount++;
      if (confidence >= 85) highConfCount++;
    }
  }

  console.log(`[Matcher] Successfully matched ${matchCount} Thai cards!`);
  console.log(`          High confidence (>= 85%): ${highConfCount} cards`);

  await fs.writeFile(OUTPUT_MAP_FILE, JSON.stringify(resultMap, null, 2), 'utf-8');
  console.log(`[Matcher] Mapping saved to ${OUTPUT_MAP_FILE}`);
}

main().catch(err => {
  console.error('Matching failed:', err);
  process.exit(1);
});
