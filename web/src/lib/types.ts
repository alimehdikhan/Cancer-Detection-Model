// Mirrors the API contract in docs/PLAN.md section 7.

export type Category = 'malignant' | 'precancerous' | 'benign'
export type RiskLevel = 'high' | 'moderate' | 'low'

export interface ClassInfo {
  code: string
  name: string
  category: Category
  description: string
}

export interface PerClassMetric {
  precision: number
  recall: number
  f1: number
  support: number
}

/** Screening view: flag a photo when P(malignant or precancerous) ≥ threshold. */
export interface MalignantMetric {
  auc: number | null
  threshold: number
  sensitivity: number | null
  specificity: number | null
}

export interface Metrics {
  accuracy: number
  balanced_accuracy: number
  macro_f1: number
  auc_macro: number | null
  melanoma_recall: number
  test_images: number
  per_class: Record<string, PerClassMetric>
  /** Optional extras written by the training pipeline. */
  malignant?: MalignantMetric | null
  ece?: number | null
}

export interface ModelInfo {
  version: string
  backbone: string
  image_size: number
  dev: boolean
  tta: boolean
  /** Flipped views averaged per prediction: 1 (none), 2 (+ mirror) or 4 (+ vertical flips). */
  tta_views: number
  trained_at: string | null
  classes: ClassInfo[]
  metrics: Metrics | null
}

export interface Health {
  status: string
  model_loaded: boolean
  model_version: string | null
}

export interface Prediction {
  code: string
  name: string
  category: Category
  probability: number
}

export interface PredictResponse {
  id: string
  model_version: string
  cached: boolean
  inference_ms: number
  dev_model: boolean
  uncertain: boolean
  top: Prediction
  predictions: Prediction[]
  risk: {
    level: RiskLevel
    malignant_probability: number
  }
}
