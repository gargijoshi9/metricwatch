
import pandas as pd

from detection.anomaly_detector import detect_sustained_drops


def test_detects_sustained_drop():
    df = pd.DataFrame({
        "date": pd.date_range("2026-01-01", periods=16),
        "revenue": [
            100, 102, 98, 101, 99,
            100, 102, 98, 101, 100,
            40, 42, 38, 41, 39, 40,
        ],
    })

    anomalies = detect_sustained_drops(df, "revenue")

    detected_dates = {item["record_date"] for item in anomalies}

    assert pd.Timestamp("2026-01-11").date() in detected_dates
    assert pd.Timestamp("2026-01-12").date() in detected_dates
    assert all(item["direction"] == "down" for item in anomalies)
    assert all(
        item["detection_method"] == "median_deviation"
        for item in anomalies
    )


def test_does_not_flag_normal_variations():
    df = pd.DataFrame({
        "date": pd.date_range("2026-01-01", periods=16),
        "revenue": [
            100, 102, 98, 101, 99,
            100, 102, 98, 101, 100,
            99, 103, 97, 101, 98, 102,
        ],
    })

    anomalies = detect_sustained_drops(df, "revenue")

    assert anomalies == []
