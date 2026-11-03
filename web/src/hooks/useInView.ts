import { type RefObject, useEffect, useRef, useState } from 'react'

/**
 * True once the element has entered the viewport (fires once, then disconnects).
 * Returns [ref, inView]. Without IntersectionObserver it reports true immediately.
 */
export function useInView<T extends Element>(
  options: { rootMargin?: string; threshold?: number } = {},
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const { rootMargin = '0px 0px -10% 0px', threshold = 0.1 } = options

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, rootMargin, threshold])

  return [ref, inView]
}
