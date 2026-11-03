import { History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { SessionPlate } from '@/hooks/useAnalyzer'
import { CATEGORY_STYLE } from '@/lib/entries'
import { percent } from '@/lib/format'
import { cn } from '@/lib/utils'

function what(plate: SessionPlate) {
  if (plate.status === 'reading') return 'Reading…'
  if (plate.status === 'error') return 'Not read'
  return plate.result ? plate.result.top.name : ''
}

function detail(plate: SessionPlate) {
  const parts = [`Fig. ${plate.figure}`]
  if (plate.status === 'done' && plate.result) parts.push(`${plate.result.top.code} ${percent(plate.result.top.probability)}`)
  if (plate.sample) parts.push(plate.sample.sourceId ?? 'Real example')
  else if (plate.example) parts.push('Synthetic')
  return parts.join(' · ')
}

function label(plate: SessionPlate) {
  const source = plate.sample ? ', real example image' : plate.example ? ', synthetic example image' : ''
  const reading =
    plate.status === 'reading'
      ? 'reading…'
      : plate.status === 'error'
        ? 'not read'
        : plate.result
          ? `${plate.result.top.name}, ${percent(plate.result.top.probability)}`
          : ''
  return `Fig. ${plate.figure}, ${reading}${source}`
}

function dotClass(plate: SessionPlate) {
  if (plate.status === 'reading') return 'bg-brand animate-pulse-dot'
  if (plate.status === 'error') return 'bg-caution'
  return plate.result ? CATEGORY_STYLE[plate.result.top.category].dot : 'bg-fg-3'
}

function Thumb({ plate, className }: { plate: SessionPlate; className?: string }) {
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-[8px] border border-line bg-viewer', className)}>
      <img src={plate.previewUrl} alt="" draggable={false} className="size-full object-cover select-none" />
      <span aria-hidden="true" className={cn('absolute right-1 bottom-1 size-1.5 rounded-full ring-1 ring-black/50', dotClass(plate))} />
    </span>
  )
}

interface HistoryProps {
  plates: SessionPlate[]
  activeFigure: number | null
  onSelect: (figure: number) => void
  onClear: () => void
  className?: string
}

/** Session history for the desktop rail: newest first, with the top finding of each photo. Memory only. */
export function HistoryRail({ plates, activeFigure, onSelect, onClear, className }: HistoryProps) {
  const newestFirst = [...plates].reverse()
  return (
    <section aria-labelledby="history-title" className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 id="history-title" className="eyebrow">
          This session
        </h2>
        {plates.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={onClear} className="-mr-2 h-8 px-2 text-xs text-fg-3">
            Clear
          </Button>
        ) : null}
      </div>
      {plates.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-4 py-6 text-center">
          <History className="size-4 text-fg-3" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-fg-3">Photos you analyse appear here. Kept in this tab only.</p>
        </div>
      ) : (
        <>
          <ul aria-label="Photos read in this session" className="mt-2 flex flex-col gap-0.5">
            {newestFirst.map((plate) => {
              const active = plate.figure === activeFigure
              return (
                <li key={plate.figure}>
                  <button
                    type="button"
                    aria-pressed={active}
                    aria-label={label(plate)}
                    onClick={() => onSelect(plate.figure)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[10px] p-1.5 text-left transition-colors duration-150',
                      active ? 'bg-surface-2' : 'hover:bg-surface-2/70',
                    )}
                  >
                    <Thumb plate={plate} className={cn('size-10', active && 'border-brand')} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('truncate text-sm', active ? 'font-medium text-fg' : 'text-fg-2')}>{what(plate)}</span>
                      <span className="truncate font-mono text-[0.6875rem] tracking-[0.04em] text-fg-3 uppercase tabular">
                        {detail(plate)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 px-1 text-xs text-fg-3">Kept in this tab only. Closing it clears everything.</p>
        </>
      )}
    </section>
  )
}

/** Session history as a horizontal strip (below the canvas on narrower screens). */
export function HistoryStrip({ plates, activeFigure, onSelect, onClear, className }: HistoryProps) {
  if (plates.length === 0) return null
  return (
    <section aria-labelledby="history-strip-title" className={cn('flex items-center gap-3', className)}>
      <h2 id="history-strip-title" className="eyebrow shrink-0">
        Session
      </h2>
      <ul
        aria-label="Photos read in this session. Kept in this tab only; closing it clears everything."
        className="-my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-1"
      >
        {plates.map((plate) => {
          const active = plate.figure === activeFigure
          return (
            <li key={plate.figure} className="shrink-0">
              <button
                type="button"
                aria-pressed={active}
                aria-label={label(plate)}
                title={label(plate)}
                onClick={() => onSelect(plate.figure)}
                className={cn(
                  'block rounded-[10px] transition-transform duration-150 ease-out-quint active:scale-[0.96]',
                  active && 'ring-2 ring-brand/40 ring-offset-1 ring-offset-canvas',
                )}
              >
                <Thumb plate={plate} className={cn('size-11', active && 'border-brand')} />
              </button>
            </li>
          )
        })}
      </ul>
      <Button variant="ghost" size="sm" onClick={onClear} className="shrink-0">
        Clear
      </Button>
    </section>
  )
}
