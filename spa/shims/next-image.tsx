import type { CSSProperties, ImgHTMLAttributes } from 'react';

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
};

/** Unsplash photos are bundled with the artifact (external images are blocked by its CSP). */
function localise(src: string): string {
  const m = src.match(/images\.unsplash\.com\/(photo-[\w-]+)/);
  return m ? `img/${m[1]}.jpg` : src;
}

export default function Image({ src, fill, sizes: _s, priority, quality: _q, style, ...rest }: ImageProps) {
  const fillStyle: CSSProperties | undefined = fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : undefined;
  return <img src={localise(src)} loading={priority ? 'eager' : 'lazy'} decoding="async" style={{ ...fillStyle, ...style }} {...rest} />;
}
