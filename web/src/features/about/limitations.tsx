import { Camera, Layers, ScanSearch, Stethoscope, Users } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

import { IconTile } from '@/components/layout/icon-tile'

export interface Limitation {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  title: string
  body: string
}

/** What the model cannot do. Shared by /about (full list) and /model (first three). */
export const LIMITATIONS: Limitation[] = [
  {
    icon: Camera,
    title: 'Trained on dermoscopy, not phone photos',
    body: 'HAM10000 images were taken through a dermatoscope, a lit skin magnifier. Ordinary phone photos look different, so expect them to be read less reliably.',
  },
  {
    icon: Users,
    title: 'Mostly lighter skin in the training data',
    body: 'HAM10000 comes mostly from people with lighter skin. How well the model works on darker skin is unknown.',
  },
  {
    icon: ScanSearch,
    title: 'No check for photos that are not skin lesions',
    body: 'There is no out-of-distribution detection. Anything uploaded gets one of the seven labels; the “unsure” flag, shown when no type reaches 50%, is the only guard.',
  },
  {
    icon: Layers,
    title: 'Seven types, not every condition',
    body: 'Skin conditions outside the seven HAM10000 types are still forced into one of them, so a confident answer can be confidently wrong.',
  },
  {
    icon: Stethoscope,
    title: 'It cannot diagnose',
    body: 'Only a clinician, usually with dermoscopy or a biopsy, can diagnose a skin lesion. Treat every result as a prompt to ask, never as an answer.',
  },
]

/** Hairline list of limitations with icon tiles. */
export function LimitationList({ items = LIMITATIONS, className }: { items?: Limitation[]; className?: string }) {
  return (
    <ul className={cn('divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface', className)}>
      {items.map((item) => (
        <li key={item.title} className="flex gap-4 p-5 sm:p-6">
          <IconTile icon={item.icon} />
          <div className="min-w-0">
            <h3 className="font-semibold tracking-[-0.012em] text-fg">{item.title}</h3>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-pretty text-fg-2">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
