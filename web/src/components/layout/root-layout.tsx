import { LazyMotion, MotionConfig } from 'motion/react'
import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'

import { AppProvider } from '@/hooks/app-context'
import { scrollToAnalyze } from '@/lib/site'
import { prefersReducedMotion } from '@/lib/utils'

import { DevModelBanner } from './dev-model-banner'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { SkipLink } from './skip-link'

const loadMotionFeatures = () => import('@/lib/motion-features').then((module) => module.default)

/**
 * Scroll handling: top of page on a new pathname; `#analyze` on a page that has the analyser
 * scrolls to it (and focuses the drop zone); "/#analyze" itself is redirected to /analyze by the
 * router; any other hash scrolls to that id. Retries briefly so lazy routes
 * have time to render their target. html's scroll-padding-top (index.css) equals the sticky header's height.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  const first = useRef(true)

  useEffect(() => {
    const isFirst = first.current
    first.current = false
    if (!hash) {
      if (!isFirst) window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }
    const id = decodeURIComponent(hash.slice(1))
    // "/#analyze" is redirected to /analyze by the router; nothing to scroll to here.
    if (id === 'analyze' && pathname === '/') return
    let tries = 0
    let timer = 0
    let unpin = () => {}

    // An instant jump (first load, reduced motion) can happen before the content above the target
    // has settled: the dev banner and the live hero panels appear once /api/v1/model answers.
    // Keep the target aligned whenever the page resizes, for 1.5 s or until the visitor takes over.
    const pin = (node: HTMLElement) => {
      const observer = new ResizeObserver(() => node.scrollIntoView({ behavior: 'auto', block: 'start' }))
      const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
      const stop = () => {
        observer.disconnect()
        window.clearTimeout(limit)
        for (const name of events) window.removeEventListener(name, stop)
      }
      const limit = window.setTimeout(stop, 1500)
      for (const name of events) window.addEventListener(name, stop, { passive: true })
      observer.observe(document.body)
      unpin = stop
    }

    const attempt = () => {
      let done: boolean
      if (id === 'analyze') {
        done = scrollToAnalyze({ focus: !isFirst })
      } else {
        const node = document.getElementById(id)
        done = Boolean(node)
        if (node) {
          const instant = isFirst || prefersReducedMotion()
          node.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' })
          if (instant) pin(node)
        }
      }
      if (!done && tries++ < 20) timer = window.setTimeout(attempt, 50)
    }
    attempt()
    return () => {
      window.clearTimeout(timer)
      unpin()
    }
  }, [pathname, hash])

  return null
}

/** Placeholder for <main> while a lazy route's chunk loads (Suspense and the router's HydrateFallback). */
export function RouteFallback() {
  return <div className="min-h-[60vh]" aria-busy="true" />
}

/** Root layout: skip link, header, dev banner, <main id="main">, footer. */
export function RootLayout() {
  return (
    <AppProvider>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
            <ScrollManager />
            <SkipLink />
            <SiteHeader />
            <DevModelBanner />
            <main id="main" tabIndex={-1} className="min-h-[70vh] outline-none">
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            </main>
            <SiteFooter />
        </MotionConfig>
      </LazyMotion>
    </AppProvider>
  )
}
