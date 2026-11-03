import * as m from 'motion/react-m'
import { useState } from 'react'

import { CodeChip } from '@/components/layout/primitives'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useInView } from '@/hooks/useInView'
import { CATEGORY_LABEL, CATEGORY_STYLE, type Entry } from '@/lib/entries'
import { integer, metricPercent } from '@/lib/format'
import type { Metrics } from '@/lib/types'
import { cn } from '@/lib/utils'

function MetricBar({
  label,
  value,
  fill,
  muted,
  shown,
  delay,
}: {
  label: string
  value: number | null | undefined
  fill: string
  muted?: boolean
  shown: boolean
  delay: number
}) {
  const scale = shown && value != null && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_3.5rem] items-center gap-3">
      <span className="font-mono text-[0.6875rem] tracking-[0.06em] text-fg-3 uppercase">{label}</span>
      <span aria-hidden="true" className="relative h-1.5 overflow-hidden rounded-full bg-track">
        <span
          className={cn('bar-fill absolute inset-0 rounded-full', fill, muted && 'opacity-50')}
          style={{
            transform: `scaleX(${scale})`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </span>
      <span className={cn('text-right font-mono text-sm tabular', value == null ? 'text-fg-3' : 'text-fg')}>
        {metricPercent(value)}
      </span>
    </div>
  )
}

type Order = 'type' | 'recall' | 'precision'

function score(metrics: Metrics | null, code: string, order: Order): number {
  const row = metrics?.per_class?.[code]
  if (!row) return -1
  return order === 'recall' ? row.recall : row.precision
}

/** Recall and precision per lesion type, with F1 and the number of test photos (n). */
export function PerClassTable({
  entries,
  metrics,
  activeTop,
}: {
  entries: Entry[]
  metrics: Metrics | null
  activeTop: string | undefined
}) {
  const [ref, inView] = useInView<HTMLOListElement>()
  const [order, setOrder] = useState<Order>('type')
  const sortable = Boolean(metrics?.per_class && Object.keys(metrics.per_class).length > 0)
  const rows =
    sortable && order !== 'type'
      ? [...entries].sort((a, b) => score(metrics, b.code, order) - score(metrics, a.code, order))
      : entries

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          aria-hidden="true"
          className="flex items-center gap-5 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-3 uppercase"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-6 rounded-full bg-fg-2" />
            Recall
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-6 rounded-full bg-fg-2 opacity-50" />
            Precision
          </span>
        </div>
        {sortable ? (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={order}
            onValueChange={(value) => {
              if (value) setOrder(value as Order)
            }}
            aria-label="Order the rows by"
            className="gap-1 p-0"
          >
            <ToggleGroupItem value="type" className="h-9 px-3 text-xs">
              Type
            </ToggleGroupItem>
            <ToggleGroupItem value="recall" className="h-9 px-3 text-xs">
              Recall
            </ToggleGroupItem>
            <ToggleGroupItem value="precision" className="h-9 px-3 text-xs">
              Precision
            </ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>
      <ol
        ref={ref}
        aria-label="Precision and recall by lesion type"
        className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
      >
        {rows.map((entry, index) => {
          const row = metrics?.per_class?.[entry.code]
          const style = CATEGORY_STYLE[entry.category]
          const isYou = entry.code === activeTop
          return (
            <m.li
              key={entry.code}
              layout="position"
              transition={{ type: 'spring', duration: 0.55, bounce: 0.12 }}
              className={cn(
                'grid gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_8.5rem] lg:items-center',
                isYou && 'bg-brand-soft/40',
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <CodeChip className={cn(style.soft, style.text, 'mt-0.5 border-transparent')}>{entry.code}</CodeChip>
                <div className="min-w-0">
                  <p className="leading-snug font-medium text-fg">{entry.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className={style.text}>{CATEGORY_LABEL[entry.category]}</span>
                    {isYou ? <Badge variant="brand">Your latest result</Badge> : null}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <MetricBar label="Recall" value={row?.recall} fill={style.fill} shown={inView} delay={index * 45} />
                <MetricBar
                  label="Precision"
                  value={row?.precision}
                  fill={style.fill}
                  muted
                  shown={inView}
                  delay={index * 45 + 80}
                />
              </div>
              <dl className="flex gap-5 font-mono text-xs text-fg-3 lg:flex-col lg:items-end lg:gap-1">
                <div className="flex gap-1.5">
                  <dt>F1</dt>
                  <dd className="text-fg-2 tabular">{metricPercent(row?.f1)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>n</dt>
                  <dd className="text-fg-2 tabular">
                    {integer(row?.support)}
                    <span className="sr-only"> test photos</span>
                  </dd>
                </div>
              </dl>
            </m.li>
          )
        })}
      </ol>
    </div>
  )
}
