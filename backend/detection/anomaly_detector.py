
import pandas as pd

from detection.baseline import calculate_rolling_baseline
from detection.severity import classify_severity


def detect_anomalies(
    df: pd.DataFrame,
    metric_column: str,
    date_column: str = "date",
    window: int = 7,
    min_history: int = 5,
    threshold: float = 2.5,
) -> list[dict]:
    """
    Detect anomalies in one metric using a rolling historical baseline.

    Returns a list of anomaly dictionaries.
    """
    if metric_column not in df.columns:
        raise ValueError(f"Metric column '{metric_column}' does not exist")

    if date_column not in df.columns:
        raise ValueError(f"Date column '{date_column}' does not exist")

    if threshold <= 0:
        raise ValueError("threshold must be positive")

    working = df[[date_column, metric_column]].copy()
    working[date_column] = pd.to_datetime(
        working[date_column],
        errors="coerce",
        format="mixed",
    )
    working[metric_column] = pd.to_numeric(
        working[metric_column],
        errors="coerce",
    )

    # Invalid dates cannot be reported reliably.
    working = working.dropna(subset=[date_column])
    working = working.sort_values(date_column).reset_index(drop=True)

    # Duplicate dates make time-series interpretation ambiguous.
    if working[date_column].duplicated().any():
        raise ValueError(
            f"Duplicate dates found for metric '{metric_column}'. "
            "Resolve or aggregate duplicate dates before detection."
        )

    baseline = calculate_rolling_baseline(
        working[metric_column],
        window=window,
        min_history=min_history,
    )

    working["baseline"] = baseline["baseline"]
    working["baseline_std"] = baseline["baseline_std"]

    working["z_score"] = (
        (working[metric_column] - working["baseline"])
        / working["baseline_std"].where(working["baseline_std"] > 0)
    )

    anomalies = []

    for _, row in working.iterrows():
        actual = row[metric_column]
        expected = row["baseline"]
        std = row["baseline_std"]
        z_score = row["z_score"]

        if pd.isna(actual) or pd.isna(expected):
            continue

        # Zero or unavailable historical variance means the z-score
        # cannot be interpreted reliably.
        if pd.isna(std) or std <= 0 or pd.isna(z_score):
            continue

        if abs(z_score) < threshold:
            continue

        change_percent = (
            ((actual - expected) / abs(expected)) * 100
            if expected != 0
            else None
        )

        anomalies.append({
            "metric_name": metric_column,
            "record_date": row[date_column].date(),
            "actual_value": float(actual),
            "baseline_value": float(expected),
            "baseline_std": float(std),
            "z_score": float(z_score),
            "change_percent": (
                float(change_percent)
                if change_percent is not None
                else None
            ),
            "direction": "up" if actual > expected else "down",
            "severity": classify_severity(float(z_score)),
            "detection_method": "zscore",

    
        })
        return anomalies
        

def detect_sustained_drops(
    df: pd.DataFrame,
    metric_column: str,
    date_column: str = "date",
    window: int = 14,
    min_history: int = 10,
    drop_threshold: float = 0.30,
) -> list[dict]:
    """Detect drops relative to the preceding historical median."""

    if metric_column not in df.columns:
        raise ValueError(f"Metric column '{metric_column}' does not exist")

    if date_column not in df.columns:
        raise ValueError(f"Date column '{date_column}' does not exist")

    if window < 1 or not 1 <= min_history <= window:
        raise ValueError("Require 1 <= min_history <= window")

    if not 0 < drop_threshold < 1:
        raise ValueError("drop_threshold must be between 0 and 1")

    working = df[[date_column, metric_column]].copy()
    working[date_column] = pd.to_datetime(
        working[date_column], errors="coerce", format="mixed"
    )
    working[metric_column] = pd.to_numeric(
        working[metric_column], errors="coerce"
    )

    working = (
        working.dropna(subset=[date_column])
        .sort_values(date_column)
        .reset_index(drop=True)
    )

    if working[date_column].duplicated().any():
        raise ValueError(f"Duplicate dates found for '{metric_column}'")

    values = working[metric_column]
    working["baseline"] = values.shift(1).rolling(
        window=window, min_periods=min_history
    ).median()
    working["baseline_std"] = values.shift(1).rolling(
        window=window, min_periods=min_history
    ).std(ddof=1)

    anomalies = []

    for _, row in working.iterrows():
        actual = row[metric_column]
        baseline = row["baseline"]

        if pd.isna(actual) or pd.isna(baseline) or baseline <= 0:
            continue

        change_percent = (actual - baseline) / baseline * 100

        if change_percent > -drop_threshold * 100:
            continue

        if change_percent <= -45:
            severity = "high"
        elif change_percent <= -35:
            severity = "medium"
        else:
            severity = "low"

        anomalies.append({
            "metric_name": metric_column,
            "record_date": row[date_column].date(),
            "actual_value": float(actual),
            "baseline_value": float(baseline),
            "baseline_std": (
                float(row["baseline_std"])
                if pd.notna(row["baseline_std"])
                else None
            ),
            "z_score": None,
            "change_percent": float(change_percent),
            "direction": "down",
            "severity": severity,
            "detection_method": "median_deviation",
        })

    return anomalies
