import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export type Scheme = 'light' | 'dark'

// Same key as the pre-paint script in index.html.
const STORAGE_KEY = 'theme-preference'
const META_COLOR: Record<Scheme, string> = { light: '#fafafb', dark: '#0a0b0c' }
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function subscribeToSystem(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const systemScheme = (): Scheme => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')

/**
 * Light / dark / system theme. The resolved scheme is applied as the `dark` class on <html>
 * (the pre-paint script in index.html does the same before first paint).
 */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)
  const system = useSyncExternalStore(subscribeToSystem, systemScheme, () => 'light' as const)
  const scheme: Scheme = preference === 'system' ? system : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', scheme === 'dark')
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = META_COLOR[scheme]
    }
  }, [scheme])

  useEffect(() => {
    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the choice then lasts for this visit.
    }
  }, [preference])

  const cycle = useCallback(
    () => setPreference((current) => (current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system')),
    [],
  )

  return { preference, scheme, setPreference, cycle }
}

export type ThemeController = ReturnType<typeof useTheme>
