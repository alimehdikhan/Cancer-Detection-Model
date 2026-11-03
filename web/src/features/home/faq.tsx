import { Link } from 'react-router'
import type * as React from 'react'

import { Section, SectionHeader } from '@/components/layout/primitives'
import { Reveal } from '@/components/magic/reveal'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useApp } from '@/hooks/app-context'
import { integer, metricPercent } from '@/lib/format'

function AccuracyAnswer() {
  const { model } = useApp()
  const metrics = model && !model.dev ? model.metrics : null
  if (metrics) {
    return (
      <>
        On <span className="tabular">{integer(metrics.test_images)}</span> held-out test images, balanced accuracy was{' '}
        <span className="tabular">{metricPercent(metrics.balanced_accuracy)}</span> and melanoma recall{' '}
        <span className="tabular">{metricPercent(metrics.melanoma_recall)}</span>. Those images are dermatoscopic, like the
        training set; on phone photos it will do worse. The{' '}
        <Link to="/model" className="font-medium text-fg underline underline-offset-4">
          model card
        </Link>{' '}
        lists every number.
      </>
    )
  }
  return (
    <>
      The model running now has no measured results: it is an untrained development model, so its predictions are random.
      Once a trained model is deployed, its test-set numbers appear on the{' '}
      <Link to="/model" className="font-medium text-fg underline underline-offset-4">
        model card
      </Link>
      . No number on this site is typed in by hand.
    </>
  )
}

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Is this a diagnosis?',
    a: 'No. Dermsight is an educational tool, not a medical device. It ranks seven lesion types by calibrated probability, but only a clinician, usually with dermoscopy or a biopsy, can diagnose a skin lesion. If a spot worries you, see a doctor whatever the result says.',
  },
  {
    q: 'Which photos work best?',
    a: 'A sharp, evenly lit close-up with the spot in the centre, filling much of the frame. Avoid flash glare, deep shadows and blur. The model learned from dermatoscopic images taken in clinics, so ordinary phone photos are harder for it.',
  },
  {
    q: 'What happens to my photo?',
    a: 'Your browser applies its orientation, resizes it to at most 1024 px and strips its metadata, such as GPS location, before sending it once. The service reads it in memory and discards it. It keeps only the numbers, keyed by a one-way fingerprint of the image. The session history on the analyser lives in this tab and disappears when you close it.',
  },
  { q: 'How accurate is it?', a: <AccuracyAnswer /> },
  {
    q: 'Why could it be wrong?',
    a: 'It learned from HAM10000: 10,015 dermatoscopic images, mostly of lighter skin. It may do worse on darker skin, on phone photos and on conditions outside its seven types, and it cannot tell when a photo shows no lesion at all. It also knows nothing of your history or how the spot has changed, which a clinician weighs.',
  },
]

/** Frequently asked questions, answered plainly. */
export function Faq() {
  return (
    <Section aria-labelledby="faq-title" bordered>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-4">
          <SectionHeader
            eyebrow="Questions"
            title="Before you upload."
            titleId="faq-title"
            description="What it is, what it isn't, and what happens to your photo."
          />
        </Reveal>
        <Reveal delay={80} className="lg:col-span-8">
          <Accordion type="single" collapsible className="rounded-xl border border-line bg-surface px-5 sm:px-6">
            {FAQ.map(({ q, a }, index) => (
              <AccordionItem key={q} value={`faq-${index}`}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent className="max-w-prose leading-relaxed">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  )
}
