import React, { useState, useEffect } from 'react';

interface SocialFeedImageProps {
  imageUrl?: string | null;
  src?: string | null;
  alt: string;
}

// A beautiful, high-quality, generic abstract Unsplash image to serve as a visual placeholder
const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

export function SocialFeedImage({ imageUrl, src, alt }: SocialFeedImageProps) {
  const initialUrl = imageUrl || src || '';
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'square'>('square');

  // Synchronize internal state when props update
  useEffect(() => {
    const updatedUrl = imageUrl || src || '';
    setCurrentSrc(updatedUrl);
    setLoaded(false);
    setHasError(false);
  }, [imageUrl, src]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    let fallbackOrientation: 'portrait' | 'landscape' | 'square' = 'square';

    if (ratio < 0.85) {
      fallbackOrientation = 'portrait';
    } else if (ratio > 1.2) {
      fallbackOrientation = 'landscape';
    }

    setOrientation(fallbackOrientation);
    setLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    // If the primary image failed to load, try swapping to our beautiful premium default template
    if (currentSrc && currentSrc !== FALLBACK_IMAGE_URL) {
      setCurrentSrc(FALLBACK_IMAGE_URL);
    } else {
      setHasError(true);
      setLoaded(true);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/5 transition-all duration-300">
      {/* Immersive subtle ambient backdrop shadow/glow for portrait style imagery */}
      {loaded && orientation === 'portrait' && !hasError && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-[0.10] pointer-events-none scale-105"
          style={{ backgroundImage: `url(${currentSrc})` }}
        />
      )}

      {!hasError && currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`w-full h-auto block transition-all duration-500 ease-out ${
            loaded ? 'opacity-100 scale-100' : 'opacity-90 scale-98'
          }`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      ) : (
        /* Final fallback if both normal URL and fallback Unsplash URL failed */
        <div className="w-full py-12 flex flex-col items-center justify-center p-4 text-center bg-slate-900/30 border border-white/5 text-slate-500 gap-1.5 rounded-xl">
          <span className="text-[18px]">📷</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">MEDIA ARCHIVE UNRESOLVABLE</span>
          <span className="text-[9px] text-slate-500 max-w-xs leading-normal">
            The external progress image coordinates could not be materialized.
          </span>
        </div>
      )}

      {/* Subtle indicator badge overlay with minimal footprint */}
      {loaded && !hasError && currentSrc && (
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded border border-white/5 bg-black/80 text-[8px] font-mono tracking-widest text-slate-400 uppercase select-none pointer-events-none z-10">
          {orientation}
        </div>
      )}
    </div>
  );
}
