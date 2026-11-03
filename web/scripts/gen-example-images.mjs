// Generates web/src/lib/example-images.ts from web/public/images/credits.json (static data, no runtime fetch).
// Usage (from web/): pnpm gen:images, or node scripts/gen-example-images.mjs [web dir] [out file]
// Rerun it whenever public/images/credits.json changes.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const web = process.argv[2] ?? process.cwd()
const out = process.argv[3] ?? join(web, 'src/lib/example-images.ts')
const credits = JSON.parse(readFileSync(join(web, 'public/images/credits.json'), 'utf8'))
const list = Array.isArray(credits) ? credits : (credits.images ?? [])

const LICENSE_LABEL = { 'CC-0': 'CC0 1.0', CC0: 'CC0 1.0', 'CC-BY': 'CC BY 4.0', 'CC BY': 'CC BY 4.0' }
const NAMED = new Set(['thumb', 'card', 'hero', 'full'])

function slotFor(key, width) {
  if (NAMED.has(key)) return key
  const w = Number(width ?? key)
  if (!Number.isFinite(w)) return null
  if (w <= 480) return 'thumb'
  if (w <= 1000) return 'card'
  return 'hero'
}

const images = []
const widths = {}
for (const c of list) {
  const files = c.files ?? {}
  const sizes = c.sizes ?? {}
  const src = {}
  const w = {}
  for (const [key, url] of Object.entries(files)) {
    const size = sizes[key] ?? {}
    const slot = slotFor(key, size.width)
    if (!slot || typeof url !== 'string') continue
    src[slot] = url
    if (size.width) w[slot] = size.width
  }
  const kind = c.kind === 'photo' ? 'photo' : 'dermoscopy'
  const lic = c.licence ?? c.license ?? ''
  const img = {
    id: c.id,
    kind,
    ...(c.class ? { code: c.class } : {}),
    ...(c.diagnosis ? { diagnosis: c.diagnosis } : {}),
    ...(c.diagnosis_confirm_type ? { confirmType: c.diagnosis_confirm_type } : {}),
    ...(c.source_id ? { sourceId: c.source_id } : {}),
    sourceUrl: c.source_url ?? '',
    license: LICENSE_LABEL[lic] ?? lic,
    attribution: c.attribution ?? '',
    alt: c.alt ?? '',
    width: c.width ?? c.sizes?.['800']?.width ?? 0,
    height: c.height ?? c.sizes?.['800']?.height ?? 0,
    src,
    _role: c.role ?? (src.hero ? 'hero' : 'class-example'),
  }
  images.push(img)
  widths[c.id] = w
}

const strip = ({ _role, ...rest }) => rest
const byCode = (a, b) => (a.code ?? '').localeCompare(b.code ?? '') || a.id.localeCompare(b.id, 'en', { numeric: true })
const dermoscopy = images.filter((i) => i.kind === 'dermoscopy' && i._role !== 'hero').sort(byCode).map(strip)
const photos = images.filter((i) => i.kind === 'photo').sort(byCode).map(strip)
const hero = images.filter((i) => i.kind === 'dermoscopy' && i._role === 'hero').map(strip)

const json = (v) => JSON.stringify(v, null, 2)
const ts = `// Generated from public/images/credits.json (ISIC Archive, CC0 / CC BY only). Do not edit by hand:
// regenerate when the manifest changes. Every image here must be credited where it is shown
// (licence and attribution) or on /about#credits.

export interface ExampleImage {
  id: string
  kind: 'dermoscopy' | 'photo'
  /** HAM10000 class code (mel, bcc, akiec, bkl, nv, df, vasc). */
  code?: string
  /** Diagnosis exactly as the source states it, e.g. "Melanoma in situ". */
  diagnosis?: string
  /** How the diagnosis was confirmed, e.g. "histopathology". */
  confirmType?: string
  /** Source image id, e.g. "ISIC_0000049". */
  sourceId?: string
  sourceUrl: string
  /** Licence label, e.g. "CC0 1.0" or "CC BY 4.0". */
  license: string
  attribution: string
  alt: string
  /** Intrinsic size of the "card" file (use for width/height attributes). */
  width: number
  height: number
  src: { thumb?: string; card?: string; hero?: string; full?: string }
}

/** Real dermoscopy examples, one or more per class, ordered by class code. */
export const DERMOSCOPY: ExampleImage[] = ${json(dermoscopy)}

/** Stock photos (may be empty). */
export const PHOTOS: ExampleImage[] = ${json(photos)}

/** Hero-quality dermoscopy images (they also carry a "hero" size). */
export const HERO: ExampleImage[] = ${json(hero)}

/** Intrinsic widths of each file, for srcset descriptors. */
const WIDTHS: Record<string, Partial<Record<keyof ExampleImage['src'], number>>> = ${json(widths)}

/** Real dermoscopy examples of one class, e.g. examplesFor('mel'). */
export function examplesFor(code: string): ExampleImage[] {
  return DERMOSCOPY.filter((img) => img.code === code)
}

/** A srcset value listing every size of the image with its intrinsic width. */
export function srcSet(img: ExampleImage): string {
  const widths = WIDTHS[img.id] ?? {}
  const seen = new Set<string>()
  return (['thumb', 'card', 'hero', 'full'] as const)
    .flatMap((slot) => {
      const url = img.src[slot]
      const width = widths[slot]
      if (!url || !width || seen.has(url)) return []
      seen.add(url)
      return [\`\${url} \${width}w\`]
    })
    .join(', ')
}
`
writeFileSync(out, ts.replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:'))
console.log('wrote', out, 'dermoscopy', dermoscopy.length, 'photos', photos.length, 'hero', hero.length)
