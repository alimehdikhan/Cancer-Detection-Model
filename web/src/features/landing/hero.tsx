import { ArrowRight, Info } from 'lucide-react'
import { useState } from 'react'
import type * as React from 'react'
import { Link } from 'react-router'

import { CodeChip, Container, Eyebrow } from '@/components/layout/primitives'
import { AnimatedGradientText } from '@/components/magic/animated-gradient-text'
import { DotPattern } from '@/components/magic/dot-pattern'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApp } from '@/hooks/app-context'
import { ANALYZE_PATH, type AnalyzeLocationState, analyzePrefetchProps } from '@/hooks/useGoToAnalyze'
import { CATEGORY_LABEL, CATEGORY_STYLE } from '@/lib/entries'
import { type ExampleImage, HERO } from '@/lib/example-images'
import { cn } from '@/lib/utils'

import { scrollToSection, TYPES_ID } from './anchors'
import { ExamplePicture, pickSrc, sourceLine, ViewfinderCorners } from './example-image'

/** Rendered width of the hero image: about 7/12 of the 72rem container on desktop, full width on phones. */
const HERO_SIZES = '(min-width: 1152px) 620px, (min-width: 1024px) 55vw, calc(100vw - 32px)'

const TICKS = Array.from({ length: 48 }, (_, index) => index)

/** Decorative instrument ring over the image: a dial of ticks and one slowly turning arc. */
function ScanRing() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-radial from-transparent from-45% to-black/45" />
      <div className="absolute top-1/2 left-1/2 aspect-square h-[84%] -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full overflow-visible text-white">
          <circle cx="100" cy="100" r="99" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.6" />
          <circle
            cx="100"
            cy="100"
            r="74"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.22"
            strokeWidth="0.6"
            strokeDasharray="0.6 3.4"
          />
          {TICKS.map((tick) => {
            const major = tick % 12 === 0
            const angle = (tick / TICKS.length) * Math.PI * 2
            const inner = major ? 90 : 95
            return (
              <line
                key={tick}
                x1={(100 + Math.cos(angle) * inner).toFixed(2)}
                y1={(100 + Math.sin(angle) * inner).toFixed(2)}
                x2={(100 + Math.cos(angle) * 99).toFixed(2)}
                y2={(100 + Math.sin(angle) * 99).toFixed(2)}
                stroke="currentColor"
                strokeOpacity={major ? 0.7 : 0.3}
                strokeWidth={major ? 0.9 : 0.6}
              />
            )
          })}
        </svg>
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 size-full overflow-visible motion-safe:animate-spin"
          style={{ animationDuration: '24s' }}
        >
          <circle
            cx="100"
            cy="100"
            r="99"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="12 88"
          />
        </svg>
      </div>
    </div>
  )
}

/** The honest caption that floats over the image: the archive's confirmed diagnosis, never a model output. */
function GroundTruthCard({ image }: { image: ExampleImage }) {
  const { entries } = useApp()
  const entry = entries.find((item) => item.code === image.code)
  const style = entry ? CATEGORY_STYLE[entry.category] : null

  return (
    <div
      className={cn(
        'relative z-10 mx-3 -mt-12 rounded-xl border border-line-strong bg-surface p-4 shadow-[0_12px_32px_-16px_rgb(0_0_0/0.45)] sm:mx-6 sm:-mt-14 sm:p-5',
        'lg:absolute lg:-bottom-10 lg:-left-10 lg:mx-0 lg:mt-0 lg:w-[20rem]',
      )}
      aria-live="polite"
    >
      <p className="eyebrow flex items-center gap-2">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-fg-3" />
        Ground truth<span className="sr-only">:</span>
      </p>
      <p className="mt-2 leading-snug font-medium text-fg">
        {image.diagnosis ?? 'Unknown diagnosis'}
        {image.confirmType ? <span className="font-normal text-fg-2"> ({image.confirmType})</span> : null}
        {image.sourceId ? <span className="sr-only">, {image.sourceId}</span> : null}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {entry && style ? (
          <>
            <CodeChip className={cn(style.soft, style.text, 'border-transparent')}>{entry.code}</CodeChip>
            <Badge variant={style.badge}>{CATEGORY_LABEL[entry.category]}</Badge>
          </>
        ) : null}
        {image.sourceId ? (
          <span aria-hidden="true" className="ml-auto font-mono text-[0.6875rem] tracking-wide text-fg-3">
            {image.sourceId}
          </span>
        ) : null}
      </div>
      <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-fg-3">
        Diagnosis confirmed by the archive, not a model output. {sourceLine(image)}.
      </p>
    </div>
  )
}

/** The hero composition: a framed real dermoscopy image, a scan ring, a filmstrip and the ground-truth card. */
function HeroVisual() {
  const [index, setIndex] = useState(0)
  const image = HERO[index] ?? HERO[0]

  if (!image) return null

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-x-6 -top-10 -bottom-6 -z-10 sm:-inset-x-12">
        <DotPattern spacing={20} className="text-line-strong" />
        <div className="absolute top-1/4 left-1/2 h-72 w-[80%] -translate-x-1/2 rounded-full bg-glow blur-3xl" />
      </div>

      <figure className="relative m-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)]">
        <div className="flex h-11 items-center justify-between gap-3 border-b border-line px-4">
          <span className="flex min-w-0 items-center gap-2 font-mono text-[0.6875rem] tracking-[0.08em] text-fg-3 uppercase">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand" />
            <span className="truncate">Dermoscopy · ISIC Archive</span>
          </span>
          <span className="shrink-0 font-mono text-[0.6875rem] tracking-[0.08em] text-fg-3 uppercase tabular">
            {String(index + 1).padStart(2, '0')} / {String(HERO.length).padStart(2, '0')}
          </span>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-viewer">
          <ExamplePicture
            key={image.id}
            image={image}
            sizes={HERO_SIZES}
            prefer="hero"
            priority={index === 0}
            className="absolute inset-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500"
          />
          <ScanRing />
          <ViewfinderCorners inset="md" />

          {HERO.length > 1 ? (
            <div role="group" aria-label="Example images" className="absolute top-4 right-4 flex flex-col gap-2">
              {HERO.map((item, itemIndex) => {
                const active = itemIndex === index
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={`Example ${itemIndex + 1}: ${item.diagnosis ?? item.alt}`}
                    onClick={() => setIndex(itemIndex)}
                    className={cn(
                      'relative size-11 overflow-hidden rounded-[8px] border bg-viewer transition-[opacity,border-color] duration-200',
                      active ? 'border-white/90 opacity-100' : 'border-white/30 opacity-70 hover:border-white/60 hover:opacity-100',
                    )}
                  >
                    <img
                      src={pickSrc(item, 'thumb')}
                      width={item.width}
                      height={item.height}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="size-full object-cover select-none"
                    />
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </figure>

      <GroundTruthCard image={image} />
    </div>
  )
}

/** Landing hero: the promise and two calls to action on the left, a real dermoscopy composition on the right. */
export function LandingHero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-x-clip pt-10 pb-16 sm:pt-14 lg:pt-20 lg:pb-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="flex min-w-0 flex-col lg:col-span-6 xl:col-span-5">
            <div className="animate-rise">
              <Eyebrow>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                Research preview · 7 lesion types · HAM10000
              </Eyebrow>
            </div>
            <h1 id="hero-title" className="mt-6 text-display text-balance text-fg animate-rise [animation-delay:60ms]">
              A second look at a skin spot, <AnimatedGradientText>in seconds.</AnimatedGradientText>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-pretty text-fg-2 animate-rise [animation-delay:120ms]">
              Upload a close-up photo. A calibrated model ranks seven lesion types, says how sure it is, and suggests what to
              do next. It is not a diagnosis.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-rise [animation-delay:180ms]">
              <Button size="lg" asChild>
                <Link to={ANALYZE_PATH} state={{ focusDropzone: true } satisfies AnalyzeLocationState} {...analyzePrefetchProps}>
                  Analyze a photo
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={`#${TYPES_ID}`} onClick={(event: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(event, TYPES_ID)}>
                  See the seven types
                </a>
              </Button>
            </div>
            <p className="mt-10 flex max-w-md items-start gap-2 border-t border-line pt-5 text-[0.8125rem] leading-relaxed text-fg-3 animate-rise [animation-delay:240ms]">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                The images on this page are real dermoscopy from the ISIC Archive, shown with the diagnosis the archive
                confirmed. No result on them comes from this model.
              </span>
            </p>
          </div>

          <div className="min-w-0 animate-rise [animation-delay:120ms] lg:col-span-6 xl:col-span-7">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  )
}
