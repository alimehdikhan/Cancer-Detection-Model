import type * as React from 'react'

import { cn } from '@/lib/utils'

export interface BorderBeamProps {
  /** Length of the light, in px. Default 120. */
  size?: number
  /** Seconds per lap. Default 6. */
  duration?: number
  /** Start delay in seconds (use a negative value to start mid-lap). Default 0. */
  delay?: number
  /** Corner radius of the parent, in px, so the beam follows its outline. Default 14. */
  radius?: number
  /** Border width in px. Default 1. */
  borderWidth?: number
  className?: string
}

/**
 * A short light travelling around the border of its parent. The parent must be `relative`.
 * Static CSS keyframes (.border-beam in index.css); hidden under prefers-reduced-motion.
 * Custom properties are set through React's style prop (CSSOM), which the CSP allows.
 */
export function BorderBeam({ size = 120, duration = 6, delay = 0, radius = 14, borderWidth = 1, className }: BorderBeamProps) {
  const vars = {
    '--beam-duration': `${duration}s`,
    '--beam-delay': `${delay}s`,
    '--beam-radius': `${radius}px`,
    '--beam-border': `${borderWidth}px`,
  } as React.CSSProperties
  return (
    <div
      aria-hidden="true"
      style={vars}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--beam-border) border-transparent',
        // Show only the border ring: intersect a padding-box mask with a border-box mask.
        '[mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000)] [mask-clip:padding-box,border-box] [mask-composite:exclude]',
        className,
      )}
    >
      <div
        className="border-beam absolute aspect-square bg-[linear-gradient(to_left,var(--brand),color-mix(in_oklab,var(--brand)_40%,transparent),transparent)]"
        style={{ width: size } as React.CSSProperties}
      />
    </div>
  )
}
