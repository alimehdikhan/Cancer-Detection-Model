import * as m from 'motion/react-m'
import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

import { CodeChip } from '@/components/layout/primitives'
import { CATEGORY_LABEL, CATEGORY_STYLE, type Entry } from '@/lib/entries'
import { percent } from '@/lib/format'
import type { Prediction } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Row {
  code: string
  name: string
  category: Entry['category']
  probability: number
}

/** Local entries merged with the response, so a class missing from it shows 0% instead of vanishing. */
function buildRows(entries: Entry[], predictions: Prediction[]): Row[] {
  const byCode = new Map(predictions.map((p) => [p.code, p]))
  const rows: Row[] = entries.map((entry) => ({
    code: entry.code,
    name: byCode.get(entry.code)?.name ?? entry.name,
    category: byCode.get(entry.code)?.category ?? entry.category,
    probability: byCode.get(entry.code)?.probability ?? 0,
  }))
  for (const p of predictions) {
    if (!rows.some((row) => row.code === p.code)) rows.push({ ...p })
  }
  return rows
}

/**
 * The seven-class distribution. Rows start in resting order with empty bars, then spring to
 * their values and re-sort into rank order (instant under reduced motion).
 */
export function Distribution({ entries, predictions }: { entries: Entry[]; predictions: Prediction[] }) {
  const reduced = useReducedMotion()
  const [settled, setSettled] = useState(Boolean(reduced))

  useEffect(() => {
    if (reduced) {
      setSettled(true)
      return
    }
    // Let the resting order paint first, then fill the bars and re-rank.
    const timer = window.setTimeout(() => setSettled(true), 220)
    return () => window.clearTimeout(timer)
  }, [reduced])

  const rows = useMemo(() => buildRows(entries, predictions), [entries, predictions])
  const ranked = useMemo(() => [...rows].sort((a, b) => b.probability - a.probability), [rows])
  const shown = settled ? ranked : rows

  return (
    <div className="@container">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 id="distribution-title" className="eyebrow">
          All seven types
        </h3>
        <p className="eyebrow hidden @md:block" aria-hidden="true">
          Calibrated probability
        </p>
      </div>
      <ol aria-labelledby="distribution-title" className="flex flex-col gap-1">
        {shown.map((row) => {
          const rank = ranked.indexOf(row) + 1
          const style = CATEGORY_STYLE[row.category]
          const top = settled && rank === 1
          return (
            <m.li
              key={row.code}
              layout="position"
              transition={{ type: 'spring', duration: 0.6, bounce: 0.12 }}
              className={cn(
                'relative grid grid-cols-[1.25rem_3.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-[10px] px-2.5 py-2 transition-colors duration-300',
                '@md:grid-cols-[1.25rem_3.25rem_minmax(0,1fr)_minmax(0,9rem)_3rem]',
                top ? 'bg-surface-2' : 'bg-transparent',
              )}
            >
              <span className="sr-only">
                {rank}. {row.name}, {CATEGORY_LABEL[row.category]}, {percent(row.probability)}
              </span>
              <span aria-hidden="true" className="font-mono text-xs text-fg-3 tabular">
                {settled ? rank : '·'}
              </span>
              <span aria-hidden="true">
                <CodeChip className={cn(style.soft, style.text, 'border-transparent')}>{row.code}</CodeChip>
              </span>
              <span aria-hidden="true" className={cn('truncate text-sm', top ? 'font-medium text-fg' : 'text-fg-2')}>
                {row.name}
              </span>
              <span
                aria-hidden="true"
                className="col-span-2 col-start-3 row-start-2 h-1.5 overflow-hidden rounded-full bg-track @md:col-span-1 @md:col-start-auto @md:row-start-auto"
              >
                <span
                  className={cn('bar-fill block h-full rounded-full', style.fill)}
                  style={{ transform: `scaleX(${settled ? Math.max(row.probability, 0.004) : 0})` }}
                />
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'col-start-4 row-start-1 text-right font-mono text-xs tabular @md:col-start-auto @md:row-start-auto',
                  top ? 'text-fg' : 'text-fg-2',
                )}
              >
                {settled ? percent(row.probability) : '—'}
              </span>
            </m.li>
          )
        })}
      </ol>
    </div>
  )
}
