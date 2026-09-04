// @ts-check
import baselineMapRaw from '../data/thaiEnglishCardMap.json';

export interface EnCardMapping {
  enCardId: string;
  enName: string;
  enSetId: string;
  enSetName: string;
  enNumber: string;
  enImageUrl: string;
  confidence: number;
  matchMethod: string;
  verified: boolean;
  matchedAt: string;
  userOverridden?: boolean;
}

const STORAGE_KEY_CUSTOM_MAPPINGS = 'pokecount_custom_thai_en_mappings';

// In-memory baseline dictionary
const baselineMap: Record<string, EnCardMapping> = baselineMapRaw as any;

/**
 * Get all user overrides from localStorage
 */
export function getCustomOverrides(): Record<string, EnCardMapping> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_MAPPINGS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to parse custom card mappings:', e);
    return {};
  }
}

/**
 * Save an updated mapping for a Thai card
 */
export function saveCardMapping(thaiCardId: string, mapping: EnCardMapping): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCustomOverrides();
    current[thaiCardId] = {
      ...mapping,
      userOverridden: true,
      verified: mapping.verified ?? true,
      matchedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_CUSTOM_MAPPINGS, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save custom card mapping:', e);
  }
}

/**
 * Remove a custom override, reverting to baseline algorithm
 */
export function resetCardMapping(thaiCardId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCustomOverrides();
    delete current[thaiCardId];
    localStorage.setItem(STORAGE_KEY_CUSTOM_MAPPINGS, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to reset card mapping:', e);
  }
}

/**
 * Get the effective English mapping for a Thai card (custom override takes precedence)
 */
export function getEnglishMatchForThaiCard(thaiCardId: string): EnCardMapping | null {
  const overrides = getCustomOverrides();
  if (overrides[thaiCardId]) {
    return overrides[thaiCardId];
  }
  return baselineMap[thaiCardId] || null;
}

/**
 * Toggle verification state
 */
export function toggleMappingVerification(thaiCardId: string, currentVerified: boolean): void {
  const existing = getEnglishMatchForThaiCard(thaiCardId);
  if (!existing) return;
  saveCardMapping(thaiCardId, {
    ...existing,
    verified: !currentVerified
  });
}

/**
 * Reverse lookup: Find which Thai card ID is mapped to a given English card ID
 */
export function getThaiCardIdForEnglishCard(enCardId: string): string | null {
  const overrides = getCustomOverrides();
  
  // 1. Check user overrides first
  for (const [thId, mapping] of Object.entries(overrides)) {
    if (mapping.enCardId === enCardId || mapping.enCardId === `EN-${enCardId}`) {
      return thId;
    }
  }

  // 2. Check baseline map
  for (const [thId, mapping] of Object.entries(baselineMap)) {
    if (mapping.enCardId === enCardId || mapping.enCardId === `EN-${enCardId}`) {
      return thId;
    }
  }

  return null;
}

