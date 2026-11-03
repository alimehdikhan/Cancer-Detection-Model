import type { Health, ModelInfo, PredictResponse } from './types'

const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api/v1'

export type ApiErrorKind =
  | 'bad-image'
  | 'too-large'
  | 'unsupported'
  | 'no-model'
  | 'rate-limited'
  | 'server'
  | 'network'
  | 'aborted'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  /** The API's own wording (a JSON string `detail`), when it sent one. */
  readonly detail: string | undefined

  constructor(kind: ApiErrorKind, message: string, status?: number, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.detail = detail
  }
}

const KIND_BY_STATUS: Record<number, ApiErrorKind> = {
  400: 'bad-image',
  413: 'too-large',
  415: 'unsupported',
  422: 'bad-image',
  429: 'rate-limited',
  503: 'no-model',
}

async function readDetail(response: Response): Promise<{ message: string; detail?: string }> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail
      if (typeof detail === 'string') return { message: detail, detail }
    }
  } catch {
    // Non-JSON error bodies (an HTML error page from a proxy, for example).
  }
  return { message: response.statusText || `HTTP ${response.status}` }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers: { Accept: 'application/json', ...init.headers } })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('aborted', 'Request cancelled')
    }
    throw new ApiError('network', 'The model service could not be reached')
  }

  if (!response.ok) {
    const kind = KIND_BY_STATUS[response.status] ?? 'server'
    const { message, detail } = await readDetail(response)
    throw new ApiError(kind, message, response.status, detail)
  }
  return (await response.json()) as T
}

export const getModel = (signal?: AbortSignal) => request<ModelInfo>('/model', { signal: signal ?? null })

export const getHealth = (signal?: AbortSignal) => request<Health>('/health', { signal: signal ?? null })

export function predict(image: Blob, signal?: AbortSignal): Promise<PredictResponse> {
  const body = new FormData()
  body.append('file', image, image.type === 'image/png' ? 'photo.png' : 'photo.jpg')
  return request<PredictResponse>('/predict', { method: 'POST', body, signal: signal ?? null })
}
