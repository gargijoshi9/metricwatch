
def classify_severity(z_score: float) -> str:
    """
    Classify anomaly severity using the absolute z-score.
    """
    magnitude = abs(z_score)

    if magnitude >= 3.5:
        return "high"

    if magnitude >= 3.0:
        return "medium"

    return "low"
