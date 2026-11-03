import { describe, expect, it } from 'vitest'

import { DERMOSCOPY, HERO, PHOTOS } from '@/lib/example-images'

import { CREDITED } from './image-credits'

const ALL = [...DERMOSCOPY, ...HERO, ...PHOTOS]
// Listing only (lazy importers are never called), so no image is loaded.
const SHIPPED = new Set(Object.keys(import.meta.glob('/public/images/*.webp')).map((path) => path.replace(/^\/public/, '')))
const MANIFEST = Object.values(
  import.meta.glob<{ default: { id: string }[] | { images: { id: string }[] } }>('/public/images/credits.json', { eager: true }),
)[0]?.default

describe('image credits', () => {
  it('matches the manifest (regenerate with `pnpm gen:images` after editing credits.json)', () => {
    expect(MANIFEST).toBeDefined()
    const entries = Array.isArray(MANIFEST) ? MANIFEST : (MANIFEST?.images ?? [])
    expect(new Set(ALL.map((image) => image.id))).toEqual(new Set(entries.map((entry) => entry.id)))
  })

  it('ships every file the site references', () => {
    expect(SHIPPED.size).toBeGreaterThan(0)
    for (const image of ALL) {
      for (const file of Object.values(image.src)) {
        if (file) expect(SHIPPED.has(file), file).toBe(true)
      }
    }
  })

  it('credits each source image exactly once, with its licence and attribution', () => {
    const sources = new Set(ALL.map((image) => image.sourceId ?? image.id))
    expect(CREDITED.map((image) => image.sourceId ?? image.id).sort()).toEqual([...sources].sort())
    for (const image of CREDITED) {
      expect(image.license).not.toBe('')
      expect(image.attribution).not.toBe('')
      expect(image.sourceUrl).toMatch(/^https:\/\//)
    }
  })
})
