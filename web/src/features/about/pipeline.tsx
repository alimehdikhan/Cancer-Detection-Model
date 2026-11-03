import { BrainCircuit, Crop, FileCheck2, ImageDown, Scale, Undo2 } from 'lucide-react'
import { createRef, type RefObject, useMemo, useRef } from 'react'
import type * as React from 'react'

import { AnimatedBeam } from '@/components/magic/animated-beam'
import type { ModelInfo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Step {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  where: 'Your browser' | 'Model service'
  title: string
  body: string
  passes: string
}

function readings(views: number): string {
  if (views <= 1) return 'reads it once'
  if (views === 2) return 'reads it twice, as taken and mirrored, and averages the two readings'
  return `reads it ${views} times, as taken and flipped ${views - 1} ways, and averages the readings`
}

/** The six steps as they actually run, with live values from /model where they matter. */
function buildSteps(model: ModelInfo | null): Step[] {
  const size = model ? `${model.image_size} × ${model.image_size} px` : 'the model’s input size'
  const views = model ? readings(model.tta_views) : 'reads it once or more and averages the readings'
  return [
    {
      icon: ImageDown,
      where: 'Your browser',
      title: 'Resized and stripped',
      body: 'The photo is turned the right way up, scaled so its longest edge is at most 1024 px, and re-encoded as JPEG. Re-encoding drops all metadata, including GPS location.',
      passes: 'one JPEG ≤ 1024 px, no metadata',
    },
    {
      icon: FileCheck2,
      where: 'Model service',
      title: 'Validated',
      body: 'The service accepts JPEG, PNG or WebP up to 10 MB, refuses anything else, and decodes the image defensively, rejecting files that are empty, corrupt or over 40 megapixels.',
      passes: 'a decoded RGB image',
    },
    {
      icon: Crop,
      where: 'Model service',
      title: 'Preprocessed',
      body: `The image is scaled, centre-cropped to ${size} and normalised exactly as during training, so the model sees photos the way it learned them.`,
      passes: model ? `${model.image_size} × ${model.image_size} px tensor` : 'model-sized tensor',
    },
    {
      icon: BrainCircuit,
      where: 'Model service',
      title: model && model.tta_views > 1 ? 'Read with test-time augmentation' : 'Read by the model',
      body: `The network${model ? ` (${model.backbone})` : ''} ${views}. Averaging flipped views makes the answer steadier.`,
      passes: 'seven raw scores',
    },
    {
      icon: Scale,
      where: 'Model service',
      title: 'Calibrated',
      body: 'Raw scores are temperature-scaled on held-out photos, so a 70% reading is right about 70% of the time on photos like the training set. If no type reaches 50%, the result is flagged as unsure.',
      passes: 'seven calibrated probabilities',
    },
    {
      icon: Undo2,
      where: 'Your browser',
      title: 'Back to you, nothing kept',
      body: 'You get the ranked types, a risk level and what to do next. The image is discarded after reading; only the numbers are cached, keyed by a one-way fingerprint of the file.',
      passes: 'a ranked result; the image is gone',
    },
  ]
}

/** Vertical pipeline with an animated beam travelling between the step nodes. */
export function Pipeline({ model }: { model: ModelInfo | null }) {
  const steps = buildSteps(model)
  const containerRef = useRef<HTMLOListElement>(null)
  const nodeRefs = useMemo<RefObject<HTMLSpanElement | null>[]>(
    () => steps.map(() => createRef<HTMLSpanElement>()),
    [steps.length],
  )

  return (
    <ol ref={containerRef} className="relative flex flex-col gap-4">
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <li key={step.title} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 sm:gap-5">
            <span
              ref={nodeRefs[index]}
              className={cn(
                'relative z-10 mt-5 flex size-11 items-center justify-center rounded-xl border bg-surface',
                step.where === 'Your browser' ? 'border-brand/40 text-brand' : 'border-line-strong text-fg-2',
              )}
            >
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0 rounded-xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-fg-3 tabular">{String(index + 1).padStart(2, '0')}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-px font-mono text-[0.625rem] tracking-[0.08em] uppercase',
                    step.where === 'Your browser' ? 'bg-brand-soft text-brand' : 'bg-surface-2 text-fg-2',
                  )}
                >
                  {step.where}
                </span>
              </div>
              <h3 className="mt-2 text-h3 text-fg">{step.title}</h3>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-pretty text-fg-2">{step.body}</p>
              <p className="mt-4 border-t border-line pt-3 font-mono text-xs text-fg-3">
                Passes on: <span className="text-fg-2">{step.passes}</span>
              </p>
            </div>
          </li>
        )
      })}
      {nodeRefs.slice(1).map((toRef, index) => {
        const fromRef = nodeRefs[index]
        if (!fromRef) return null
        return (
          <AnimatedBeam
            key={index}
            containerRef={containerRef}
            fromRef={fromRef}
            toRef={toRef}
            duration={2.6}
            delay={index * 0.45}
            className="z-0"
          />
        )
      })}
    </ol>
  )
}
