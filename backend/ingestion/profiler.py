
import pandas as pd


def profile_dataframe(df: pd.DataFrame) -> dict:
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

        is_date_candidate = False
        is_numeric_candidate = False

        if non_null_count > 0:
            if pd.api.types.is_datetime64_any_dtype(series):
                is_date_candidate = True
                date_ratio = 1.0
                column_info["date_parse_ratio"] = 1.0
            elif pd.api.types.is_bool_dtype(series):
                pass
            elif pd.api.types.is_numeric_dtype(series):
                is_numeric_candidate = True
            else:
                numeric_values = pd.to_numeric(
                    non_null,
                    errors="coerce",
                )
                numeric_ratio = float(numeric_values.notna().mean())

                if numeric_ratio >= 0.8:
                    is_numeric_candidate = True
                else:
                    parsed_dates = pd.to_datetime(
                        non_null,
                        errors="coerce",
                        format="mixed",
                    )
                    date_ratio = float(parsed_dates.notna().mean())
                    is_date_candidate = date_ratio >= 0.8

                    if is_date_candidate:
                        column_info["date_parse_ratio"] = round(
                            date_ratio, 3
                        )

        if is_date_candidate:
            candidate_date_columns.append(str(column))
        elif is_numeric_candidate:
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
