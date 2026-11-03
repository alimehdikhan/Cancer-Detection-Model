// Generated from public/images/credits.json (ISIC Archive, CC0 / CC BY only). Do not edit by hand:
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
export const DERMOSCOPY: ExampleImage[] = [
  {
    id: "akiec-1",
    kind: "dermoscopy",
    code: "akiec",
    diagnosis: "Squamous cell carcinoma in situ",
    confirmType: "histopathology",
    sourceId: "ISIC_0021071",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0021071/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a squamous cell carcinoma in situ (ISIC_0021071)",
    width: 800,
    height: 600,
    src: {
      thumb: "/images/akiec-1-400.webp",
      card: "/images/akiec-1-800.webp"
    }
  },
  {
    id: "akiec-2",
    kind: "dermoscopy",
    code: "akiec",
    diagnosis: "Solar or actinic keratosis",
    confirmType: "histopathology",
    sourceId: "ISIC_0010512",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0010512/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of an actinic keratosis (ISIC_0010512)",
    width: 800,
    height: 600,
    src: {
      thumb: "/images/akiec-2-400.webp",
      card: "/images/akiec-2-800.webp"
    }
  },
  {
    id: "bcc-1",
    kind: "dermoscopy",
    code: "bcc",
    diagnosis: "Basal cell carcinoma",
    confirmType: "histopathology",
    sourceId: "ISIC_0011752",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0011752/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a basal cell carcinoma (ISIC_0011752)",
    width: 800,
    height: 527,
    src: {
      thumb: "/images/bcc-1-400.webp",
      card: "/images/bcc-1-800.webp"
    }
  },
  {
    id: "bcc-2",
    kind: "dermoscopy",
    code: "bcc",
    diagnosis: "Basal cell carcinoma",
    confirmType: "histopathology",
    sourceId: "ISIC_0011642",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0011642/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a basal cell carcinoma (ISIC_0011642)",
    width: 800,
    height: 533,
    src: {
      thumb: "/images/bcc-2-400.webp",
      card: "/images/bcc-2-800.webp"
    }
  },
  {
    id: "bkl-1",
    kind: "dermoscopy",
    code: "bkl",
    diagnosis: "Seborrheic keratosis",
    confirmType: "histopathology",
    sourceId: "ISIC_0001104",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0001104/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a seborrheic keratosis (ISIC_0001104)",
    width: 800,
    height: 600,
    src: {
      thumb: "/images/bkl-1-400.webp",
      card: "/images/bkl-1-800.webp"
    }
  },
  {
    id: "bkl-2",
    kind: "dermoscopy",
    code: "bkl",
    diagnosis: "Seborrheic keratosis",
    confirmType: "histopathology",
    sourceId: "ISIC_0011911",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0011911/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a seborrheic keratosis (ISIC_0011911)",
    width: 800,
    height: 529,
    src: {
      thumb: "/images/bkl-2-400.webp",
      card: "/images/bkl-2-800.webp"
    }
  },
  {
    id: "df-1",
    kind: "dermoscopy",
    code: "df",
    diagnosis: "Dermatofibroma",
    confirmType: "histopathology",
    sourceId: "ISIC_0001114",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0001114/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a dermatofibroma (ISIC_0001114)",
    width: 800,
    height: 800,
    src: {
      thumb: "/images/df-1-400.webp",
      card: "/images/df-1-800.webp"
    }
  },
  {
    id: "df-2",
    kind: "dermoscopy",
    code: "df",
    diagnosis: "Dermatofibroma",
    confirmType: "histopathology",
    sourceId: "ISIC_0011677",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0011677/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a dermatofibroma (ISIC_0011677)",
    width: 800,
    height: 534,
    src: {
      thumb: "/images/df-2-400.webp",
      card: "/images/df-2-800.webp"
    }
  },
  {
    id: "mel-1",
    kind: "dermoscopy",
    code: "mel",
    diagnosis: "Melanoma in situ",
    confirmType: "histopathology",
    sourceId: "ISIC_0000049",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0000049/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a melanoma in situ (ISIC_0000049)",
    width: 800,
    height: 601,
    src: {
      thumb: "/images/mel-1-400.webp",
      card: "/images/mel-1-800.webp"
    }
  },
  {
    id: "mel-2",
    kind: "dermoscopy",
    code: "mel",
    diagnosis: "Melanoma Invasive",
    confirmType: "histopathology",
    sourceId: "ISIC_0000013",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0000013/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of an invasive melanoma (ISIC_0000013)",
    width: 800,
    height: 600,
    src: {
      thumb: "/images/mel-2-400.webp",
      card: "/images/mel-2-800.webp"
    }
  },
  {
    id: "nv-1",
    kind: "dermoscopy",
    code: "nv",
    diagnosis: "Nevus, Congenital",
    confirmType: "histopathology",
    sourceId: "ISIC_0001109",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0001109/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a congenital melanocytic nevus (ISIC_0001109)",
    width: 800,
    height: 536,
    src: {
      thumb: "/images/nv-1-400.webp",
      card: "/images/nv-1-800.webp"
    }
  },
  {
    id: "nv-2",
    kind: "dermoscopy",
    code: "nv",
    diagnosis: "Nevus, Lentiginous",
    confirmType: "histopathology",
    sourceId: "ISIC_0009871",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0009871/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a lentiginous melanocytic nevus (ISIC_0009871)",
    width: 800,
    height: 600,
    src: {
      thumb: "/images/nv-2-400.webp",
      card: "/images/nv-2-800.webp"
    }
  },
  {
    id: "vasc-1",
    kind: "dermoscopy",
    code: "vasc",
    diagnosis: "Hemangioma",
    confirmType: "histopathology",
    sourceId: "ISIC_0001115",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0001115/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a hemangioma (ISIC_0001115)",
    width: 800,
    height: 800,
    src: {
      thumb: "/images/vasc-1-400.webp",
      card: "/images/vasc-1-800.webp"
    }
  },
  {
    id: "vasc-2",
    kind: "dermoscopy",
    code: "vasc",
    diagnosis: "Angiokeratoma",
    confirmType: "histopathology",
    sourceId: "ISIC_0014990",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0014990/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of an angiokeratoma (ISIC_0014990)",
    width: 800,
    height: 533,
    src: {
      thumb: "/images/vasc-2-400.webp",
      card: "/images/vasc-2-800.webp"
    }
  }
]

/** Stock photos (may be empty). */
export const PHOTOS: ExampleImage[] = []

/** Hero-quality dermoscopy images (they also carry a "hero" size). */
export const HERO: ExampleImage[] = [
  {
    id: "hero-1",
    kind: "dermoscopy",
    code: "vasc",
    diagnosis: "Hemangioma",
    confirmType: "histopathology",
    sourceId: "ISIC_0001115",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0001115/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a hemangioma (ISIC_0001115)",
    width: 800,
    height: 800,
    src: {
      thumb: "/images/hero-1-400.webp",
      card: "/images/hero-1-800.webp",
      hero: "/images/hero-1-1400.webp"
    }
  },
  {
    id: "hero-2",
    kind: "dermoscopy",
    code: "nv",
    diagnosis: "Nevus, Congenital",
    confirmType: "histopathology",
    sourceId: "ISIC_0001109",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0001109/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a congenital melanocytic nevus (ISIC_0001109)",
    width: 800,
    height: 536,
    src: {
      thumb: "/images/hero-2-400.webp",
      card: "/images/hero-2-800.webp",
      hero: "/images/hero-2-1400.webp"
    }
  },
  {
    id: "hero-3",
    kind: "dermoscopy",
    code: "mel",
    diagnosis: "Melanoma in situ",
    confirmType: "histopathology",
    sourceId: "ISIC_0000049",
    sourceUrl: "https://api.isic-archive.com/images/ISIC_0000049/",
    license: "CC0 1.0",
    attribution: "Anonymous",
    alt: "Dermoscopic image of a melanoma in situ (ISIC_0000049)",
    width: 800,
    height: 601,
    src: {
      thumb: "/images/hero-3-400.webp",
      card: "/images/hero-3-800.webp",
      hero: "/images/hero-3-1400.webp"
    }
  }
]

/** Intrinsic widths of each file, for srcset descriptors. */
const WIDTHS: Record<string, Partial<Record<keyof ExampleImage['src'], number>>> = {
  "akiec-1": {
    thumb: 400,
    card: 800
  },
  "akiec-2": {
    thumb: 400,
    card: 800
  },
  "bcc-1": {
    thumb: 400,
    card: 800
  },
  "bcc-2": {
    thumb: 400,
    card: 800
  },
  "bkl-1": {
    thumb: 400,
    card: 800
  },
  "bkl-2": {
    thumb: 400,
    card: 800
  },
  "df-1": {
    thumb: 400,
    card: 800
  },
  "df-2": {
    thumb: 400,
    card: 800
  },
  "mel-1": {
    thumb: 400,
    card: 800
  },
  "mel-2": {
    thumb: 400,
    card: 800
  },
  "nv-1": {
    thumb: 400,
    card: 800
  },
  "nv-2": {
    thumb: 400,
    card: 800
  },
  "vasc-1": {
    thumb: 400,
    card: 800
  },
  "vasc-2": {
    thumb: 400,
    card: 800
  },
  "hero-1": {
    thumb: 400,
    card: 800,
    hero: 1400
  },
  "hero-2": {
    thumb: 400,
    card: 800,
    hero: 1400
  },
  "hero-3": {
    thumb: 400,
    card: 800,
    hero: 1400
  }
}

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
      return [`${url} ${width}w`]
    })
    .join(', ')
}
