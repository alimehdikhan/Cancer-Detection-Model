import {
  ArrowRight,
  ArrowUpRight,
  Ban,
  Database,
  EyeOff,
  Fingerprint,
  FileCode2,
  History,
  ImageOff,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import { Link } from 'react-router'

import { Section, SectionHeader } from '@/components/layout/primitives'
import { StatusDot, statusLabel } from '@/components/layout/status-pill'
import { BentoCard, BentoGrid } from '@/components/magic/bento-grid'
import { Reveal } from '@/components/magic/reveal'
import { SpotlightCard } from '@/components/magic/spotlight-card'
import { Button } from '@/components/ui/button'
import { CREDITED_COUNT, ImageCredits } from '@/features/about/image-credits'
import { LimitationList } from '@/features/about/limitations'
import { IconTile } from '@/components/layout/icon-tile'
import { PageHero } from '@/components/layout/page-hero'
import { usePageTitle } from '@/components/layout/page-title'
import { Pipeline } from '@/features/about/pipeline'
import { useApp } from '@/hooks/app-context'
import { middleTruncate } from '@/lib/format'
import { API_DOCS_URL, DATASET_CITATION, DATASET_LICENSE, DISCLAIMER } from '@/lib/site'

const JUMP_LINKS = [
  { label: 'Pipeline', hash: '#pipeline' },
  { label: 'Privacy', hash: '#privacy' },
  { label: 'Limitations', hash: '#limitations' },
  { label: 'Dataset', hash: '#dataset' },
  { label: 'Image credits', hash: '#credits' },
]

const PRIVACY = [
  {
    icon: ImageOff,
    title: 'Photos are never stored',
    description:
      'Your photo is sent once, read in memory and discarded. It is not written to disk or kept with the result.',
    className: 'lg:col-span-2',
  },
  {
    icon: EyeOff,
    title: 'Metadata stripped first',
    description:
      'Before upload, the browser re-encodes the photo, dropping EXIF data such as GPS location and camera details.',
  },
  {
    icon: Fingerprint,
    title: 'Only numbers are cached',
    description:
      'The service caches the result, which is only numbers, for a while. It is keyed by a one-way SHA-256 fingerprint of the file, so the same photo gets the same answer quickly.',
  },
  {
    icon: History,
    title: 'History stays in this tab',
    description:
      'Session history lives in memory only. Reloading or closing the tab clears it; nothing goes to browser storage.',
    className: 'lg:col-span-2',
  },
  {
    icon: Ban,
    title: 'No accounts, no trackers',
    description:
      'No sign-up and no analytics. The page’s security policy only lets it talk to its own server, and fonts are self-hosted.',
    className: 'lg:col-span-2',
  },
  {
    icon: Sun,
    title: 'One thing is saved',
    description:
      'Your light or dark theme choice, in this browser’s local storage. Choose “system” and even that is removed.',
  },
]

const DATASET_FACTS = [
  { value: '10,015', label: 'dermatoscopic images' },
  { value: '7', label: 'diagnostic categories' },
  { value: 'CC BY-NC-SA 4.0', label: 'licence, non-commercial' },
]

const EXTERNAL = [
  { label: 'Dataset', detail: 'doi:10.7910/DVN/DBW86T', href: 'https://doi.org/10.7910/DVN/DBW86T' },
  { label: 'Paper', detail: 'doi:10.1038/sdata.2018.161', href: 'https://doi.org/10.1038/sdata.2018.161' },
  { label: 'Licence', detail: 'CC BY-NC-SA 4.0', href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' },
]

function FactsPanel() {
  const { status, model } = useApp()
  const rows: { label: string; value: string }[] = [
    { label: 'Photos stored', value: 'Never' },
    { label: 'Sent to the server', value: 'One JPEG ≤ 1024 px' },
    { label: 'Photo metadata', value: 'Stripped in your browser' },
    { label: 'Lesion types', value: '7, from HAM10000' },
    {
      label: 'Model',
      value: model ? `${middleTruncate(model.version, 22)}${model.dev ? ' (dev)' : ''}` : statusLabel(status),
    },
    { label: 'Licence', value: 'CC BY-NC-SA 4.0' },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),0_24px_60px_-36px_rgb(0_0_0/0.45)]">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/50 px-5 py-3">
        <span className="eyebrow">Fact sheet</span>
        <span className="inline-flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.06em] text-fg-2 uppercase">
          <StatusDot status={status} />
          {statusLabel(status)}
        </span>
      </div>
      <dl className="divide-y divide-line px-5">
        {rows.map((row) => (
          <div key={row.label} className="flex min-h-12 items-center justify-between gap-6 py-3">
            <dt className="shrink-0 text-sm text-fg-2">{row.label}</dt>
            <dd className="min-w-0 truncate text-right font-mono text-[0.8125rem] text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function AboutRoute() {
  usePageTitle('About')
  const { model } = useApp()

  return (
    <>
      <PageHero
        eyebrow="About Dermsight"
        title="How a photo becomes a result."
        description="Dermsight is a research preview with inspectable code: a skin lesion classifier trained on the public HAM10000 dataset, with calibrated confidence and no stored photos. Here is exactly what happens, what it can’t do, and where the data comes from."
        aside={<FactsPanel />}
      >
        <nav aria-label="On this page" className="flex flex-wrap gap-2">
          {JUMP_LINKS.map((link) => (
            <Link
              key={link.hash}
              to={link.hash}
              className="inline-flex h-10 items-center rounded-full border border-line bg-surface/70 px-4 text-sm text-fg-2 transition-colors duration-200 hover:border-line-strong hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </PageHero>

      <Section id="pipeline" aria-labelledby="pipeline-title">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <SectionHeader
                eyebrow="Pipeline"
                title="Six steps, nothing kept"
                titleId="pipeline-title"
                description="From your photo to a ranked result. Each step says what it passes to the next, using the live settings of the loaded model."
              />
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
                <div className="bg-surface p-4">
                  <dt className="eyebrow">Sent</dt>
                  <dd className="mt-1.5 text-sm text-fg">One JPEG, ≤ 1024 px, no metadata</dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="eyebrow">Returned</dt>
                  <dd className="mt-1.5 text-sm text-fg">7 probabilities, a risk level, an unsure flag</dd>
                </div>
              </dl>
            </div>
          </div>
          <Reveal className="lg:col-span-7">
            <Pipeline model={model} />
          </Reveal>
        </div>
      </Section>

      <Section id="privacy" aria-labelledby="privacy-title" bordered>
        <div className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Privacy"
            title="Private by design"
            titleId="privacy-title"
            description="Every claim here matches what the code does. There is nothing to opt out of, because nothing is collected."
          />
          <Reveal>
            <BentoGrid>
              {PRIVACY.map((item) => (
                <BentoCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  className={item.className}
                />
              ))}
            </BentoGrid>
          </Reveal>
        </div>
      </Section>

      <Section id="limitations" aria-labelledby="limitations-title" bordered>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <SectionHeader
                eyebrow="Limitations"
                title="What it can’t do"
                titleId="limitations-title"
                description="A model trained on a public research dataset can be useful and still be wrong. Read these before trusting any result."
              />
              <Button asChild variant="outline" className="self-start">
                <Link to="/model">
                  See the model card
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <Reveal className="lg:col-span-7">
            <LimitationList />
          </Reveal>
        </div>
      </Section>

      <Section id="dataset" aria-labelledby="dataset-title" bordered>
        <div className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Dataset and licence"
            title="Trained on HAM10000"
            titleId="dataset-title"
            description="A large, public collection of dermatoscopic images of common pigmented skin lesions, gathered from several sources and labelled by experts."
          />
          <Reveal className="grid gap-4 lg:grid-cols-12">
            <dl className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:col-span-12">
              {DATASET_FACTS.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-1.5 bg-surface p-6">
                  <dt className="eyebrow order-2">{fact.label}</dt>
                  <dd className="order-1 text-[1.75rem] leading-none font-semibold tracking-[-0.03em] text-fg tabular">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <SpotlightCard as="article" className="flex flex-col gap-5 lg:col-span-7">
              <div className="flex items-center gap-3">
                <IconTile icon={Database} />
                <h3 className="text-h3 text-fg">Citation</h3>
              </div>
              <blockquote className="border-l-2 border-brand/50 pl-4 text-[0.9375rem] leading-relaxed text-pretty text-fg-2">
                {DATASET_CITATION}
              </blockquote>
              <p className="text-sm leading-relaxed text-fg-2">
                Licence: {DATASET_LICENSE}. Because of it, Dermsight and its model are for non-commercial research and
                education only.
              </p>
            </SpotlightCard>
            <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface lg:col-span-5">
              {EXTERNAL.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex min-h-16 items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-surface-2/60"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-fg">{link.label}</span>
                      <span className="block truncate font-mono text-xs text-fg-3">{link.detail}</span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-fg-3 transition-transform duration-200 ease-out-quint group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg"
                      aria-hidden="true"
                    />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section id="credits" aria-labelledby="credits-title" bordered>
        <div className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Credits"
            title="Image credits"
            titleId="credits-title"
            description={`The ${CREDITED_COUNT} example images on this site are real dermoscopy images from the ISIC Archive, used under the licence shown with each. Each diagnosis is the archive’s own ground truth with how it was confirmed, not a model result.`}
          />
          <Reveal>
            <ImageCredits />
          </Reveal>
          <p className="text-sm text-fg-2">
            Source:{' '}
            <a
              href="https://www.isic-archive.com/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg"
            >
              ISIC Archive
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . The model itself was trained on HAM10000, credited under Dataset and licence above.
          </p>
        </div>
      </Section>

      <Section aria-labelledby="disclaimer-title" bordered>
        <Reveal className="grid gap-4 lg:grid-cols-2">
          <div className="relative isolate flex flex-col gap-5 overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute -top-24 -left-20 -z-10 h-56 w-80 rounded-full bg-glow blur-3xl"
            />
            <IconTile icon={ShieldCheck} />
            <div>
              <h2 id="disclaimer-title" className="text-h3 text-fg">
                Not a medical device
              </h2>
              <p className="mt-2 leading-relaxed text-pretty text-fg-2">{DISCLAIMER}</p>
              <p className="mt-3 leading-relaxed text-pretty text-fg-2">
                Dermsight is for education and research only and does not give medical advice. If you are worried about
                a spot on your skin, see a doctor.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <IconTile icon={FileCode2} />
            <div className="flex flex-1 flex-col">
              <h2 className="text-h3 text-fg">For developers</h2>
              <p className="mt-2 leading-relaxed text-pretty text-fg-2">
                The model service is a small JSON API:{' '}
                <code className="font-mono text-sm text-fg">GET /api/v1/model</code> describes the loaded model and its
                metrics, and <code className="font-mono text-sm text-fg">POST /api/v1/predict</code> reads a photo. The
                interactive docs list every field.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <a href={API_DOCS_URL}>
                    API docs
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/model">Model card</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
