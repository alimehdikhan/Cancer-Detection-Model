/** First focusable element on the page; jumps to <main id="main">. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
    >
      Skip to content
    </a>
  )
}
