import type * as React from 'react'

import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'

export interface RevealProps extends React.ComponentProps<'div'> {
  /** Delay in ms before the reveal transition starts. Default 0. */
  delay?: number
}

/** Fades and rises 8px into place once, when scrolled into view. Instant under reduced motion. */
export function Reveal({ delay = 0, className, style, ...props }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn('reveal', inView && 'is-visible', className)}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...props}
    />
  )
}
