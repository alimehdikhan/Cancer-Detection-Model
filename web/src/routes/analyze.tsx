import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { usePageTitle } from '@/components/layout/page-title'
import { AnalyzerWorkspace } from '@/features/analyzer/workspace'
import { type AnalyzeLocationState, focusAnalyzeTarget } from '@/hooks/useGoToAnalyze'

/** /analyze: the main app screen. Arriving from a call to action focuses the drop zone. */
export default function AnalyzeRoute() {
  usePageTitle('Analyze a photo')
  const location = useLocation()
  const focusDropzone = (location.state as AnalyzeLocationState | null)?.focusDropzone === true

  useEffect(() => {
    if (focusDropzone) focusAnalyzeTarget(document.getElementById('analyze'))
  }, [focusDropzone, location.key])

  return <AnalyzerWorkspace />
}
