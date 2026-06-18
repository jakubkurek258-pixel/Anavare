import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function AvatarImage({ src, alt = "Avatar", className = "w-full h-full" }: AvatarImageProps) {
  const [error, setError] = useState(false);

  // Return fallback if src is empty or load fails
  if (!src || src.trim() === '' || error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-indigo-950/80 via-purple-900/40 to-slate-900 border border-indigo-500/30 text-indigo-300 font-mono text-xs select-none ${className}`}>
        <User className="w-[50%] h-[50%] stroke-[1.5] text-indigo-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      referrerPolicy="no-referrer"
      onError={() => {
        console.warn(`[AvatarImage] Failed to resolve src: ${src}. Activating sleek fallback.`);
        setError(true);
      }}
    />
  );
}
