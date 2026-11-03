import { type RefObject, useEffect, useId, useState } from 'react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

export interface AnimatedBeamProps {
  /** The positioned (relative) element that contains both nodes and this beam. */
  containerRef: RefObject<HTMLElement | null>
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  /** Bend of the curve in px (negative bends up). Default 0 (straight). */
  curvature?: number
  /** Seconds per pulse. Default 3. */
  duration?: number
  /** Delay in seconds. Default 0. */
  delay?: number
  /** Run the light from `to` to `from`. Default false. */
  reverse?: boolean
  /** Horizontal / vertical offsets of the start and end points in px. */
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
  className?: string
}

interface Geometry {
  width: number
  height: number
  d: string
}

/**
 * SVG connector between two elements with a dash of brand light running along it.
 * Geometry is measured with ResizeObserver; animation is static CSS (.beam-dash), and the
 * moving light is hidden under prefers-reduced-motion (the base line stays).
 */
export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  duration = 3,
  delay = 0,
  reverse = false,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  className,
}: AnimatedBeamProps) {
  const id = useId()
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const from = fromRef.current
      const to = toRef.current
      if (!from || !to) return
      const box = container.getBoundingClientRect()
      const a = from.getBoundingClientRect()
      const b = to.getBoundingClientRect()
      const x1 = a.left - box.left + a.width / 2 + startXOffset
      const y1 = a.top - box.top + a.height / 2 + startYOffset
      const x2 = b.left - box.left + b.width / 2 + endXOffset
      const y2 = b.top - box.top + b.height / 2 + endYOffset
      const cx = (x1 + x2) / 2
      const cy = (y1 + y2) / 2 - curvature
      setGeometry({ width: box.width, height: box.height, d: `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}` })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    if (fromRef.current) observer.observe(fromRef.current)
    if (toRef.current) observer.observe(toRef.current)
    return () => observer.disconnect()
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset])

  if (!geometry) return null
  const vars = { '--beam-duration': `${duration}s`, '--beam-delay': `${delay}s` } as React.CSSProperties

  return (
    <svg
      aria-hidden="true"
      fill="none"
      width={geometry.width}
      height={geometry.height}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      className={cn('pointer-events-none absolute top-0 left-0 overflow-visible', className)}
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={geometry.d} stroke="var(--line-strong)" strokeWidth={1.5} strokeLinecap="round" />
      <path
        d={geometry.d}
        pathLength={100}
        stroke="var(--brand)"
        strokeWidth={2}
        strokeLinecap="round"
        className="beam-dash"
        style={{ ...vars, animationDirection: reverse ? 'reverse' : 'normal' }}
      />
    </svg>
  )
}
