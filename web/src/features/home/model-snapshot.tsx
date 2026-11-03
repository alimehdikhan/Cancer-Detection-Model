import { ArrowRight, CloudOff, FlaskConical, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'

import { Section, SectionHeader } from '@/components/layout/primitives'
import { StatusDot, statusLabel } from '@/components/layout/status-pill'
import { NumberTicker } from '@/components/magic/number-ticker'
import { Reveal } from '@/components/magic/reveal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApp } from '@/hooks/app-context'
import { date, integer, middleTruncate } from '@/lib/format'
import type { Metrics, ModelInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

const METRICS: { key: keyof Pick<Metrics, 'balanced_accuracy' | 'melanoma_recall' | 'macro_f1' | 'accuracy'>; label: string; hint: string }[] = [
  { key: 'balanced_accuracy', label: 'Balanced accuracy', hint: 'Recall averaged over the seven types, so rare types count as much as common ones.' },
  { key: 'melanoma_recall', label: 'Melanoma recall', hint: 'Share of test melanomas the model ranked first as melanoma.' },
  { key: 'macro_f1', label: 'Macro F1', hint: 'Precision and recall combined, averaged over the seven types.' },
  { key: 'accuracy', label: 'Accuracy', hint: 'Share of all test images whose top type was right.' },
]

function SpecList({ model }: { model: ModelInfo | null }) {
  const rows: [string, string][] = model
    ? [
        ['Version', middleTruncate(model.version, 26)],
        ['Backbone', model.backbone],
        ['Input size', `${model.image_size} px`],
        ['TTA views', model.tta_views > 1 ? `${model.tta_views} views averaged` : 'Off'],
        ['Trained', model.trained_at ? date(model.trained_at) : 'Not trained'],
      ]
    : []

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="eyebrow">Running now</p>
      {model ? (
        <dl className="mt-4 flex flex-col">
          {rows.map(([term, value]) => (
            <div key={term} className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 first:border-t-0 first:pt-0">
              <dt className="text-sm text-fg-2">{term}</dt>
              <dd className="min-w-0 truncate text-right font-mono text-[0.8125rem] text-fg tabular" title={term === 'Version' ? model.version : undefined}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex justify-between gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricTiles({ metrics }: { metrics: Metrics }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        {METRICS.map(({ key, label, hint }) => (
          <li key={key} className="flex flex-col gap-2 bg-surface p-5">
            <p className="eyebrow">{label}</p>
            <NumberTicker
              value={metrics[key] * 100}
              decimals={1}
              format={(n) => `${n.toFixed(1)}%`}
              className="text-[2.25rem] leading-none font-semibold tracking-[-0.03em] text-fg"
            />
            <p className="text-sm leading-relaxed text-fg-2">{hint}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-fg-3">
        Measured on <span className="font-mono tabular">{integer(metrics.test_images)}</span> held-out test images, split by
        lesion so no lesion appears in both training and test.
      </p>
    </div>
  )
}

function NotTrained({ dev }: { dev: boolean }) {
  return (
    <div className="flex h-full flex-col gap-5 rounded-xl border border-dashed border-line-strong bg-surface-2/40 p-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-caution-soft text-caution-text">
          <FlaskConical className="size-[18px]" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-h3 text-fg">Not trained yet</h3>
          <p className="mt-1.5 max-w-prose text-[0.9375rem] leading-relaxed text-fg-2">
            {dev
              ? 'The service is running an untrained development model, so there are no test results to show and its predictions are random.'
              : 'This model was loaded without test results, so there are no numbers to show.'}{' '}
            We would rather show nothing than a number nobody measured. Once a trained model is deployed, its test-set results
            appear here by themselves.
          </p>
        </div>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-2" aria-label="Metrics that will appear">
        {METRICS.map(({ key, label }) => (
          <li key={key} className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
            <span className="text-sm text-fg-2">{label}</span>
            <span className="font-mono text-sm text-fg-3" aria-label="no data yet">
              —
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Unavailable({ offline, onRetry }: { offline: boolean; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-start gap-4 rounded-xl border border-dashed border-line-strong bg-surface-2/40 p-6">
      <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-surface-2 text-fg-2">
        <CloudOff className="size-[18px]" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-h3 text-fg">{offline ? 'The model service is offline' : 'No model is loaded'}</h3>
        <p className="mt-1.5 max-w-prose text-[0.9375rem] leading-relaxed text-fg-2">
          {offline
            ? "The numbers are read live from the service, and it can't be reached right now. This page checks again every 15 seconds."
            : 'The service is up, but no model is in place yet, so there is nothing to measure. Numbers appear once a model is loaded.'}
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RotateCcw aria-hidden="true" />
        Check again
      </Button>
    </div>
  )
}

/** Live model snapshot: real metrics from /api/v1/model, or an honest empty state. */
export function ModelSnapshot() {
  const { model, status, service } = useApp()
  const trained = model && !model.dev && model.metrics ? model.metrics : null

  let panel
  if (status === 'connecting') {
    panel = <Skeleton className="h-64 w-full rounded-xl" />
  } else if (status === 'offline' || status === 'no-model' || !model) {
    panel = <Unavailable offline={status === 'offline'} onRetry={service.retry} />
  } else if (trained) {
    panel = <MetricTiles metrics={trained} />
  } else {
    panel = <NotTrained dev={model.dev} />
  }

  return (
    <Section aria-labelledby="snapshot-title" bordered>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <Reveal>
          <SectionHeader
            eyebrow="Model snapshot"
            title="Live numbers, straight from the model."
            titleId="snapshot-title"
            description="Everything here is read from the running service. Nothing is typed in by hand."
          />
        </Reveal>
        <Link
          to="/model"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-medium text-fg-2 transition-colors hover:text-fg"
        >
          Open the model card
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <Reveal delay={80} className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <SpecList model={model} />
          <p className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-3 uppercase">
            <StatusDot status={status} />
            <span className={cn(status === 'ready' && 'text-fg-2')}>{statusLabel(status)}</span>
            <span aria-hidden="true">·</span>
            <span>GET /api/v1/model</span>
          </p>
        </div>
        <div className="min-w-0">{panel}</div>
      </Reveal>
    </Section>
  )
}
