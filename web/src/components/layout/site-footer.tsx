import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { ANALYZE_PATH, analyzePrefetchProps } from '@/hooks/useGoToAnalyze'
import { API_DOCS_URL, DATASET_CITATION, DATASET_LICENSE } from '@/lib/site'

import { Logo } from './logo'
import { Container } from './primitives'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Analyze a photo', to: ANALYZE_PATH },
      { label: 'Model card', to: '/model' },
      { label: 'Conditions', to: '/conditions' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'How it works', to: '/about#pipeline' },
      { label: 'Privacy', to: '/about#privacy' },
      { label: 'Limitations', to: '/about#limitations' },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <Container className="grid gap-10 py-14 md:grid-cols-12">
        <div className="flex flex-col gap-3 md:col-span-5">
          <Logo />
          <p className="max-w-sm text-sm text-fg-2">
            An educational skin lesion classifier. Not a medical device and not a diagnosis: see a clinician about any
            spot that worries you.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-2 md:col-span-2">
            <p className="eyebrow mb-1">{column.title}</p>
            {column.links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                {...(link.to === ANALYZE_PATH ? analyzePrefetchProps : {})}
                className="w-fit text-sm text-fg-2 transition-colors hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ))}

        <div className="flex flex-col gap-2 md:col-span-3">
          <p className="eyebrow mb-1">Developers</p>
          <a href={API_DOCS_URL} className="inline-flex w-fit items-center gap-1 text-sm text-fg-2 transition-colors hover:text-fg">
            API docs
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-3 py-6 text-xs text-fg-3 md:flex-row md:items-start md:justify-between md:gap-8">
          <p className="max-w-3xl">
            Trained on HAM10000. {DATASET_CITATION} {DATASET_LICENSE}.
          </p>
          <p className="shrink-0 font-mono tracking-[0.06em] uppercase">Not a medical device</p>
        </Container>
      </div>
    </footer>
  )
}
