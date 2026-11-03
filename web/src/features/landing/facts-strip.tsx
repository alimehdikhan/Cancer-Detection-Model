import { Container } from '@/components/layout/primitives'
import { Reveal } from '@/components/magic/reveal'

/** Real, checkable facts only: the dataset, its size, the classes, calibration and privacy. */
const FACTS = [
  { value: 'HAM10000', label: 'The research dataset it learned from' },
  { value: '10,015', label: 'Dermatoscopic images in that dataset' },
  { value: '7', label: 'Lesion types it ranks every photo against' },
  { value: 'Calibrated', label: 'Once trained, 70% means about 70%' },
  { value: 'Never stored', label: 'Photos are read in memory, then discarded' },
] as const

/** A strip of facts directly under the hero. */
export function FactsStrip() {
  return (
    <section aria-label="Key facts" className="pb-20 lg:pb-28">
      <Container>
        <Reveal>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-5">
            {FACTS.map((fact, index) => (
              <li
                key={fact.value}
                className={
                  index === FACTS.length - 1
                    ? 'col-span-2 flex flex-col gap-1.5 bg-surface p-5 sm:p-6 lg:col-span-1'
                    : 'flex flex-col gap-1.5 bg-surface p-5 sm:p-6'
                }
              >
                <p className="text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-fg tabular sm:text-2xl">
                  {fact.value}
                </p>
                <p className="text-sm leading-snug text-fg-2">{fact.label}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}
