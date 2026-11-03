import type * as React from 'react'

import { type ExampleImage, srcSet } from '@/lib/example-images'
import { cn } from '@/lib/utils'

type Slot = keyof ExampleImage['src']

/** The best single URL for the plain `src` attribute, preferring one size. */
export function pickSrc(image: ExampleImage, prefer: Slot = 'card'): string {
  return image.src[prefer] ?? image.src.card ?? image.src.hero ?? image.src.full ?? image.src.thumb ?? ''
}

/** "Ground truth: Melanoma in situ (histopathology), ISIC_0000049", or null when the diagnosis is unknown. */
export function groundTruth(image: ExampleImage): string | null {
  if (!image.diagnosis) return null
  const confirm = image.confirmType ? ` (${image.confirmType})` : ''
  const source = image.sourceId ? `, ${image.sourceId}` : ''
  return `Ground truth: ${image.diagnosis}${confirm}${source}`
}

/** Where the image comes from and its licence, e.g. "ISIC Archive (Anonymous) · CC0 1.0". */
export function sourceLine(image: ExampleImage): string {
  const origin =
    image.kind === 'dermoscopy'
      ? `ISIC Archive${image.attribution ? ` (${image.attribution})` : ''}`
      : image.attribution || 'Photo'
  return `${origin} · ${image.license}`
}

export interface ExamplePictureProps
  extends Omit<React.ComponentProps<'img'>, 'src' | 'srcSet' | 'width' | 'height' | 'alt' | 'sizes'> {
  image: ExampleImage
  /** The `sizes` attribute: how wide the image renders at each breakpoint. */
  sizes: string
  /** Size used for the fallback `src`. Default 'card'. */
  prefer?: Slot
  /** The one above-the-fold image: eager, high fetch priority. Everything else is lazy. */
  priority?: boolean
  /** Empty alt when the image is decorative next to an equivalent caption. */
  decorative?: boolean
}

/** A real example image from the manifest: srcset, intrinsic size, lazy unless it is the priority image. */
export function ExamplePicture({
  image,
  sizes,
  prefer = 'card',
  priority = false,
  decorative = false,
  className,
  ...props
}: ExamplePictureProps) {
  const set = srcSet(image)
  return (
    <img
      src={pickSrc(image, prefer)}
      srcSet={set || undefined}
      sizes={set ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={decorative ? '' : image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      draggable={false}
      className={cn('size-full object-cover select-none', className)}
      {...props}
    />
  )
}

// Written out in full so the Tailwind compiler can see every class.
const CORNERS = {
  sm: [
    'top-3 left-3 border-t border-l rounded-tl-[6px]',
    'top-3 right-3 border-t border-r rounded-tr-[6px]',
    'bottom-3 left-3 border-b border-l rounded-bl-[6px]',
    'bottom-3 right-3 border-b border-r rounded-br-[6px]',
  ],
  md: [
    'top-4 left-4 border-t border-l rounded-tl-[6px]',
    'top-4 right-4 border-t border-r rounded-tr-[6px]',
    'bottom-4 left-4 border-b border-l rounded-bl-[6px]',
    'bottom-4 right-4 border-b border-r rounded-br-[6px]',
  ],
} as const

/** Viewfinder corners for a photo well (white on the near-black viewer, as in the analyser). */
export function ViewfinderCorners({ inset = 'sm' }: { inset?: 'sm' | 'md' }) {
  return (
    <>
      {CORNERS[inset].map((corner) => (
        <span key={corner} aria-hidden="true" className={cn('pointer-events-none absolute size-4 border-white/45', corner)} />
      ))}
    </>
  )
}

/**
 * A captioned example: the image in a viewer well, then "Ground truth: ..." with a link to the
 * source record, and the origin and licence.
 */
export function ExampleFigure({
  image,
  sizes,
  aspect = 'aspect-[3/2]',
  credit = true,
  className,
}: {
  image: ExampleImage
  sizes: string
  aspect?: string
  /** Show the origin and licence line. Pass false when a shared credit line follows a group of figures. */
  credit?: boolean
  className?: string
}) {
  return (
    <figure className={cn('m-0 flex min-w-0 flex-col gap-2', className)}>
      <div className={cn('relative overflow-hidden rounded-[10px] border border-line bg-viewer', aspect)}>
        <ExamplePicture image={image} sizes={sizes} className="absolute inset-0" />
      </div>
      <figcaption className="text-xs leading-snug text-fg-3">
        {image.diagnosis ? (
          <span className="block text-fg-2">
            Ground truth: {image.diagnosis}
            {image.confirmType ? ` (${image.confirmType})` : ''}
            {image.sourceId ? (
              <>
                ,{' '}
                <a
                  href={image.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[0.6875rem] underline decoration-line-strong underline-offset-2 transition-colors hover:text-fg"
                >
                  {image.sourceId}
                  <span className="sr-only"> on the ISIC Archive (opens in a new tab)</span>
                </a>
              </>
            ) : null}
          </span>
        ) : null}
        {credit ? <span className="mt-0.5 block">{sourceLine(image)}</span> : null}
      </figcaption>
    </figure>
  )
}
