# Build plan

This document describes how the project goes from a single Colab notebook to a
production-ready skin lesion classifier: a training pipeline that produces honest,
reproducible accuracy numbers, a fast inference API, and a polished web app.

> **Medical disclaimer.** This is an educational/research tool. It is not a medical
> device and must never be presented as a diagnosis. Every surface that shows a
> prediction also shows that disclaimer.

---

## 1. Goals

| Goal | What it means in practice |
| --- | --- |
| **Accurate** | Better model, but also *honest* numbers: no data leakage, a held-out test set, per-class metrics, calibrated probabilities. |
| **Fast** | Model inference in tens of milliseconds on a CPU (no GPU needed to serve), small uploads, cached repeat requests, static assets served from cache. |
| **Scalable** | Stateless API containers that scale horizontally, shared cache, versioned model artifacts. |
| **Production ready** | Input validation, size limits, rate limiting, health checks, tests, CI, Docker, clear docs. |
| **Premium UX** | A calm, clinical, well-crafted interface that explains results clearly and never overstates them. |

## 2. What was wrong with the original notebook

1. **Data leakage.** HAM10000 has ~10,015 images of ~7,470 lesions. Splitting by image puts
   photos of the same lesion in both train and validation, inflating scores.
2. **Broken evaluation.** The validation generator shuffled, so predictions were compared
   against labels in a different order.
3. **Augmented validation data.** Random flips/zoom were applied to validation images.
4. **Imbalance ignored in the main run.** Class weights were dropped in the second `fit`.
   ~67% of images are benign nevi, so plain accuracy hides poor melanoma detection.
5. **Frozen backbone.** MobileNetV2 was never fine-tuned.
6. **Never finished.** Training was interrupted in epoch 1, so there is no baseline number.

## 3. Architecture

```
            ┌────────────────────── training (GPU, offline) ──────────────────────┐
 Kaggle ──► │ ml/: download → lesion-grouped split → fine-tune → evaluate on test │
 HAM10000   │      → temperature calibration → ONNX export + model.json           │
            └───────────────────────────────┬─────────────────────────────────────┘
                                            │ models/current/{model.onnx, model.json}
                                            ▼
 Browser ──► nginx (web) ──/api──► FastAPI + ONNX Runtime (api) ◄──► Redis (shared cache)
   │           │  static SPA, immutable asset caching, gzip, rate limiting
   └ resizes image client-side before upload
```

### Repository layout

```
api/            FastAPI inference service (ONNX Runtime, no PyTorch at runtime)
  app/          config, model loading, preprocessing, caching, routes
  scripts/      make_dev_model.py: tiny untrained model for local dev and tests
  tests/
ml/             Training pipeline (PyTorch + timm)
  skin_ml/      data, model, train, evaluate, calibrate, export
  tests/        end-to-end smoke test on a synthetic dataset
web/            React + TypeScript + Vite frontend, served by nginx in production
models/         Exported model artifacts (gitignored)
notebooks/      train_colab.ipynb (GPU training) and the legacy notebook
docs/           This plan
```

### Key technology decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Training framework | PyTorch + `timm` | Access to modern pretrained backbones and a mature fine-tuning toolkit. |
| Default backbone | EfficientNet-B2 (ImageNet pretrained), 256 px | Best accuracy for the CPU budget. Benchmarked at ~20 ms per image in ONNX Runtime, against 150–600 ms for ConvNeXt-Tiny, whose 7×7 depthwise convolutions are slow on ORT's CPU kernels (see §5). ConvNeXt-Tiny or EfficientNet-B3 are one flag away when serving on a GPU. |
| Serving format | ONNX + ONNX Runtime | Fast CPU inference, ~50 MB runtime instead of ~2 GB of PyTorch/TensorFlow, framework-agnostic. |
| API | FastAPI | Async, typed, automatic OpenAPI docs. |
| Cache | In-process LRU + optional Redis | LRU is free and instant; Redis shares results across replicas. |
| Frontend | React + TypeScript + Vite + Tailwind | Static build, tiny runtime, hashed assets cache forever. |
| Packaging | Docker Compose (web, api, redis) | One command to run the full stack; each service scales independently. |

## 4. Accuracy strategy

All of these are implemented in `ml/` and are configurable.

1. **Leak-free splits.** `StratifiedGroupKFold` on `lesion_id` gives a 70/15/15
   train/val/test split, stratified by diagnosis. Split files are saved for reproducibility.
2. **Stronger backbone, fully fine-tuned.** EfficientNet-B2 at 256 px (instead of a frozen
   MobileNetV2 at 224) with the whole network trained, a higher learning rate on the new head,
   dropout and stochastic depth.
3. **Augmentation suited to dermoscopy.** Lesions have no "up", so: random resized crops,
   horizontal/vertical flips, full-circle rotation, and mild colour jitter.
4. **Imbalance handling.** Class-weighted cross-entropy (inverse-sqrt frequency) with
   label smoothing. Checkpoints are selected on **balanced accuracy** (mean per-class
   recall), not raw accuracy, so rare cancers count as much as common moles.
5. **Modern optimisation.** AdamW, linear warm-up then cosine decay, mixed precision,
   gradient clipping, an EMA copy of the weights, and early stopping.
6. **Test-time augmentation.** Predictions are averaged over flipped views.
7. **Calibration.** Temperature scaling fitted on the validation set, so "80% confident"
   means roughly 80% correct. This matters more than raw accuracy for a medical UI.
8. **Honest reporting.** The test set is touched exactly once. `metrics.json` reports
   accuracy, balanced accuracy, macro F1, macro ROC-AUC, per-class precision/recall,
   melanoma recall, and the confusion matrix. These are shown in the app's model card.

Expected outcome: published results with lesion-level splits typically land around
85–90% accuracy with lower balanced accuracy. Because the old notebook never finished and
had leakage, there is no fair baseline to compare against; the new pipeline's `metrics.json`
becomes the baseline. Numbers are only known after a GPU training run.

**Phase 2 accuracy work** (not in the first build): fuse metadata (age, sex, body site),
ensemble two backbones, train at higher resolution, add ISIC 2019/2020 data, and add an
out-of-distribution detector to reject photos that are not skin lesions.

## 5. Performance and caching

| Layer | Technique |
| --- | --- |
| Browser | Downscale to ≤1024 px JPEG before upload (a 5 MB phone photo becomes ~150 KB). Results memoised per SHA-256 of the file for the session. |
| Static assets | Vite content-hashed filenames, served with `Cache-Control: immutable, max-age=1y`. `index.html` is `no-cache`. gzip enabled. Fonts self-hosted. |
| API | Model loaded once at startup and warmed up. Inference runs in a thread pool with a concurrency limit so the event loop never blocks. TTA views go through ONNX Runtime as one batch. |
| Result cache | Key = `model_version + TTA setting + sha256(image bytes)`. In-memory LRU with TTL, then Redis if configured. Identical concurrent requests share one inference (single-flight). Bumping the model version invalidates everything automatically. |
| HTTP | `GET /api/v1/model` sends `Cache-Control` and an `ETag`. |

### Measured latency

Measured on the development machine, an Intel Core i5-6500T (a 2015 35 W quad-core, running
throttled at about 0.8 GHz during the tests), inside Docker. Numbers varied a lot between runs
because the machine was busy, so treat them as rough. Server CPUs are several times faster.

Model only, ONNX Runtime, one 224 px image, 4 threads:

| Backbone | Median |
| --- | --- |
| ConvNeXt-Tiny | 150–600 ms (varied between runs) |
| ResNet-50 | 48 ms |
| **EfficientNet-B2 (chosen)** | **19 ms** |
| EfficientNet-B0 | 12 ms |

INT8 dynamic quantization was also tried on the ConvNeXt models. It did not help on this CPU,
so it is not used.

Through the API's predictor (decode, preprocess and inference, EfficientNet-B2 at 256 px):

| Setting | Median |
| --- | --- |
| 1 view, 4 threads | 55 ms |
| 2 views (default TTA), 2 threads | 140 ms |
| Repeat upload (cache hit, measured through the HTTP API) | ~5 ms |

`TTA_VIEWS=1` halves model time on weak hardware, at a small cost in accuracy.

Privacy: uploaded images are never stored or logged. Only prediction results are cached,
keyed by a hash of the image.

## 6. Scalability and production readiness

- **Stateless API.** Any replica can serve any request. Scale with more containers behind
  nginx or a load balancer, sharing Redis.
- **Thread tuning.** ONNX Runtime intra-op threads are set per worker so
  `workers × threads ≈ CPU cores`.
- **Versioned artifacts.** `model.json` carries the version, preprocessing parameters,
  class order, temperature, and test metrics. The API reads everything from it, so
  training and serving cannot drift apart. A parity test checks API preprocessing
  against the training pipeline.
- **Input safety.** Content-type allowlist (JPEG, PNG, WebP), 10 MB limit, decompression-bomb
  protection, EXIF orientation handling, minimum image size.
- **Rate limiting** in nginx on the predict endpoint.
- **Health.** `/api/v1/health` for liveness and readiness. Container health checks.
- **Observability.** Request IDs and timing headers (`X-Request-ID`, `Server-Timing`),
  structured logs. (Phase 2: Prometheus metrics, tracing.)
- **Quality gates.** API tests, ML smoke test, frontend type-check and build, run in CI.

## 7. API contract (v1)

Base path: `/api/v1`. Errors return `{"detail": "<message>"}` with a proper status code.

### `GET /api/v1/health`

```json
{ "status": "ok", "model_loaded": true, "model_version": "efficientnet_b2-20261103-1a2b3c4d" }
```

Always `200` while the process is up. With no model loaded it returns
`{ "status": "degraded", "model_loaded": false, "model_version": null }`.
`GET /api/v1/ready` returns `503` until a model is loaded, for orchestrator readiness probes.

### `GET /api/v1/model`

```json
{
  "version": "efficientnet_b2-20261103-1a2b3c4d",
  "backbone": "efficientnet_b2.ra_in1k",
  "image_size": 256,
  "dev": false,
  "tta": true,
  "tta_views": 2,
  "trained_at": "2026-11-03T10:00:00Z",
  "classes": [
    {
      "code": "mel",
      "name": "Melanoma",
      "category": "malignant",
      "description": "A cancer of pigment-producing cells. ..."
    }
  ],
  "metrics": {
    "accuracy": 0.88,
    "balanced_accuracy": 0.80,
    "macro_f1": 0.79,
    "auc_macro": 0.97,
    "melanoma_recall": 0.72,
    "test_images": 1503,
    "per_class": { "mel": { "precision": 0.7, "recall": 0.72, "f1": 0.71, "support": 167 } },
    "malignant": { "auc": 0.93, "threshold": 0.5, "sensitivity": 0.78, "specificity": 0.9 },
    "ece": 0.03
  }
}
```

The metric values above are illustrative, not results. Real values come from the training run.
`category` is one of `malignant`, `precancerous`, `benign`. `tta_views` is how many flipped
views are averaged per prediction (1, 2 or 4). `metrics` is `null` for the dev model. Within
`metrics`, `malignant` (screening view: flag when the summed malignant probability ≥ `threshold`)
and `ece` (expected calibration error) are optional.

### `POST /api/v1/predict`

`multipart/form-data` with a `file` field (JPEG, PNG or WebP, ≤10 MB).

```json
{
  "id": "9f2c1a…",
  "model_version": "efficientnet_b2-20261103-1a2b3c4d",
  "cached": false,
  "inference_ms": 41.7,
  "dev_model": false,
  "uncertain": false,
  "top": { "code": "nv", "name": "Melanocytic nevus", "category": "benign", "probability": 0.91 },
  "predictions": [
    { "code": "nv", "name": "Melanocytic nevus", "category": "benign", "probability": 0.91 }
  ],
  "risk": { "level": "low", "malignant_probability": 0.04 }
}
```

- `predictions` lists all 7 classes, sorted by probability.
- `risk.malignant_probability` = P(melanoma) + P(basal cell carcinoma) + P(actinic keratosis / intraepithelial carcinoma).
- `risk.level`: `high` if ≥ 0.5 or the top class is malignant; `moderate` if ≥ 0.2 or the top class is precancerous; otherwise `low`.
- `uncertain` is `true` when the top probability is below 0.5. The UI then says the model is unsure.

Status codes: `400` unreadable image, `413` too large, `415` unsupported type, `503` no model loaded.

## 8. Frontend experience

Single page, mobile-first, light and dark themes.

1. **Hero + analyser.** Clear headline, a drag-and-drop / click / paste / camera upload
   panel, and a guidance line ("works best with close-up dermoscopic images").
2. **Analysing state.** The image preview with a subtle scanning animation.
3. **Result.** Top finding with calibrated confidence, a risk banner with plain-language
   next steps, the full probability distribution, what the condition is, and the
   disclaimer. An "uncertain" state when the model is unsure. A clear warning banner
   when the API is running the untrained dev model.
4. **Model card.** Live test-set metrics from `/api/v1/model`, honestly labelled.
5. **Condition guide.** The seven classes explained.
6. **Session history.** Previous analyses this session, in memory only (nothing stored).

Accessibility: keyboard-operable upload, visible focus, AA contrast, `prefers-reduced-motion`.

## 9. Build phases

| Phase | Deliverable | Verified how |
| --- | --- | --- |
| 1 | This plan | — |
| 2 | `ml/` training pipeline | End-to-end smoke test on a synthetic dataset: train → evaluate → calibrate → export → ONNX parity |
| 3 | `api/` inference service | pytest suite against a dev ONNX model |
| 4 | `web/` frontend | Type-check, production build, visual check against the running API |
| 5 | Docker Compose, nginx, CI, Colab notebook, README | `docker compose up` locally |
| 6 | **Real training run on a GPU** (Colab, about 1 h on a T4) | `metrics.json` on the held-out test set |

Phase 6 needs a GPU and Kaggle credentials; this machine has neither, so it is run via
`notebooks/train_colab.ipynb`. Drop the resulting `model.onnx` and `model.json` into
`models/current/` and the app picks them up.

## 10. Risks and limits

- **Dermoscopy vs phone photos.** HAM10000 is dermoscopic. Ordinary phone photos are out of
  distribution and will be less accurate. The UI says so.
- **Not an OOD detector.** A photo of a cat still gets a lesion label. The `uncertain`
  flag helps; a real OOD check is phase 2.
- **Dataset bias.** HAM10000 skews toward lighter skin tones and a European population.
  Performance on other groups is unknown and is stated in the model card.
- **Licence.** HAM10000 is CC BY-NC-SA 4.0: non-commercial use only, with attribution.
