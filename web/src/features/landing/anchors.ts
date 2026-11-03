import type * as React from 'react'

import { prefersReducedMotion } from '@/lib/utils'

/** id of the "Seven types" gallery on the landing page. */
export const TYPES_ID = 'types'

/**
 * In-page jump for an `<a href="#id">`: smooth unless reduced motion, then focus the section
 * (it carries tabIndex={-1}) so keyboard and screen-reader users land there too.
 */
export function scrollToSection(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  target.focus({ preventScroll: true })
}
