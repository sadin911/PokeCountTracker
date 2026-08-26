export const R2_CDN_BASE = 'https://pub-af524b77e8e3403685545bc0a8222090.r2.dev';
export const DEFAULT_CARD_PLACEHOLDER = `${import.meta.env.BASE_URL || '/'}card-placeholder.svg`.replace('//', '/');

/**
 * Resolves a card image path to its best URL.
 * - If running in Production (GitHub Pages, Vercel), points directly to Cloudflare R2 CDN.
 * - If running in Local Dev, uses local asset path for instant offline loading.
 */
export function resolveCardImageUrl(path?: string | null): string | undefined {
  if (!path) return DEFAULT_CARD_PLACEHOLDER;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const cleanPath = path.replace(/^\/?PokeCountTracker/, '').replace(/^\/+/, '');

  if (import.meta.env.PROD) {
    return `${R2_CDN_BASE}/${cleanPath}`;
  }

  return path;
}

/**
 * Fallback error handler for card image loading.
 * Hierarchy: Local asset -> Cloudflare R2 CDN -> Official Asia CDN -> Default Card Placeholder
 */
export function handleCardImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  localPath?: string | null,
  officialImageUrl?: string | null
) {
  const target = e.currentTarget;
  if (!target) return;

  // Prevent infinite loop if placeholder fails
  if (target.src.includes('card-placeholder.svg')) {
    return;
  }

  const cleanPath = (localPath || '').replace(/^\/?PokeCountTracker/, '').replace(/^\/+/, '');
  const r2Url = cleanPath ? `${R2_CDN_BASE}/${cleanPath}` : null;

  // 1. If currently on local URL and failed, fallback to Cloudflare R2
  if (r2Url && target.src !== r2Url && target.src !== officialImageUrl) {
    target.src = r2Url;
    return;
  }

  // 2. If it's a basic energy in SCF or custom set that failed on R2, fallback to SCE energy
  if (cleanPath.includes('card-images/SCF/') && cleanPath.includes('พลังงานพื้นฐาน')) {
    const sceFallback = `${R2_CDN_BASE}/${cleanPath.replace('card-images/SCF/', 'card-images/SCE/')}`;
    if (target.src !== sceFallback) {
      target.src = sceFallback;
      return;
    }
  }

  // 3. If Cloudflare R2 failed, fallback to Official Asia CDN (only if valid)
  if (officialImageUrl && target.src !== officialImageUrl) {
    target.src = officialImageUrl;
    return;
  }

  // 4. Ultimate Fallback: Default Placeholder Card
  target.src = DEFAULT_CARD_PLACEHOLDER;
}
