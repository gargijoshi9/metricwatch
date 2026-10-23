from pathlib import Path

from ingestion.loader import load_file
from ingestion.profiler import profile_dataframe
from ingestion.cleaner import clean


def prepare_dataset(
    file_path: str,
    date_column: str,
    metric_columns: list[str],
) -> dict:
    """
    Load, profile, and clean a dataset.

    Column mappings must be explicitly supplied for now.
    Returns the cleaned DataFrame and diagnostic reports.
    """
    raw_df = load_file(file_path)

    profile = profile_dataframe(raw_df)

    cleaned_df, quality_issues = clean(
        raw_df,
        date_column=date_column,
        metric_columns=metric_columns,
    )

    return {
        "filename": Path(file_path).name,
        "original_row_count": len(raw_df),
        "original_column_count": len(raw_df.columns),
        "profile": profile,
        "cleaned_df": cleaned_df,
        "cleaned_row_count": len(cleaned_df),
        "quality_issues": quality_issues,
        "quality_issue_count": len(quality_issues),
    }