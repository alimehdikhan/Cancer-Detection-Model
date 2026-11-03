import type * as React from 'react'

import { cn } from '@/lib/utils'

/** Page container: max 72rem, 16px gutters on phones, 24px on sm, 32px on lg. */
export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)} {...props} />
}

export interface SectionProps extends React.ComponentProps<'section'> {
  /** Vertical rhythm. 'default' = py-20 lg:py-28, 'tight' = py-12 lg:py-16, 'none' = no padding. */
  spacing?: 'default' | 'tight' | 'none'
  /** Hairline top border. Default false. */
  bordered?: boolean
  /** Wrap children in <Container>. Default true. */
  contained?: boolean
}

/** A page section with consistent spacing; pass id + aria-labelledby for landmarks. */
export function Section({ spacing = 'default', bordered = false, contained = true, className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        'relative', // anchor offset: html scroll-padding-top in index.css (= the header height)
        spacing === 'default' && 'py-20 lg:py-28',
        spacing === 'tight' && 'py-12 lg:py-16',
        bordered && 'border-t border-line',
        className,
      )}
      {...props}
    >
      {contained ? <Container>{children}</Container> : children}
    </section>
  )
}

export interface SectionHeaderProps {
  /** Mono uppercase micro-label above the title. */
  eyebrow?: React.ReactNode
  title: React.ReactNode
  /** id for the <h2>, to pair with the section's aria-labelledby. */
  titleId?: string
  description?: React.ReactNode
  align?: 'left' | 'center'
  /** Heading level. Default 2. */
  as?: 'h1' | 'h2'
  className?: string
}

/** Eyebrow + H2 (text-h2) + optional lead paragraph. */
export function SectionHeader({ eyebrow, title, titleId, description, align = 'left', as = 'h2', className }: SectionHeaderProps) {
  const Heading = as
  return (
    <div className={cn('flex max-w-2xl flex-col gap-3', align === 'center' && 'mx-auto items-center text-center', className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Heading id={titleId} className={cn(as === 'h1' ? 'text-display' : 'text-h2', 'text-fg')}>
        {title}
      </Heading>
      {description ? <p className="text-lg leading-relaxed text-fg-2">{description}</p> : null}
    </div>
  )
}

/** Mono uppercase label pill, e.g. the hero eyebrow "Research preview · 7 lesion types". */
export function Eyebrow({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-xs tracking-[0.08em] text-fg-2 uppercase',
        className,
      )}
      {...props}
    />
  )
}

/** Small mono code chip, e.g. "mel". Pass a category soft/text class for colour. */
export function CodeChip({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-[6px] border border-line bg-surface-2 px-1.5 font-mono text-[0.6875rem] font-medium tracking-wide text-fg-2 uppercase',
        className,
      )}
      {...props}
    />
  )
}
