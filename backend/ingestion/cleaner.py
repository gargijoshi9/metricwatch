
import pandas as pd

MIN_ROWS = 10


class CleaningError(Exception):
    """Raised when a dataset cannot be cleaned safely."""
    pass


DATE_COLUMN_ALIASES = {
    "date",
    "timestamp",
    "datetime",
    "record_date",
}


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Return a copy with normalized column names."""
    result = df.copy(deep=True)

    normalized = [
        str(column).strip().lower().replace(" ", "_")
        for column in result.columns
    ]

    if len(normalized) != len(set(normalized)):
        raise CleaningError(
            "Column names collide after normalization. "
            "Rename the duplicate columns before cleaning."
        )

    result.columns = normalized
    return result


def clean(
    df: pd.DataFrame,
    date_column: str | None = None,
    metric_columns: list[str] | None = None,
) -> tuple[pd.DataFrame, list[dict]]:
    """
    Clean safely and return (cleaned_df, quality_issues).

    date_column:
        Explicitly mapped date column, or an unambiguous common alias.

    metric_columns:
        Explicitly mapped numeric metric columns. Unmapped columns
        are not automatically treated as business metrics.

    No rows are dropped and no missing values are imputed.
    """
    if df.empty:
        raise CleaningError("Cannot clean an empty dataset.")

    # Keep the caller's DataFrame unchanged.
    original = df.copy(deep=True)
    original_columns = list(original.columns)
    result = normalize_columns(original)

    # Map normalized column names back to their original headers.
    source_names = dict(zip(result.columns, original_columns))

    issues = []

    def add_issue(
        issue_type: str,
        source_position: int,
        column: str | None,
        description: str,
    ) -> None:
        # Excel row 1 is assumed to contain headers, so the first
        # data row is row 2.
        issues.append({
            "issue_type": issue_type,
            "source_row": source_position + 2,
            "source_column": (
                source_names.get(column, str(column))
                if column is not None
                else None
            ),
            "description": description,
            "resolution": "flagged_unresolved",
        })

    # Identify a date column only when the caller has not mapped one.
    if date_column is None:
        candidates = [
            column for column in result.columns
            if column in DATE_COLUMN_ALIASES
        ]

        if len(candidates) == 1:
            date_column = candidates[0]
        elif len(candidates) > 1:
            raise CleaningError(
                "Multiple possible date columns found. "
                "Specify date_column explicitly."
            )
        else:
            raise CleaningError(
                "No unambiguous date column found. "
                "Profile the dataset and map its date column first."
            )

    date_column = (
        str(date_column).strip().lower().replace(" ", "_")
    )

    if date_column not in result.columns:
        raise CleaningError(
            f"Mapped date column '{date_column}' does not exist."
        )

    # Parse dates, but preserve rows whose dates are invalid.
    original_dates = result[date_column].copy()
    parsed_dates = pd.to_datetime(
        original_dates,
        errors="coerce",
        format="mixed",
    )

    for position, (raw_value, parsed_value) in enumerate(
        zip(original_dates, parsed_dates)
    ):
        if pd.isna(parsed_value):
            add_issue(
                "missing_date",
                position,
                date_column,
                "Date is missing or cannot be parsed.",
            )

    result[date_column] = parsed_dates

    # Only coerce columns explicitly identified as metrics.
    normalized_metrics = []
    for column in metric_columns or []:
        normalized = str(column).strip().lower().replace(" ", "_")

        if normalized not in result.columns:
            raise CleaningError(
                f"Mapped metric column '{normalized}' does not exist."
            )

        if normalized == date_column:
            raise CleaningError(
                "The date column cannot also be a metric column."
            )

        normalized_metrics.append(normalized)

    for column in normalized_metrics:
        before = result[column].copy()
        converted = pd.to_numeric(before, errors="coerce")

        for position, (raw_value, numeric_value) in enumerate(
            zip(before, converted)
        ):
            if pd.isna(raw_value):
                add_issue(
                    "missing_value",
                    position,
                    column,
                    "Metric value is missing; value was preserved as missing.",
                )
            elif pd.isna(numeric_value):
                add_issue(
                    "invalid_type",
                    position,
                    column,
                    f"Value {raw_value!r} is not numeric.",
                )

        result[column] = converted

    # Report missing values in other columns without coercing them.
    checked_columns = set(normalized_metrics) | {date_column}

    for column in result.columns:
        if column in checked_columns:
            continue

        for position, missing in enumerate(result[column].isna()):
            if missing:
                add_issue(
                    "missing_value",
                    position,
                    column,
                    "Value is missing; original data was not imputed.",
                )

    # Detect exact duplicate rows without deleting them.
    duplicate_mask = original.duplicated(keep=False)

    for position in range(len(original)):
        if duplicate_mask.iloc[position]:
            add_issue(
                "duplicate_row",
                position,
                None,
                "Row is an exact duplicate of another input row.",
            )

    return result, issues
