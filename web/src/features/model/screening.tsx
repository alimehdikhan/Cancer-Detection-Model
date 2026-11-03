import { Gauge, ShieldAlert } from 'lucide-react'

import { NumberTicker } from '@/components/magic/number-ticker'
import { SpotlightCard } from '@/components/magic/spotlight-card'
import { IconTile } from '@/components/layout/icon-tile'
import { useInView } from '@/hooks/useInView'
import { decimal, metricPercent } from '@/lib/format'
import type { MalignantMetric } from '@/lib/types'
import { cn } from '@/lib/utils'

function Stat({ label, value, shown, delay }: { label: string; value: number | null; shown: boolean; delay: number }) {
  const scale = shown && value != null ? Math.max(0, Math.min(1, value)) : 0
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-fg-2">{label}</span>
        <span className={cn('font-mono text-sm tabular', value == null ? 'text-fg-3' : 'text-fg')}>
          {metricPercent(value)}
        </span>
      </div>
      <span aria-hidden="true" className="relative h-1.5 overflow-hidden rounded-full bg-track">
        <span
          className="bar-fill absolute inset-0 rounded-full bg-brand"
          style={{ transform: `scaleX(${scale})`, transitionDelay: `${delay}ms` }}
        />
      </span>
    </div>
  )
}

/** Malignant-or-precancerous screening view at the evaluation's threshold. */
export function ScreeningCard({ malignant }: { malignant: MalignantMetric }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const threshold = `${Math.round(malignant.threshold * 100)}%`
  return (
    <SpotlightCard className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <IconTile icon={ShieldAlert} />
        <div className="min-w-0">
          <p className="eyebrow">Malignant screening</p>
          <h3 className="mt-1.5 text-h3 text-fg">
            Flag a photo when malignant or precancerous types add up to {threshold} or more
          </h3>
        </div>
      </div>
      <div ref={ref} className="grid gap-4">
        <Stat label="Sensitivity" value={malignant.sensitivity} shown={inView} delay={0} />
        <Stat label="Specificity" value={malignant.specificity} shown={inView} delay={90} />
      </div>
      <p className="text-sm leading-relaxed text-pretty text-fg-2">
        A threshold trades missed cancers against false alarms. At {threshold}, the model flags{' '}
        <span className="text-fg tabular">{metricPercent(malignant.sensitivity)}</span> of the malignant or precancerous
        test photos and leaves <span className="text-fg tabular">{metricPercent(malignant.specificity)}</span> of the
        benign ones unflagged.
        {malignant.auc != null ? (
          <>
            {' '}
            Its ROC-AUC for this split is <span className="font-mono text-fg tabular">{decimal(malignant.auc)}</span>.
          </>
        ) : null}
      </p>
    </SpotlightCard>
  )
}

/**
 * Expected calibration error with a small illustration: the diagonal is perfect calibration and
 * the band around it is the measured average gap (drawn to scale on a 0–100% axis).
 */
export function CalibrationCard({ ece }: { ece: number }) {
  const gap = Math.max(0, Math.min(0.5, ece))
  const size = 120
  const band = gap * size
  const points = `0,${size} ${size},0`
  const polygon = `0,${size - band} ${size - band},0 ${size},0 ${size},${band} ${band},${size} 0,${size}`
  return (
    <SpotlightCard className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <IconTile icon={Gauge} />
        <div className="min-w-0">
          <p className="eyebrow">Calibration</p>
          <h3 className="mt-1.5 text-h3 text-fg">Stated confidence, checked against reality</h3>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <svg
          viewBox={`-12 -1 ${size + 14} ${size + 16}`}
          className="size-28 shrink-0 overflow-visible text-fg-3"
          role="img"
          aria-label={`Diagonal of perfect calibration with a band of ± ${(gap * 100).toFixed(1)} percentage points`}
        >
          <rect x="0" y="0" width={size} height={size} rx="6" fill="none" stroke="var(--line)" />
          <polygon points={polygon} fill="var(--brand)" opacity="0.28" />
          <text x={size / 2} y={size + 12} textAnchor="middle" className="fill-current font-mono" fontSize="8">
            confidence
          </text>
          <text
            x={-size / 2}
            y={-5}
            textAnchor="middle"
            transform="rotate(-90)"
            className="fill-current font-mono"
            fontSize="8"
          >
            accuracy
          </text>
          <polyline points={points} fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
        <div className="min-w-0">
          <p className="text-[2.125rem] leading-none font-semibold tracking-[-0.035em] text-fg tabular">
            <span aria-hidden="true">
              <NumberTicker value={ece} duration={1100} format={(n) => n.toFixed(3)} />
            </span>
            <span className="sr-only">{decimal(ece)}</span>
          </p>
          <p className="mt-1 font-mono text-[0.6875rem] tracking-[0.08em] text-fg-3 uppercase">
            Expected calibration error
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-pretty text-fg-2">
        Probabilities are temperature-scaled on held-out photos. On the test set, stated confidence and actual accuracy
        differ by about <span className="text-fg tabular">{(gap * 100).toFixed(1)}</span> percentage points on average:
        a 70% reading is right roughly 70% of the time on photos like the training set.
      </p>
    </SpotlightCard>
  )
}
