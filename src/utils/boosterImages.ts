import boosterMapData from '../data/setBoosterImages.json';
import { R2_CDN_BASE } from './cardImage';

const boosterMap: Record<string, string> = boosterMapData;

/**
 * Resolves a set's booster pack cover image to its best URL.
 * - In Production (GitHub Pages / Custom Domain): points to Cloudflare R2 CDN (`${R2_CDN_BASE}/set-boosters/${setId}.webp`).
 * - In Local Dev: uses local asset path for instant offline loading.
 */
export function getSetBoosterImage(setId?: string): string | null {
  if (!setId) return null;
  const clean = setId.trim();
  const found = boosterMap[clean] || boosterMap[clean.toUpperCase()] || boosterMap[clean.toLowerCase()];
  if (!found) return null;

  const filename = found.replace(/^\/?set-boosters\//, '').replace(/\.(png|jpg|jpeg|webp)$/, '.webp');
  const relativePath = `set-boosters/${filename}`;

  if (import.meta.env.PROD) {
    return `${R2_CDN_BASE}/${relativePath}`;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${relativePath}`;
}

/**
 * Fallback error handler for booster pack image loading.
 * Hierarchy: Cloudflare R2 CDN WebP -> Local /set-boosters/
 */
export function handleBoosterImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  setId?: string
) {
  const target = e.currentTarget;
  if (!target || !setId) return;

  const filename = `${setId.trim()}.webp`;
  const r2Url = `${R2_CDN_BASE}/set-boosters/${filename}`;
  const localUrl = `/set-boosters/${filename}`;

  if (target.src !== r2Url) {
    target.src = r2Url;
  } else if (target.src !== localUrl) {
    target.src = localUrl;
  }
}
