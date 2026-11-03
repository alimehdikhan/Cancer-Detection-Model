import { ArrowLeft, ArrowUpRight, BookOpen, Cpu, Info } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { Container, Eyebrow } from '@/components/layout/primitives'
import { DotPattern } from '@/components/magic/dot-pattern'
import { SpotlightCard } from '@/components/magic/spotlight-card'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/layout/icon-tile'
import { usePageTitle } from '@/components/layout/page-title'
import { ANALYZE_PATH, type AnalyzeLocationState, analyzePrefetchProps } from '@/hooks/useGoToAnalyze'
import { middleTruncate } from '@/lib/format'

const PLACES = [
  { to: '/model', icon: Cpu, title: 'Model card', body: 'What is running and how it was measured.' },
  { to: '/conditions', icon: BookOpen, title: 'Conditions', body: 'The seven lesion types and the ABCDE signs.' },
  { to: '/about', icon: Info, title: 'About', body: 'The pipeline, privacy and limitations.' },
]

export default function NotFoundRoute() {
  usePageTitle('Page not found')
  const { pathname } = useLocation()

  return (
    <section aria-labelledby="page-title" className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <DotPattern className="text-line-strong/80" />
        <div className="absolute top-0 left-1/2 h-[26rem] w-[40rem] max-w-[140%] -translate-x-1/2 -translate-y-1/3 rounded-full bg-glow blur-3xl" />
      </div>
      <Container className="flex min-h-[70svh] flex-col items-center justify-center gap-6 py-20 text-center sm:py-28">
        <p
          aria-hidden="true"
          className="animate-rise bg-gradient-to-b from-fg to-fg/25 bg-clip-text font-mono text-[clamp(5rem,16vw,9rem)] leading-none font-semibold tracking-[-0.06em] text-transparent tabular"
        >
          404
        </p>
        <Eyebrow className="animate-rise max-w-full" style={{ animationDelay: '60ms' }}>
          <span className="truncate">
            No page at <span className="normal-case">{middleTruncate(pathname, 32)}</span>
          </span>
        </Eyebrow>
        <h1 id="page-title" className="animate-rise text-h2 text-balance text-fg" style={{ animationDelay: '120ms' }}>
          This page doesn’t exist.
        </h1>
        <p
          className="animate-rise max-w-[46ch] text-lg leading-relaxed text-pretty text-fg-2"
          style={{ animationDelay: '160ms' }}
        >
          The link may be broken, or the page may have moved. Everything Dermsight does starts from the analyser.
        </p>
        <div className="animate-rise flex flex-wrap justify-center gap-3" style={{ animationDelay: '200ms' }}>
          <Button asChild size="lg">
            <Link to="/">
              <ArrowLeft aria-hidden="true" />
              Back to home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link
              to={ANALYZE_PATH}
              state={{ focusDropzone: true } satisfies AnalyzeLocationState}
              {...analyzePrefetchProps}
            >
              Analyze a photo
            </Link>
          </Button>
        </div>

        <nav
          aria-label="Other pages"
          className="animate-rise mt-10 w-full max-w-3xl"
          style={{ animationDelay: '260ms' }}
        >
          <ul className="grid gap-3 text-left sm:grid-cols-3">
            {PLACES.map((place) => (
              <SpotlightCard as="li" key={place.to} className="p-0">
                <Link to={place.to} className="group flex h-full flex-col gap-3 rounded-xl p-5">
                  <span className="flex items-center justify-between">
                    <IconTile icon={place.icon} />
                    <ArrowUpRight
                      className="size-4 text-fg-3 transition-transform duration-200 ease-out-quint group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="font-semibold text-fg">{place.title}</span>
                  <span className="text-sm leading-relaxed text-fg-2">{place.body}</span>
                </Link>
              </SpotlightCard>
            ))}
          </ul>
        </nav>
      </Container>
    </section>
  )
}
