# Product

<!-- impeccable:product-schema 1 -->

> Inferred record. Written by an unattended build agent from the owner's brief and
> `docs/PLAN.md`; no interview took place. Every fact below comes from those two sources.
> Confirm or correct with the project owner.

## Platform

web

## Stack

delegated: React 19 + TypeScript + Vite + Tailwind CSS v4, with shadcn/ui components on Radix,
React Router (lazy routes), `motion` for animation and the Geist typeface. Built to static files
and served by nginx, which also proxies `/api` to the FastAPI inference service. Chosen by the
owner's build plan for a static, cache-friendly frontend.

## Design Direction

"Precision": a calm, exact interface in the spirit of Linear, Vercel and Raycast. Neutral
surfaces, hairline borders, one violet accent, Geist and Geist Mono, light and dark themes, and
restrained motion with reduced-motion fallbacks. Tokens, components and rules are in
`DESIGN.md`.

## Users

- People with a skin spot they are curious or worried about, often on a phone, uploading a
  photo to get a read on it. They may be anxious; they are not clinicians.
- People evaluating the model itself (peers, reviewers, students) who want to see how it
  performs and how honestly it reports itself.

## Product Purpose

Dermsight classifies an image of a skin lesion into the seven HAM10000 diagnostic categories
and returns a calibrated probability for each, plus a simple risk read (low, moderate, high)
derived from the combined probability of the malignant and precancerous classes. Success is a
visitor who understands what the model thinks, how sure it is, what that means for them
(usually: see a dermatologist if anything looks concerning), and what the model cannot do.

## Positioning

A transparent, honest classifier: calibrated probabilities instead of a single verdict, a model card
with held-out test-set metrics from a leak-free (lesion-grouped) split, explicit uncertainty,
and plain statements of its limits. It never presents itself as a diagnosis.

## Operating Context

- Upload by drag-and-drop, file picker, clipboard paste, or the phone camera.
- Images are downscaled in the browser before upload and processed in memory on the server;
  images are never stored. Results are cached by image hash.
- A development build may run an untrained model whose predictions are random; the interface
  must say so prominently whenever that is the case.
- The API can be unreachable or have no model loaded; both are real states.

## Capabilities and Constraints

- Seven classes (HAM10000 codes): `akiec` actinic keratosis / intraepithelial carcinoma
  (precancerous), `bcc` basal cell carcinoma (malignant), `bkl` benign keratosis-like lesion,
  `df` dermatofibroma, `mel` melanoma (malignant), `nv` melanocytic nevus, `vasc` vascular lesion
  (all benign).
- Response contract: see `docs/PLAN.md` section 7.
- The model was trained on dermoscopic images; ordinary phone photos are out of distribution.
- The model has no out-of-distribution detection: a non-lesion photo still gets a label. The
  `uncertain` flag (top probability below 0.5) is the only guard.
- No body-location, age, or sex input. No accounts. No history beyond the current session.

## Brand Commitments

- Name: Dermsight (provisional, kept in one constant so it can be renamed).
- Voice: calm, plain, clinical, honest about uncertainty. Never alarmist, never reassuring
  beyond what the numbers support.

## Evidence on Hand

- Model metrics arrive live from `GET /api/v1/model`; they are `null` until a real model is
  trained. No numbers may be invented or hard-coded.
- No testimonials, customers, clinical validation, regulatory clearance, or partner logos
  exist. None may be implied.
- Dataset: HAM10000 (Tschandl et al., 2018), CC BY-NC-SA 4.0, non-commercial use, attribution
  required. It skews toward lighter skin tones and a European population.

## Product Principles

1. Not a diagnosis, on every surface that shows a prediction.
2. Show the whole distribution and the confidence, not just a label.
3. Say what the model cannot do as clearly as what it can.
4. Privacy by default: nothing about the image is kept.
5. Fast and calm: the result should arrive before anxiety builds.

## Accessibility & Inclusion

WCAG 2.1 AA contrast, fully keyboard-operable upload, visible focus, `prefers-reduced-motion`
respected, results readable without relying on colour alone (risk levels carry text labels).
