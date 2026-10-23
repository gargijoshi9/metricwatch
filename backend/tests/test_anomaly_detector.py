
import pandas as pd

from detection.baseline import calculate_rolling_baseline
from detection.severity import classify_severity
from detection.anomaly_detector import detect_anomalies


def test_baseline_excludes_current_observation():
    series = pd.Series([10, 11, 9, 10, 10, 100])

    result = calculate_rolling_baseline(
        series,
        window=5,
        min_history=5,
    )

    assert result.loc[5, "baseline"] == 10
    assert pd.isna(result.loc[0, "baseline"])


def test_severity_thresholds():
    assert classify_severity(2.7) == "low"
    assert classify_severity(-3.2) == "medium"
    assert classify_severity(4.0) == "high"


def test_detector_finds_large_drop():
    df = pd.DataFrame({
        "date": pd.date_range("2026-01-01", periods=10),
        "revenue": [100, 102, 98, 101, 99, 100, 102, 98, 101, 40],
    })

    anomalies = detect_anomalies(df, "revenue")

    assert len(anomalies) == 1
    assert anomalies[0]["direction"] == "down"
    assert anomalies[0]["actual_value"] == 40
    assert anomalies[0]["detection_method"] == "zscore"


def test_detector_skips_missing_values():
    df = pd.DataFrame({
        "date": pd.date_range("2026-01-01", periods=8),
        "revenue": [100, 102, 98, 101, 99, 100, None, 40],
    })

    anomalies = detect_anomalies(df, "revenue")

    assert all(item["actual_value"] is not None for item in anomalies)


def test_detector_rejects_duplicate_dates():
    df = pd.DataFrame({
        "date": pd.to_datetime(["2026-01-01", "2026-01-01"]),
        "revenue": [100, 200],
    })

    try:
        detect_anomalies(df, "revenue")
        assert False, "Expected duplicate dates to raise ValueError"
    except ValueError as exc:
        assert "Duplicate dates" in str(exc)
