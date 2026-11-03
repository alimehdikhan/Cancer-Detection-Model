import { useEffect, useRef } from 'react'

import { cn, prefersReducedMotion } from '@/lib/utils'

export interface NumberTickerProps {
  /** Target value. */
  value: number
  /** Value to start from on first run. Default 0. */
  from?: number
  /** Duration in ms. Default 900. */
  duration?: number
  /** Delay before starting, ms. Default 0. */
  delay?: number
  /** Formats each frame's number, e.g. (n) => `${Math.round(n)}%`. Default: rounds to `decimals`. */
  format?: (value: number) => string
  /** Decimal places when no `format` is given. Default 0. */
  decimals?: number
  /** Only start once scrolled into view. Default true. */
  startOnView?: boolean
  className?: string
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

/**
 * Counts up to `value` with requestAnimationFrame, writing textContent directly (no re-render
 * per frame). Under prefers-reduced-motion the final value appears instantly. Tabular figures.
 * When `value` changes it animates from the currently shown number.
 */
export function NumberTicker({
  value,
  from = 0,
  duration = 900,
  delay = 0,
  format,
  decimals = 0,
  startOnView = true,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef(from)
  const formatRef = useRef(format)
  formatRef.current = format

  const render = (n: number) => (formatRef.current ? formatRef.current(n) : n.toFixed(decimals))

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (prefersReducedMotion() || duration <= 0) {
      current.current = value
      node.textContent = render(value)
      return
    }

    let frame = 0
    let timer = 0
    let observer: IntersectionObserver | null = null
    const start = current.current

    const run = () => {
      const began = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - began) / duration)
        const n = start + (value - start) * easeOut(t)
        current.current = n
        node.textContent = render(n)
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }
    const kick = () => {
      timer = window.setTimeout(run, delay)
    }

    if (startOnView && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect()
            kick()
          }
        },
        { threshold: 0.2 },
      )
      observer.observe(node)
    } else {
      kick()
    }

    return () => {
      observer?.disconnect()
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay, startOnView, decimals])

  return (
    <span ref={ref} className={cn('tabular inline-block', className)}>
      {render(prefersReducedMotion() ? value : current.current)}
    </span>
  )
}
