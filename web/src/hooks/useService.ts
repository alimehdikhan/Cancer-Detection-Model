import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, getModel } from '@/lib/api'
import type { ModelInfo } from '@/lib/types'

export type ServiceState =
  | { status: 'connecting' }
  | { status: 'ready'; model: ModelInfo }
  | { status: 'no-model'; detail: string }
  | { status: 'offline' }

const RETRY_MS = 15_000

/** Tracks whether the model service is reachable and which model it serves. */
export function useService() {
  const [state, setState] = useState<ServiceState>({ status: 'connecting' })
  const [attempt, setAttempt] = useState(0)
  const versionRef = useRef<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getModel(controller.signal)
      .then((model) => {
        versionRef.current = model.version
        setState({ status: 'ready', model })
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.kind === 'aborted') return
        versionRef.current = null
        if (error instanceof ApiError && error.kind === 'no-model') setState({ status: 'no-model', detail: error.message })
        else setState({ status: 'offline' })
      })
    return () => controller.abort()
  }, [attempt])

  // Keep trying quietly while the service is down, so the page recovers on its own.
  useEffect(() => {
    if (state.status === 'ready' || state.status === 'connecting') return
    const timer = window.setTimeout(() => setAttempt((n) => n + 1), RETRY_MS)
    return () => window.clearTimeout(timer)
  }, [state, attempt])

  const retry = useCallback(() => {
    setState((current) => (current.status === 'ready' ? current : { status: 'connecting' }))
    setAttempt((n) => n + 1)
  }, [])

  /** Re-read model info when a prediction reports a version we have not seen (a redeploy). */
  const noteModelVersion = useCallback((version: string) => {
    if (versionRef.current !== version) setAttempt((n) => n + 1)
  }, [])

  return { state, retry, noteModelVersion }
}
