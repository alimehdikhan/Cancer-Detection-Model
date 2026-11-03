import { ArrowUpRight } from 'lucide-react'

import { CodeChip } from '@/components/layout/primitives'
import { useApp } from '@/hooks/app-context'
import { CATEGORY_STYLE } from '@/lib/entries'
import { DERMOSCOPY, type ExampleImage, HERO, PHOTOS, srcSet } from '@/lib/example-images'
import { cn } from '@/lib/utils'

const LICENSE_URL: Record<string, string> = {
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
}

const HERO_SOURCES = new Set(HERO.map((image) => image.sourceId ?? image.id))

/** Every image in the manifest, once per source image (the hero reuses gallery images). */
export const CREDITED: ExampleImage[] = (() => {
  const seen = new Set<string>()
  return [...DERMOSCOPY, ...HERO, ...PHOTOS].filter((image) => {
    const key = image.sourceId ?? image.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})()

const linkClass =
  'rounded-[4px] underline decoration-line-strong underline-offset-2 transition-colors duration-200 hover:text-fg hover:decoration-fg-3'

function CreditItem({ image }: { image: ExampleImage }) {
  const { entries } = useApp()
  const category = entries.find((entry) => entry.code === image.code)?.category
  const style = category ? CATEGORY_STYLE[category] : null
  const licenseUrl = LICENSE_URL[image.license]
  const thumb = image.src.thumb ?? image.src.card ?? image.src.hero ?? image.src.full

  return (
    <li className="flex min-w-0 gap-4 rounded-xl border border-line bg-surface p-3">
      {thumb ? (
        <img
          src={thumb}
          srcSet={srcSet(image)}
          sizes="112px"
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          alt={image.alt}
          className="h-21 w-28 shrink-0 rounded-[10px] bg-viewer object-cover"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex min-w-0 items-start gap-2">
          {image.code ? (
            <CodeChip className={cn('shrink-0', style && `${style.soft} ${style.text} border-transparent`)}>{image.code}</CodeChip>
          ) : null}
          <span className="min-w-0 text-sm leading-5 font-medium text-pretty text-fg">{image.diagnosis ?? image.alt}</span>
        </p>
        {image.confirmType ? <p className="text-xs text-fg-2">Confirmed by {image.confirmType}</p> : null}
        <p className="text-xs text-fg-2">
          <a href={image.sourceUrl} target="_blank" rel="noreferrer" className={cn(linkClass, 'font-mono')}>
            {image.sourceId ?? 'Source'}
            <ArrowUpRight className="ml-0.5 inline size-3 align-[-1px]" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {HERO_SOURCES.has(image.sourceId ?? image.id) ? <span className="text-fg-2"> · also in the hero</span> : null}
        </p>
        <p className="text-xs text-fg-2">
          {licenseUrl ? (
            <a href={licenseUrl} target="_blank" rel="noreferrer" className={linkClass}>
              {image.license}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            image.license
          )}
          {image.attribution ? ` · ${image.attribution}` : null}
        </p>
      </div>
    </li>
  )
}

/** The full credit list for /about#credits: thumbnail, diagnosis, source link, licence, attribution. */
export function ImageCredits() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CREDITED.map((image) => (
        <CreditItem key={image.sourceId ?? image.id} image={image} />
      ))}
    </ul>
  )
}

export const CREDITED_COUNT = CREDITED.length
