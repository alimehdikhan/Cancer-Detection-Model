import { CloudOff, Hourglass, ImageOff, Info, Plus, RotateCcw, ServerCrash, X } from 'lucide-react'
import type * as React from 'react'

import { CodeChip } from '@/components/layout/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ServiceStatus } from '@/hooks/app-context'
import type { SessionPlate } from '@/hooks/useAnalyzer'
import { CATEGORY_LABEL, CATEGORY_STYLE, type Entry } from '@/lib/entries'
import { DISCLAIMER } from '@/lib/site'
import { cn } from '@/lib/utils'

import { ERROR_TITLE, NO_RETRY } from './copy'
import { Distribution } from './distribution'
import { GroundTruth } from './ground-truth'
import { AboutType, NextSteps, ResultMeta, ResultNotice, RiskBanner, TopFinding } from './result-view'

const LEGEND = [
  { category: 'malignant', text: 'cancer' },
  { category: 'precancerous', text: 'can become cancer' },
  { category: 'benign', text: 'not cancer' },
] as const

/** Before any photo: what the panel will show, and the seven entries, unranked. */
function IdleBody({ entries, paused }: { entries: Entry[]; paused: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-fg">{paused ? 'Analysis is paused' : 'No photo yet'}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-2">
          {paused
            ? 'Analysis is unavailable until the model service is back. The seven entries it chooses between are listed below.'
            : "When you add a photo, the model gives each of these seven entries a calibrated probability and ranks them. You'll also see how concerned to be and what to do next."}
        </p>
      </div>
      <div>
        <h3 id="entries-title" className="eyebrow mb-2">
          The seven entries
        </h3>
        <ol aria-labelledby="entries-title" className="flex flex-col">
          {entries.map((entry) => {
            const style = CATEGORY_STYLE[entry.category]
            return (
              <li
                key={entry.code}
                className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-2 last:border-b-0"
              >
                <span className="sr-only">
                  {entry.name}, {CATEGORY_LABEL[entry.category]}, no reading yet
                </span>
                <span aria-hidden="true">
                  <CodeChip className={cn(style.soft, style.text, 'border-transparent')}>{entry.code}</CodeChip>
                </span>
                <span aria-hidden="true" className="truncate text-sm text-fg-2">
                  {entry.name}
                </span>
                <span aria-hidden="true" className="font-mono text-xs text-fg-3">
                  —
                </span>
              </li>
            )
          })}
        </ol>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-3">
          {LEGEND.map(({ category, text }) => (
            <li key={category} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn('size-1.5 rounded-full', CATEGORY_STYLE[category].dot)} />
              <span>
                <span className="font-medium text-fg-2">{CATEGORY_LABEL[category]}:</span> {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SKELETON_WIDTHS = ['72%', '48%', '36%', '28%', '20%', '14%', '9%']

/** While the model reads: where the result will land, plus Cancel. */
function ReadingBody({ plate, onCancel }: { plate: SessionPlate; onCancel: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2.5 text-sm font-medium text-fg">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inset-0 animate-pulse-dot rounded-full bg-brand" />
            </span>
            Reading the photo…
          </p>
          <p className="mt-1 text-sm text-fg-2">Fig. {plate.figure} · This usually takes under a second.</p>
        </div>
        <Button variant="outline" onClick={onCancel} data-analyze-focus="" className="shrink-0">
          <X aria-hidden="true" />
          Cancel
        </Button>
      </div>
      <Skeleton className="h-[4.75rem] w-full rounded-xl" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-10 w-24" />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-3.5">
        <Skeleton className="h-3 w-28" />
        {SKELETON_WIDTHS.map((width) => (
          <div key={width} className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3">
            <Skeleton className="h-5 w-11" />
            <div className="h-1.5 overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full bg-fg-3/25" style={{ width }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function errorIcon(kind: NonNullable<SessionPlate['error']>['kind']) {
  if (kind === 'network') return CloudOff
  if (kind === 'rate-limited' || kind === 'aborted') return Hourglass
  if (kind === 'server' || kind === 'no-model') return ServerCrash
  return ImageOff
}

/** A photo that was not read: neutral (never red), with a retry or a next step. */
function ErrorBody({ plate, onRetry, onNewPhoto }: { plate: SessionPlate; onRetry: () => void; onNewPhoto: () => void }) {
  const kind = plate.error?.kind ?? 'server'
  const Icon = errorIcon(kind)
  const canRetry = !NO_RETRY.has(kind)
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-caution-soft text-caution-text">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div>
        <p className="eyebrow">Fig. {plate.figure} wasn't read</p>
        <h3 className="mt-1.5 text-base font-semibold text-fg">{ERROR_TITLE[kind]}</h3>
        <p className="mt-1 text-sm leading-relaxed text-fg-2">{plate.error?.message}</p>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {canRetry ? (
          <Button onClick={onRetry} data-analyze-focus="">
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        ) : null}
        <Button variant="outline" onClick={onNewPhoto} {...(canRetry ? {} : { 'data-analyze-focus': '' })}>
          <Plus aria-hidden="true" />
          {canRetry ? 'New photo' : 'Choose another photo'}
        </Button>
      </div>
    </div>
  )
}

/**
 * The result column of the workspace. Every state lives here: idle, reading, error and the full
 * result (risk, top finding, ground truth for real examples, notices, distribution, guidance).
 */
export function ResultPanel({
  active,
  status,
  entries,
  ttaViews,
  onCancel,
  onRetry,
  onNewPhoto,
  className,
}: {
  active: SessionPlate | null
  status: ServiceStatus
  entries: Entry[]
  ttaViews: number | null
  onCancel: () => void
  onRetry: (figure: number) => void
  onNewPhoto: () => void
  className?: string
}) {
  const paused = status === 'offline' || status === 'no-model'

  let body: React.ReactNode
  if (!active) body = <IdleBody entries={entries} paused={paused} />
  else if (active.status === 'reading') body = <ReadingBody plate={active} onCancel={onCancel} />
  else if (active.status === 'error') body = <ErrorBody plate={active} onRetry={() => onRetry(active.figure)} onNewPhoto={onNewPhoto} />
  else if (active.result) {
    const result = active.result
    body = (
      <div key={active.figure} className="flex flex-col gap-5">
        <RiskBanner risk={result.risk} />
        <TopFinding result={result} />
        {active.sample ? <GroundTruth sample={active.sample} result={result} entries={entries} /> : null}
        <ResultNotice result={result} />
        <Distribution entries={entries} predictions={result.predictions} />
        <AboutType result={result} entries={entries} />
        <NextSteps result={result} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <ResultMeta plate={active} result={result} ttaViews={ttaViews} />
          <Button variant="outline" onClick={onNewPhoto} data-analyze-focus="" className="max-lg:hidden">
            <Plus aria-hidden="true" />
            New photo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section
      id="analyze-result"
      aria-labelledby="result-title"
      className={cn('scroll-mt-20 rounded-2xl border border-line bg-surface', className)}
    >
      <div className="flex h-12 items-center justify-between gap-3 border-b border-line px-4 sm:px-5">
        <h2 id="result-title" className="eyebrow text-fg-2">
          Result
        </h2>
        <p className="truncate font-mono text-[0.6875rem] tracking-[0.06em] text-fg-3 uppercase">
          {active ? `Fig. ${active.figure}` : paused ? 'Paused' : 'Waiting for a photo'}
        </p>
      </div>
      <div className="p-4 sm:p-5">{body}</div>
      <p className="flex items-start gap-2 border-t border-line px-4 py-3 text-xs leading-relaxed text-fg-3 sm:px-5">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        <span>{DISCLAIMER} Dermsight is an educational tool, not a medical device.</span>
      </p>
    </section>
  )
}
