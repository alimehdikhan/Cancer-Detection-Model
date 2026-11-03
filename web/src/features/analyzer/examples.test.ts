import { describe, expect, it } from 'vitest'

import { buildEntries } from '@/lib/entries'
import { DERMOSCOPY, examplesFor, HERO, srcSet } from '@/lib/example-images'

import { galleryItems } from './example-gallery'
import { groundTruthText } from './ground-truth'

describe('real example images', () => {
  it('lists only CC0 or CC BY images, each with a source and size', () => {
    for (const image of [...DERMOSCOPY, ...HERO]) {
      expect(['CC0 1.0', 'CC BY 4.0']).toContain(image.license)
      expect(image.sourceUrl).toMatch(/^https:\/\//)
      expect(image.width).toBeGreaterThan(0)
      expect(image.height).toBeGreaterThan(0)
      expect(image.alt).not.toBe('')
    }
  })

  it('builds a srcset with intrinsic widths', () => {
    const image = DERMOSCOPY[0]!
    expect(srcSet(image)).toMatch(/^\/images\/\S+ \d+w(, \/images\/\S+ \d+w)*$/)
  })

  it('offers one example per class, in the resting order', () => {
    const items = galleryItems(buildEntries(undefined))
    expect(items.map(({ entry }) => entry.code)).toEqual(['mel', 'bcc', 'akiec', 'bkl', 'nv', 'df', 'vasc'])
    for (const { entry, image } of items) expect(examplesFor(entry.code)).toContain(image)
  })

  it('states the ground truth as the source gives it', () => {
    const image = examplesFor('mel')[0]!
    expect(groundTruthText(image)).toBe(`${image.diagnosis} (${image.confirmType}), ${image.sourceId}`)
  })
})
