import { cn } from '@/lib/utils'

/** Geometric logo mark: a concentric ring and dot (decorative; pair with the wordmark). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-6', className)} fill="none">
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" fill="var(--brand)" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-fg', className)}>
      <LogoMark />
      <span className="text-[0.9375rem] font-semibold tracking-[-0.02em]">Dermsight</span>
    </span>
  )
}
