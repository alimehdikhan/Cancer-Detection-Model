import * as m from 'motion/react-m'

import type { SessionPlate } from '@/hooks/useAnalyzer'
import { cn } from '@/lib/utils'

const CORNERS = [
  'top-3 left-3 border-t border-l rounded-tl-[6px]',
  'top-3 right-3 border-t border-r rounded-tr-[6px]',
  'bottom-3 left-3 border-b border-l rounded-bl-[6px]',
  'bottom-3 right-3 border-b border-r rounded-br-[6px]',
]

function viewerAlt(plate: SessionPlate) {
  if (plate.sample) return `${plate.sample.alt || 'Real example image'}, figure ${plate.figure}`
  if (plate.example) return `Synthetic example image, figure ${plate.figure}`
  return `Your photo, figure ${plate.figure}`
}

/**
 * The photo well: the downscaled upload on a near-black surface, with viewfinder corners, a
 * figure tag, the synthetic-example label and, while reading, a sweeping scan line.
 */
export function Viewer({ plate, className }: { plate: SessionPlate; className?: string }) {
  const reading = plate.status === 'reading'
  const failed = plate.status === 'error'

  return (
    <figure className={cn('relative m-0 overflow-hidden rounded-xl bg-viewer', className)}>
      <div className={cn('absolute inset-0 transition-opacity duration-300', failed && 'opacity-50 grayscale')}>
        {/* Soft, blurred copy of the photo fills any letterbox so the well never looks empty. */}
        <img
          src={plate.previewUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 size-full scale-125 object-cover opacity-35 blur-2xl select-none"
        />
        <m.img
          key={plate.previewUrl}
          src={plate.previewUrl}
          alt={viewerAlt(plate)}
          draggable={false}
          initial={{ opacity: 0, transform: 'scale(1.04)', filter: 'blur(8px)' }}
          animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative size-full object-contain select-none"
        />
      </div>

      {/* Viewfinder corners */}
      {CORNERS.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute size-4 transition-colors duration-300',
            corner,
            reading ? 'border-brand' : 'border-white/35',
          )}
        />
      ))}

      {reading ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/15" />
          <div className="animate-scan absolute inset-x-0 top-0 h-1/2 motion-reduce:hidden">
            <div className="absolute inset-x-0 bottom-0 h-20 translate-y-1/2 bg-linear-to-b from-transparent via-brand/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-brand shadow-[0_0_12px_1px_var(--color-brand)]" />
          </div>
        </div>
      ) : null}

      <figcaption className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2 px-4 pb-1">
        <span className="rounded-full bg-black/60 px-2 py-0.5 font-mono text-[0.6875rem] tracking-[0.06em] text-white/90 uppercase">
          Fig. {plate.figure}
          {failed ? ' · Not read' : reading ? ' · Reading' : ''}
        </span>
        {plate.example ? (
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-[0.6875rem] font-medium text-white/90">
            Synthetic example image
          </span>
        ) : null}
        {plate.sample ? (
          <span className="max-w-full truncate rounded-full bg-black/60 px-2 py-0.5 text-[0.6875rem] font-medium text-white/90">
            Real example · {plate.sample.sourceId ?? plate.sample.id} · {plate.sample.license}
          </span>
        ) : null}
      </figcaption>
    </figure>
  )
}
