import { ImageIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Container } from '@/components/layout/primitives'
import { DERMOSCOPY, HERO, PHOTOS } from '@/lib/example-images'

/** Licences actually used by the images on the site, e.g. "CC0 1.0" or "CC0 1.0 / CC BY 4.0". */
const LICENCES = [...new Set([...DERMOSCOPY, ...HERO, ...PHOTOS].map((image) => image.license))].join(' / ')

/** One quiet line crediting the images, linking to the full credits on /about. */
export function CreditsLine() {
  if (!LICENCES) return null
  return (
    <div className="border-t border-line">
      <Container className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-5 text-center text-xs text-fg-3">
        <ImageIcon className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Images: ISIC Archive{PHOTOS.length ? ' and credited photographers' : ''}, {LICENCES}.
        </span>
        <Link
          to="/about#credits"
          className="font-medium text-fg-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg"
        >
          See credits
        </Link>
      </Container>
    </div>
  )
}
