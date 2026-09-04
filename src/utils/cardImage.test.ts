import { describe, it, expect } from 'vitest';
import { resolveCardImageUrl, R2_CDN_BASE } from './cardImage';

describe('cardImage utility suite', () => {
  it('resolves English card relative path to Cloudflare R2 standard webp', () => {
    const url = resolveCardImageUrl('card-images-en/sv8/1.webp');
    expect(url).toBe(`${R2_CDN_BASE}/card-images-en/sv8/1.webp`);
  });

  it('resolves English card relative path to Cloudflare R2 HD jpg when hd is true', () => {
    const url = resolveCardImageUrl('card-images-en/sv8/1.webp', true);
    expect(url).toBe(`${R2_CDN_BASE}/card-images-en-hd/sv8/1.jpg`);
  });

  it('upgrades full R2 English URL to HD jpg when hd is true', () => {
    const fullUrl = `${R2_CDN_BASE}/card-images-en/sv8/1.webp`;
    const url = resolveCardImageUrl(fullUrl, true);
    expect(url).toBe(`${R2_CDN_BASE}/card-images-en-hd/sv8/1.jpg`);
  });

  it('preserves external global CDN image URLs unchanged', () => {
    const externalUrl = 'https://images.pokemontcg.io/sv1/1.png';
    const url = resolveCardImageUrl(externalUrl);
    expect(url).toBe('https://images.pokemontcg.io/sv1/1.png');
  });
});
