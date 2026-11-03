import { CirclePause, CloudOff, ImageUp, RotateCcw } from 'lucide-react'
import type * as React from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import type { ServiceStatus } from '@/hooks/app-context'
import { cn } from '@/lib/utils'

const OPEN_KEYS = new Set(['Enter', ' '])

/**
 * The upload prompt: a keyboard-operable drop zone (Enter or Space opens the picker), or the paused
 * state while the service is offline or has no model. Camera and examples live in the workspace.
 */
export function EmptyState({
  status,
  preparing,
  onOpenPicker,
  onCheckAgain,
  className,
}: {
  status: ServiceStatus
  preparing: boolean
  onOpenPicker: () => void
  onCheckAgain: () => void
  /** Extra classes for the drop zone (e.g. its minimum height). */
  className?: string
}) {
  const paused = status === 'offline' || status === 'no-model'
  const disabled = paused || preparing

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!OPEN_KEYS.has(event.key) || event.target !== event.currentTarget) return
    event.preventDefault()
    if (!disabled) onOpenPicker()
  }

  if (paused) {
    const Icon = status === 'offline' ? CloudOff : CirclePause
    return (
      <div
        tabIndex={0}
        data-analyze-focus=""
        aria-labelledby="paused-title"
        aria-describedby="paused-detail"
        className={cn(
          'flex min-h-[20rem] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line-strong bg-surface-2/40 px-6 py-10 text-center sm:min-h-[23rem]',
          className,
        )}
      >
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-caution-soft text-caution-text">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex max-w-sm flex-col gap-1.5">
          <p id="paused-title" className="text-base font-semibold text-fg">
            Analysis is paused
          </p>
          <p id="paused-detail" className="text-sm leading-relaxed text-fg-2">
            {status === 'offline'
              ? "The model service can't be reached, so photos can't be analysed right now. This page checks again every 15 seconds and turns analysis back on by itself."
              : 'The service is running, but no model is loaded yet. Analysis turns on by itself once a trained model is in place.'}
          </p>
        </div>
        <Button variant="outline" onClick={onCheckAgain}>
          <RotateCcw aria-hidden="true" />
          Check again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        data-analyze-focus=""
        aria-disabled={disabled || undefined}
        aria-busy={preparing || undefined}
        aria-label={preparing ? 'Preparing photo…' : 'Choose a photo to analyze. You can also drop or paste one.'}
        aria-describedby="dropzone-formats"
        onClick={() => {
          if (!disabled) onOpenPicker()
        }}
        onKeyDown={onKeyDown}
        className={cn(
          'group/drop relative flex min-h-[17rem] cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2/40 px-6 py-10 text-center transition-[border-color,background-color] duration-200 ease-out-quint sm:min-h-[20rem]',
          'hover:border-fg-3 hover:bg-surface-2/80',
          preparing && 'cursor-progress',
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="relative inline-flex size-14 items-center justify-center rounded-2xl border border-line bg-surface text-fg shadow-[0_1px_0_0_var(--color-line),0_10px_30px_-14px_var(--color-glow)] transition-transform duration-300 ease-out-quint group-hover/drop:-translate-y-0.5"
        >
          {preparing ? (
            <span className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
          ) : (
            <ImageUp className="size-6" />
          )}
        </span>
        <div className="flex max-w-sm flex-col gap-1.5">
          <p className="text-base font-semibold text-balance text-fg">
            {preparing ? (
              'Preparing photo…'
            ) : (
              <>
                <span className="pointer-coarse:hidden">Drop a photo, paste one, or choose a file</span>
                <span className="hidden pointer-coarse:inline">Choose a photo or take a new one</span>
              </>
            )}
          </p>
          <p className="text-sm text-fg-2">A sharp, well-lit close-up works best.</p>
        </div>
        <span
          aria-hidden="true"
          // Below lg the sticky action bar carries the same button, so the zone does not repeat it.
          className={cn(buttonVariants({ size: 'sm' }), 'pointer-events-none max-lg:hidden', preparing && 'opacity-50')}
        >
          Choose a photo
        </span>
        <p id="dropzone-formats" className="font-mono text-[0.6875rem] tracking-[0.06em] text-fg-3 uppercase">
          JPEG, PNG or WebP · resized in your browser · never stored
        </p>
      </div>
    </div>
  )
}
