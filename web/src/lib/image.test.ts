// @vitest-environment node
// node: real WebCrypto (crypto.subtle) and Blob; the canvas APIs are stubbed below.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { downscale, fingerprint, firstImage, ImageReadError, scaledSize } from './image'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('scaledSize', () => {
  it('caps the longest edge at 1024 px and keeps the aspect ratio', () => {
    expect(scaledSize(4000, 3000)).toEqual({ width: 1024, height: 768 })
    expect(scaledSize(3000, 4000)).toEqual({ width: 768, height: 1024 })
    expect(scaledSize(2048, 2048)).toEqual({ width: 1024, height: 1024 })
  })

  it('never upscales small images', () => {
    expect(scaledSize(800, 600)).toEqual({ width: 800, height: 600 })
    expect(scaledSize(1024, 10)).toEqual({ width: 1024, height: 10 })
  })

  it('never returns a zero edge for extreme panoramas', () => {
    expect(scaledSize(100_000, 10)).toEqual({ width: 1024, height: 1 })
  })

  it('honours a custom limit', () => {
    expect(scaledSize(1000, 500, 100)).toEqual({ width: 100, height: 50 })
  })
})

describe('fingerprint', () => {
  it('is the hex SHA-256 of the file bytes', async () => {
    await expect(fingerprint(new Blob(['abc']))).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('falls back to file metadata outside secure contexts', async () => {
    vi.stubGlobal('crypto', undefined)
    const file = Object.assign(new Blob(['abcd']), { name: 'mole.jpg', lastModified: 42 })
    await expect(fingerprint(file)).resolves.toBe('meta:mole.jpg:4:42')
  })
})

describe('downscale', () => {
  function stubCanvas(width: number, height: number) {
    const drawn: { width: number; height: number }[] = []
    const close = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width, height, close })))
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        constructor(
          readonly width: number,
          readonly height: number,
        ) {
          drawn.push({ width, height })
        }
        getContext() {
          return { imageSmoothingQuality: 'low', drawImage: vi.fn() }
        }
        async convertToBlob(options: { type: string }) {
          return new Blob(['jpeg'], { type: options.type })
        }
      },
    )
    return { drawn, close }
  }

  it('re-encodes a large photo as a 1024 px JPEG and frees the bitmap', async () => {
    const { drawn, close } = stubCanvas(4032, 3024)
    const blob = await downscale(new Blob(['raw'], { type: 'image/heic' }))
    expect(drawn).toEqual([{ width: 1024, height: 768 }])
    expect(blob.type).toBe('image/jpeg')
    expect(close).toHaveBeenCalledOnce()
  })

  it('throws ImageReadError when the file cannot be decoded', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('decode failed')
      }),
    )
    await expect(downscale(new Blob(['nope']))).rejects.toBeInstanceOf(ImageReadError)
  })
})

describe('firstImage', () => {
  it('picks the first image (or untyped) file', () => {
    const text = new File(['t'], 'notes.txt', { type: 'text/plain' })
    const png = new File(['p'], 'a.png', { type: 'image/png' })
    expect(firstImage([text, png])).toBe(png)
    expect(firstImage([text])).toBeUndefined()
    expect(firstImage(null)).toBeUndefined()
  })
})
