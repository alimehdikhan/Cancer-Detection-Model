import { FlaskConical } from 'lucide-react'

import { NumberTicker } from '@/components/magic/number-ticker'
import { SpotlightCard } from '@/components/magic/spotlight-card'
import { decimal, metricPercent } from '@/lib/format'
import type { Metrics } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MetricDef {
  key: string
  label: string
  value: number | null
  format: 'percent' | 'decimal'
  meaning: string
}

/**
 * The headline metrics with one-line plain explanations. With `metrics` null every value is
 * null (rendered as "—"): the cards then explain what will appear, never a made-up number.
 * Screening and calibration cards only appear when the evaluation reported them.
 */
export function metricDefs(metrics: Metrics | null): MetricDef[] {
  const malignant = metrics?.malignant ?? null
  const threshold = malignant ? `${Math.round(malignant.threshold * 100)}%` : null
  const defs: MetricDef[] = [
    {
      key: 'balanced_accuracy',
      label: 'Balanced accuracy',
      value: metrics?.balanced_accuracy ?? null,
      format: 'percent',
      meaning: 'The average of the seven per-type recalls, so rare cancers count as much as common moles.',
    },
    {
      key: 'accuracy',
      label: 'Accuracy',
      value: metrics?.accuracy ?? null,
      format: 'percent',
      meaning: 'Share of test photos whose top-ranked type was correct. Flattered by how common moles are.',
    },
    {
      key: 'macro_f1',
      label: 'Macro F1',
      value: metrics?.macro_f1 ?? null,
      format: 'percent',
      meaning: 'Balances precision and recall, averaged over the seven types.',
    },
    {
      key: 'auc_macro',
      label: 'Macro ROC-AUC',
      value: metrics?.auc_macro ?? null,
      format: 'decimal',
      meaning: 'How well the probabilities separate each type from the rest. 1.000 is perfect, 0.500 is chance.',
    },
    {
      key: 'melanoma_recall',
      label: 'Melanoma recall',
      value: metrics?.melanoma_recall ?? null,
      format: 'percent',
      meaning: 'Share of melanomas in the test set that the model ranked first.',
    },
  ]
  if (!metrics || malignant) {
    defs.push(
      {
        key: 'sensitivity',
        label: 'Malignant sensitivity',
        value: malignant?.sensitivity ?? null,
        format: 'percent',
        meaning: threshold
          ? `Of the malignant or precancerous test photos, the share flagged at ≥ ${threshold} combined probability.`
          : 'Of the malignant or precancerous test photos, the share the screening threshold flags.',
      },
      {
        key: 'specificity',
        label: 'Malignant specificity',
        value: malignant?.specificity ?? null,
        format: 'percent',
        meaning: 'Of the benign test photos, the share correctly left unflagged at the same threshold.',
      },
    )
  }
  if (!metrics || metrics.ece != null) {
    defs.push({
      key: 'ece',
      label: 'Calibration error (ECE)',
      value: metrics?.ece ?? null,
      format: 'decimal',
      meaning: 'Average gap between stated confidence and actual accuracy. Lower is better; 0 is perfect.',
    })
  }
  return defs
}

function formatValue(def: MetricDef): string {
  return def.format === 'percent' ? metricPercent(def.value) : decimal(def.value)
}

function MetricValue({ def }: { def: MetricDef }) {
  if (def.value == null) {
    return (
      <span className="text-fg-3">
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not available</span>
      </span>
    )
  }
  const isPercent = def.format === 'percent'
  return (
    <>
      <span aria-hidden="true">
        <NumberTicker
          value={isPercent ? def.value * 100 : def.value}
          duration={1100}
          format={(n) => (isPercent ? `${n.toFixed(1)}%` : n.toFixed(3))}
        />
      </span>
      <span className="sr-only">{formatValue(def)}</span>
    </>
  )
}

/** Grid of metric cards (4 columns on desktop, 2 on tablets, 1 on phones). */
export function MetricGrid({ metrics, pending = false }: { metrics: Metrics | null; pending?: boolean }) {
  const defs = metricDefs(metrics)
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Test-set metrics">
      {defs.map((def) => (
        <SpotlightCard as="li" key={def.key} className={cn('flex flex-col gap-3 p-5', pending && 'bg-surface/60')}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[0.6875rem] tracking-[0.08em] text-fg-3 uppercase">{def.label}</p>
            {pending ? (
              <span className="rounded-full border border-line px-1.5 py-px font-mono text-[0.625rem] tracking-[0.06em] text-fg-3 uppercase">
                Pending
              </span>
            ) : null}
          </div>
          <p className="text-[2.125rem] leading-none font-semibold tracking-[-0.035em] text-fg tabular">
            <MetricValue def={def} />
          </p>
          <p className="text-sm leading-relaxed text-pretty text-fg-2">{def.meaning}</p>
        </SpotlightCard>
      ))}
    </ul>
  )
}

/** Honest empty state for an untrained (dev) model or a model shipped without metrics. */
export function NotTrainedNotice({ dev }: { dev: boolean }) {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-caution/30 bg-surface p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-16 -z-10 h-56 w-80 rounded-full bg-caution-soft opacity-90 blur-3xl"
      />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-caution/30 bg-caution-soft text-caution-text">
          <FlaskConical className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-caution-soft px-2.5 py-0.5 font-mono text-[0.6875rem] tracking-[0.08em] text-caution-text uppercase">
            Not evaluated
          </p>
          <h3 className="mt-3 text-h3 text-balance text-fg">
            {dev
              ? 'This is an untrained development model, so there are no honest numbers to show.'
              : 'This model was loaded without an evaluation report.'}
          </h3>
          <p className="mt-2 max-w-[68ch] leading-relaxed text-pretty text-fg-2">
            {dev
              ? 'Its predictions are random, so any accuracy figure would describe chance, not skill. After a training run, this page fills in by itself with the scores measured on held-out photos the model never saw.'
              : 'Metrics appear here once a trained model with its test-set evaluation is loaded. Until then the model’s outputs have not been measured.'}
          </p>
          <ul className="mt-5 grid gap-2 text-sm text-fg-2 sm:grid-cols-3">
            {['Eight headline metrics', 'Precision and recall per type', 'Screening and calibration'].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-[10px] border border-line bg-surface-2/60 px-3 py-2"
              >
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-fg-3" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
