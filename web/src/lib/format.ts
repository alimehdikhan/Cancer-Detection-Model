/** Calibrated probabilities are shown as whole percentages; more precision would overstate them. */
export function percent(p: number): string {
  if (!Number.isFinite(p)) return '—'
  if (p > 0 && p < 0.005) return '<1%'
  if (p < 1 && p >= 0.995) return '>99%'
  return `${Math.round(p * 100)}%`
}

/** Evaluation metrics keep one decimal, since they are measured on a fixed test set. */
export function metricPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(1)}%`
}

export function decimal(value: number | null | undefined, digits = 3): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

export function integer(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en').format(value)
}

export function milliseconds(ms: number): string {
  if (!Number.isFinite(ms)) return '—'
  return ms < 10 ? `${ms.toFixed(1)} ms` : `${Math.round(ms)} ms`
}

export function date(iso: string | null | undefined): string {
  if (!iso) return '—'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(parsed)
}

/** Keep both ends of long identifiers such as model versions. */
export function middleTruncate(value: string, max = 28): string {
  if (value.length <= max) return value
  const keep = Math.floor((max - 1) / 2)
  return `${value.slice(0, keep)}…${value.slice(-keep)}`
}
