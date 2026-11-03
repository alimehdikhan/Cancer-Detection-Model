import type * as React from 'react'

import { cn } from '@/lib/utils'

/** Shimmering placeholder. The shimmer stops under prefers-reduced-motion. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--track)_0%,var(--line-strong)_50%,var(--track)_100%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
