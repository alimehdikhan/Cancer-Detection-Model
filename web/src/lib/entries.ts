import type { Category, ClassInfo } from './types'

/**
 * The seven HAM10000 entries and their fixed furniture: code, name, category and a one-line
 * note. Names and descriptions from GET /api/v1/model take precedence; this table keeps the
 * interface readable while the service is unreachable.
 */
export interface Entry extends ClassInfo {
  note: string
}

/** Resting order: malignant first, then precancerous, then benign. */
export const ENTRY_ORDER = ['mel', 'bcc', 'akiec', 'bkl', 'nv', 'df', 'vasc'] as const

const FALLBACK: Record<string, Omit<Entry, 'code'>> = {
  mel: {
    name: 'Melanoma',
    category: 'malignant',
    note: 'The most serious skin cancer, and highly curable when caught early.',
    description:
      "A cancer of the skin's pigment cells. Less common than other skin cancers but the most serious, because it can spread. It is highly curable when caught early, so any suspicion should be checked by a dermatologist promptly.",
  },
  bcc: {
    name: 'Basal cell carcinoma',
    category: 'malignant',
    note: 'The most common skin cancer. Grows slowly and rarely spreads.',
    description:
      'The most common skin cancer. It grows slowly and rarely spreads to other parts of the body, but it can damage nearby tissue if left untreated. It often looks like a pearly bump or a sore that does not heal.',
  },
  akiec: {
    name: "Actinic keratosis / Bowen's disease",
    category: 'precancerous',
    note: 'Sun-damage patches that can turn into squamous cell carcinoma.',
    description:
      "Rough, scaly patches caused by years of sun exposure. Actinic keratoses can turn into squamous cell carcinoma, and Bowen's disease is an early form of that cancer confined to the skin's surface. Both are very treatable when found early.",
  },
  bkl: {
    name: 'Benign keratosis',
    category: 'benign',
    note: 'Seborrheic keratoses, sun spots and similar harmless growths.',
    description:
      'Harmless growths such as seborrheic keratoses, sun spots (solar lentigines) and lichen planus-like keratoses. They become more common with age. Some can look like melanoma, which is why they are sometimes checked.',
  },
  nv: {
    name: 'Melanocytic nevus',
    category: 'benign',
    note: 'A common mole.',
    description:
      'A common mole: a harmless cluster of pigment cells. Most adults have many. A mole that changes in size, shape or colour is worth having checked.',
  },
  df: {
    name: 'Dermatofibroma',
    category: 'benign',
    note: 'A small, firm, harmless bump, most often on the legs.',
    description:
      'A small, firm, harmless bump in the skin, most often on the legs. It sometimes appears after a minor injury such as an insect bite.',
  },
  vasc: {
    name: 'Vascular lesion',
    category: 'benign',
    note: 'Cherry angiomas and other small blood-vessel growths.',
    description:
      'Growths made of small blood vessels, such as cherry angiomas, angiokeratomas and pyogenic granulomas. Usually harmless.',
  },
}

export const CATEGORY_LABEL: Record<Category, string> = {
  malignant: 'Malignant',
  precancerous: 'Precancerous',
  benign: 'Benign',
}

/** Tailwind class names per category, written out in full so the compiler can see them. */
export const CATEGORY_STYLE: Record<
  Category,
  { text: string; soft: string; fill: string; dot: string; badge: 'malignant' | 'precancerous' | 'benign' }
> = {
  malignant: { text: 'text-mal-text', soft: 'bg-mal-soft', fill: 'bg-mal', dot: 'bg-mal', badge: 'malignant' },
  precancerous: { text: 'text-pre-text', soft: 'bg-pre-soft', fill: 'bg-pre', dot: 'bg-pre', badge: 'precancerous' },
  benign: { text: 'text-ben-text', soft: 'bg-ben-soft', fill: 'bg-ben', dot: 'bg-ben', badge: 'benign' },
}

/** Merge the API's class list with the fixed furniture, in resting order. */
export function buildEntries(classes: ClassInfo[] | undefined): Entry[] {
  const byCode = new Map((classes ?? []).map((c) => [c.code, c]))
  const known = ENTRY_ORDER.map((code) => {
    const base = FALLBACK[code]!
    const live = byCode.get(code)
    return {
      code,
      name: live?.name ?? base.name,
      category: live?.category ?? base.category,
      description: live?.description || base.description,
      note: base.note,
    }
  })
  // A future model could add classes; keep them rather than hiding them.
  const extra = (classes ?? [])
    .filter((c) => !(ENTRY_ORDER as readonly string[]).includes(c.code))
    .map((c) => ({ ...c, note: c.description.split('. ')[0] ?? c.description }))
  return [...known, ...extra]
}
