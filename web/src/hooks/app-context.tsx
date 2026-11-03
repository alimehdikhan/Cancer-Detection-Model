import { createContext, type ReactNode, useContext, useMemo } from 'react'

import { buildEntries, type Entry } from '@/lib/entries'
import type { ModelInfo } from '@/lib/types'

import { type AnalyzerController, useAnalyzer } from './useAnalyzer'
import { type ServiceState, useService } from './useService'
import { type ThemeController, useTheme } from './useTheme'

/** One status for the header pill, the dev banner and empty states. */
export type ServiceStatus = 'connecting' | 'ready' | 'dev' | 'no-model' | 'offline'

export interface AppState {
  theme: ThemeController
  service: { state: ServiceState; retry: () => void; noteModelVersion: (version: string) => void }
  /** Simplified status: 'dev' when the loaded model is the untrained development model. */
  status: ServiceStatus
  /** The loaded model, or null while connecting / offline / no model. */
  model: ModelInfo | null
  /** The seven classes (API names and descriptions over the static fallback), resting order. */
  entries: Entry[]
  /** The single analyser session, shared across routes so history survives navigation. */
  analyzer: AnalyzerController
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const service = useService()
  const analyzer = useAnalyzer({ onServiceIssue: service.retry, onModelVersion: service.noteModelVersion })

  const model = service.state.status === 'ready' ? service.state.model : null
  const entries = useMemo(() => buildEntries(model?.classes), [model])
  const status: ServiceStatus =
    service.state.status === 'ready' ? (service.state.model.dev ? 'dev' : 'ready') : service.state.status

  const value = useMemo<AppState>(
    () => ({ theme, service, status, model, entries, analyzer }),
    [theme, service, status, model, entries, analyzer],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/** Access theme, service, model, entries and the analyser from any component under the layout. */
export function useApp(): AppState {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside <AppProvider>')
  return value
}
