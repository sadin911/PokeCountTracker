import React, { useState, useEffect, useRef } from 'react';

// In-memory cache for all image URLs loaded during this session
export const globalLoadedImageCache = new Set<string>();

/**
 * Preload a list of card image URLs in the background.
 * Browser caches them so when they enter viewport they render immediately.
 */
export function preloadCardImages(urls: (string | undefined | null)[]) {
  if (typeof window === 'undefined') return;

  const runPreload = () => {
    urls.forEach((url) => {
      if (!url || globalLoadedImageCache.has(url)) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      img.onload = () => globalLoadedImageCache.add(url);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 1500 });
  } else {
    setTimeout(runPreload, 100);
  }
}

interface OptimizedCardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function OptimizedCardImage({
  src,
  alt,
  priority = false,
  className = '',
  containerClassName = '',
  onError,
  onLoad,
  ...rest
}: OptimizedCardImageProps) {
  const isAlreadyLoaded = Boolean(src && globalLoadedImageCache.has(src));
  const [isLoaded, setIsLoaded] = useState<boolean>(isAlreadyLoaded);
  const [shouldLoad, setShouldLoad] = useState<boolean>(priority || isAlreadyLoaded);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync loaded state when src changes
  useEffect(() => {
    if (src && globalLoadedImageCache.has(src)) {
      setIsLoaded(true);
      setShouldLoad(true);
    } else if (!priority) {
      setIsLoaded(false);
    }
  }, [src, priority]);

  // Ahead-of-time IntersectionObserver with 1000px margin (approx. 2 screens ahead)
  useEffect(() => {
    if (shouldLoad || priority) return;

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '1000px 0px', // Fetch 1,000px before scrolling into viewport
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad, priority]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (src) {
      globalLoadedImageCache.add(src);
    }
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${containerClassName}`}
    >
      {/* Skeleton Shimmer Placeholder (visible only while loading and not yet cached) */}
      {!isLoaded && (
        <div
          className="absolute inset-0 z-0 bg-slate-900/90 dark:bg-slate-950 flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          {/* Pokéball Wireframe Watermark */}
          <div className="w-12 h-12 rounded-full border-2 border-slate-700/40 relative flex items-center justify-center opacity-40">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700/40 -translate-y-1/2" />
            <div className="w-4 h-4 rounded-full border-2 border-slate-700/50 bg-slate-900 z-10" />
          </div>

          {/* Shimmer Light Sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-skeleton-shimmer pointer-events-none" />
        </div>
      )}

      {/* Actual Image */}
      {shouldLoad && src && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchPriority: 'high' } : {})}
          onLoad={handleImageLoad}
          onError={onError}
          className={`${className} ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-200 ease-out`}
          {...rest}
        />
      )}
    </div>
  );
}
