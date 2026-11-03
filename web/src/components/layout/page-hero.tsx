import type * as React from 'react'

import { DotPattern } from '@/components/magic/dot-pattern'
import { cn } from '@/lib/utils'

import { Container, Eyebrow } from './primitives'

export interface PageHeroProps {
  /** Mono pill above the title. */
  eyebrow: React.ReactNode
  /** The page's single h1. */
  title: React.ReactNode
  description?: React.ReactNode
  /** Actions or meta under the description. */
  children?: React.ReactNode
  /** Right-hand panel on large screens; stacks under the text on small screens. */
  aside?: React.ReactNode
  className?: string
}

const delay = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` })

/**
 * Header band shared by the secondary pages: dot grid fading from the top, a faint violet glow,
 * eyebrow pill, display h1 and lead. Elements rise in once (instant under reduced motion).
 */
export function PageHero({ eyebrow, title, description, children, aside, className }: PageHeroProps) {
  return (
    <section
      aria-labelledby="page-title"
      className={cn('relative isolate overflow-hidden border-b border-line', className)}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <DotPattern
          fade={false}
          className="text-line-strong/80 [mask-image:radial-gradient(ellipse_80%_70%_at_30%_0%,black_10%,transparent_75%)]"
        />
        <div className="absolute -top-56 left-[8%] h-[28rem] w-[44rem] max-w-[140%] rounded-full bg-glow opacity-80 blur-3xl" />
      </div>
      <Container
        className={cn(
          'grid gap-12 pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20',
          aside ? 'lg:grid-cols-12 lg:items-center lg:gap-10' : undefined,
        )}
      >
        <div className={cn('flex min-w-0 flex-col items-start gap-5', aside ? 'lg:col-span-7' : 'max-w-3xl')}>
          <Eyebrow className="animate-rise">{eyebrow}</Eyebrow>
          <h1 id="page-title" className="animate-rise text-display text-balance text-fg" style={delay(60)}>
            {title}
          </h1>
          {description ? (
            <p className="animate-rise max-w-[60ch] text-lg leading-relaxed text-pretty text-fg-2" style={delay(120)}>
              {description}
            </p>
          ) : null}
          {children ? (
            <div className="animate-rise w-full pt-1" style={delay(180)}>
              {children}
            </div>
          ) : null}
        </div>
        {aside ? (
          <div className="animate-rise min-w-0 lg:col-span-5" style={delay(220)}>
            {aside}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
