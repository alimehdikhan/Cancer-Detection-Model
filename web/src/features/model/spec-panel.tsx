import { RotateCw } from 'lucide-react'
import type * as React from 'react'

import { StatusDot, statusLabel } from '@/components/layout/status-pill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApp } from '@/hooks/app-context'
import { date, middleTruncate } from '@/lib/format'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-6 py-3">
      <dt className="shrink-0 text-sm text-fg-2">{label}</dt>
      <dd className="min-w-0 text-right font-mono text-[0.8125rem] text-fg">{children}</dd>
    </div>
  )
}

const LABELS = ['Version', 'Backbone', 'Input', 'Test-time views', 'Lesion types', 'Trained'] as const

/** Window-like panel with the live /model facts (or a loading / unavailable state). */
export function SpecPanel() {
  const { status, model, service } = useApp()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),0_24px_60px_-36px_rgb(0_0_0/0.45)]">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/50 px-5 py-3">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </span>
        <span className="truncate font-mono text-xs text-fg-3">GET /api/v1/model</span>
        <span className="inline-flex shrink-0 items-center gap-2 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-2 uppercase">
          <StatusDot status={status} />
          {statusLabel(status)}
        </span>
      </div>

      {model ? (
        <dl className="divide-y divide-line px-5">
          <Row label="Version">
            <span className="block truncate" title={model.version}>
              {middleTruncate(model.version, 26)}
            </span>
          </Row>
          <Row label="Backbone">
            <span className="break-all">{model.backbone}</span>
          </Row>
          <Row label="Input">
            <span className="tabular">
              {model.image_size} × {model.image_size} px
            </span>
          </Row>
          <Row label="Test-time views">
            <span className="tabular">
              {model.tta_views > 1 ? `${model.tta_views} views, averaged` : 'Single view'}
            </span>
          </Row>
          <Row label="Lesion types">
            <span className="tabular">{model.classes.length}</span>
          </Row>
          <Row label="Trained">
            {model.dev ? <Badge variant="caution">Not trained · dev model</Badge> : date(model.trained_at)}
          </Row>
        </dl>
      ) : status === 'connecting' ? (
        <dl className="divide-y divide-line px-5" aria-busy="true">
          {LABELS.map((label, index) => (
            <Row key={label} label={label}>
              <Skeleton className="ml-auto h-4" style={{ width: `${5 + ((index * 3) % 5)}rem` }} />
            </Row>
          ))}
        </dl>
      ) : (
        <div className="flex flex-col items-start gap-4 px-5 py-8">
          <p className="text-fg-2">
            {status === 'no-model'
              ? 'No model is loaded, so there is nothing to describe yet.'
              : 'Model details are unavailable while the model service can’t be reached. Checking again every 15 seconds.'}
          </p>
          <Button variant="outline" size="sm" onClick={service.retry}>
            <RotateCw aria-hidden="true" />
            Check again
          </Button>
        </div>
      )}
    </div>
  )
}
