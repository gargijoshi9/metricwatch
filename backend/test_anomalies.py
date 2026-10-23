
from ingestion.pipeline import prepare_dataset
from detection.anomaly_detector import detect_anomalies
from detection.anomaly_detector import detect_sustained_drops
import pandas as pd
file_path = r"D:\Download\metricwatch_test_data.csv"

metric_columns = [
    "website_visits",
    "orders",
    "revenue",
    "conversion_rate",
    "ad_spend",
]

result = prepare_dataset(
    file_path=file_path,
    date_column="date",
    metric_columns=metric_columns,
)

df = result["cleaned_df"]

all_anomalies = []

for metric in metric_columns:
    anomalies = detect_anomalies(df, metric)
    all_anomalies.extend(anomalies)

print(f"\nTotal anomalies detected: {len(all_anomalies)}")

for anomaly in sorted(
    all_anomalies,
    key=lambda item: (item["record_date"], item["metric_name"]),
):
    print(
        f"{anomaly['record_date']} | "
        f"{anomaly['metric_name']} | "
        f"actual={anomaly['actual_value']:.2f} | "
        f"baseline={anomaly['baseline_value']:.2f} | "
        f"z={anomaly['z_score']:.2f} | "
        f"severity={anomaly['severity']} | "
        f"direction={anomaly['direction']}"
    )

from collections import Counter

print("\n--- ANOMALY SUMMARY BY METRIC ---")
print(Counter(a["metric_name"] for a in all_anomalies))

print("\n--- ANOMALY SUMMARY BY SEVERITY ---")
print(Counter(a["severity"] for a in all_anomalies))

print("\n--- ANOMALIES BY DIRECTION ---")
print(Counter(a["direction"] for a in all_anomalies))

print("\n--- CHECK INJECTED DROP PERIODS ---")

for metric in ["website_visits", "orders", "revenue"]:
    print(f"\n{metric}")

    metric_df = df[["date", metric]].copy()
    metric_df["date"] = pd.to_datetime(metric_df["date"])

    # Show all dates in both deliberately affected periods.
    affected = metric_df[
        (
            (metric_df["date"] >= "2026-09-25")
            & (metric_df["date"] <= "2026-09-27")
        )
        | (
            (metric_df["date"] >= "2026-10-02")
            & (metric_df["date"] <= "2026-10-04")
        )
    ]

    detected_dates = {
    item["record_date"]
    for item in (
        detect_anomalies(df, metric)
        + detect_sustained_drops(df, metric)
    )
}

    for _, row in affected.iterrows():
        date = row["date"].date()
        print(
            f"{date} | value={row[metric]} | "
            f"detected={date in detected_dates}"
        )


print("\n--- 14-DAY HISTORICAL MEDIAN DIAGNOSTIC ---")

for metric in ["website_visits", "orders", "revenue"]:
    temp = df[["date", metric]].copy()
    temp["date"] = pd.to_datetime(temp["date"])
    temp = temp.sort_values("date").reset_index(drop=True)

    # Shift by one so the current day's value never enters its baseline.
    temp["median_14"] = (
        temp[metric]
        .shift(1)
        .rolling(window=14, min_periods=10)
        .median()
    )

    temp["deviation_pct"] = (
        (temp[metric] - temp["median_14"])
        / temp["median_14"].abs().replace(0, float("nan"))
        * 100
    )

    affected = temp[
        (
            (temp["date"] >= "2026-09-25")
            & (temp["date"] <= "2026-09-27")
        )
        | (
            (temp["date"] >= "2026-10-02")
            & (temp["date"] <= "2026-10-04")
        )
    ]

    print(f"\n{metric}")
    print(
        affected[
            ["date", metric, "median_14", "deviation_pct"]
        ].to_string(index=False)
    )

print("\n--- DETECTOR COUNTS BEFORE DEDUPLICATION ---")

for metric in metric_columns:
    zscore_results = detect_anomalies(df, metric)
    median_results = detect_sustained_drops(df, metric)

    print(
        f"{metric}: "
        f"zscore={len(zscore_results)}, "
        f"median={len(median_results)}"
    )

print("\n--- COMBINED DETECTOR SUMMARY ---")

combined = {}

for metric in metric_columns:
    zscore_results = detect_anomalies(df, metric)
    median_results = detect_sustained_drops(df, metric)

    for anomaly in zscore_results + median_results:
        key = (anomaly["metric_name"], anomaly["record_date"])

        # Keep one record per metric and date.
        # Prefer the result with the larger absolute percentage change
        # when both detectors flag the same observation.
        existing = combined.get(key)

        if existing is None or abs(anomaly["change_percent"] or 0) > abs(
            existing["change_percent"] or 0
        ):
            combined[key] = anomaly

print("Z-score detections:", sum(
    len(detect_anomalies(df, metric)) for metric in metric_columns
))
print("Median detections:", sum(
    len(detect_sustained_drops(df, metric)) for metric in metric_columns
))
print("Unique metric/date events:", len(combined))

for anomaly in sorted(
    combined.values(),
    key=lambda item: (item["record_date"], item["metric_name"]),
):
    print(
        f"{anomaly['record_date']} | "
        f"{anomaly['metric_name']} | "
        f"{anomaly['detection_method']} | "
        f"{anomaly['severity']} | "
        f"{anomaly['change_percent']}"
    )