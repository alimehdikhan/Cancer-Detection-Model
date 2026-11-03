import { ArrowUpRight, Check, X } from 'lucide-react'

import type { Entry } from '@/lib/entries'
import type { ExampleImage } from '@/lib/example-images'
import type { PredictResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

/** "ISIC_0000049" or the manifest id. */
export const sampleRef = (sample: ExampleImage) => sample.sourceId ?? sample.id

/** "Melanoma in situ (histopathology), ISIC_0000049": the label exactly as the source gives it. */
export function groundTruthText(sample: ExampleImage) {
  const confirm = sample.confirmType ? ` (${sample.confirmType})` : ''
  return `${sample.diagnosis ?? 'Unknown diagnosis'}${confirm}, ${sampleRef(sample)}`
}

/**
 * For a real example: the known diagnosis next to the live result, so a visitor can see whether
 * the model's top type agrees with it. Neutral styling either way (never green or red).
 */
export function GroundTruth({
  sample,
  result,
  entries,
  className,
}: {
  sample: ExampleImage
  result?: PredictResponse
  entries: Entry[]
  className?: string
}) {
  const expected = entries.find((entry) => entry.code === sample.code)
  const match = result && sample.code ? result.top.code === sample.code : null

  return (
    <section aria-label="Ground truth for this example" className={cn('rounded-xl border border-line bg-surface-2/60 p-4', className)}>
      <p className="text-sm leading-relaxed text-fg">
        <span className="font-semibold">Ground truth for this example:</span> {groundTruthText(sample)}
      </p>
      {expected ? (
        <p className="mt-1 text-sm text-fg-2">
          Dataset class: {expected.name} <span className="font-mono text-xs text-fg-3 uppercase">({expected.code})</span>
        </p>
      ) : null}
      {match !== null && result ? (
        <p className="mt-2.5 flex items-start gap-2 border-t border-line pt-2.5 text-sm text-fg-2">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg"
          >
            {match ? <Check className="size-2.5" /> : <X className="size-2.5" />}
          </span>
          <span>
            {match
              ? `The model's top type (${result.top.name}) matches the ground truth.`
              : `The model's top type (${result.top.name}) differs from the ground truth.`}
          </span>
        </p>
      ) : null}
      <p className="mt-2.5 text-xs text-fg-3">
        Image: {sampleRef(sample)}, ISIC Archive{sample.attribution ? ` (${sample.attribution})` : ''}, {sample.license}.{' '}
        {sample.sourceUrl ? (
          <a
            href={sample.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 underline decoration-line-strong hover:text-fg"
          >
            Source
            <ArrowUpRight className="size-3" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </p>
    </section>
  )
}
