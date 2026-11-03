import { ArrowRight, Info } from 'lucide-react'
import { Link } from 'react-router'

import { Section } from '@/components/layout/primitives'
import { DotPattern } from '@/components/magic/dot-pattern'
import { Reveal } from '@/components/magic/reveal'
import { Button } from '@/components/ui/button'
import { ANALYZE_PATH, type AnalyzeLocationState, analyzePrefetchProps } from '@/hooks/useGoToAnalyze'
import { DISCLAIMER } from '@/lib/site'

/** Closing call to action, with the disclaimer. */
export function ClosingCta() {
  return (
    <Section aria-labelledby="cta-title" bordered>
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-2xl border border-line bg-surface px-6 py-14 text-center sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 text-line-strong">
            <DotPattern spacing={20} />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 -z-10 h-64 w-[70%] -translate-x-1/2 rounded-full bg-glow opacity-80 blur-3xl"
          />
          <p className="eyebrow">Ready when you are</p>
          <h2 id="cta-title" className="mx-auto mt-4 max-w-2xl text-h2 text-balance text-fg">
            Wondering about a spot? Take a second look.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-fg-2">
            It takes a few seconds, your photo is never stored, and you get a calibrated ranking with plain next steps.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={ANALYZE_PATH} state={{ focusDropzone: true } satisfies AnalyzeLocationState} {...analyzePrefetchProps}>
                Analyze a photo
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/conditions">Learn the seven types</Link>
            </Button>
          </div>
          <p className="mx-auto mt-10 flex max-w-xl items-start justify-center gap-2 text-left text-xs leading-relaxed text-fg-3 sm:text-center">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>{DISCLAIMER}</span>
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
