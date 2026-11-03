// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, getModel, predict } from './api'

const json = (status: number, body: unknown, statusText = '') =>
  new Response(JSON.stringify(body), { status, statusText, headers: { 'Content-Type': 'application/json' } })

function mockFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => {
      throw new Error('expected the request to fail')
    },
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

const jpeg = () => new Blob(['x'], { type: 'image/jpeg' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('returns the parsed body and asks for JSON', async () => {
    const fetchMock = mockFetch(async () => json(200, { version: 'v1' }))
    await expect(getModel()).resolves.toEqual({ version: 'v1' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/v1/model')
    expect(init.headers).toMatchObject({ Accept: 'application/json' })
  })

  it.each([
    [400, 'bad-image'],
    [413, 'too-large'],
    [415, 'unsupported'],
    [422, 'bad-image'],
    [429, 'rate-limited'],
    [503, 'no-model'],
    [500, 'server'],
    [502, 'server'],
  ] as const)('maps HTTP %i to "%s" and keeps a string detail', async (status, kind) => {
    mockFetch(async () => json(status, { detail: `detail ${status}` }))
    const error = await failure(predict(jpeg()))
    expect(error.kind).toBe(kind)
    expect(error.status).toBe(status)
    expect(error.detail).toBe(`detail ${status}`)
    expect(error.message).toBe(`detail ${status}`)
  })

  it('ignores a non-string detail (FastAPI validation arrays)', async () => {
    mockFetch(async () =>
      json(422, { detail: [{ loc: ['body', 'file'], msg: 'Field required' }] }, 'Unprocessable Content'),
    )
    const error = await failure(getModel())
    expect(error.kind).toBe('bad-image')
    expect(error.status).toBe(422)
    expect(error.detail).toBeUndefined()
  })

  it('copes with a non-JSON error page from a proxy', async () => {
    mockFetch(async () => new Response('<html>Bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }))
    const error = await failure(getModel())
    expect(error.kind).toBe('server')
    expect(error.message).toBe('Bad Gateway')
    expect(error.detail).toBeUndefined()
  })

  it('maps a failed fetch to "network"', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    const error = await failure(getModel())
    expect(error.kind).toBe('network')
    expect(error.status).toBeUndefined()
  })

  it('maps an aborted request to "aborted"', async () => {
    mockFetch(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError')
    })
    const error = await failure(predict(jpeg(), new AbortController().signal))
    expect(error.kind).toBe('aborted')
  })

  it('posts the image as multipart "file" with a matching file name', async () => {
    const fetchMock = mockFetch(async () => json(200, { id: 'r1' }))
    await predict(new Blob(['png'], { type: 'image/png' }))
    await predict(jpeg())
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/v1/predict')
    expect(init.method).toBe('POST')
    expect(((init.body as FormData).get('file') as File).name).toBe('photo.png')
    const [, second] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(((second.body as FormData).get('file') as File).name).toBe('photo.jpg')
  })
})
