
import pandas as pd


def profile_dataframe(df: pd.DataFrame) -> dict:
    """
    Inspect a DataFrame without modifying it.

    Returns a JSON-serializable report containing:
    - dataset dimensions
    - column data types and missing-value counts
    - candidate date and numeric columns
    - duplicate-row count
    """
    if df.empty:
        raise ValueError("Cannot profile an empty dataset.")

    columns = []
    candidate_date_columns = []
    candidate_numeric_columns = []

    for column in df.columns:
        series = df[column]
        non_null = series.dropna()

        missing_count = int(series.isna().sum())
        non_null_count = int(series.notna().sum())

        column_info = {
            "name": str(column),
            "inferred_type": str(series.dtype),
            "row_count": int(len(series)),
            "missing_count": missing_count,
            "missing_percentage": round(
                missing_count / len(series) * 100, 2
            ),
            "unique_count": int(series.nunique(dropna=True)),
        }

        # Identify columns that could contain timestamps.
        if non_null_count > 0:
            parsed_dates = pd.to_datetime(
                non_null, errors="coerce", format="mixed"
            )
            date_ratio = float(parsed_dates.notna().mean())

            if date_ratio >= 0.8:
                candidate_date_columns.append(str(column))
                column_info["date_parse_ratio"] = round(date_ratio, 3)

        # Identify columns that could contain numeric values.
        numeric_values = pd.to_numeric(non_null, errors="coerce")

        if (
            str(column) not in candidate_date_columns
            and non_null_count > 0
            and numeric_values.notna().mean() >= 0.8
        ):
            candidate_numeric_columns.append(str(column))

        columns.append(column_info)

    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "duplicate_row_count": int(df.duplicated().sum()),
        "columns": columns,
        "candidate_date_columns": candidate_date_columns,
        "candidate_numeric_columns": candidate_numeric_columns,
    }
