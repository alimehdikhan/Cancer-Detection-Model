import { ArrowRight, Gauge, Scale, ShieldCheck, Stethoscope } from 'lucide-react'
import { Link } from 'react-router'

import { IconTile } from '@/components/layout/icon-tile'
import { Section, SectionHeader } from '@/components/layout/primitives'
import { Reveal } from '@/components/magic/reveal'
import { DERMOSCOPY, examplesFor, PHOTOS } from '@/lib/example-images'

import { ExamplePicture, groundTruth, sourceLine, ViewfinderCorners } from './example-image'

const POINTS = [
  {
    icon: ShieldCheck,
    title: 'Photos are never stored',
    text: 'Your browser applies the orientation, resizes the photo to at most 1024 px and strips metadata such as GPS. The service reads it once in memory and discards it.',
  },
  {
    icon: Gauge,
    title: 'Confidence you can read',
    text: 'A trained model is calibrated on held-out photos, so a 70% reading is right about 70% of the time on photos like the training set. Below 50%, the result says it is unsure.',
  },
  {
    icon: Scale,
    title: 'Numbers from the model, not from us',
    text: 'Every metric on this site is read live from the running service. An untrained model shows no numbers at all.',
  },
  {
    icon: Stethoscope,
    title: 'Not a diagnosis',
    text: 'Dermsight is an educational tool, not a medical device. Only a clinician, usually with dermoscopy or a biopsy, can diagnose a skin lesion.',
  },
] as const

const FLOW = [
  ['Leaves your browser', '≤ 1024 px JPEG, no metadata'],
  ['Kept by the service', 'Numbers only, never the photo'],
  ['Session history', 'This tab only, cleared on close'],
] as const

/** Privacy and honesty: a real image with its caption, what leaves the browser, and four plain promises. */
export function PrivacySection() {
  const image = PHOTOS[0] ?? examplesFor('nv')[1] ?? DERMOSCOPY[0]
  const truth = image ? groundTruth(image) : null

  return (
    <Section aria-labelledby="privacy-title" bordered>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <Reveal className="flex flex-col gap-4 lg:col-span-5">
          {image ? (
            <figure className="m-0 overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-viewer">
                <ExamplePicture image={image} sizes="(min-width: 1024px) 440px, calc(100vw - 32px)" className="absolute inset-0" />
                <ViewfinderCorners />
                <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[0.6875rem] tracking-[0.06em] text-white/90 uppercase">
                  {image.kind === 'photo' ? 'Photo' : 'Dermoscopy'}
                </span>
              </div>
              <figcaption className="border-t border-line px-4 py-3 text-xs leading-relaxed text-fg-3">
                {truth ? <span className="block text-fg-2">{truth}</span> : null}
                <span className="block">{sourceLine(image)}</span>
              </figcaption>
            </figure>
          ) : null}
          <dl className="divide-y divide-line rounded-xl border border-line bg-surface">
            {FLOW.map(([term, value]) => (
              <div key={term} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt className="text-sm text-fg-2">{term}</dt>
                <dd className="font-mono text-[0.8125rem] text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="flex flex-col gap-10 lg:col-span-7 lg:pt-2">
          <Reveal>
            <SectionHeader
              eyebrow="Privacy and honesty"
              title="Private by design. Honest about its limits."
              titleId="privacy-title"
              description="A careful tool says what it does with your photo and what it cannot know. Here is both, in plain words."
            />
          </Reveal>
          <Reveal delay={80}>
            <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {POINTS.map(({ icon, title, text }) => (
                <li key={title} className="flex flex-col gap-3">
                  <IconTile icon={icon} />
                  <h3 className="text-h3 text-fg">{title}</h3>
                  <p className="text-[0.9375rem] leading-relaxed text-fg-2">{text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6">
            <Link
              to="/about#privacy"
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-fg-2 transition-colors hover:text-fg"
            >
              How your photo is handled
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/about#limitations"
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-fg-2 transition-colors hover:text-fg"
            >
              What it can’t do
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  )
}
