import { useId } from 'react'

import { Hint } from '@/components/ui/hint'
import type { ServiceStatus } from '@/hooks/app-context'
import { useApp } from '@/hooks/app-context'
import { middleTruncate } from '@/lib/format'
import { cn } from '@/lib/utils'

const LABEL: Record<ServiceStatus, string> = {
  connecting: 'Connecting',
  ready: 'Ready',
  dev: 'Dev model',
  'no-model': 'No model',
  offline: 'Offline',
}

const DOT: Record<ServiceStatus, string> = {
  connecting: 'bg-fg-3 animate-pulse-dot',
  ready: 'bg-brand',
  dev: 'bg-caution',
  'no-model': 'bg-caution',
  offline: 'bg-fg-3',
}

/** Status dot only (for the analyser top bar, etc.). */
export function StatusDot({ status, className }: { status: ServiceStatus; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-1.5 shrink-0 rounded-full', DOT[status], className)} />
}

export function statusLabel(status: ServiceStatus) {
  return LABEL[status]
}

/** One-sentence explanation of the service status (model version when loaded). */
export function useStatusDetail() {
  const { status, model } = useApp()
  if (status === 'ready' || status === 'dev') {
    return `Model ${middleTruncate(model?.version ?? '', 32)}${status === 'dev' ? ', an untrained development model' : ''}`
  }
  if (status === 'no-model') return 'The service is running, but no model is loaded.'
  if (status === 'offline') return 'The model service cannot be reached. Retrying in the background.'
  return 'Connecting to the model service…'
}

/** Header pill: model service status with a CSS tooltip giving the model version. */
export function StatusPill({ className, align = 'center' }: { className?: string; align?: 'start' | 'center' | 'end' }) {
  const { status } = useApp()
  const detail = useStatusDetail()
  const id = useId()

  return (
    <Hint id={id} label={detail} align={align} className={className}>
      <button
        type="button"
        aria-describedby={id}
        className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface/60 px-3 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-2 uppercase transition-colors hover:border-line-strong hover:text-fg"
      >
        <StatusDot status={status} />
        <span>
          <span className="sr-only">Model status: </span>
          {LABEL[status]}
        </span>
      </button>
    </Hint>
  )
}
