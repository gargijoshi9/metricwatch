import pandas as pd

REQUIRED_COLUMNS = {"date", "revenue", "orders", "conversion_rate", "traffic", "cost", "refunds"}
MIN_ROWS = 10


class CleaningError(Exception):
    pass


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df


def validate_columns(df: pd.DataFrame):
    missing = REQUIRED_COLUMNS - set(df.columns)
    if "date" in missing:
        raise CleaningError("Missing required 'date' column")
    # other missing metric columns are allowed — just won't be analyzed


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """Returns (cleaned_df, list_of_quality_issues)"""
    issues = []

    df = normalize_columns(df)
    validate_columns(df)

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    bad_dates = df[df["date"].isna()]
    for idx in bad_dates.index:
        issues.append({
            "issue_type": "missing_date",
            "source_row": int(idx),
            "source_column": "date",
            "description": "Unparseable or missing date",
            "resolution": "dropped",
        })
    df = df.dropna(subset=["date"])

    df = df.sort_values("date").set_index("date")

    metric_cols = [c for c in df.columns if c in REQUIRED_COLUMNS - {"date"}]
    for col in metric_cols:
        before = df[col].copy()
        df[col] = pd.to_numeric(df[col], errors="coerce")
        bad_mask = df[col].isna() & before.notna()
        for idx in df[bad_mask].index:
            issues.append({
                "issue_type": "invalid_type",
                "source_row": None,
                "source_column": col,
                "description": f"Non-numeric value in {col}",
                "resolution": "flagged_unresolved",
            })
        # interpolate missing metric values on valid dates
        df[col] = df[col].interpolate(limit_direction="both")

    if len(df) < MIN_ROWS:
        raise CleaningError(f"Not enough rows after cleaning: {len(df)} < {MIN_ROWS}")

    return df, issues