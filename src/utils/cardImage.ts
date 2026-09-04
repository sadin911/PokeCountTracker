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

  // If path is already a full R2 or external URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (hd && path.includes('/card-images-en/')) {
      return path.replace('/card-images-en/', '/card-images-en-hd/').replace(/\.(webp|png)$/, '.jpg');
    }
    return path;
  }

  let cleanPath = path.replace(/^\/?PokeCountTracker/, '').replace(/^\/+/, '');

  if (hd) {
    if (cleanPath.startsWith('card-images/')) {
      cleanPath = cleanPath
        .replace('card-images/', 'card-images-hd/')
        .replace(/\.(webp|png|jpeg)$/, '.jpg');
    } else if (cleanPath.startsWith('card-images-en/')) {
      cleanPath = cleanPath
        .replace('card-images-en/', 'card-images-en-hd/')
        .replace(/\.(webp|png|jpeg)$/, '.jpg');
    }
  }

  // English images always route to R2 (not bundled in local repo git)
  if (cleanPath.startsWith('card-images-en/') || cleanPath.startsWith('card-images-en-hd/')) {
    return `${R2_CDN_BASE}/${cleanPath}`;
  }

  if (import.meta.env.PROD) {
    return `${R2_CDN_BASE}/${cleanPath}`;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${cleanPath}`;
}

/**
 * Fallback error handler for card image loading.
 * Hierarchy:
 * - For Thai cards: Local HD (.jpg) -> Cloudflare R2 HD (.jpg) -> Standard Thumbnail (.webp) -> Official Asia CDN -> Default Card Placeholder
 * - For English cards: Cloudflare R2 HD (.jpg) -> Cloudflare R2 Thumbnail (.webp) -> Official Pokémon TCG Global CDN -> Default Card Placeholder
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

  const currentSrc = target.src || '';

  // 1. English Cards Fallback Pipeline
  if (currentSrc.includes('card-images-en') || (localPath && localPath.includes('card-images-en'))) {
    // 1.1 If HD version on R2 failed, try standard R2 thumbnail (.webp)
    if (currentSrc.includes('card-images-en-hd')) {
      const stdR2Url = currentSrc.replace('card-images-en-hd/', 'card-images-en/').replace(/\.jpg$/, '.webp');
      if (currentSrc !== stdR2Url) {
        target.src = stdR2Url;
        return;
      }
    }

    // 1.2 Fallback to official Pokemon TCG Global CDN if R2 object is missing/uploading
    if (officialImageUrl && currentSrc !== officialImageUrl) {
      target.src = officialImageUrl;
      return;
    }

    // Try deriving official pokemontcg.io URL from path if not explicitly provided
    const enMatch = currentSrc.match(/card-images-en(?:-hd)?\/([^/]+)\/([^.]+)\.(webp|jpg|png)/);
    if (enMatch) {
      const [, setId, num] = enMatch;
      const fallbackGlobalCdn = `https://images.pokemontcg.io/${setId}/${num}.png`;
      if (currentSrc !== fallbackGlobalCdn) {
        target.src = fallbackGlobalCdn;
        return;
      }
    }

    target.src = DEFAULT_CARD_PLACEHOLDER;
    return;
  }

  const cleanPath = (localPath || '').replace(/^\/?PokeCountTracker/, '').replace(/^\/+/, '');
  const isHdAttempt = currentSrc.includes('card-images-hd');

  // 2. Thai Cards Fallback Pipeline
  // 2.1 If HD attempt, try Cloudflare R2 HD (.jpg)
  if (isHdAttempt) {
    const r2HdJpg = `${R2_CDN_BASE}/${cleanPath.replace('card-images/', 'card-images-hd/').replace(/\.(webp|png|jpeg)$/, '.jpg')}`;
    if (currentSrc !== r2HdJpg) {
      target.src = r2HdJpg;
      return;
    }
  }

  // 2.2 Fallback to Standard Thumbnail (.webp)
  const stdCleanPath = cleanPath.replace('card-images-hd/', 'card-images/').replace(/\.jpg$/, '.webp');
  const r2StdUrl = `${R2_CDN_BASE}/${stdCleanPath}`;

  if (currentSrc !== r2StdUrl && currentSrc !== officialImageUrl) {
    target.src = r2StdUrl;
    return;
  }

  // 2.3 Fallback for basic energy if any
  if (cleanPath.includes('card-images/SCF/') && cleanPath.includes('พลังงานพื้นฐาน')) {
    const sceFallback = `${R2_CDN_BASE}/${cleanPath.replace('card-images/SCF/', 'card-images/SCE/')}`;
    if (currentSrc !== sceFallback) {
      target.src = sceFallback;
      return;
    }
  }

  // 2.4 Fallback to Official Asia CDN (if valid)
  if (officialImageUrl && currentSrc !== officialImageUrl) {
    target.src = officialImageUrl;
    return;
  }

  // 2.5 Ultimate Fallback: Default Placeholder Card
  target.src = DEFAULT_CARD_PLACEHOLDER;
}
