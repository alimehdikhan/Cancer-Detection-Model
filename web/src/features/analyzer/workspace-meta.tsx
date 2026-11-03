import { ArrowRight } from 'lucide-react'
import type * as React from 'react'
import { Link } from 'react-router'

import { StatusDot, statusLabel } from '@/components/layout/status-pill'
import type { ServiceStatus } from '@/hooks/app-context'
import { middleTruncate } from '@/lib/format'
import type { ModelInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

function viewsLabel(model: ModelInfo) {
  if (!model.tta || model.tta_views <= 1) return 'Single view'
  return `${model.tta_views} views (TTA)`
}

/** Compact status for the workspace bar: dot, label, version and TTA views. */
export function ModelChip({ status, model, className }: { status: ServiceStatus; model: ModelInfo | null; className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex h-8 min-w-0 items-center gap-2 rounded-full border border-line bg-surface px-3 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-2 uppercase',
        className,
      )}
    >
      <StatusDot status={status} />
      <span className="shrink-0">
        <span className="sr-only">Model status: </span>
        {statusLabel(status)}
      </span>
      {model ? (
        <>
          {/* The version gives way to the keyboard hints on lg, where the bar is tightest. */}
          <span aria-hidden="true" className="hidden h-3 w-px shrink-0 bg-line-strong sm:block lg:hidden xl:block" />
          <span className="hidden truncate text-fg-3 sm:inline lg:hidden xl:inline" title={model.version}>
            {middleTruncate(model.version, 22)}
          </span>
          <span aria-hidden="true" className="hidden h-3 w-px shrink-0 bg-line-strong md:block" />
          <span className="hidden shrink-0 text-fg-3 md:inline">{model.tta ? `TTA ×${model.tta_views}` : 'No TTA'}</span>
        </>
      ) : null}
    </p>
  )
}

/** Model details for the desktop rail. */
export function ModelPanel({ status, model, className }: { status: ServiceStatus; model: ModelInfo | null; className?: string }) {
  const rows: [string, React.ReactNode][] = [
    [
      'Status',
      <span key="status" className="inline-flex items-center gap-1.5">
        <StatusDot status={status} />
        {statusLabel(status)}
      </span>,
    ],
  ]
  if (model) {
    rows.push(
      [
        'Version',
        <span key="version" className="font-mono text-xs" title={model.version}>
          {middleTruncate(model.version, 20)}
        </span>,
      ],
      ['Views', viewsLabel(model)],
      ['Input', `${model.image_size} × ${model.image_size} px`],
    )
  }

  return (
    <section aria-labelledby="rail-model-title" className={cn('rounded-xl border border-line bg-surface p-3.5', className)}>
      <h2 id="rail-model-title" className="eyebrow">
        Model
      </h2>
      <dl className="mt-2.5 flex flex-col gap-1.5 text-[0.8125rem]">
        {rows.map(([term, value]) => (
          <div key={term} className="flex min-w-0 items-center justify-between gap-3">
            <dt className="shrink-0 text-fg-3">{term}</dt>
            <dd className="min-w-0 truncate text-right text-fg-2">{value}</dd>
          </div>
        ))}
      </dl>
      {status === 'dev' ? (
        <p className="mt-2.5 rounded-[8px] bg-caution-soft px-2.5 py-1.5 text-xs leading-relaxed text-caution-text">
          Untrained development model: its results are random.
        </p>
      ) : null}
      <Link
        to="/model"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-fg-2 transition-colors hover:text-fg"
      >
        Model card
        <ArrowRight className="size-3" aria-hidden="true" />
      </Link>
    </section>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-surface px-1 font-mono text-[0.625rem] font-medium text-fg-2 shadow-[inset_0_-1px_0_0_var(--color-line-strong)]">
      {children}
    </kbd>
  )
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

/** Keyboard hints (hidden on touch-only devices). */
export function KeyHints({ layout = 'row', className }: { layout?: 'row' | 'stack'; className?: string }) {
  const mod = isMac() ? '⌘' : 'Ctrl'
  return (
    <ul
      aria-label="Keyboard shortcuts"
      className={cn(
        'pointer-coarse:hidden text-xs text-fg-3',
        layout === 'row' ? 'flex flex-wrap items-center gap-x-4 gap-y-1' : 'flex flex-col gap-2',
        className,
      )}
    >
      <li className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5">
          <Kbd>{mod}</Kbd>
          <Kbd>V</Kbd>
        </span>
        <span>paste a photo</span>
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5">
          <Kbd>Enter</Kbd>
          <span className="px-0.5">/</span>
          <Kbd>Space</Kbd>
        </span>
        <span>open the file picker</span>
      </li>
    </ul>
  )
}
