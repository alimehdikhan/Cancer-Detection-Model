import { useRef } from 'react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export interface SpotlightCardProps extends React.ComponentProps<'div'> {
  /** Render as another element, e.g. 'article' or 'li'. Default 'div'. */
  as?: 'div' | 'article' | 'li' | 'section'
}

/**
 * A card with a soft brand-tinted light that follows the pointer (CSS variables --spot-x /
 * --spot-y set through CSSOM, no style tags). Hairline border, 14px radius, surface fill.
 * Children render above the light. Static (no light) on touch and when not hovered.
 */
export function SpotlightCard({ as = 'div', className, children, onPointerMove, ...props }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const Comp = as as 'div'

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    const node = ref.current
    if (!node || event.pointerType === 'touch') return
    const rect = node.getBoundingClientRect()
    node.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    node.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }

  return (
    <Comp
      ref={ref}
      onPointerMove={move}
      className={cn(
        'group/spot relative isolate overflow-hidden rounded-xl border border-line bg-surface p-6 transition-colors duration-200 hover:border-line-strong',
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="spotlight pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
      />
      {children}
    </Comp>
  )
}
