import { Camera, CircleAlert, ImagePlus, Info, Plus, ScanSearch, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type * as React from 'react'

import { BorderBeam } from '@/components/magic/border-beam'
import { Button } from '@/components/ui/button'
import { useApp } from '@/hooks/app-context'
import type { SessionPlate } from '@/hooks/useAnalyzer'
import { useFileIntake } from '@/hooks/useFileIntake'
import { focusAnalyzeTarget } from '@/hooks/useGoToAnalyze'
import type { ExampleImage } from '@/lib/example-images'
import { percent } from '@/lib/format'
import { firstImage } from '@/lib/image'
import { ANALYZE_ID } from '@/lib/site'
import { cn, prefersReducedMotion } from '@/lib/utils'

import { RISK_COPY } from './copy'
import { EmptyState } from './empty-state'
import { ExampleGallery } from './example-gallery'
import { groundTruthText } from './ground-truth'
import { HistoryRail, HistoryStrip } from './history'
import { ResultPanel } from './result-panel'
import { Viewer } from './viewer'
import { KeyHints, ModelChip, ModelPanel } from './workspace-meta'

function announce(plate: SessionPlate | null) {
  if (!plate) return ''
  if (plate.status === 'reading') return `Reading figure ${plate.figure}.`
  if (plate.status === 'error') return '' // the error panel is role=alert
  if (plate.status === 'done' && plate.result) {
    const { top, risk } = plate.result
    const truth = plate.sample ? ` Ground truth for this example: ${groundTruthText(plate.sample)}.` : ''
    return `Figure ${plate.figure} read. Most likely ${top.name}, ${percent(top.probability)}. ${RISK_COPY[risk.level].label}.${truth}`
  }
  return ''
}

const isWide = () => window.matchMedia('(min-width: 64rem)').matches

/**
 * The main app screen: a workspace with the photo canvas and the result side by side, a rail with
 * the session history, model status and keyboard hints (xl), real examples to try, and a sticky
 * action bar on phones. One analyser session is shared across routes (useApp), memory only.
 */
export function AnalyzerWorkspace() {
  const { analyzer, status, model, service, entries } = useApp()
  const { active, preparing, notice, plates } = analyzer
  const paused = status === 'offline' || status === 'no-model'
  const reading = active?.status === 'reading'

  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // Window-level drag and drop plus paste; ignored while analysis is paused.
  const dragging = useFileIntake(
    (file) => {
      if (!paused) void analyzer.analyze(file)
    },
    () => {
      if (!paused) analyzer.reject()
    },
  )

  const openPicker = () => {
    if (!paused && !preparing) fileRef.current?.click()
  }
  const openCamera = () => {
    if (!paused && !preparing) cameraRef.current?.click()
  }

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    if (input.files && input.files.length > 0) {
      const image = firstImage(input.files)
      if (image) void analyzer.analyze(image)
      else analyzer.reject()
    }
    input.value = ''
  }

  const newAnalysis = () => {
    analyzer.reset()
    focusAnalyzeTarget(rootRef.current)
  }

  const pickExample = (image: ExampleImage) => {
    if (!isWide()) {
      canvasRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
    void analyzer.analyzeSample(image)
  }

  // Narrow screens: bring a fresh result into view once per figure.
  const scrolled = useRef(new Set<number>())
  const doneFigure = active?.status === 'done' ? active.figure : null
  useEffect(() => {
    if (doneFigure == null || scrolled.current.has(doneFigure)) return
    scrolled.current.add(doneFigure)
    const panel = resultRef.current
    if (!panel || isWide()) return
    const { top } = panel.getBoundingClientRect()
    if (top < 0 || top > window.innerHeight * 0.6) {
      panel.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
  }, [doneFigure])

  const history = {
    plates,
    activeFigure: active?.figure ?? null,
    onSelect: analyzer.select,
    onClear: analyzer.clear,
  }

  return (
    <section id={ANALYZE_ID} ref={rootRef} aria-labelledby="analyze-title" className="relative">
      {/* Workspace bar */}
      <div className="border-b border-line bg-surface/50">
        <div className="mx-auto flex min-h-14 w-full max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="hidden size-8 items-center justify-center rounded-[9px] border border-line bg-surface text-fg-2 sm:inline-flex"
            >
              <ScanSearch className="size-4" />
            </span>
            <h1 id="analyze-title" className="text-lg font-semibold tracking-[-0.015em] text-fg">
              Analyze a photo
            </h1>
          </div>
          <ModelChip status={status} model={model} className="max-w-full" />
          <div className="ml-auto hidden items-center gap-5 lg:flex">
            {/* At xl the rail carries the keyboard hints. */}
            <KeyHints className="xl:hidden" />
            <Button size="sm" variant="outline" onClick={newAnalysis}>
              <Plus aria-hidden="true" />
              New analysis
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[90rem] px-4 pt-4 pb-10 sm:px-6 sm:pt-6 lg:px-8 lg:pb-16">
        <div className="grid items-start gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
          {/* Rail (xl+) */}
          <aside aria-label="Session and model" className="hidden flex-col gap-4 xl:sticky xl:top-20 xl:flex">
            <HistoryRail {...history} />
            <ModelPanel status={status} model={model} />
            <section aria-labelledby="keys-title" className="rounded-xl border border-line bg-surface p-3.5 pointer-coarse:hidden">
              <h2 id="keys-title" className="eyebrow">
                Keyboard
              </h2>
              <KeyHints layout="stack" className="mt-2.5" />
            </section>
          </aside>

          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
            {/* Canvas column */}
            <div className="flex min-w-0 flex-col gap-4">
              <div
                ref={canvasRef}
                className="relative scroll-mt-20 rounded-2xl border border-line bg-surface p-2 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-fg)_5%,transparent)] sm:p-2.5"
              >
                {reading ? <BorderBeam radius={20} size={200} duration={5} borderWidth={1.5} /> : null}
                {active ? (
                  <Viewer plate={active} className="aspect-[4/3] w-full sm:aspect-auto sm:h-[26rem] lg:h-[30rem]" />
                ) : (
                  <EmptyState
                    status={status}
                    preparing={preparing}
                    onOpenPicker={openPicker}
                    onCheckAgain={service.retry}
                    className="min-h-[18rem] sm:min-h-[26rem] lg:min-h-[30rem]"
                  />
                )}

                {/* Drag veil */}
                <div
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-opacity duration-150 ease-out-quint',
                    paused
                      ? 'border-line-strong bg-surface'
                      : 'border-brand bg-surface bg-[linear-gradient(var(--color-brand-soft),var(--color-brand-soft))] shadow-[0_0_0_6px_var(--color-glow)]',
                    dragging ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex size-12 items-center justify-center rounded-2xl border bg-surface',
                      paused ? 'border-line text-fg-3' : 'border-brand/40 text-brand',
                    )}
                  >
                    <ImagePlus className="size-5" />
                  </span>
                  <p className={cn('text-base font-semibold', paused ? 'text-fg-2' : 'text-accent-foreground')}>
                    {paused ? 'Analysis is paused right now' : 'Release to analyze'}
                  </p>
                </div>
              </div>

              {notice ? (
                <div
                  role={notice.tone === 'error' ? 'alert' : 'status'}
                  className={cn(
                    'flex items-start gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-sm leading-relaxed',
                    notice.tone === 'error'
                      ? 'border-caution/30 bg-caution-soft text-caution-text'
                      : 'border-line bg-surface-2 text-fg-2',
                  )}
                >
                  {notice.tone === 'error' ? (
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  )}
                  <p>{notice.message}</p>
                </div>
              ) : null}

              {/* Desktop: pick the next photo straight from the canvas */}
              {active ? (
                <div className="hidden flex-wrap items-center gap-2 lg:flex">
                  <Button variant="outline" size="sm" onClick={openPicker} disabled={paused || preparing}>
                    <ImagePlus aria-hidden="true" />
                    Choose another photo
                  </Button>
                  <p className="ml-auto text-xs text-fg-3">JPEG, PNG or WebP · resized in your browser · never stored</p>
                </div>
              ) : null}

              <HistoryStrip {...history} className="xl:hidden" />

              <ExampleGallery
                entries={entries}
                disabled={paused || preparing}
                activeId={active?.sample?.id ?? null}
                onPick={pickExample}
                className="hidden lg:block"
              />
            </div>

            {/* Result column */}
            <div ref={resultRef} className={cn('min-w-0 scroll-mt-20', !active && 'max-lg:order-2')}>
              <ResultPanel
                active={active}
                status={status}
                entries={entries}
                ttaViews={model?.tta ? model.tta_views : null}
                onCancel={analyzer.cancel}
                onRetry={analyzer.retry}
                onNewPhoto={newAnalysis}
              />
            </div>

            {/* Phones and tablets: examples right under the drop zone until a photo is in, then after the result */}
            <ExampleGallery
              entries={entries}
              disabled={paused || preparing}
              activeId={active?.sample?.id ?? null}
              onPick={pickExample}
              className={cn('lg:hidden', !active && 'max-lg:order-1')}
            />
          </div>
        </div>
      </div>

      {/* Sticky action bar (phones and tablets): thumb-reachable, inside the section so it never covers the footer.
          Hidden while analysis is paused: the canvas then offers "Check again". */}
      <div hidden={paused} className="sticky bottom-0 z-30 border-t border-line bg-canvas px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          {reading ? (
            <Button variant="outline" size="lg" className="flex-1" onClick={analyzer.cancel}>
              <X aria-hidden="true" />
              Cancel reading
            </Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={openPicker} disabled={paused || preparing}>
              <ImagePlus aria-hidden="true" />
              {preparing ? 'Preparing…' : active ? 'New photo' : 'Choose a photo'}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="pointer-fine:hidden"
            onClick={openCamera}
            disabled={paused || preparing || reading}
          >
            <Camera aria-hidden="true" />
            Camera
          </Button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce(active)}
      </p>

      <input ref={fileRef} type="file" accept="image/*" tabIndex={-1} hidden onChange={onPick} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" tabIndex={-1} hidden onChange={onPick} />
    </section>
  )
}
