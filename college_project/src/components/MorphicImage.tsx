'use client';

import React, { useState } from 'react';

interface MorphicImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon: string;
}

export default function MorphicImage({ src, alt, className, fallbackIcon, ...props }: MorphicImageProps) {
  const [error, setError] = useState(!src);

  if (error) {
    return (
      <div 
        className={`glass-panel flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent border border-outline/10 text-primary dark:text-white select-none ${className}`}
        style={{ backdropFilter: 'blur(20px)' }}
      >
        <span className="material-symbols-outlined opacity-60 text-[32px]">
          {fallbackIcon}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
