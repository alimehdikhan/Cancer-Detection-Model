import { useLocation, useNavigate } from 'react-router'

/** The main app screen. */
export const ANALYZE_PATH = '/analyze'

/** Router state that asks /analyze to focus its drop zone once it has rendered. */
export interface AnalyzeLocationState {
  focusDropzone?: boolean
}

let chunk: Promise<typeof import('@/routes/analyze')> | null = null

/** Load (once) the code-split /analyze route. The router's lazy() and the CTA prefetch share it. */
export function loadAnalyzeRoute() {
  chunk ??= import('@/routes/analyze').catch((error: unknown) => {
    chunk = null // a failed prefetch must not poison the real navigation
    throw error
  })
  return chunk
}

/** Fire-and-forget prefetch for CTA hover and focus. */
export function prefetchAnalyze() {
  loadAnalyzeRoute().catch(() => {})
}

/** Spread on any link or button that leads to /analyze: the chunk starts loading on hover or focus. */
export const analyzePrefetchProps = {
  onPointerEnter: prefetchAnalyze,
  onFocus: prefetchAnalyze,
} as const

/** Focus the drop zone (or the current state's primary action) without scrolling. */
export function focusAnalyzeTarget(root: ParentNode | null = document) {
  requestAnimationFrame(() => root?.querySelector<HTMLElement>('[data-analyze-focus]')?.focus({ preventScroll: true }))
}

/**
 * Go to the analyser: navigate to /analyze and focus the drop zone; when already there, bring the
 * workspace to the top and focus its primary action.
 */
export function useGoToAnalyze() {
  const location = useLocation()
  const navigate = useNavigate()
  return () => {
    if (location.pathname === ANALYZE_PATH) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      focusAnalyzeTarget()
      return
    }
    prefetchAnalyze()
    navigate(ANALYZE_PATH, { state: { focusDropzone: true } satisfies AnalyzeLocationState })
  }
}
