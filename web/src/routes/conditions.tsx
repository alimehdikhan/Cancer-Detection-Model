import { ArrowRight, CalendarClock, ClipboardList, ImageIcon } from 'lucide-react'
import { Link } from 'react-router'

import { CodeChip, Section, SectionHeader } from '@/components/layout/primitives'
import { StatusDot } from '@/components/layout/status-pill'
import { DotPattern } from '@/components/magic/dot-pattern'
import { Reveal } from '@/components/magic/reveal'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/layout/icon-tile'
import { PageHero } from '@/components/layout/page-hero'
import { usePageTitle } from '@/components/layout/page-title'
import { AbcdeGrid } from '@/features/conditions/abcde'
import { ConditionGroup, GROUPS } from '@/features/conditions/condition-groups'
import { useApp } from '@/hooks/app-context'
import { ANALYZE_PATH, type AnalyzeLocationState, analyzePrefetchProps } from '@/hooks/useGoToAnalyze'
import { CATEGORY_STYLE } from '@/lib/entries'
import { DERMOSCOPY } from '@/lib/example-images'
import { middleTruncate } from '@/lib/format'
import { DISCLAIMER } from '@/lib/site'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

const IMAGE_LICENCES = [...new Set(DERMOSCOPY.map((image) => image.license))].join(' / ')

const LEGEND: { category: Category; label: string; meaning: string }[] = [
  { category: 'malignant', label: 'Malignant', meaning: 'Skin cancer.' },
  { category: 'precancerous', label: 'Precancerous', meaning: 'Can turn into cancer.' },
  { category: 'benign', label: 'Benign', meaning: 'Not cancer.' },
]

function LegendPanel() {
  const { entries, status, model } = useApp()
  const live = Boolean(model)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)] sm:p-6">
      <p className="eyebrow">At a glance</p>
      <ul className="mt-4 divide-y divide-line">
        {LEGEND.map((item) => {
          const codes = entries.filter((entry) => entry.category === item.category)
          const style = CATEGORY_STYLE[item.category]
          return (
            <li
              key={item.category}
              className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-full', style.dot)} />
                <p className="text-fg">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-fg-2"> · {item.meaning}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-5.5 sm:pl-0">
                {codes.map((entry) => (
                  <CodeChip
                    key={entry.code}
                    className={cn(style.soft, style.text, 'border-transparent')}
                    title={entry.name}
                  >
                    {entry.code}
                  </CodeChip>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 font-mono text-[0.6875rem] tracking-[0.04em] text-fg-3">
        <StatusDot status={status} />
        {live && model
          ? `Descriptions from model ${middleTruncate(model.version, 24)}`
          : status === 'connecting'
            ? 'Built-in descriptions while the model service connects'
            : 'Built-in descriptions while the model service is unavailable'}
      </p>
    </div>
  )
}

const SEE_A_DOCTOR = [
  'It is new and looks unlike your other spots.',
  'It changes in size, shape or colour.',
  'It shows any of the ABCDE signs above.',
  'It bleeds, itches, crusts or is a sore that doesn’t heal.',
  'It worries you, for any reason.',
]

const WHATEVER_IT_SAYS = [
  'A low-concern result is not an all-clear. Trust a change you can see over a percentage.',
  'Bring the photo, and note how long the spot has been there and whether it has changed.',
  'Photograph it every few weeks in the same light, so any change is easy to see.',
]

export default function ConditionsRoute() {
  usePageTitle('Conditions')
  const { entries, analyzer } = useApp()
  const activeTop = analyzer.active?.result?.top.code

  return (
    <>
      <PageHero
        eyebrow="7 lesion types · HAM10000"
        title="Seven skin lesion types, in plain words."
        description="Every photo is ranked against these seven types from the HAM10000 research dataset. They are grouped by what matters most: whether it is cancer. Each type shows real dermoscopy examples with the diagnosis the archive confirmed."
        aside={<LegendPanel />}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="#types">Browse the types</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="#abcde">ABCDE checklist</Link>
          </Button>
        </div>
      </PageHero>

      <Section id="types" aria-label="Lesion types by group">
        <div className="flex flex-col gap-20 lg:gap-28">
          {GROUPS.map((group) => (
            <ConditionGroup key={group.id} group={group} entries={entries} activeTop={activeTop} />
          ))}
        </div>
        <p className="mt-14 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-6 text-xs leading-relaxed text-fg-3">
          <ImageIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Example images: ISIC Archive, {IMAGE_LICENCES}. They show the archive’s confirmed diagnosis, never a model
            output.
          </span>
          <Link
            to="/about#credits"
            className="font-medium text-fg-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg"
          >
            See credits
          </Link>
        </p>
      </Section>

      <Section id="abcde" aria-labelledby="abcde-title" bordered className="overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80">
          <DotPattern
            className="text-line-strong/70 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,black_10%,transparent_70%)]"
            fade={false}
          />
        </div>
        <div className="relative flex flex-col gap-10">
          <SectionHeader
            eyebrow="Warning signs"
            title="The ABCDE checklist"
            titleId="abcde-title"
            description="Doctors use these five signs to spot melanoma early. Any one of them is a good reason to have a spot looked at."
          />
          <Reveal>
            <AbcdeGrid />
          </Reveal>
        </div>
      </Section>

      <Section aria-labelledby="doctor-title" bordered>
        <div className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Next steps"
            title="When to see a doctor"
            titleId="doctor-title"
            description="Whatever a model says. A checked spot that turns out to be harmless is a good outcome, not a wasted visit."
          />
          <Reveal className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6">
              <div className="flex items-center gap-3">
                <IconTile icon={CalendarClock} />
                <h3 className="text-h3 text-fg">Book an appointment if a spot</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {SEE_A_DOCTOR.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-fg-2">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6">
              <div className="flex items-center gap-3">
                <IconTile icon={ClipboardList} />
                <h3 className="text-h3 text-fg">Whatever Dermsight says</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {WHATEVER_IT_SAYS.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-fg-2">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-fg-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="relative isolate overflow-hidden rounded-2xl border border-line bg-surface px-6 py-10 sm:px-10">
            <div
              aria-hidden="true"
              className="absolute -bottom-24 left-1/2 -z-10 h-56 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-glow blur-3xl"
            />
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h3 className="text-h3 text-fg">Have a photo of a spot?</h3>
                <p className="mt-2 leading-relaxed text-pretty text-fg-2">{DISCLAIMER}</p>
              </div>
              <Button asChild size="lg" className="self-start md:self-auto">
                <Link to={ANALYZE_PATH} state={{ focusDropzone: true } satisfies AnalyzeLocationState} {...analyzePrefetchProps}>
                  Analyze a photo
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  )
}
