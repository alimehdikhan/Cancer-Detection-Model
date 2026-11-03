import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { Section, SectionHeader } from '@/components/layout/primitives'
import { Reveal } from '@/components/magic/reveal'
import { Button } from '@/components/ui/button'
import { LIMITATIONS, LimitationList } from '@/features/about/limitations'
import { PageHero } from '@/components/layout/page-hero'
import { usePageTitle } from '@/components/layout/page-title'
import { MetricGrid, NotTrainedNotice } from '@/features/model/metric-grid'
import { PerClassTable } from '@/features/model/per-class'
import { CalibrationCard, ScreeningCard } from '@/features/model/screening'
import { SpecPanel } from '@/features/model/spec-panel'
import { useApp } from '@/hooks/app-context'
import { ANALYZE_PATH, type AnalyzeLocationState, analyzePrefetchProps } from '@/hooks/useGoToAnalyze'
import { integer } from '@/lib/format'

export default function ModelRoute() {
  usePageTitle('Model card')
  const { status, model, entries, analyzer } = useApp()

  const metrics = model && !model.dev ? model.metrics : null
  const state: 'loading' | 'unavailable' | 'untrained' | 'measured' =
    status === 'connecting' ? 'loading' : !model ? 'unavailable' : metrics ? 'measured' : 'untrained'
  const activeTop = analyzer.active?.result?.top.code
  const malignant = metrics?.malignant ?? null
  const ece = metrics?.ece ?? null

  return (
    <>
      <PageHero
        eyebrow="Model card"
        title="What is running, and how well it reads."
        description="Every fact and figure on this page comes live from the model service. Scores are measured once, on held-out photos the model never saw in training. Nothing here is estimated or filled in."
        aside={<SpecPanel />}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link
              to={ANALYZE_PATH}
              state={{ focusDropzone: true } satisfies AnalyzeLocationState}
              {...analyzePrefetchProps}
            >
              Analyze a photo
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="#limits">Known limitations</Link>
          </Button>
        </div>
      </PageHero>

      <Section aria-labelledby="metrics-title" spacing="default">
        <div className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Evaluation"
            title="Held-out test set"
            titleId="metrics-title"
            description={
              state === 'measured' && metrics ? (
                <>
                  Measured once, on <span className="text-fg tabular">{integer(metrics.test_images)}</span> photos. The
                  split was made by lesion, so no spot appears in both training and testing.
                </>
              ) : state === 'loading' ? (
                'Loading the evaluation from the model service…'
              ) : state === 'unavailable' ? (
                'The evaluation loads from the model service, which is not available right now. No numbers are shown rather than old or invented ones.'
              ) : (
                'Each metric below is explained in plain words. Values appear only once a trained model has been evaluated.'
              )
            }
          />
          {state === 'untrained' && model ? (
            <Reveal>
              <NotTrainedNotice dev={model.dev} />
            </Reveal>
          ) : null}
          <Reveal>
            <MetricGrid metrics={metrics} pending={state !== 'measured'} />
          </Reveal>
        </div>
      </Section>

      <Section aria-labelledby="per-class-title" bordered>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="Per lesion type"
              title="Precision and recall"
              titleId="per-class-title"
              description="Recall: of the test photos of a type, the share the model ranked first. Precision: of the photos the model ranked as that type, the share that really were."
            />
          </div>
          <Reveal>
            <PerClassTable entries={entries} metrics={metrics} activeTop={activeTop} />
          </Reveal>
          {state !== 'measured' ? (
            <p className="text-sm text-fg-3">Bars stay empty until a trained model reports its per-type scores.</p>
          ) : null}
        </div>
      </Section>

      {malignant || ece != null ? (
        <Section aria-labelledby="screening-title" bordered>
          <div className="flex flex-col gap-10">
            <SectionHeader
              eyebrow="Screening and calibration"
              title="Is it cancer, and can you trust the percentage?"
              titleId="screening-title"
              description="Two views that matter more than accuracy: how often a cancerous or precancerous spot gets flagged, and whether a stated confidence means what it says."
            />
            <Reveal className="grid gap-4 lg:grid-cols-2">
              {malignant ? <ScreeningCard malignant={malignant} /> : null}
              {ece != null ? <CalibrationCard ece={ece} /> : null}
            </Reveal>
          </div>
        </Section>
      ) : null}

      <Section id="limits" aria-labelledby="limits-title" bordered>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col items-start gap-6 lg:col-span-5">
            <SectionHeader
              eyebrow="Known limits"
              title="Where it falls short"
              titleId="limits-title"
              description="Good test scores describe photos like the training set. These are the ways real use can differ."
            />
            <Button asChild variant="outline">
              <Link to="/about#limitations">
                All limitations
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <Reveal className="lg:col-span-7">
            <LimitationList items={LIMITATIONS.slice(0, 3)} />
          </Reveal>
        </div>
      </Section>
    </>
  )
}
