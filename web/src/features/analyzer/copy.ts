import type { AnalyzeError } from '@/hooks/useAnalyzer'
import type { RiskLevel } from '@/lib/types'

/** Risk banner copy and colours (never green, never "all clear"). */
export const RISK_COPY: Record<RiskLevel, { label: string; advice: string; tone: string; dot: string }> = {
  high: {
    label: 'High concern',
    advice: 'The model leans towards a malignant type. Please have this spot examined by a doctor or dermatologist soon.',
    tone: 'bg-mal-soft text-mal-text',
    dot: 'bg-mal',
  },
  moderate: {
    label: 'Moderate concern',
    advice: 'There is a real chance of a malignant or precancerous type. Have a doctor or dermatologist look at this spot.',
    tone: 'bg-pre-soft text-pre-text',
    dot: 'bg-pre',
  },
  low: {
    label: 'Low concern',
    advice:
      'The model mostly sees benign types. That is not an all-clear: see a doctor if the spot is new, changing, bleeding or itching.',
    tone: 'bg-ben-soft text-ben-text',
    dot: 'bg-ben',
  },
}

export const NEXT_STEPS: Record<RiskLevel, string[]> = {
  high: [
    "Book an appointment with your doctor or a dermatologist soon. Don't wait to see whether it changes.",
    'Bring this photo, and note how long the spot has been there and whether it has changed.',
    'Only an examination, often with a biopsy, can say what it is.',
  ],
  moderate: [
    'Arrange for a doctor or dermatologist to look at it.',
    'Until then, photograph it every few weeks in the same light so any change is easy to see.',
    'See someone sooner if it grows, changes colour, bleeds or itches.',
  ],
  low: [
    'Keep an eye on it: photograph it every few months in the same light.',
    'See a doctor if it changes in size, shape or colour, bleeds, itches, or looks unlike your other spots.',
    "If you were worried enough to check, it's reasonable to ask a doctor anyway.",
  ],
}

export const UNCERTAIN_STEPS = [
  'Try a sharper, well-lit close-up with the spot in the centre of the frame.',
  'If the photo does not show a skin lesion, ignore this result entirely.',
]

export const UNCERTAIN_TITLE = 'The model is unsure'
export const UNCERTAIN_MESSAGE =
  'No entry reached 50%. The photo may be blurry or too far away, or it may not show a skin lesion at all.'

export const DEV_RESULT_MESSAGE = 'Development model: this result is random and means nothing.'

export const ERROR_TITLE: Record<AnalyzeError['kind'], string> = {
  unreadable: 'This file could not be read',
  'bad-image': 'The image could not be read',
  'too-large': 'This image is too large',
  unsupported: 'Unsupported file type',
  'no-model': 'No model is loaded',
  'rate-limited': 'Too many requests',
  server: 'The service hit an error',
  network: 'The service could not be reached',
  aborted: 'Reading was stopped',
}

/** Same bytes cannot succeed for these, so "Try again" is hidden. */
export const NO_RETRY: ReadonlySet<AnalyzeError['kind']> = new Set(['unsupported', 'too-large'])
