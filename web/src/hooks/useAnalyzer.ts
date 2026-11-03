import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, type ApiErrorKind, predict } from '@/lib/api'
import type { ExampleImage } from '@/lib/example-images'
import { downscale, fingerprint, ImageReadError } from '@/lib/image'
import type { PredictResponse } from '@/lib/types'

export type PlateStatus = 'reading' | 'done' | 'error'

export interface AnalyzeError {
  kind: ApiErrorKind | 'unreadable'
  message: string
}

/** One analysed photo in this tab. Nothing here is persisted. */
export interface SessionPlate {
  figure: number
  hash: string
  /** The downscaled JPEG that was uploaded; kept so a failed read can be retried. */
  image: Blob
  previewUrl: string
  status: PlateStatus
  /** True when analyze() was called with { example: true } for a synthetic image (label it "Synthetic example image"). No page does this today. */
  example: boolean
  /** Set for a real, licensed example image with a known diagnosis (show its ground truth and credit). */
  sample?: ExampleImage
  result?: PredictResponse
  error?: AnalyzeError
}

export interface IntakeNotice {
  tone: 'info' | 'error'
  message: string
}

const MAX_PLATES = 24
// A floor on the reading state so a fast answer does not flash; cached answers skip it.
const MIN_READING_MS = 450

export const ERROR_MESSAGES: Record<AnalyzeError['kind'], string> = {
  unreadable: 'This file could not be read as an image. Use a JPEG, PNG or WebP photo.',
  'bad-image': 'The service could not read this image. Try a different photo.',
  'too-large': 'This image is over the 10 MB upload limit.',
  unsupported: 'That file type is not supported. Use a JPEG, PNG or WebP photo.',
  'no-model': 'The model service is running, but no model is loaded yet.',
  'rate-limited': 'Too many requests in a short time. Wait a few seconds, then try again.',
  server: 'The model service hit an error. Try again in a moment.',
  network: 'The model service could not be reached. Check that it is running, then try again.',
  aborted: 'Stopped so another photo could be read first.',
}

function toAnalyzeError(error: unknown): AnalyzeError {
  if (error instanceof ImageReadError) return { kind: 'unreadable', message: ERROR_MESSAGES.unreadable }
  if (error instanceof ApiError) {
    // The API's own wording is more specific for unreadable images (too small, corrupt, …).
    const message =
      error.kind === 'bad-image' && error.detail && error.detail.length < 160 ? error.detail : ERROR_MESSAGES[error.kind]
    return { kind: error.kind, message }
  }
  return { kind: 'server', message: ERROR_MESSAGES.server }
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new ApiError('aborted', 'Request cancelled'))
      },
      { once: true },
    )
  })
}

interface Options {
  onServiceIssue?: () => void
  onModelVersion?: (version: string) => void
}

export function useAnalyzer({ onServiceIssue, onModelVersion }: Options = {}) {
  const [plates, setPlates] = useState<SessionPlate[]>([])
  const [activeFigure, setActiveFigure] = useState<number | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [notice, setNotice] = useState<IntakeNotice | null>(null)

  const platesRef = useRef(plates)
  platesRef.current = plates
  const controllerRef = useRef<AbortController | null>(null)
  const preparingRef = useRef(false)
  const figureRef = useRef(0)
  const callbacks = useRef({ onServiceIssue, onModelVersion })
  callbacks.current = { onServiceIssue, onModelVersion }

  const patch = useCallback((figure: number, change: Partial<SessionPlate>) => {
    setPlates((current) => current.map((plate) => (plate.figure === figure ? { ...plate, ...change } : plate)))
  }, [])

  const read = useCallback(
    async (figure: number, image: Blob) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      patch(figure, { status: 'reading', error: undefined })

      const started = performance.now()
      try {
        const result = await predict(image, controller.signal)
        const remaining = MIN_READING_MS - (performance.now() - started)
        if (!result.cached && remaining > 0) await wait(remaining, controller.signal)
        patch(figure, { status: 'done', result })
        callbacks.current.onModelVersion?.(result.model_version)
      } catch (error) {
        const failure = toAnalyzeError(error)
        patch(figure, { status: 'error', error: failure })
        if (failure.kind === 'network' || failure.kind === 'no-model') callbacks.current.onServiceIssue?.()
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
      }
    },
    [patch],
  )

  const analyze = useCallback(
    async (file: File, options: { example?: boolean; sample?: ExampleImage } = {}) => {
      // One photo at a time while hashing/downscaling (drops and pastes bypass disabled buttons).
      if (preparingRef.current) return
      preparingRef.current = true
      setNotice(null)
      setPreparing(true)
      try {
        const hash = await fingerprint(file)
        const existing = platesRef.current.find((plate) => plate.hash === hash)
        if (existing) {
          setActiveFigure(existing.figure)
          setNotice({ tone: 'info', message: "Same photo as one earlier in this session. Showing that result." })
          if (existing.status === 'error') void read(existing.figure, existing.image)
          return
        }

        const image = await downscale(file)
        const figure = ++figureRef.current
        const plate: SessionPlate = {
          figure,
          hash,
          image,
          previewUrl: URL.createObjectURL(image),
          status: 'reading',
          example: options.example ?? false,
          ...(options.sample ? { sample: options.sample } : {}),
        }
        setPlates((current) => {
          const next = [...current, plate]
          for (const dropped of next.splice(0, Math.max(0, next.length - MAX_PLATES))) {
            URL.revokeObjectURL(dropped.previewUrl)
          }
          return next
        })
        setActiveFigure(figure)
        void read(figure, image)
      } catch (error) {
        setNotice({ tone: 'error', message: toAnalyzeError(error).message })
      } finally {
        preparingRef.current = false
        setPreparing(false)
      }
    },
    [read],
  )

  const retry = useCallback(
    (figure: number) => {
      const plate = platesRef.current.find((p) => p.figure === figure)
      if (plate) void read(plate.figure, plate.image)
    },
    [read],
  )

  /** For drops and pastes that contained no image at all. */
  const reject = useCallback(() => {
    setNotice({ tone: 'error', message: 'That was not an image. Use a JPEG, PNG or WebP photo.' })
  }, [])

  const select = useCallback((figure: number) => {
    setNotice(null)
    setActiveFigure(figure)
  }, [])

  /** Abort the read in flight and drop that photo, returning to the empty state. */
  const cancel = useCallback(() => {
    const controller = controllerRef.current
    controllerRef.current = null
    const reading = platesRef.current.find((plate) => plate.status === 'reading')
    controller?.abort()
    if (!reading) return
    URL.revokeObjectURL(reading.previewUrl)
    setPlates((current) => current.filter((plate) => plate.figure !== reading.figure))
    setActiveFigure((current) => (current === reading.figure ? null : current))
  }, [])

  /**
   * Fetch a real example image (public/images, see lib/example-images) and send it through the
   * normal upload path, so the model reads it live. The plate keeps the example for its ground truth.
   */
  const sampleRef = useRef(false)
  const analyzeSample = useCallback(
    async (sample: ExampleImage) => {
      const url = sample.src.card ?? sample.src.hero ?? sample.src.full ?? sample.src.thumb
      if (!url || sampleRef.current || preparingRef.current) return
      sampleRef.current = true
      setNotice(null)
      setPreparing(true)
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(String(response.status))
        const blob = await response.blob()
        setPreparing(false)
        const name = `${sample.sourceId ?? sample.id}.${blob.type === 'image/jpeg' ? 'jpg' : 'webp'}`
        await analyze(new File([blob], name, { type: blob.type || 'image/webp' }), { sample })
      } catch {
        setPreparing(false)
        setNotice({ tone: 'error', message: 'That example could not be loaded. Try another one, or your own photo.' })
      } finally {
        sampleRef.current = false
      }
    },
    [analyze],
  )

  /** Show the empty dropzone again without forgetting the session history. */
  const reset = useCallback(() => {
    setNotice(null)
    setActiveFigure(null)
  }, [])

  const clear = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    for (const plate of platesRef.current) URL.revokeObjectURL(plate.previewUrl)
    figureRef.current = 0
    setPlates([])
    setActiveFigure(null)
    setNotice(null)
  }, [])

  useEffect(
    () => () => {
      controllerRef.current?.abort()
      for (const plate of platesRef.current) URL.revokeObjectURL(plate.previewUrl)
    },
    [],
  )

  const active = plates.find((plate) => plate.figure === activeFigure) ?? null
  return {
    plates,
    active,
    preparing,
    notice,
    analyze,
    analyzeSample,
    reject,
    retry,
    cancel,
    reset,
    select,
    clear,
  }
}

export type AnalyzerController = ReturnType<typeof useAnalyzer>
