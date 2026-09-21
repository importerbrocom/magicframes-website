import Image from 'next/image';

export interface PlaceholderImageProps {
  /** Intended image source. When empty, a labeled placeholder is shown. */
  src?: string;
  alt: string;
  width: number;
  height: number;
  /** Optional caption shown under the dimension label. */
  label?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Renders either a real (unoptimized, static-export friendly) image or, when
 * no `src` is provided, a styled box that visibly displays the intended
 * dimensions (e.g. "1920 x 1080"). The user swaps in real images later; the
 * dimension label documents the size each slot expects.
 */
export default function PlaceholderImage({
  src,
  alt,
  width,
  height,
  label,
  className,
  priority = false,
}: PlaceholderImageProps) {
  const boxClassName = ['relative overflow-hidden', className].filter(Boolean).join(' ');

  if (src) {
    return (
      <div className={boxClassName} style={{ aspectRatio: `${width} / ${height}` }}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${alt} placeholder, ${width} by ${height} pixels`}
      className={`flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-blush-100 to-gold-100 text-ink-700 ring-1 ring-inset ring-blush-200 ${boxClassName}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <span className="font-serif text-lg font-semibold tracking-tight sm:text-xl">
        {width} x {height}
      </span>
      <span className="px-3 text-center text-xs uppercase tracking-widest text-ink-700/70">
        {label ?? alt}
      </span>
    </div>
  );
}
