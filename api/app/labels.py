"""Human-readable information about each diagnosis the model can output."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Category = Literal["malignant", "precancerous", "benign"]
RiskLevel = Literal["high", "moderate", "low"]


@dataclass(frozen=True)
class ClassInfo:
    name: str
    category: Category
    description: str


CLASS_INFO: dict[str, ClassInfo] = {
    "akiec": ClassInfo(
        "Actinic keratosis / Bowen's disease",
        "precancerous",
        "Rough, scaly patches caused by years of sun exposure. Actinic keratoses can turn into "
        "squamous cell carcinoma, and Bowen's disease is an early form of that cancer confined to "
        "the skin's surface. Both are very treatable when found early.",
    ),
    "bcc": ClassInfo(
        "Basal cell carcinoma",
        "malignant",
        "The most common skin cancer. It grows slowly and rarely spreads to other parts of the "
        "body, but it can damage nearby tissue if left untreated. It often looks like a pearly "
        "bump or a sore that does not heal.",
    ),
    "bkl": ClassInfo(
        "Benign keratosis",
        "benign",
        "Harmless growths such as seborrheic keratoses, sun spots (solar lentigines) and lichen "
        "planus-like keratoses. They become more common with age. Some can look like melanoma, "
        "which is why they are sometimes checked.",
    ),
    "df": ClassInfo(
        "Dermatofibroma",
        "benign",
        "A small, firm, harmless bump in the skin, most often on the legs. It sometimes appears "
        "after a minor injury such as an insect bite.",
    ),
    "mel": ClassInfo(
        "Melanoma",
        "malignant",
        "A cancer of the skin's pigment cells. Less common than other skin cancers but the most "
        "serious, because it can spread. It is highly curable when caught early, so any "
        "suspicion should be checked by a dermatologist promptly.",
    ),
    "nv": ClassInfo(
        "Melanocytic nevus",
        "benign",
        "A common mole: a harmless cluster of pigment cells. Most adults have many. A mole that "
        "changes in size, shape or colour is worth having checked.",
    ),
    "vasc": ClassInfo(
        "Vascular lesion",
        "benign",
        "Growths made of small blood vessels, such as cherry angiomas, angiokeratomas and "
        "pyogenic granulomas. Usually harmless.",
    ),
}

# Summed into the malignant probability. Matches ml/skin_ml/labels.py.
MALIGNANT_GROUP = frozenset({"akiec", "bcc", "mel"})

UNCERTAIN_BELOW = 0.5
HIGH_RISK_AT = 0.5
MODERATE_RISK_AT = 0.2


def risk_level(malignant_probability: float, top_category: Category) -> RiskLevel:
    if malignant_probability >= HIGH_RISK_AT or top_category == "malignant":
        return "high"
    if malignant_probability >= MODERATE_RISK_AT or top_category == "precancerous":
        return "moderate"
    return "low"
