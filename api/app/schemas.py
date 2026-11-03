"""Response models. They define the public API contract and the OpenAPI docs."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

from .labels import Category, RiskLevel


class ClassProbability(BaseModel):
    code: str
    name: str
    category: Category
    probability: float


class Risk(BaseModel):
    level: RiskLevel
    malignant_probability: float


class PredictionResponse(BaseModel):
    id: str
    model_version: str
    cached: bool
    inference_ms: float
    dev_model: bool
    uncertain: bool
    top: ClassProbability
    predictions: list[ClassProbability]
    risk: Risk

    model_config = ConfigDict(protected_namespaces=())


class ModelClass(BaseModel):
    code: str
    name: str
    category: Category
    description: str


class ModelInfoResponse(BaseModel):
    version: str
    backbone: str
    image_size: int
    dev: bool
    tta: bool
    tta_views: int
    trained_at: str | None
    classes: list[ModelClass]
    metrics: dict[str, Any] | None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    model_loaded: bool
    model_version: str | None

    model_config = ConfigDict(protected_namespaces=())


class ErrorResponse(BaseModel):
    detail: str
