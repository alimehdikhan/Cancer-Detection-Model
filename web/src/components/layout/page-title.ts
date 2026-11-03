import { useEffect } from 'react'

import { BRAND } from '@/lib/brand'

/** Sets document.title to "<title> · Dermsight" while the page is mounted. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · ${BRAND.name}`
    return () => {
      document.title = previous
    }
  }, [title])
}
