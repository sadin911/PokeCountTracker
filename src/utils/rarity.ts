// Exact set breakdown specifications based on official Pokemon TCG SV / MA Asian / Thai expansion lists:
export const SET_RULES: Record<string, { ar?: [number, number]; sr?: [number, number]; sar?: [number, number]; ur?: [number, number]; s?: [number, number]; ssr?: [number, number] }> = {
  // SV1S (Scarlet ex - Total 108): 1-78 Base, 79-90 AR (12), 91-100 SR (10), 101-105 SAR (5), 106-108 UR (3)
  SV1S: { ar: [79, 90], sr: [91, 100], sar: [101, 105], ur: [106, 108] },
  // SV1V (Violet ex - Total 108): 1-78 Base, 79-90 AR (12), 91-100 SR (10), 101-105 SAR (5), 106-108 UR (3)
  SV1V: { ar: [79, 90], sr: [91, 100], sar: [101, 105], ur: [106, 108] },
  // SV1a (Triplet Beat - Total 103): 1-73 Base, 74-85 AR (12), 86-95 SR (10), 96-101 SAR (6), 102-103 UR (2)
  SV1a: { ar: [74, 85], sr: [86, 95], sar: [96, 101], ur: [102, 103] },
  // SV2P (Snow Hazard - Total 99): 1-71 Base, 72-83 AR (12), 84-91 SR (8), 92-96 SAR (5), 97-99 UR (3)
  SV2P: { ar: [72, 83], sr: [84, 91], sar: [92, 96], ur: [97, 99] },
  // SV2D (Clay Burst - Total 99): 1-71 Base, 72-83 AR (12), 84-91 SR (8), 92-96 SAR (5), 97-99 UR (3)
  SV2D: { ar: [72, 83], sr: [84, 91], sar: [92, 96], ur: [97, 99] },
  // SV2a (Pokemon 151 - Total 210): 1-165 Base, 166-183 AR (18), 184-199 SR (16), 200-207 SAR (8), 208-210 UR (3)
  SV2a: { ar: [166, 183], sr: [184, 199], sar: [200, 207], ur: [208, 210] },
  // SV3 (Ruler of Black Flame - Total 141): 1-108 Base, 109-120 AR (12), 121-133 SR (13), 134-138 SAR (5), 139-141 UR (3)
  SV3: { ar: [109, 120], sr: [121, 133], sar: [134, 138], ur: [139, 141] },
  // SV3a (Raging Surf - Total 92): 1-62 Base, 63-74 AR (12), 75-84 SR (10), 85-89 SAR (5), 90-92 UR (3)
  SV3a: { ar: [63, 74], sr: [75, 84], sar: [85, 89], ur: [90, 92] },
  // SV4K (Ancient Roar - Total 95): 1-66 Base, 67-78 AR (12), 79-88 SR (10), 89-92 SAR (4), 93-95 UR (3)
  SV4K: { ar: [67, 78], sr: [79, 88], sar: [89, 92], ur: [93, 95] },
  // SV4M (Future Flash - Total 95): 1-66 Base, 67-78 AR (12), 79-88 SR (10), 89-92 SAR (4), 93-95 UR (3)
  SV4M: { ar: [67, 78], sr: [79, 88], sar: [89, 92], ur: [93, 95] },
  // SV4a (Shiny Treasure ex - Total 360): 1-190 Base, 191-319 S (129), 320-337 SSR (18), 338-345 SR (8), 346-353 SAR (8), 354-360 UR (7)
  SV4a: { s: [191, 319], ssr: [320, 337], sr: [338, 345], sar: [346, 353], ur: [354, 360] },
  // SV5K (Wild Force - Total 100): 1-71 Base, 72-83 AR (12), 84-93 SR (10), 94-97 SAR (4), 98-100 UR (3)
  SV5K: { ar: [72, 83], sr: [84, 93], sar: [94, 97], ur: [98, 100] },
  // SV5M (Cyber Judge - Total 100): 1-71 Base, 72-83 AR (12), 84-93 SR (10), 94-97 SAR (4), 98-100 UR (3)
  SV5M: { ar: [72, 83], sr: [84, 93], sar: [94, 97], ur: [98, 100] },
  // SV5a (Crimson Haze - Total 96): 1-66 Base, 67-78 AR (12), 79-88 SR (10), 89-93 SAR (5), 94-96 UR (3)
  SV5a: { ar: [67, 78], sr: [79, 88], sar: [89, 93], ur: [94, 96] },
  // SV6 (Mask of Change - Total 133): 1-101 Base, 102-113 AR (12), 114-124 SR (11), 125-130 SAR (6), 131-133 UR (3)
  SV6: { ar: [102, 113], sr: [114, 124], sar: [125, 130], ur: [131, 133] },
  // SV7s (Stellar Guidance - Total 229): 1-166 Base, 167-184 AR (18), 185-212 SR (28), 213-223 SAR (11), 224-229 UR (6)
  SV7s: { ar: [167, 184], sr: [185, 212], sar: [213, 223], ur: [224, 229] },
  // SV8s (Supercharged Breaker - Total 244): 1-182 Base, 183-200 AR (18), 201-229 SR (29), 230-238 SAR (9), 239-244 UR (6)
  SV8s: { ar: [183, 200], sr: [201, 229], sar: [230, 238], ur: [239, 244] },
  // Sv8a (Terastal Fest ex - Total 381): 1-187 Base, 188-202 SR (15), 203-228 SAR (26), 229-237 UR (9)
  Sv8a: { sr: [188, 202], sar: [203, 228], ur: [229, 237] },
  // SV9s (Destined Rivals - Total 185): 1-139 Base, 140-153 AR (14), 154-173 SR (20), 174-182 SAR (9), 183-185 UR (3)
  SV9s: { ar: [140, 153], sr: [154, 173], sar: [174, 182], ur: [183, 185] },
  // SV10s (Glory of Team Rocket - Total 189): 1-138 Base, 139-152 AR (14), 153-176 SR (24), 177-186 SAR (10), 187-189 UR (3)
  SV10s: { ar: [139, 152], sr: [153, 176], sar: [177, 186], ur: [187, 189] },
  // SV11s (Black & White - Total 348): 1-172 Base, 173-316 AR (144), 317-332 SR (16), 333-346 SAR (14), 347-348 UR (2)
  SV11s: { ar: [173, 316], sr: [317, 332], sar: [333, 346], ur: [347, 348] },
  // MA1 (Mega Evolution 1 - Total 184): 1-126 Base, 127-150 AR (24), 151-172 SR (22), 173-182 SAR (10), 183-184 UR (2)
  MA1: { ar: [127, 150], sr: [151, 172], sar: [173, 182], ur: [183, 184] },
  // MA2 (Mega Evolution 2 - Total 143): 1-103 Base, 104-119 AR (16), 120-136 SR (17), 137-142 SAR (6), 143-143 UR (1)
  MA2: { ar: [104, 119], sr: [120, 136], sar: [137, 142], ur: [143, 143] },
  // MA3 (Mega Evolution Dream ex - Total 250): 1-193 Base, 194-213 AR (20), 214-232 SR (19), 233-249 SAR (17), 250-250 UR (1)
  MA3: { ar: [194, 213], sr: [214, 232], sar: [233, 249], ur: [250, 250] },
  // MA4 (Void Blast - Total 181): 1-123 Base, 124-147 AR (24), 148-168 SR (21), 169-179 SAR (11), 180-181 UR (2)
  MA4: { ar: [124, 147], sr: [148, 168], sar: [169, 179], ur: [180, 181] },
  // MA5 (Shadow Menace - Total 238): 1-164 Base, 165-188 AR (24), 189-224 SR (36), 225-236 SAR (12), 237-238 UR (2)
  MA5: { ar: [165, 188], sr: [189, 224], sar: [225, 236], ur: [237, 238] },
};

export function getCardRarityClass(card: any): string {
  if (card.rarityCode) return card.rarityCode;

  const name = (card.name || '').trim();
  const rawSetId = card.set?.id || '';
  const setId = rawSetId.toUpperCase();
  const col = (card.collectorNumber || card.localId || '').toUpperCase();
  const category = card.category || '';

  // 1. Promo
  if (setId.includes('-P') || setId.includes('PROMO') || col.includes('PROMO') || col.startsWith('P-') || setId === 'PROMO') {
    return 'PROMO';
  }

  // 2. ACE SPEC
  if (name.includes('ACE SPEC') || name.includes('เอซสเปก') || col.includes('ACE')) {
    return 'ACE_SPEC';
  }

  // 3. Radiant
  if (name.includes('ส่องประกาย') || name.includes('Radiant')) {
    return 'RADIANT';
  }

  // 4. Check Set Rule table if available
  const match = col.match(/^0*(\d+)[-/]0*(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);

    const config = SET_RULES[rawSetId] || SET_RULES[setId];
    if (config) {
      if (config.s && num >= config.s[0] && num <= config.s[1]) return 'AR';
      if (config.ssr && num >= config.ssr[0] && num <= config.ssr[1]) return 'EX';
      if (config.ar && num >= config.ar[0] && num <= config.ar[1]) return 'AR';
      if (config.sr && num >= config.sr[0] && num <= config.sr[1]) return 'SR';
      if (config.sar && num >= config.sar[0] && num <= config.sar[1]) return 'SAR';
      if (config.ur && num >= config.ur[0] && num <= config.ur[1]) return 'UR';
    } else if (num > total) {
      if (category === 'Pokemon' && !name.includes('ex') && !name.includes('EX') && !name.includes('V')) {
        return 'AR';
      }
      return 'SR';
    }
  }

  // 5. Base set High Rarity:
  if (name.includes('ex') || name.includes('EX')) return 'EX';
  if (name.includes('VMAX')) return 'VMAX';
  if (name.includes('VSTAR')) return 'VSTAR';
  if (/(?:[\u0E00-\u0E7F]|\s)V(?:$|[\s\(\[\{【])/i.test(name) || name.endsWith('V')) return 'V';

  return 'REGULAR';
}
