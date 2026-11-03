import type * as React from 'react'

import { cn } from '@/lib/utils'

export interface HintProps {
  /** Tooltip text (also exposed to assistive tech through aria-describedby on the trigger). */
  label: React.ReactNode
  /** id for the hint text; pass the same id as aria-describedby on the focusable child. */
  id: string
  side?: 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  className?: string
  children: React.ReactNode
}

/**
 * Zero-JS tooltip: shows on hover and on keyboard focus within (CSS only). Use this on the
 * home route and in the shell instead of Radix Tooltip to keep the initial bundle small.
 * The child must be focusable and carry aria-describedby={id}.
 */
export function Hint({ label, id, side = 'bottom', align = 'center', className, children }: HintProps) {
  return (
    <span className={cn('group/hint relative inline-flex', className)}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none invisible absolute z-50 w-max max-w-72 rounded-md border border-line-strong bg-popover px-2.5 py-1.5 text-xs font-normal tracking-normal text-balance text-popover-foreground normal-case opacity-0 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)] transition-opacity duration-150',
          'group-hover/hint:visible group-hover/hint:opacity-100 group-has-[:focus-visible]/hint:visible group-has-[:focus-visible]/hint:opacity-100',
          side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
          align === 'start' && 'left-0',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'end' && 'right-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}
