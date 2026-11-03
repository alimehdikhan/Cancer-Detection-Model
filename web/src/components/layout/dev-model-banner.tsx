import { TriangleAlert } from 'lucide-react'
import { useLocation } from 'react-router'

import { useApp } from '@/hooks/app-context'
import { ANALYZE_PATH } from '@/hooks/useGoToAnalyze'
import { DEV_MODEL_MESSAGE } from '@/lib/site'
import { cn } from '@/lib/utils'

import { Container } from './primitives'

/** Caution banner under the header whenever the loaded model is the untrained dev model. */
export function DevModelBanner() {
  const { status } = useApp()
  const { pathname } = useLocation()
  if (status !== 'dev') return null
  return (
    <div role="note" className="border-b border-caution/30 bg-caution-soft text-caution-text">
      <Container className={cn('flex items-start gap-2.5 py-2.5 text-sm sm:items-center', pathname === ANALYZE_PATH && 'max-w-[90rem]')}>
        <TriangleAlert className="mt-0.5 size-4 shrink-0 sm:mt-0" aria-hidden="true" />
        <p>{DEV_MODEL_MESSAGE}</p>
      </Container>
    </div>
  )
}
