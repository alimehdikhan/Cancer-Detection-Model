import { CodeChip } from '@/components/layout/primitives'
import { Reveal } from '@/components/magic/reveal'
import { SpotlightCard } from '@/components/magic/spotlight-card'
import { Badge } from '@/components/ui/badge'
import { ExampleFigure, sourceLine } from '@/features/landing/example-image'
import { CATEGORY_LABEL, CATEGORY_STYLE, type Entry } from '@/lib/entries'
import { examplesFor } from '@/lib/example-images'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

export const GROUPS: {
  id: string
  title: string
  meaning: string
  categories: Category[]
  description: string
}[] = [
  {
    id: 'cancer',
    title: 'Cancer and pre-cancer',
    meaning: 'See a doctor',
    categories: ['malignant', 'precancerous'],
    description:
      'These types are skin cancer or can turn into it. All of them are far easier to treat when found early, so any suspicion deserves a prompt check.',
  },
  {
    id: 'not-cancer',
    title: 'Not cancer',
    meaning: 'Usually harmless',
    categories: ['benign'],
    description:
      'These types are benign. Some can look like melanoma, which is why doctors sometimes examine or remove them to be sure.',
  },
]

/** Rendered width of one example: two per card, cards two-up on the 8/12 column (wide cards span both). */
const FIGURE_SIZES = '(min-width: 1024px) 160px, (min-width: 640px) 22vw, 45vw'
const WIDE_FIGURE_SIZES = '(min-width: 1024px) 330px, 45vw'

function ConditionCard({ entry, isYou, wide }: { entry: Entry; isYou: boolean; wide: boolean }) {
  const style = CATEGORY_STYLE[entry.category]
  const examples = examplesFor(entry.code).slice(0, 2)
  // One credit line under both figures when they share origin and licence.
  const credits = new Set(examples.map(sourceLine))
  const sharedCredit = examples.length > 1 && credits.size === 1 ? [...credits][0] : null
  return (
    <SpotlightCard
      as="li"
      id={entry.code}
      className={cn('flex scroll-mt-24 flex-col gap-4', wide && 'sm:col-span-2', isYou && 'border-brand/50')}
    >
      {examples.length ? (
        <div className="flex flex-col gap-2">
          <div className={cn('grid gap-3', examples.length > 1 && 'grid-cols-2')}>
            {examples.map((image) => (
              <ExampleFigure
                key={image.id}
                image={image}
                sizes={wide ? WIDE_FIGURE_SIZES : FIGURE_SIZES}
                credit={!sharedCredit}
              />
            ))}
          </div>
          {sharedCredit ? <p className="text-xs text-fg-3">{sharedCredit}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <CodeChip className={cn(style.soft, style.text, 'border-transparent')}>{entry.code}</CodeChip>
        <Badge variant={style.badge}>{CATEGORY_LABEL[entry.category]}</Badge>
        {isYou ? <Badge variant="brand">Your latest result</Badge> : null}
      </div>
      <h3 className="text-h3 text-balance text-fg">{entry.name}</h3>
      <p className={cn('text-[0.9375rem] leading-relaxed text-pretty text-fg-2', wide && 'sm:max-w-[68ch]')}>
        {entry.description}
      </p>
    </SpotlightCard>
  )
}

/** One group: a sticky explanation on the left, the condition cards on the right. */
export function ConditionGroup({
  group,
  entries,
  activeTop,
}: {
  group: (typeof GROUPS)[number]
  entries: Entry[]
  activeTop: string | undefined
}) {
  const members = entries.filter((entry) => group.categories.includes(entry.category))
  const titleId = `group-${group.id}-title`
  return (
    <section aria-labelledby={titleId} className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-4">
        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 font-mono text-xs tracking-[0.08em] text-fg-3 uppercase">
            <span className="flex -space-x-0.5" aria-hidden="true">
              {group.categories.map((category) => (
                <span
                  key={category}
                  className={cn('size-2 rounded-full ring-2 ring-canvas', CATEGORY_STYLE[category].dot)}
                />
              ))}
            </span>
            {group.meaning}
          </p>
          <h2 id={titleId} className="text-h2 text-fg">
            {group.title}
          </h2>
          <p className="leading-relaxed text-pretty text-fg-2">{group.description}</p>
          <p className="font-mono text-xs text-fg-3 tabular">
            {members.length} {members.length === 1 ? 'type' : 'types'} ·{' '}
            {group.categories.map((category) => CATEGORY_LABEL[category]).join(' and ')}
          </p>
        </div>
      </div>
      <Reveal className="lg:col-span-8">
        <ul className="grid gap-4 sm:grid-cols-2">
          {members.map((entry, index) => (
            <ConditionCard
              key={entry.code}
              entry={entry}
              isYou={entry.code === activeTop}
              wide={members.length % 2 === 1 && index === 0}
            />
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
