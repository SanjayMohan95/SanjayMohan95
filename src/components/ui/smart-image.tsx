'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * next/image with a graceful gradient + emoji fallback when the remote
 * asset fails (offline, blocked CDN) so layouts never collapse.
 */
export function SmartImage({
  fallbackEmoji = '🍽️',
  className,
  alt,
  src,
  ...props
}: Omit<ImageProps, 'src'> & { src?: string; fallbackEmoji?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-amber-50 to-rose-100', className)}
      >
        <span className="text-4xl" aria-hidden>
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      className={cn('object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
      {...props}
    />
  );
}
