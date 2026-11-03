/**
 * Product naming lives here and only here. index.html picks it up at build time
 * through the `brand-html` plugin in vite.config.ts.
 */
export const BRAND = {
  name: 'Dermsight',
  description:
    'Upload a close-up photo of a skin spot. A model trained on HAM10000 ranks seven lesion types by calibrated probability. Educational use only, not a diagnosis.',
} as const
