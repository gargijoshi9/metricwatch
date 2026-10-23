import pandas as pd

from ingestion.pipeline import prepare_dataset


def test_pipeline_loads_profiles_and_cleans_csv(tmp_path):
    csv_path = tmp_path / "business.csv"

    df = pd.DataFrame({
        "date": [
            "2026-10-01",
            "2026-10-02",
            "2026-10-03",
        ],
        "website_visits": [5000, 5200, 3100],
        "orders": [225, 234, 120],
        "revenue": [15300, 15912, 8160],
        "conversion_rate": [4.5, 4.5, 3.87],
        "ad_spend": [1200, 1250, 2400],
    })

    df.to_csv(csv_path, index=False)

    result = prepare_dataset(
        str(csv_path),
        date_column="date",
        metric_columns=[
            "website_visits",
            "orders",
            "revenue",
            "conversion_rate",
            "ad_spend",
        ],
    )

    assert result["filename"] == "business.csv"
    assert result["original_row_count"] == 3
    assert result["original_column_count"] == 6
    assert result["cleaned_row_count"] == 3
    assert result["quality_issue_count"] == 0

    cleaned = result["cleaned_df"]

    assert "date" in cleaned.columns
    assert cleaned["revenue"].tolist() == [15300, 15912, 8160]
    assert pd.api.types.is_datetime64_any_dtype(cleaned["date"])