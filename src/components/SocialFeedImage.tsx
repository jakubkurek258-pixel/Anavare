import React, { useState } from 'react';

interface SocialFeedImageProps {
  src: string;
  alt: string;
}

export function SocialFeedImage({ src, alt }: SocialFeedImageProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'square' | 'loading'>('loading');
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    let detected: 'portrait' | 'landscape' | 'square' = 'square';
    
    if (ratio < 0.82) {
      detected = 'portrait';
    } else if (ratio > 1.25) {
      detected = 'landscape';
    } else {
      detected = 'square';
    }

    setOrientation(detected);
    setAspectRatio(ratio);
    setLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setOrientation('landscape');
    setAspectRatio(1.6);
    setLoaded(true);
    setHasError(true);
  };

  // Prevent CLS by using a sensible fallback aspect ratio or the calculated one
  const aspectStyle = aspectRatio 
    ? { aspectRatio: `${aspectRatio}` } 
    : { aspectRatio: '1.6' };

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden border border-white/5 bg-slate-950/60 shadow-inner flex items-center justify-center transition-all duration-300"
      style={aspectStyle}
    >
      {/* Immersive ambient backdrop shadow/glow for portrait images */}
      {loaded && orientation === 'portrait' && !hasError && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-[0.14] pointer-events-none scale-110"
          style={{ backgroundImage: `url(${src})` }}
        />
      )}

      {/* Cybernetic shimmer skeleton loader */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 font-mono text-[9px] text-indigo-400/80 gap-2.5">
          <div className="w-5 h-5 border border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
          <span className="tracking-widest uppercase animate-pulse">syncing aspect coordinates...</span>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-pink-950/10 border border-pink-500/20 text-pink-400 gap-2 select-none">
          <span className="text-[14px]">⚠️</span>
          <span className="font-mono text-[10px] uppercase tracking-wider">MEDIA SECURE TUNNEL OFFLINE</span>
          <span className="text-[9px] text-slate-500 max-w-xs leading-normal">The image could not be loaded. Please verify URL parameters or secure connection channels.</span>
        </div>
      ) : (
        /* Real image tag with natural dynamic fitting */
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`w-full h-auto block object-contain transition-all duration-500 ease-out ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{ width: '100%', height: 'auto' }}
        />
      )}

      {/* Dynamic Indicator Badge overlay */}
      {loaded && !hasError && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded border border-white/5 bg-black/85 text-[8px] font-mono tracking-widest text-slate-500 uppercase select-none pointer-events-none">
          {orientation}
        </div>
      )}
    </div>
  );
}
