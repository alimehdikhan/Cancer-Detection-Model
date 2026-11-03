import { prefersReducedMotion } from './utils'

/** Primary navigation (header and footer). `to` is a react-router path. */
export const NAV_LINKS = [
  { label: 'Analyze', to: '/analyze' },
  { label: 'Model', to: '/model' },
  { label: 'Conditions', to: '/conditions' },
  { label: 'About', to: '/about' },
] as const

/** Interactive API docs served by the backend (FastAPI). */
export const API_DOCS_URL = '/api/docs'

export const DATASET_CITATION =
  'Tschandl, P., Rosendahl, C. & Kittler, H. The HAM10000 dataset, a large collection of multi-source dermatoscopic images of common pigmented skin lesions. Sci. Data 5, 180161 (2018).'
export const DATASET_LICENSE = 'CC BY-NC-SA 4.0, non-commercial use'
export const DISCLAIMER =
  'Not a diagnosis. Only a clinician, usually with dermoscopy or a biopsy, can diagnose a skin lesion.'
export const DEV_MODEL_MESSAGE =
  'Development model: it is untrained, so its predictions are random. Use it to try the interface, not to read a spot.'

/**
 * id of the analyser section on /analyze. The old `/#analyze` URL is redirected to /analyze by
 * the router; in-app navigation should use ANALYZE_PATH from '@/hooks/useGoToAnalyze'.
 */
export const ANALYZE_ID = 'analyze'

/**
 * Smoothly scroll to the analyser (instant under reduced motion) and focus the element marked
 * `data-analyze-focus` (the dropzone) without a second scroll. Returns false if not on the page.
 */
export function scrollToAnalyze({ focus = true }: { focus?: boolean } = {}): boolean {
  const section = document.getElementById(ANALYZE_ID)
  if (!section) return false
  section.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  if (focus) {
    const target = section.querySelector<HTMLElement>('[data-analyze-focus]')
    target?.focus({ preventScroll: true })
  }
  return true
}
