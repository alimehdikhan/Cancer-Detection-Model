import { describe, expect, it } from 'vitest'

import { date, decimal, integer, metricPercent, middleTruncate, milliseconds, percent } from './format'

describe('format', () => {
  it('percent: whole numbers, clamped ends, dash for non-finite', () => {
    expect(percent(0.456)).toBe('46%')
    expect(percent(0)).toBe('0%')
    expect(percent(1)).toBe('100%')
    expect(percent(0.004)).toBe('<1%')
    expect(percent(0.996)).toBe('>99%')
    expect(percent(Number.NaN)).toBe('—')
  })

  it('metricPercent keeps one decimal', () => {
    expect(metricPercent(0.8123)).toBe('81.2%')
    expect(metricPercent(null)).toBe('—')
    expect(metricPercent(undefined)).toBe('—')
    expect(metricPercent(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('decimal and integer', () => {
    expect(decimal(0.12345)).toBe('0.123')
    expect(decimal(0.5, 1)).toBe('0.5')
    expect(decimal(null)).toBe('—')
    expect(integer(10015)).toBe('10,015')
    expect(integer(undefined)).toBe('—')
  })

  it('milliseconds', () => {
    expect(milliseconds(4.26)).toBe('4.3 ms')
    expect(milliseconds(123.6)).toBe('124 ms')
    expect(milliseconds(Number.NaN)).toBe('—')
  })

  it('date', () => {
    expect(date('2026-03-04T12:00:00Z')).toBe('Mar 4, 2026')
    expect(date(null)).toBe('—')
    expect(date('not a date')).toBe('not a date')
  })

  it('middleTruncate keeps both ends', () => {
    expect(middleTruncate('short')).toBe('short')
    const long = 'dev-untrained-8d28e72f-0123456789abcdef'
    const out = middleTruncate(long, 15)
    expect(out).toBe(`${long.slice(0, 7)}…${long.slice(-7)}`)
    expect(out).toHaveLength(15)
  })
})
