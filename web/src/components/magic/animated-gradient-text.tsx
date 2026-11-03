import type * as React from 'react'

import { cn } from '@/lib/utils'

export interface AnimatedGradientTextProps extends React.ComponentProps<'span'> {
  /** Pan the gradient slowly. Default true (static under prefers-reduced-motion). */
  animate?: boolean
}

/**
 * Text filled with a subtle fg → brand → fg gradient that pans slowly. Use at most once per
 * page (e.g. one phrase of the hero headline). Colours stay AA in both themes.
 */
export function AnimatedGradientText({ animate = true, className, ...props }: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        'bg-[linear-gradient(90deg,var(--fg)_0%,var(--brand)_35%,var(--fg)_70%,var(--brand)_100%)] bg-[length:200%_auto] bg-clip-text text-transparent [-webkit-background-clip:text]',
        animate && 'animate-gradient-pan',
        className,
      )}
      {...props}
    />
  )
}
