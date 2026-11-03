import { describe, expect, it } from 'vitest'

import { NEXT_STEPS, NO_RETRY, RISK_COPY } from '@/features/analyzer/copy'

import { buildEntries, CATEGORY_LABEL, CATEGORY_STYLE, ENTRY_ORDER } from './entries'
import type { Category, RiskLevel } from './types'

describe('entries', () => {
  it('falls back to the built-in table in resting order when the API is unreachable', () => {
    const entries = buildEntries(undefined)
    expect(entries.map((e) => e.code)).toEqual([...ENTRY_ORDER])
    expect(entries.filter((e) => e.category === 'malignant').map((e) => e.code)).toEqual(['mel', 'bcc'])
    expect(entries.find((e) => e.code === 'akiec')?.category).toBe('precancerous')
    for (const entry of entries) {
      expect(entry.name.length).toBeGreaterThan(0)
      expect(entry.description.length).toBeGreaterThan(0)
      expect(entry.note.length).toBeGreaterThan(0)
    }
  })

  it('lets live API names and descriptions win, and keeps unknown classes', () => {
    const entries = buildEntries([
      { code: 'nv', name: 'Nevus (live)', category: 'benign', description: 'Live description. More.' },
      { code: 'scc', name: 'Squamous cell carcinoma', category: 'malignant', description: 'New class. Second sentence.' },
    ])
    const nv = entries.find((e) => e.code === 'nv')
    expect(nv?.name).toBe('Nevus (live)')
    expect(nv?.description).toBe('Live description. More.')
    expect(entries).toHaveLength(ENTRY_ORDER.length + 1)
    expect(entries.at(-1)).toMatchObject({ code: 'scc', note: 'New class' })
  })

  it('keeps the fallback description when the API sends an empty one', () => {
    const [mel] = buildEntries([{ code: 'mel', name: 'Melanoma', category: 'malignant', description: '' }])
    expect(mel?.description.length).toBeGreaterThan(20)
  })

  it('has a label and complete class names for every category', () => {
    const categories: Category[] = ['malignant', 'precancerous', 'benign']
    for (const category of categories) {
      expect(CATEGORY_LABEL[category]).toMatch(/^[A-Z]/)
      const style = CATEGORY_STYLE[category]
      expect(style.badge).toBe(category)
      for (const value of [style.text, style.soft, style.fill, style.dot]) {
        expect(value).toMatch(/^(text|bg)-(mal|pre|ben)/)
      }
    }
  })
})

describe('risk copy', () => {
  it('covers every risk level', () => {
    const levels: RiskLevel[] = ['high', 'moderate', 'low']
    for (const level of levels) {
      expect(RISK_COPY[level].label.length).toBeGreaterThan(0)
      expect(RISK_COPY[level].advice.length).toBeGreaterThan(0)
      expect(NEXT_STEPS[level].length).toBeGreaterThan(0)
    }
  })

  it('does not offer "Try again" for errors a retry cannot fix', () => {
    expect(NO_RETRY.has('unsupported')).toBe(true)
    expect(NO_RETRY.has('too-large')).toBe(true)
    expect(NO_RETRY.has('network')).toBe(false)
  })
})
