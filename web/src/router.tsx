import { createBrowserRouter, Navigate, useLocation } from 'react-router'

import { RootLayout, RouteFallback } from '@/components/layout/root-layout'
import { ANALYZE_PATH, type AnalyzeLocationState, loadAnalyzeRoute } from '@/hooks/useGoToAnalyze'
import HomeRoute from '@/routes/home'

// The analyser used to live at "/#analyze". A first load of that URL goes straight to /analyze
// (before the router reads the location, so the landing page never flashes).
if (typeof window !== 'undefined' && window.location.pathname === '/' && window.location.hash === '#analyze') {
  window.history.replaceState(window.history.state, '', `${ANALYZE_PATH}${window.location.search}`)
}

/** "/" is the landing page; in-app links to the old "/#analyze" are redirected to /analyze. */
function HomeOrLegacyAnalyze() {
  const { hash } = useLocation()
  if (hash === '#analyze') {
    return <Navigate to={ANALYZE_PATH} replace state={{ focusDropzone: true } satisfies AnalyzeLocationState} />
  }
  return <HomeRoute />
}

/**
 * "/" is eager; every other route is code-split and loaded on demand (/analyze is also prefetched
 * when a call to action is hovered or focused, see hooks/useGoToAnalyze).
 *
 * Client-only SPA: when the first URL is a lazy route, the router is not "initialised" until that
 * chunk arrives, and it renders the nearest HydrateFallback instead. The lazy pages therefore sit
 * under a pathless layout route that owns the fallback, so the header, banner and footer render at
 * once and only <main> waits (an empty, aria-busy block, the same one Suspense uses).
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomeOrLegacyAnalyze /> },
      {
        hydrateFallbackElement: <RouteFallback />,
        children: [
          { path: 'analyze', lazy: async () => ({ Component: (await loadAnalyzeRoute()).default }) },
          { path: 'model', lazy: async () => ({ Component: (await import('@/routes/model')).default }) },
          { path: 'conditions', lazy: async () => ({ Component: (await import('@/routes/conditions')).default }) },
          { path: 'about', lazy: async () => ({ Component: (await import('@/routes/about')).default }) },
          { path: '*', lazy: async () => ({ Component: (await import('@/routes/not-found')).default }) },
        ],
      },
    ],
  },
])
