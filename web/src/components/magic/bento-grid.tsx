import type * as React from 'react'

import { cn } from '@/lib/utils'

import { SpotlightCard } from './spotlight-card'

/** Responsive bento grid: 1 column on mobile, 2 on sm, 3 on lg. Use col-span classes on cards. */
export function BentoGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)} {...props} />
}

export interface BentoCardProps {
  /** Lucide icon component, e.g. ShieldCheck. */
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  title: React.ReactNode
  description: React.ReactNode
  /** Optional visual area above the text (a mini chart, a code chip row…). */
  visual?: React.ReactNode
  /** Extra classes, e.g. 'lg:col-span-2' or 'lg:row-span-2'. */
  className?: string
  children?: React.ReactNode
}

/** A spotlight card laid out for the bento grid: optional visual, icon, title, description. */
export function BentoCard({ icon: Icon, title, description, visual, className, children }: BentoCardProps) {
  return (
    <SpotlightCard className={cn('flex flex-col gap-4', className)}>
      {visual ? <div className="relative min-h-0 flex-1">{visual}</div> : null}
      <div className="mt-auto flex flex-col gap-2">
        {Icon ? (
          <span className="mb-1 inline-flex size-9 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-fg-2">
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
        ) : null}
        <h3 className="text-h3 text-fg">{title}</h3>
        <p className="text-[0.9375rem] leading-relaxed text-fg-2">{description}</p>
        {children}
      </div>
    </SpotlightCard>
  )
}
