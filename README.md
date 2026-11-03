# Skin Lesion Classifier

A deep learning system that classifies dermoscopic images of skin lesions into the seven
HAM10000 categories, including melanoma and basal cell carcinoma. It has three parts:

| Part | What it is |
| --- | --- |
| [`ml/`](ml) | PyTorch training pipeline: leak-free splits, fine-tuned EfficientNet, calibration, ONNX export |
| [`api/`](api) | FastAPI service that runs the model with ONNX Runtime, with validation and caching |
| [`web/`](web) | React frontend for uploading an image and reading the result |

> **Not a medical device.** This project is for education and research. It does not diagnose
> anything. Anyone worried about a mark on their skin should see a doctor or dermatologist.

The design, the reasoning behind it, and the API contract are in [`docs/PLAN.md`](docs/PLAN.md).

## Quick start

You need Python 3.10+, Node 22+ with pnpm, and optionally Docker.

### Run the app locally

```bash
python -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r api/requirements-dev.txt

# Until you have trained a model, create an untrained placeholder.
# The app shows a clear warning while it is in use: its predictions are random.
python api/scripts/make_dev_model.py

uvicorn app.main:app --app-dir api --port 8000 --reload
```

In a second terminal:

```bash
cd web
pnpm install
pnpm dev                               # http://localhost:5173 (proxies /api to port 8000)
```

The frontend is React 19, TypeScript, Vite and Tailwind CSS v4, with shadcn/ui components on
Radix, React Router (code-split routes), animated components built on `motion`, and the Geist
typeface, self-hosted. `/` is the landing page and `/analyze` is the analyser. The example images
are real ISIC Archive dermoscopy images (CC0), credited at `/about#credits`; after changing
`web/public/images/credits.json`, run `pnpm gen:images`. Set `API_PROXY_TARGET` to proxy to a
different API address.
`pnpm build && pnpm preview` serves the production build locally. The design system ("Precision":
tokens, type, components, motion and CSP rules) is described in [`web/DESIGN.md`](web/DESIGN.md). The product name ("Dermsight") is a placeholder set in
`web/src/lib/brand.ts`.

API docs are at http://localhost:8000/api/docs.

### Run the full stack with Docker

```bash
docker compose up --build              # http://localhost:8080
```

This starts nginx (static site, rate limiting, reverse proxy), the API, and Redis (shared result
cache). The API serves the model in `models/current/`. To add API replicas, run
`docker compose up --scale api=3`.

## Training a real model

Training needs a GPU and a [Kaggle API token](https://www.kaggle.com/settings) for the dataset.

**Google Colab (easiest):** open [`notebooks/train_colab.ipynb`](notebooks/train_colab.ipynb) in
Colab, select a GPU runtime, and run all cells. It downloads `model.zip` at the end. Unzip it into
`models/current/` and restart the API. The repository must be pushed to GitHub first, because the
notebook clones it.

**Your own GPU machine:**

```bash
pip install -r ml/requirements.txt     # install the CUDA build of PyTorch first if needed
cd ml
python -m skin_ml.download --data-dir data/ham10000
python -m skin_ml.train --data-dir data/ham10000 --output-dir runs/effnet_b2
python -m skin_ml.export --run-dir runs/effnet_b2 --dest ../models/current
```

`python -m skin_ml.train --help` lists every option (backbone, image size, epochs, learning rate,
class weighting, TTA, and so on). One command trains, fits the calibration temperature on the
validation set, evaluates once on the test set, and exports. A run directory contains:

| File | Contents |
| --- | --- |
| `splits.csv` | Which images went to train / val / test (grouped by lesion) |
| `history.json` | Per-epoch loss and validation metrics |
| `best.pt` | Best checkpoint by validation balanced accuracy |
| `calibration.json` | Temperature and before/after calibration error |
| `metrics.json` | Held-out test metrics: accuracy, balanced accuracy, macro F1, ROC-AUC, per-class precision/recall, confusion matrix |
| `export/` | `model.onnx` and `model.json`, ready for the API |

### How accuracy was improved over the original notebook

The original notebook ([`notebooks/legacy/`](notebooks/legacy)) never finished training, and its
evaluation was flawed, so it has no trustworthy baseline number. The new pipeline:

- **Splits by lesion, not by image.** HAM10000 often has several photos of one lesion. Splitting
  by image leaks near-duplicates into the test set and inflates scores.
- **Fine-tunes a stronger backbone end to end** (EfficientNet-B2 at 256 px) instead of training
  only a small head on a frozen MobileNetV2. EfficientNet-B2 was chosen after benchmarking: it
  runs in about 20 ms per image on CPU, while ConvNeXt-Tiny took 150–600 ms. For GPU serving,
  `--backbone convnext_tiny.fb_in22k_ft_in1k` is one flag away.
- **Handles class imbalance.** About 67% of images are benign moles, so it uses class-weighted loss
  and picks checkpoints by **balanced accuracy**, which rewards catching rare cancers.
- **Uses modern training:** dermoscopy-specific augmentation, AdamW, warm-up and cosine decay, mixed
  precision, EMA weights and early stopping.
- **Averages test-time augmentation** (flipped views) at inference.
- **Calibrates probabilities** with temperature scaling, so the confidence shown is meaningful.
- **Reports honestly.** It evaluates once on a held-out test set and reports per-class recall.

Results appear in `metrics.json` and in the app's model card after a training run.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Liveness and whether a model is loaded |
| `GET` | `/api/v1/ready` | 200 only when a model is loaded |
| `GET` | `/api/v1/model` | Model version, classes with descriptions, test metrics (ETag-cached) |
| `POST` | `/api/v1/predict` | Multipart `file` (JPEG/PNG/WebP, ≤10 MB) → calibrated probabilities and risk level |

The full contract with examples is in [`docs/PLAN.md`](docs/PLAN.md#7-api-contract-v1).

### Performance and caching

- The model is loaded once per worker and warmed up. Inference runs off the event loop with a
  concurrency limit, and all TTA views go through ONNX Runtime as one batch.
- Results are cached by `model version + SHA-256 of the image`: first in memory, then in Redis
  if `REDIS_URL` is set. Identical concurrent uploads share one inference. Deploying a new model
  invalidates the cache automatically.
- The browser shrinks photos before upload. Static assets have hashed names and are cached for a year.

### Configuration

Environment variables (or a `.env` file; see [`.env.example`](.env.example)):

| Variable | Default | Meaning |
| --- | --- | --- |
| `MODEL_DIR` | `models/current` | Folder containing `model.onnx` and `model.json` |
| `REDIS_URL` | unset | Enables the shared Redis cache tier |
| `CACHE_TTL_SECONDS` | `604800` | How long results stay cached |
| `CACHE_MAX_ITEMS` | `4096` | In-memory cache size per worker |
| `MAX_UPLOAD_MB` | `10` | Upload size limit |
| `MAX_CONCURRENT_INFERENCES` | `2` | Inferences running at once per worker |
| `TTA_VIEWS` | from model | 1, 2 or 4 flipped views per prediction |
| `ORT_THREADS` | auto | ONNX Runtime threads per worker (default: cores ÷ workers) |
| `WEB_CONCURRENCY` | `2` (Docker) | Uvicorn worker processes |
| `CORS_ORIGINS` | unset | Comma-separated origins, only needed if the web app is on another domain |

## Tests

```bash
cd api && pytest                       # API: endpoints, validation, caching, risk logic
cd ml && pytest                        # ML: synthetic end-to-end run, leak-free splits, train/serve preprocessing parity
cd web && pnpm test                    # Web: API client error mapping, helpers, page components (Vitest)
cd web && pnpm build                   # type-check, production build and CSP hash check
```

CI runs the API, ML and web tests and builds on every push ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

**Windows note:** if Smart App Control is on, it can block PyTorch's and pandas' compiled files
(`An Application Control policy has blocked this file`). The API doesn't use PyTorch and runs fine.
For training or the ML tests, use Colab, WSL, or Docker, for example:
`docker run --rm -v "$PWD:/work" -w /work/ml python:3.12-slim bash -c "pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt && pytest"`.

## Project structure

```
api/          FastAPI inference service (+ Dockerfile, tests, dev-model script)
ml/           Training pipeline (skin_ml package + tests)
web/          React + TypeScript + Vite frontend (+ nginx config, Dockerfile)
models/       Model artifacts served by the API (gitignored)
notebooks/    Colab training notebook; legacy/ holds the original Keras notebook
docs/         Build plan, architecture and API contract
```

## Limitations

- HAM10000 contains **dermoscopic** images. Ordinary phone photos look different, and accuracy on
  them will be lower.
- The model always picks one of seven lesion types, even for images that are not skin lesions. Low
  confidence is flagged as "uncertain", but there is no dedicated out-of-distribution detector yet.
- HAM10000 skews toward lighter skin tones and a European population. Performance on other groups
  has not been measured.

## Dataset and licence

HAM10000: Tschandl, P., Rosendahl, C. & Kittler, H. *The HAM10000 dataset, a large collection of
multi-source dermatoscopic images of common pigmented skin lesions.* Sci. Data 5, 180161 (2018).
The dataset is licensed **CC BY-NC-SA 4.0**, so models trained on it are for non-commercial use.
