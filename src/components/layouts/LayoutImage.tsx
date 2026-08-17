'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getLayoutFallbackImage, isLocalPlaceholderImage } from '@/lib/layoutImages';

interface LayoutImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fallbackSeed?: string;
  onLoad?: () => void;
}

/**
 * Layout property image with automatic fallback when src is missing or fails to load.
 * Local SVG placeholders use a plain img tag (Next/Image SVG optimization is unreliable).
 */
export default function LayoutImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  className = '',
  fallbackSeed = 'default',
  onLoad,
}: LayoutImageProps) {
  const fallback = getLayoutFallbackImage(fallbackSeed);
  const [currentSrc, setCurrentSrc] = useState(src || fallback);
  const [useNativeImg, setUseNativeImg] = useState(
    isLocalPlaceholderImage(src || fallback)
  );

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setUseNativeImg(true);
    }
  };

  if (useNativeImg || isLocalPlaceholderImage(currentSrc)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSrc}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
          onError={handleError}
          onLoad={onLoad}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        onLoad={onLoad}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={handleError}
      onLoad={onLoad}
    />
  );
}
