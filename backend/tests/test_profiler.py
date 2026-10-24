
import pandas as pd

from ingestion.profiler import profile_dataframe


def test_profile_identifies_dates_and_numeric_columns():
    df = pd.DataFrame({
        "Order Date": [
            "2026-10-01",
            "2026-10-02",
            "2026-10-03",
        ],
        "Net Sales": [1000, 1200, 900],
        "Region": ["South", "North", "South"],
    })

    report = profile_dataframe(df)

    assert report["row_count"] == 3
    assert report["column_count"] == 3
    assert "Order Date" in report["candidate_date_columns"]
    assert "Net Sales" in report["candidate_numeric_columns"]
    assert "Region" not in report["candidate_numeric_columns"]


def test_profile_handles_datetime64_and_boolean_types():
    df = pd.DataFrame({
        "timestamp": pd.to_datetime(["2026-10-01", "2026-10-02"]),
        "is_active": [True, False],
        "score": [98.5, 87.0],
    })

    report = profile_dataframe(df)

    assert "timestamp" in report["candidate_date_columns"]
    assert "timestamp" not in report["candidate_numeric_columns"]
    assert "is_active" not in report["candidate_numeric_columns"]
    assert "is_active" not in report["candidate_date_columns"]
    assert "score" in report["candidate_numeric_columns"]


def test_profile_counts_missing_and_duplicate_rows():
    df = pd.DataFrame({
        "date": ["2026-10-01", "2026-10-01", None],
        "revenue": [100, 100, None],
    })

    report = profile_dataframe(df)

    assert report["duplicate_row_count"] == 1

    columns = {
        column["name"]: column
        for column in report["columns"]
    }

    assert columns["date"]["missing_count"] == 1
    assert columns["revenue"]["missing_count"] == 1


def test_profile_does_not_modify_input():
    df = pd.DataFrame({
        "date": ["2026-10-01", "2026-10-02"],
        "revenue": [100, None],
    })
    original = df.copy(deep=True)

    profile_dataframe(df)

    pd.testing.assert_frame_equal(df, original)


def test_profile_rejects_empty_dataframe():
    df = pd.DataFrame()

    try:
        profile_dataframe(df)
    except ValueError as error:
        assert "empty dataset" in str(error).lower()
    else:
        raise AssertionError("Expected ValueError for empty dataset")
