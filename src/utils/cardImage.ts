export const R2_CDN_BASE = 'https://pub-af524b77e8e3403685545bc0a8222090.r2.dev';
export const DEFAULT_CARD_PLACEHOLDER = `${import.meta.env.BASE_URL || '/'}card-placeholder.svg`.replace('//', '/');

/**
 * Resolves a card image path to its best URL.
 * - hd: true -> points to Ultra-HD high-resolution version (.jpg in card-images-hd/...)
 * - hd: false / omitted -> points to lightweight thumbnail (.webp in card-images/...)
 * - In Production (GitHub Pages): points to Cloudflare R2 CDN.
 * - In Local Dev: uses local asset path for instant offline loading.
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
 * Hierarchy: Local HD (.jpg) -> Cloudflare R2 HD (.jpg) -> Standard Thumbnail (.webp) -> Official Asia CDN -> Default Card Placeholder
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

  // 1. If HD attempt, try Cloudflare R2 HD (.jpg)
  if (isHdAttempt) {
    const r2HdJpg = `${R2_CDN_BASE}/${cleanPath.replace('card-images/', 'card-images-hd/').replace(/\.(webp|png|jpeg)$/, '.jpg')}`;
    if (target.src !== r2HdJpg) {
      target.src = r2HdJpg;
      return;
    }
  }

  // 2. Fallback to Standard Thumbnail (.webp)
  const stdCleanPath = cleanPath.replace('card-images-hd/', 'card-images/').replace(/\.jpg$/, '.webp');
  const r2StdUrl = `${R2_CDN_BASE}/${stdCleanPath}`;

  if (target.src !== r2StdUrl && target.src !== officialImageUrl) {
    target.src = r2StdUrl;
    return;
  }

  // 3. Fallback for basic energy if any
  if (cleanPath.includes('card-images/SCF/') && cleanPath.includes('พลังงานพื้นฐาน')) {
    const sceFallback = `${R2_CDN_BASE}/${cleanPath.replace('card-images/SCF/', 'card-images/SCE/')}`;
    if (target.src !== sceFallback) {
      target.src = sceFallback;
      return;
    }
  }

  // 4. Fallback to Official Asia CDN (if valid)
  if (officialImageUrl && target.src !== officialImageUrl) {
    target.src = officialImageUrl;
    return;
  }

  // 5. Ultimate Fallback: Default Placeholder Card
  target.src = DEFAULT_CARD_PLACEHOLDER;
}
