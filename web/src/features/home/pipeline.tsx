import { ArrowRight, ListOrdered, Monitor, Server } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router'

import { Section, SectionHeader } from '@/components/layout/primitives'
import { AnimatedBeam } from '@/components/magic/animated-beam'
import { Reveal } from '@/components/magic/reveal'
import { useApp } from '@/hooks/app-context'

export const HOW_IT_WORKS_ID = 'how-it-works'

/** How it works: Your browser → model service → calibrated result, joined by animated beams. */
export function Pipeline() {
  const { model } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const browserRef = useRef<HTMLSpanElement>(null)
  const serviceRef = useRef<HTMLSpanElement>(null)
  const resultRef = useRef<HTMLSpanElement>(null)

  const views = model?.tta_views ?? 1
  const steps = [
    {
      ref: browserRef,
      icon: Monitor,
      title: 'Your browser',
      caption: 'Applies the photo’s orientation, resizes it to at most 1024 px and strips metadata such as GPS.',
    },
    {
      ref: serviceRef,
      icon: Server,
      title: 'Model service',
      caption: model
        ? `Validates the image and reads it at ${model.image_size} px${views > 1 ? `, averaging ${views} flipped views` : ''}. The photo is then discarded.`
        : 'Validates the image and reads it at the model’s input size. The photo is then discarded.',
    },
    {
      ref: resultRef,
      icon: ListOrdered,
      title: 'Calibrated result',
      caption: 'Seven calibrated probabilities, a concern level and next steps. Only the numbers are cached.',
    },
  ]

  return (
    <Section id={HOW_IT_WORKS_ID} tabIndex={-1} aria-labelledby="pipeline-title" bordered className="outline-none">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <Reveal>
          <SectionHeader
            eyebrow="How it works"
            title="From photo to answer in three steps."
            titleId="pipeline-title"
            description="Nothing is stored along the way. The photo exists only in your tab and, briefly, in the service’s memory."
          />
        </Reveal>
        <Link
          to="/about"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-medium text-fg-2 transition-colors hover:text-fg"
        >
          The full pipeline
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div ref={containerRef} className="relative mt-12">
        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="relative z-10 rounded-xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                  <span
                    ref={step.ref}
                    className="relative z-10 inline-flex size-11 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-fg"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-fg-3 tabular">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-5 text-h3 text-fg">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-2">{step.caption}</p>
              </li>
            )
          })}
        </ol>
        <AnimatedBeam containerRef={containerRef} fromRef={browserRef} toRef={serviceRef} duration={3.2} />
        <AnimatedBeam containerRef={containerRef} fromRef={serviceRef} toRef={resultRef} duration={3.2} delay={1.6} />
      </div>
    </Section>
  )
}
