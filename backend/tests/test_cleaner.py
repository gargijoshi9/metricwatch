
import pandas as pd
import pytest

from ingestion.cleaner import clean, CleaningError


def test_accepts_unfamiliar_metric_names():
    df = pd.DataFrame({
        "Order Date": ["2026-10-01", "2026-10-02"],
        "Net Sales": ["1000", "1200"],
        "Website Visits": [500, 600],
    })

    cleaned, issues = clean(
        df,
        date_column="Order Date",
        metric_columns=["Net Sales", "Website Visits"],
    )

    assert "order_date" in cleaned.columns
    assert "net_sales" in cleaned.columns
    assert cleaned["net_sales"].tolist() == [1000, 1200]
    assert issues == []


def test_invalid_date_is_flagged_not_dropped():
    df = pd.DataFrame({
        "date": ["2026-10-01", "not-a-date"],
        "revenue": [100, 200],
    })

    cleaned, issues = clean(df, metric_columns=["revenue"])

    assert len(cleaned) == 2
    assert cleaned["date"].isna().sum() == 1
    assert any(i["issue_type"] == "missing_date" for i in issues)


def test_missing_values_are_not_imputed():
    df = pd.DataFrame({
        "date": ["2026-10-01", "2026-10-02", "2026-10-03"],
        "revenue": [100, None, 300],
    })

    cleaned, issues = clean(df, metric_columns=["revenue"])

    assert pd.isna(cleaned.loc[1, "revenue"])
    assert any(i["issue_type"] == "missing_value" for i in issues)


def test_invalid_numeric_value_is_flagged():
    df = pd.DataFrame({
        "date": ["2026-10-01", "2026-10-02"],
        "revenue": ["100", "unknown"],
    })

    cleaned, issues = clean(df, metric_columns=["revenue"])

    assert cleaned["revenue"].iloc[0] == 100
    assert pd.isna(cleaned["revenue"].iloc[1])
    assert any(i["issue_type"] == "invalid_type" for i in issues)


def test_duplicate_rows_are_flagged_not_removed():
    df = pd.DataFrame({
        "date": ["2026-10-01", "2026-10-01"],
        "revenue": [100, 100],
    })

    cleaned, issues = clean(df, metric_columns=["revenue"])

    assert len(cleaned) == 2
    assert sum(
        i["issue_type"] == "duplicate_row" for i in issues
    ) == 2


def test_original_dataframe_is_not_modified():
    df = pd.DataFrame({
        "Date": ["2026-10-01", "invalid"],
        "Revenue": ["100", "unknown"],
    })
    original = df.copy(deep=True)

    clean(df, metric_columns=["Revenue"])

    pd.testing.assert_frame_equal(df, original)


def test_missing_date_mapping_raises_error():
    df = pd.DataFrame({
        "Order Day": ["2026-10-01"],
        "Net Sales": [100],
    })

    with pytest.raises(CleaningError, match="date column"):
        clean(df)


def test_normalized_column_name_collision_is_rejected():
    df = pd.DataFrame({
        "Net Sales": [100],
        "net_sales": [200],
    })

    with pytest.raises(CleaningError, match="collide"):
        clean(df, date_column="date")
