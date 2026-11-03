import { FlaskConical, Info } from 'lucide-react'

import { CodeChip } from '@/components/layout/primitives'
import { NumberTicker } from '@/components/magic/number-ticker'
import { Badge } from '@/components/ui/badge'
import type { SessionPlate } from '@/hooks/useAnalyzer'
import { CATEGORY_LABEL, CATEGORY_STYLE, type Entry } from '@/lib/entries'
import { middleTruncate, milliseconds, percent } from '@/lib/format'
import type { PredictResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

import {
  DEV_RESULT_MESSAGE,
  NEXT_STEPS,
  RISK_COPY,
  UNCERTAIN_MESSAGE,
  UNCERTAIN_STEPS,
  UNCERTAIN_TITLE,
} from './copy'

/**
 * One calm container for everything that should temper the reading: the development-model notice
 * and the "unsure" state. Renders nothing when neither applies.
 */
export function ResultNotice({ result }: { result: PredictResponse }) {
  if (!result.dev_model && !result.uncertain) return null
  return (
    <div className="rounded-xl border border-caution/30 bg-caution-soft px-4 py-3 text-caution-text">
      <p className="text-sm font-semibold">Read this result with care</p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {result.dev_model ? (
          <li className="flex items-start gap-2 text-sm leading-relaxed">
            <FlaskConical className="mt-[3px] size-3.5 shrink-0" aria-hidden="true" />
            <span>{DEV_RESULT_MESSAGE}</span>
          </li>
        ) : null}
        {result.uncertain ? (
          <li className="flex items-start gap-2 text-sm leading-relaxed">
            <Info className="mt-[3px] size-3.5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold">{UNCERTAIN_TITLE}.</strong> {UNCERTAIN_MESSAGE}
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  )
}

export function RiskBanner({ risk }: { risk: PredictResponse['risk'] }) {
  const copy = RISK_COPY[risk.level]
  return (
    <div className={cn('rounded-xl px-4 py-3.5', copy.tone)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className={cn('size-2 rounded-full', copy.dot)} />
          {copy.label}
        </p>
        <p className="font-mono text-xs tabular">{percent(risk.malignant_probability)} malignant or precancerous</p>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed">{copy.advice}</p>
    </div>
  )
}

export function TopFinding({ result, className }: { result: PredictResponse; className?: string }) {
  const { top } = result
  const style = CATEGORY_STYLE[top.category]
  const runnerUp = [...result.predictions].sort((a, b) => b.probability - a.probability)[1]

  return (
    <div className={cn('flex flex-col', className)}>
      <p className="eyebrow">Most likely</p>
      <h3 className="mt-2 text-h3 text-fg text-balance">{top.name}</h3>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <CodeChip className={cn(style.soft, style.text, 'border-transparent')}>{top.code}</CodeChip>
        <Badge variant={style.badge}>{CATEGORY_LABEL[top.category]}</Badge>
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <NumberTicker
          value={top.probability * 100}
          format={(n) => percent(n / 100)}
          startOnView={false}
          duration={1000}
          className="text-[2.75rem] leading-none font-semibold tracking-[-0.03em] text-fg"
        />
        <p className="eyebrow mt-2">Confidence (calibrated)</p>
        {runnerUp ? (
          <p className="mt-3 min-w-0 truncate text-sm text-fg-2">
            <span className="text-fg-3">Runner-up:</span> {runnerUp.name}{' '}
            <span className="font-mono text-xs tabular">{percent(runnerUp.probability)}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function AboutType({ result, entries }: { result: PredictResponse; entries: Entry[] }) {
  const entry = entries.find((e) => e.code === result.top.code)
  return (
    <section aria-labelledby="about-type-title" className="rounded-xl border border-line bg-canvas/40 p-4">
      <h3 id="about-type-title" className="eyebrow">
        About this type
      </h3>
      <p className="mt-2.5 text-sm font-medium text-fg">
        {entry?.name ?? result.top.name}{' '}
        <span className="font-normal text-fg-3">· {CATEGORY_LABEL[result.top.category]}</span>
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{entry?.description}</p>
    </section>
  )
}

export function NextSteps({ result }: { result: PredictResponse }) {
  const steps = [...(result.uncertain ? UNCERTAIN_STEPS : []), ...NEXT_STEPS[result.risk.level]]
  return (
    <section aria-labelledby="next-steps-title" className="rounded-xl border border-line bg-canvas/40 p-4">
      <h3 id="next-steps-title" className="eyebrow">
        What to do next
      </h3>
      <ol className="mt-2.5 flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-fg-2">
            <span aria-hidden="true" className="mt-px font-mono text-xs text-fg-3 tabular">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Mono meta row: figure, model version, TTA views, cached or fresh, inference time. */
export function ResultMeta({
  plate,
  result,
  ttaViews,
  className,
}: {
  plate: SessionPlate
  result: PredictResponse
  ttaViews: number | null
  className?: string
}) {
  return (
    <p className={cn('flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-3 uppercase', className)}>
      <span>Fig. {plate.figure}</span>
      <span title={result.model_version}>{middleTruncate(result.model_version, 26)}</span>
      {ttaViews ? <span>TTA ×{ttaViews}</span> : null}
      <span>{result.cached ? 'Cached' : 'Fresh read'}</span>
      <span className="tabular">{milliseconds(result.inference_ms)}</span>
    </p>
  )
}
