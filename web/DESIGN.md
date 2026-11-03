# Dermsight design system: Precision

A calm, exact interface in the spirit of Linear, Vercel and Raycast: neutral surfaces, hairline
borders, one violet accent, Geist type, and motion that explains rather than decorates. The
subject is medical and the visitor may be anxious, so the interface never shouts, never uses
red for errors, and never shows a number the API did not send.

Source of truth: `src/index.css` (tokens and utilities), `src/components/ui` (shadcn/ui,
written by hand on Radix), `src/components/magic` (animated pieces) and
`src/components/layout` (chrome and page primitives).

## Tokens

All colours are OKLCH custom properties on `:root`, overridden under `.dark` on `<html>`, and
exposed to Tailwind v4 through `@theme`. The shadcn names (`background`, `card`, `muted`,
`border`, `ring`...) map onto them, so shadcn classes and the Precision classes agree.

| Role | Classes | Notes |
| --- | --- | --- |
| Surfaces | `bg-canvas`, `bg-surface`, `bg-surface-2`, `bg-viewer` | page, cards, wells; the photo viewer is near-black in both themes |
| Text | `text-fg`, `text-fg-2`, `text-fg-3`, `text-on-inverse` | body, secondary, meta; all AA on every surface |
| Lines | `border-line` (default border), `border-line-strong`, `bg-track` | translucent hairlines |
| Brand | `text-brand`, `bg-brand`, `bg-brand-soft`, `ring-ring`, `bg-glow` | violet (hue 292); focus rings and hero glows |
| Categories | `mal`, `pre`, `ben` with `-text` and `-soft` | malignant red, precancerous amber, benign blue |
| Caution | `bg-caution`, `text-caution-text`, `bg-caution-soft` | uncertain results, the dev model and every error state |

Rules: red (`mal`) only ever means "malignant class"; errors use caution. Green is never used, so
nothing reads as "all clear". Risk banners use the category soft fills (high: mal, moderate:
pre, low: ben) and always carry a text label, never colour alone.

Radius: 10px controls (`rounded-[10px]`), 14px cards (`rounded-xl`), 20px hero panels
(`rounded-2xl`), pills (`rounded-full`). Elevation comes from hairlines and surface steps, not
shadows.

## Type

Geist Variable for text and Geist Mono Variable for codes, labels and numbers, both
self-hosted through Fontsource; only the two latin files are preloaded.

- `text-display` (hero h1), `text-h2`, `text-h3`: the heading scale, with tight tracking.
- `eyebrow`: mono, 0.75rem, uppercase, tracking 0.08em, `text-fg-3`.
- `tabular`: tabular figures for every metric, probability and timing.
- One h1 per page; sections pair `aria-labelledby` with their h2 id.

## Components

- `ui/`: Button (default inverse, brand, outline, secondary, ghost, link, destructive in
  caution colours), Badge (category and caution variants), Card, Tabs, Accordion, Tooltip,
  Hint (a CSS-only tooltip for the eager landing route), Separator, Skeleton, ToggleGroup,
  DropdownMenu and Popover (both forced non-modal).
- `magic/`: BorderBeam (only while analysing), NumberTicker (screen readers get the final
  value), DotPattern, SpotlightCard, BentoGrid, AnimatedBeam (the pipeline diagrams),
  AnimatedGradientText (the hero only), Reveal.
- `layout/`: SiteHeader (sticky, 64px), DevModelBanner, SiteFooter, SkipLink, StatusPill,
  Container, Section, SectionHeader, Eyebrow,
  CodeChip, PageHero, IconTile and `usePageTitle` ("Page · Dermsight").

## Motion

`motion` runs in `<LazyMotion strict>` with its features in a lazy chunk, so components use
`motion/react-m` only. `MotionConfig reducedMotion="user"` is set at the root, and every CSS
animation (`animate-scan`, `animate-pulse-dot`, `animate-shimmer`, `animate-gradient-pan`,
`animate-rise`, `bar-fill`, `reveal`) stops under `prefers-reduced-motion`. The standard
easing is `ease-out-quint`, `cubic-bezier(0.22, 1, 0.36, 1)`. Motion is used for state
changes (analysing, a result arriving, bars filling, a list re-sorting) and for one entrance
per element, never as a loop competing with content.

## CSP

nginx sends a strict Content-Security-Policy (`nginx-security-headers.conf`). The only inline
script is the pre-paint theme script, allowed by its sha256 hash; `scripts/check-csp.mjs` fails
the build when the hash and the script drift apart.

- No runtime `<style>` injection. The React `style` prop and `element.style.setProperty`
  (CSSOM) are fine.
- Forbidden because they inject styles or need a modal portal: Radix Dialog, Sheet,
  AlertDialog, Select, Drawer and ScrollArea; sonner, vaul, emotion and styled-components;
  modal DropdownMenu or Popover; `AnimatePresence mode="popLayout"`.
- No third-party origins: fonts, images and scripts are all served from the same origin.

## Routes

| Path | Content | Loading |
| --- | --- | --- |
| `/` | Landing page: hero with a real ISIC image and its ground-truth card, facts strip, the seven types gallery (`#types`, real images), how it works, privacy, live model snapshot, FAQ, closing call to action, credits line | eager |
| `/analyze` | The main app screen: drop zone or photo viewer, result panel (every state), session history (left rail from 1280px, a strip below), model panel, keyboard hints, "Try a real example" gallery, sticky action bar on phones | lazy |
| `/model` | Model card from `GET /api/v1/model`: spec panel, metrics or a "Not evaluated" notice, per-class bars, screening and calibration, limits (`#limits`) | lazy |
| `/conditions` | The seven lesion types by group (`#types`, one card per class with `id=<code>` and two real examples), ABCDE (`#abcde`), when to see a doctor | lazy |
| `/about` | Pipeline (`#pipeline`), privacy (`#privacy`), limitations (`#limitations`), dataset and citation (`#dataset`), image credits (`#credits`) | lazy |
| `*` | Not found, with links to every page | lazy |

The router is `createBrowserRouter`. Lazy pages sit under a pathless route with a
`hydrateFallbackElement`, so on a cold load the header and footer render at once and only
`<main>` waits. `ScrollManager` scrolls to the top on a new path and to any hash, re-aligning
while late content above it settles. `html` has `scroll-padding-top: 4rem` (the header height),
so anchors and focused elements land just below the sticky header.

The analyser lives at `/analyze`. The old `/#analyze` URL still works: a first load is rewritten
to `/analyze` before the router starts, and in-app links to it are redirected. Every link or
button that leads there uses `'@/hooks/useGoToAnalyze'`: `ANALYZE_PATH`, router state
`{ focusDropzone: true }` (the drop zone gets focus once the page renders) and
`analyzePrefetchProps` (the lazy chunk starts loading on hover or focus). `useGoToAnalyze()`
returns a function that does all of this, or focuses the drop zone when already on the page.

## Images

All photos are real dermoscopy images from the ISIC Archive, licence-checked (CC0 or CC BY
only), stored in `public/images` as WebP at 400, 800 and (hero) 1400 px wide. The manifest is
`public/images/credits.json`; `pnpm gen:images` regenerates `src/lib/example-images.ts`
(`DERMOSCOPY`, `HERO`, `PHOTOS`, `examplesFor(code)`, `srcSet(image)`) from it, so rerun it
whenever the manifest changes. No runtime fetch of the manifest, and no third-party image hosts.

- Use only images from the manifest. Every `<img>` has `width` and `height` (from the
  manifest), `srcset` and `sizes`, and `alt` text (`alt=""` only when adjacent text says the
  same). The landing hero image is the only eager one (`fetchpriority="high"`); everything
  else is `loading="lazy"` and `decoding="async"`.
- A diagnosis shown with an image is the archive's ground truth, never a model output, written
  as "Ground truth: <diagnosis> (<confirmation type>), ISIC_xxx".
- A model probability appears next to a real image only when it came live from the API: the
  "Try a real example" gallery on `/analyze` sends the image through the normal upload path
  and shows the ground truth beside the live result.
- Credit is always reachable: captions carry the licence, and `/about#credits` lists every
  image once (thumbnail, diagnosis, confirmation, ISIC id linked to the archive, licence and
  attribution). The landing credits line, `/conditions` and the `/analyze` gallery link to it.

## Accessibility

WCAG 2.1 AA contrast from the tokens in both themes; a visible 2px focus ring that is never
removed; touch targets of at least 40px; full keyboard operation of the upload; live regions
for analyser status and errors; no horizontal scrolling from 360px up; and every animation has
a reduced-motion path.

## Honesty

Metrics come only from `/api/v1/model` and show "Not evaluated" when it sends none. No
testimonials, user counts, logos, certifications or invented accuracy figures, and no "open
source" claim (the repository has no licence file). Example images are real and credited, their
diagnoses are labelled as the archive's ground truth, and every result repeats that it is not a
diagnosis.
