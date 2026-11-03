import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lacks a few browser APIs the components touch on mount.
if (typeof window !== 'undefined') {
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList

  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver
  globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver

  afterEach(() => cleanup())
}
