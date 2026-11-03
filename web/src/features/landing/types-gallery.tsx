import { ArrowRight, ListChecks } from 'lucide-react'
import { Link } from 'react-router'

import { IconTile } from '@/components/layout/icon-tile'
import { CodeChip, Section, SectionHeader } from '@/components/layout/primitives'
import { DotPattern } from '@/components/magic/dot-pattern'
import { Reveal } from '@/components/magic/reveal'
import { Badge } from '@/components/ui/badge'
import { useApp } from '@/hooks/app-context'
import { CATEGORY_LABEL, CATEGORY_STYLE, type Entry } from '@/lib/entries'
import { examplesFor } from '@/lib/example-images'
import { cn } from '@/lib/utils'

import { TYPES_ID } from './anchors'
import { ExamplePicture, groundTruth } from './example-image'

/** Four columns on desktop, two on tablets, a 112px square beside the text on phones. */
const CARD_SIZES = '(min-width: 1024px) 264px, (min-width: 640px) calc(50vw - 40px), 112px'

/** Whole-card link target with a visible focus ring on the card (the link itself stretches over it). */
const CARD = cn(
  'group relative flex min-h-28 overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-200 hover:border-line-strong',
  'has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring',
)
const STRETCHED = 'outline-none after:absolute after:inset-0 after:rounded-xl'

function TypeCard({ entry }: { entry: Entry }) {
  const image = examplesFor(entry.code)[0]
  const style = CATEGORY_STYLE[entry.category]
  const truth = image ? groundTruth(image) : null

  return (
    <li className={cn(CARD, 'sm:flex-col')}>
      <div className="relative w-28 shrink-0 overflow-hidden bg-viewer sm:aspect-[4/3] sm:w-auto">
        {image ? (
          <ExamplePicture
            image={image}
            sizes={CARD_SIZES}
            className="absolute inset-0 transition-transform duration-700 ease-out-quint motion-safe:group-hover:scale-[1.04]"
          />
        ) : (
          <DotPattern className="text-white/20" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <CodeChip className={cn(style.soft, style.text, 'border-transparent')}>{entry.code}</CodeChip>
          <Badge variant={style.badge}>{CATEGORY_LABEL[entry.category]}</Badge>
        </div>
        <h3 className="text-base leading-snug font-semibold tracking-[-0.01em] text-balance text-fg">
          <Link to={`/conditions#${entry.code}`} className={STRETCHED}>
            {entry.name}
          </Link>
        </h3>
        <p className="hidden text-sm leading-relaxed text-pretty text-fg-2 sm:block">{entry.note}</p>
        {image && truth ? (
          <p className="mt-auto pt-1 text-[0.6875rem] leading-snug text-pretty text-fg-3">
            {truth} · {image.license}
          </p>
        ) : null}
      </div>
    </li>
  )
}

/** "Seven types it can tell apart": one real, captioned example per class, each linking to its guide entry. */
export function TypesGallery() {
  const { entries } = useApp()

  return (
    <Section id={TYPES_ID} tabIndex={-1} aria-labelledby="types-title" bordered className="outline-none">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <Reveal>
          <SectionHeader
            eyebrow="Seven types"
            title="Seven types it can tell apart."
            titleId="types-title"
            description="Every photo is ranked against these seven lesion types. Each example is a real dermoscopy image with the diagnosis the archive confirmed."
          />
        </Reveal>
        <Link
          to="/conditions"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-medium text-fg-2 transition-colors hover:text-fg"
        >
          All conditions
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <Reveal delay={80} className="mt-12">
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {entries.map((entry) => (
            <TypeCard key={entry.code} entry={entry} />
          ))}
          <li className={cn(CARD, 'isolate flex-col justify-between gap-6 border-dashed border-line-strong bg-surface-2/40 p-5')}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              <DotPattern spacing={16} className="text-line-strong" />
            </div>
            <IconTile icon={ListChecks} />
            <div className="flex flex-col gap-2">
              <h3 className="text-base leading-snug font-semibold tracking-[-0.01em] text-fg">
                <Link to="/conditions#abcde" className={STRETCHED}>
                  Know the warning signs
                </Link>
              </h3>
              <p className="text-sm leading-relaxed text-pretty text-fg-2">
                The ABCDE checklist, and when to see a doctor whatever a model says.
              </p>
            </div>
            <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
              Open the guide
              <ArrowRight className="size-4" />
            </span>
          </li>
        </ul>
      </Reveal>
      <p className="mt-6 text-xs leading-relaxed text-fg-3">
        Examples are for orientation only. A model result appears only for a photo you analyze yourself.
      </p>
    </Section>
  )
}
