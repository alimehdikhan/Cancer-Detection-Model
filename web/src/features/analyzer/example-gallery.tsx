import { ArrowRight, Images } from 'lucide-react'
import { Link } from 'react-router'

import { CodeChip } from '@/components/layout/primitives'
import type { Entry } from '@/lib/entries'
import { CATEGORY_STYLE } from '@/lib/entries'
import { examplesFor, type ExampleImage, srcSet } from '@/lib/example-images'
import { cn } from '@/lib/utils'

import { sampleRef } from './ground-truth'

/** One real example per class, in the app's resting order (malignant first). */
export function galleryItems(entries: Entry[]) {
  return entries.flatMap((entry) => {
    const image = examplesFor(entry.code)[0]
    return image ? [{ entry, image }] : []
  })
}

/**
 * "Try a real example": licensed ISIC dermoscopy images with a confirmed diagnosis. Picking one
 * sends it through the live API like any upload; the result then shows its ground truth.
 */
export function ExampleGallery({
  entries,
  disabled,
  activeId,
  onPick,
  className,
}: {
  entries: Entry[]
  disabled: boolean
  /** id of the example currently on the canvas, if any. */
  activeId: string | null
  onPick: (image: ExampleImage) => void
  className?: string
}) {
  const items = galleryItems(entries)
  if (items.length === 0) return null
  const licenses = [...new Set(items.map(({ image }) => image.license))].join(' and ')
  const confirmTypes = new Set(items.map(({ image }) => image.confirmType))
  const confirmed =
    confirmTypes.size === 1 && confirmTypes.has('histopathology')
      ? 'whose diagnosis was confirmed by histopathology'
      : 'with a diagnosis recorded by the archive'

  return (
    <section aria-labelledby="examples-title" className={cn('rounded-2xl border border-line bg-surface p-4 sm:p-5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="examples-title" className="text-base font-semibold text-fg">
          Try a real example
        </h2>
        <p className="eyebrow">ISIC Archive · {licenses}</p>
      </div>
      <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-fg-2">
        Dermoscopy images {confirmed}. Each one goes through the live model, so you can compare its answer with the
        ground truth.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4">
        {items.map(({ entry, image }) => {
          const active = image.id === activeId
          const style = CATEGORY_STYLE[entry.category]
          return (
            <li key={image.id} className="min-w-0">
              <button
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onPick(image)}
                className={cn(
                  'group/ex flex w-full flex-col overflow-hidden rounded-xl border bg-canvas text-left transition-[border-color,box-shadow,transform] duration-150 ease-out-quint',
                  'hover:border-line-strong active:scale-[0.98] disabled:cursor-progress disabled:opacity-60',
                  active ? 'border-brand ring-2 ring-brand/25' : 'border-line',
                )}
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-viewer">
                  <img
                    src={image.src.thumb ?? image.src.card}
                    srcSet={srcSet(image)}
                    sizes="(min-width: 1280px) 11rem, (min-width: 640px) 24vw, 46vw"
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    alt=""
                    draggable={false}
                    className="size-full object-cover transition-transform duration-500 ease-out-quint select-none group-hover/ex:scale-[1.03]"
                  />
                </span>
                <span className="flex min-w-0 flex-col gap-1.5 p-2.5">
                  <span className="sr-only">Analyze this example. Ground truth: </span>
                  <span className="line-clamp-2 min-h-[2.5rem] text-[0.8125rem] leading-tight font-medium text-fg">
                    {image.diagnosis}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <CodeChip className={cn(style.soft, style.text, 'border-transparent')}>{entry.code}</CodeChip>
                    <span className="truncate font-mono text-[0.625rem] tracking-[0.04em] text-fg-3 uppercase">
                      {sampleRef(image)}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {/* Fills the eighth cell (7 examples in a 2- or 4-column grid) with the way to the full credits. */}
        <li className="min-w-0">
          <Link
            to="/about#credits"
            className="group/cr flex h-full min-h-40 w-full flex-col justify-between gap-3 rounded-xl border border-dashed border-line-strong bg-canvas p-3 text-left transition-colors duration-150 hover:border-fg-3 hover:bg-surface-2/60"
          >
            <Images className="size-4 text-fg-3" aria-hidden="true" />
            <span className="flex flex-col gap-1">
              <span className="text-[0.8125rem] leading-tight font-medium text-fg">Image credits</span>
              <span className="text-xs leading-snug text-fg-2">Source, licence and attribution for every example</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[0.625rem] tracking-[0.04em] text-fg-2 uppercase">
              About · credits
              <ArrowRight
                className="size-3 transition-transform duration-150 ease-out-quint group-hover/cr:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </li>
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-fg-3">
        Images from the ISIC Archive (isic-archive.com), {licenses}; attribution as listed by the archive. Shown for
        education only.{' '}
        <Link to="/about#credits" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
          Image credits
        </Link>
      </p>
    </section>
  )
}
