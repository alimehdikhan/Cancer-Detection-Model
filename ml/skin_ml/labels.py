"""Class codes used by HAM10000. The order here is the model's output order."""

CLASSES: tuple[str, ...] = ("akiec", "bcc", "bkl", "df", "mel", "nv", "vasc")

# Classes whose probabilities are summed into the "malignant probability" shown to users.
# akiec covers actinic keratoses and intraepithelial carcinoma (Bowen's disease).
MALIGNANT_GROUP: tuple[str, ...] = ("akiec", "bcc", "mel")
