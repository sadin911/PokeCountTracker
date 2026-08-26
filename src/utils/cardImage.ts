export const R2_CDN_BASE = 'https://pub-af524b77e8e3403685545bc0a8222090.r2.dev';
export const DEFAULT_CARD_PLACEHOLDER = `${import.meta.env.BASE_URL || '/'}card-placeholder.svg`.replace('//', '/');

/**
 * Resolves a card image path to its best URL.
 * - hd: true -> points to Ultra-HD high-resolution version (card-images-hd/...)
 * - hd: false / omitted -> points to lightweight, high-performance thumbnail (card-images/...)
 * - If running in Production (GitHub Pages, Vercel), points to Cloudflare R2 CDN.
 * - If running in Local Dev, uses local asset path for instant offline loading.
 */
export function resolveCardImageUrl(path?: string | null, hd: boolean = false): string | undefined {
  if (!path) return DEFAULT_CARD_PLACEHOLDER;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  let cleanPath = path.replace(/^\/?PokeCountTracker/, '').replace(/^\/+/, '');

  if (hd) {
    if (cleanPath.startsWith('card-images/')) {
      cleanPath = cleanPath
        .replace('card-images/', 'card-images-hd/')
        .replace(/\.(webp|png|jpeg)$/, '.jpg');
    }
  }

  if (import.meta.env.PROD) {
    return `${R2_CDN_BASE}/${cleanPath}`;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${cleanPath}`;
}

/**
 * Fallback error handler for card image loading.
 * Hierarchy: Local HD (.jpg) -> Local HD (.webp) -> Local Standard -> Cloudflare R2 HD (.jpg) -> Cloudflare R2 HD (.webp) -> Cloudflare R2 Standard -> Official Asia CDN -> Default Card Placeholder
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
  const isHdAttempt = target.src.includes('card-images-hd');

  // 1. If HD (.jpg) failed on local dev, try local HD (.webp)
  if (isHdAttempt && target.src.endsWith('.jpg')) {
    const webpHdSrc = target.src.replace(/\.jpg$/, '.webp');
    if (target.src !== webpHdSrc) {
      target.src = webpHdSrc;
      return;
    }
  }

  // 2. If HD failed, fallback to local standard thumbnail
  if (isHdAttempt) {
    const stdCleanPath = cleanPath
      .replace('card-images-hd/', 'card-images/')
      .replace(/\.jpg$/, '.webp');
    const baseUrl = import.meta.env.BASE_URL || '/';
    const localStdUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${stdCleanPath}`;

    if (!import.meta.env.PROD && target.src !== localStdUrl) {
      target.src = localStdUrl;
      return;
    }
  }

  // 3. Fallback to Cloudflare R2 (HD .webp or Standard .webp)
  const r2StdUrl = cleanPath ? `${R2_CDN_BASE}/${cleanPath.replace('card-images-hd/', 'card-images/').replace(/\.jpg$/, '.webp')}` : null;
  const r2Url = cleanPath ? `${R2_CDN_BASE}/${cleanPath}` : null;

  if (r2StdUrl && target.src !== r2StdUrl && target.src !== officialImageUrl) {
    target.src = r2StdUrl;
    return;
  } else if (r2Url && target.src !== r2Url && target.src !== officialImageUrl) {
    target.src = r2Url;
    return;
  }

  // 3. If it's a basic energy in SCF or custom set that failed on R2, fallback to SCE energy
  if (cleanPath.includes('card-images/SCF/') && cleanPath.includes('พลังงานพื้นฐาน')) {
    const sceFallback = `${R2_CDN_BASE}/${cleanPath.replace('card-images/SCF/', 'card-images/SCE/')}`;
    if (target.src !== sceFallback) {
      target.src = sceFallback;
      return;
    }
  }

  // 4. If Cloudflare R2 failed, fallback to Official Asia CDN (only if valid)
  if (officialImageUrl && target.src !== officialImageUrl) {
    target.src = officialImageUrl;
    return;
  }

  // 5. Ultimate Fallback: Default Placeholder Card
  target.src = DEFAULT_CARD_PLACEHOLDER;
}

