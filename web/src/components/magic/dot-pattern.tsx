import { useId } from 'react'

import { cn } from '@/lib/utils'

export interface DotPatternProps {
  /** Grid spacing in px. Default 18. */
  spacing?: number
  /** Dot radius in px. Default 1. */
  radius?: number
  /** Fade the grid out towards the edges with a radial mask. Default true. */
  fade?: boolean
  className?: string
}

/**
 * Decorative SVG dot grid. Absolutely positioned to fill its (relative) parent; colour comes
 * from `currentColor`, default text-line-strong. Override with e.g. className="text-fg/10".
 */
export function DotPattern({ spacing = 18, radius = 1, fade = true, className }: DotPatternProps) {
  const id = useId()
  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full text-line-strong',
        fade && 'mask-radial-fade',
        className,
      )}
    >
      <defs>
        <pattern id={id} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <circle cx={spacing / 2} cy={spacing / 2} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
