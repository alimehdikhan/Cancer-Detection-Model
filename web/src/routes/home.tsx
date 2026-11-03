import { ClosingCta } from '@/features/home/closing-cta'
import { Faq } from '@/features/home/faq'
import { ModelSnapshot } from '@/features/home/model-snapshot'
import { Pipeline } from '@/features/home/pipeline'
import { CreditsLine } from '@/features/landing/credits-line'
import { FactsStrip } from '@/features/landing/facts-strip'
import { LandingHero } from '@/features/landing/hero'
import { PrivacySection } from '@/features/landing/privacy'
import { TypesGallery } from '@/features/landing/types-gallery'

/**
 * Landing page: the promise with real dermoscopy images, key facts, the seven types, how it works,
 * privacy and honesty, the live model snapshot, FAQ and a closing call to action. The analyser
 * itself lives on /analyze.
 */
export default function HomeRoute() {
  return (
    <>
      <LandingHero />
      <FactsStrip />
      <TypesGallery />
      <Pipeline />
      <PrivacySection />
      <ModelSnapshot />
      <Faq />
      <ClosingCta />
      <CreditsLine />
    </>
  )
}
