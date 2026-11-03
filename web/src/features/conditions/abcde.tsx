import type * as React from 'react'

import { SpotlightCard } from '@/components/magic/spotlight-card'
import { cn } from '@/lib/utils'

/** Closed polygon around (cx, cy) whose radius follows `radii` (one value per vertex). */
function ring(cx: number, cy: number, radii: number[]): string {
  return radii
    .map((r, i) => {
      const angle = (i / radii.length) * Math.PI * 2 - Math.PI / 2
      return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`
    })
    .join(' ')
}

const JAGGED = ring(36, 30, [19, 15, 20, 14, 18, 21, 13, 19, 16, 21, 14, 18, 20, 13, 19, 15, 21, 16])
const OUTER = ring(36, 30, [20, 19, 21, 20, 18, 19, 21, 20, 19, 18, 20, 21])
const MIDDLE = ring(38, 31, [13, 11, 14, 12, 10, 13, 12, 14, 11, 12])
const INNER = ring(33, 28, [6, 7, 5, 7, 6, 5, 7, 6])
const GROWN = ring(54, 30, [16, 14, 17, 13, 16, 18, 13, 15, 17, 14])

const GLYPHS: Record<string, React.ReactNode> = {
  A: (
    <>
      <path d="M36 10 A20 20 0 0 0 36 50 Z" className="fill-current opacity-20" />
      <path d="M36 10 C52 11 62 22 55 31 C50 38 52 47 36 50 Z" className="fill-current opacity-45" />
      <path
        d="M36 10 A20 20 0 0 0 36 50 C52 47 50 38 55 31 C62 22 52 11 36 10 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <line x1="36" y1="3" x2="36" y2="57" stroke="var(--brand)" strokeWidth="1.25" strokeDasharray="3 3" />
    </>
  ),
  B: (
    <>
      <polygon points={JAGGED} className="fill-current opacity-25" />
      <polygon points={JAGGED} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </>
  ),
  C: (
    <>
      <polygon
        points={OUTER}
        className="fill-current opacity-15"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <polygon points={MIDDLE} className="fill-current opacity-40" />
      <polygon points={INNER} className="fill-current opacity-85" />
    </>
  ),
  D: (
    <>
      <circle cx="36" cy="34" r="15" className="fill-current opacity-25" stroke="currentColor" strokeWidth="1.25" />
      <line x1="21" y1="12" x2="51" y2="12" stroke="var(--brand)" strokeWidth="1.25" />
      <line x1="21" y1="8" x2="21" y2="16" stroke="var(--brand)" strokeWidth="1.25" />
      <line x1="51" y1="8" x2="51" y2="16" stroke="var(--brand)" strokeWidth="1.25" />
      <text x="58" y="15" className="fill-current font-mono" fontSize="8">
        6mm
      </text>
    </>
  ),
  E: (
    <>
      <circle cx="13" cy="30" r="7" className="fill-current opacity-25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M24 30 H33 M30 26.5 L33.5 30 L30 33.5"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={GROWN}
        className="fill-current opacity-40"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </>
  ),
}

export const ABCDE = [
  { letter: 'A', term: 'Asymmetry', text: 'The two halves don’t match.' },
  { letter: 'B', term: 'Border', text: 'The edge is ragged, notched or blurred.' },
  { letter: 'C', term: 'Colour', text: 'Several shades, or colour that is uneven.' },
  { letter: 'D', term: 'Diameter', text: 'Wider than about 6 mm, the size of a pencil eraser.' },
  { letter: 'E', term: 'Evolving', text: 'It changes in size, shape or colour, or starts to itch or bleed.' },
] as const

/** The five ABCDE warning signs as illustrated cards. */
export function AbcdeGrid() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="The ABCDE warning signs">
      {ABCDE.map((item, index) => (
        <SpotlightCard
          as="li"
          key={item.letter}
          className={cn('flex flex-col gap-5 p-5', index === ABCDE.length - 1 && 'sm:col-span-2 lg:col-span-1')}
        >
          <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-[10px] border border-line bg-surface-2/60">
            <svg viewBox="0 0 72 60" className="h-16 w-auto overflow-visible text-fg-2" aria-hidden="true">
              {GLYPHS[item.letter]}
            </svg>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-2xl leading-none font-semibold text-brand" aria-hidden="true">
              {item.letter}
            </span>
            <h3 className="text-h3 text-fg">{item.term}</h3>
          </div>
          <p className="-mt-2 text-[0.9375rem] leading-relaxed text-pretty text-fg-2">{item.text}</p>
        </SpotlightCard>
      ))}
    </ol>
  )
}
