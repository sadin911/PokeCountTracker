import { normalizeCollectorNum } from './collectionTextParser';
import { buildCardLookup } from './collectionExcelParser';

export { buildCardLookup };

export interface OcrCardMatchResult {
  card: any | null;
  extractedSet: string | null;
  extractedNumber: string | null;
  rawMatchedSnippet: string | null;
  confidence: number;
}

/**
 * Common OCR misrecognitions in Pokémon card set codes.
 */
function cleanOcrSetCode(setCandidate: string, knownSets: Set<string>): string {
  const upper = setCandidate.toUpperCase().trim();

  // Check direct case-insensitive match
  for (const s of knownSets) {
    if (s.toUpperCase() === upper) return s;
  }

  // Common OCR character confusions:
  // e.g. '5V8A' -> 'SV8a', '58A' -> 'S8a', '5C1A' -> 'SC1a'
  let corrected = upper;
  if (corrected.startsWith('5V')) corrected = 'SV' + corrected.slice(2);
  else if (corrected.startsWith('5C')) corrected = 'SC' + corrected.slice(2);
  else if (corrected.startsWith('5')) corrected = 'S' + corrected.slice(1);

  // '0' instead of 'O' or vice versa
  for (const s of knownSets) {
    if (s.toUpperCase() === corrected) return s;
  }

  return setCandidate;
}

/**
 * Searches OCR text for Pokemon card identifiers (e.g. "SV8a 025/187", "SC1a 001-154", "s8a 10").
 */
export function matchOcrToCard(
  rawText: string,
  catalog: any[],
  cardLookupCache?: { cardLookup: Map<string, any>; knownSets: Set<string> }
): OcrCardMatchResult {
  if (!rawText || !rawText.trim()) {
    return {
      card: null,
      extractedSet: null,
      extractedNumber: null,
      rawMatchedSnippet: null,
      confidence: 0,
    };
  }

  const { cardLookup, knownSets } = cardLookupCache || buildCardLookup(catalog);

  // Clean raw text into single lines with uniform spaces
  const cleanText = rawText.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');

  // Regex patterns targeting standard Thai Pokémon set & collector number patterns:
  // Examples:
  // "SV8a 025/187", "SV8a F 025/187", "SC1a 001-154", "sv7 001/102", "S12a 010/172", "SV-P 001", "S-P 120"
  const patterns = [
    // Pattern 1: [Set] [Optional Regulation/Rarity] [Number/Total]
    // e.g. "SV8a 025/187", "SV8a F 025/187", "SC1a 001-154", "SV-P 025"
    /(?:^|[^\w])([A-Za-z0-9]{1,4}(?:-[A-Za-z0-9]+)?)\s+(?:[A-Z]\s+)?([A-Za-z0-9]+(?:[\/-]\d{1,3})?)(?:[^\w]|$)/g,
    // Pattern 2: Hyphenated or tight code, e.g. "SV8a-025", "SC1a-001"
    /(?:^|[^\w])([A-Za-z0-9]{1,4}(?:-[A-Za-z0-9]+)?)[-_/]([A-Za-z0-9]{1,3})(?:[\/-]\d{1,3})?(?:[^\w]|$)/g,
  ];

  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(cleanText)) !== null) {
      const rawSet = match[1];
      const rawNum = match[2];
      if (!rawSet || !rawNum) continue;

      const correctedSet = cleanOcrSetCode(rawSet, knownSets);
      const sLower = correctedSet.toLowerCase();

      const numPrefix = normalizeCollectorNum(rawNum.split(/[-/]/)[0]);
      const normFull = rawNum.trim().toLowerCase();

      // Check lookup map
      const matched =
        cardLookup.get(`${sLower}:${numPrefix}`) ||
        cardLookup.get(`${sLower}:${normFull}`) ||
        cardLookup.get(`${sLower}:${normalizeCollectorNum(rawNum)}`);

      if (matched) {
        return {
          card: matched,
          extractedSet: matched.set?.id || correctedSet,
          extractedNumber: matched.collectorNumber || rawNum,
          rawMatchedSnippet: match[0].trim(),
          confidence: 0.95,
        };
      }
    }
  }

  // Pattern 3: Broader scan for known set code anywhere, followed by closest 1-3 digit number
  for (const knownSet of knownSets) {
    const setRegex = new RegExp(`\\b${knownSet}\\b[\\s\\S]{0,15}?(\\d{1,3})(?:[\\/-]\\d{1,3})?`, 'i');
    const match = cleanText.match(setRegex);
    if (match) {
      const numPrefix = normalizeCollectorNum(match[1]);
      const sLower = knownSet.toLowerCase();
      const matched = cardLookup.get(`${sLower}:${numPrefix}`);
      if (matched) {
        return {
          card: matched,
          extractedSet: matched.set?.id || knownSet,
          extractedNumber: matched.collectorNumber || match[1],
          rawMatchedSnippet: match[0].trim(),
          confidence: 0.85,
        };
      }
    }
  }

  return {
    card: null,
    extractedSet: null,
    extractedNumber: null,
    rawMatchedSnippet: null,
    confidence: 0,
  };
}
