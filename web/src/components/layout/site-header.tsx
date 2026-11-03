import { ArrowRight, Menu, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

import { Button } from '@/components/ui/button'
import { ANALYZE_PATH, analyzePrefetchProps, useGoToAnalyze } from '@/hooks/useGoToAnalyze'
import { NAV_LINKS } from '@/lib/site'
import { cn } from '@/lib/utils'

import { Container } from './primitives'
import { Logo } from './logo'
import { StatusPill } from './status-pill'
import { ThemeToggle } from './theme-toggle'

/** Kept here for existing imports; the hook lives in '@/hooks/useGoToAnalyze'. */
export { useGoToAnalyze }

function NavItem({ label, to, onNavigate, mobile }: { label: string; to: string; onNavigate?: () => void; mobile?: boolean }) {
  const target = to
  const base = mobile
    ? 'flex h-12 items-center rounded-[10px] px-3 text-base font-medium transition-colors'
    : 'inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-medium transition-colors'

  return (
    <NavLink
      to={target}
      onClick={onNavigate}
      {...(target === ANALYZE_PATH ? analyzePrefetchProps : {})}
      className={({ isActive }) =>
        cn(base, isActive ? 'bg-surface-2 text-fg' : 'text-fg-2 hover:bg-surface-2 hover:text-fg')
      }
    >
      {label}
    </NavLink>
  )
}

/**
 * Sticky translucent header: logo, nav with active state, status pill (tooltip), theme toggle,
 * primary CTA on desktop; a custom disclosure menu on mobile (no Sheet / Dialog: CSP-safe).
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const location = useLocation()
  const goToAnalyze = useGoToAnalyze()
  const onAnalyze = location.pathname === ANALYZE_PATH

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [location.pathname, location.hash])
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/75 backdrop-blur-xl backdrop-saturate-150 supports-[not(backdrop-filter:blur(0))]:bg-canvas">
      <Container className={cn('flex h-16 items-center gap-3', onAnalyze && 'max-w-[90rem]')}>
        <Link to="/" className="-ml-1 rounded-[10px] px-1 py-1" aria-label="Dermsight, home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.to} label={link.label} to={link.to} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <StatusPill className="hidden sm:inline-flex" align="end" />
          <ThemeToggle />
          <Button
            size="sm"
            className={cn('hidden', !onAnalyze && 'md:inline-flex')}
            onClick={goToAnalyze}
            {...analyzePrefetchProps}
          >
            Analyze a photo
            <ArrowRight aria-hidden="true" />
          </Button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-[10px] text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </Container>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-line bg-canvas md:hidden data-[open=true]:animate-in data-[open=true]:fade-in-0 data-[open=true]:slide-in-from-top-1"
        data-open={open}
      >
        <Container className="flex flex-col gap-1 py-3">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.to} label={link.label} to={link.to} mobile onNavigate={() => setOpen(false)} />
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
            <StatusPill align="start" />
            <Button
              size="sm"
              className={cn(onAnalyze && 'hidden')}
              onClick={() => {
                setOpen(false)
                goToAnalyze()
              }}
              {...analyzePrefetchProps}
            >
              Analyze a photo
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </div>
    </header>
  )
}
