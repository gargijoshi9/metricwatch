import pandas as pd
from pathlib import Path


class LoadError(Exception):
    """Raised when a dataset cannot be loaded."""
    pass


def load_file(file_path: str) -> pd.DataFrame:
    path = Path(file_path)

    if not path.is_file():
        raise LoadError(f"File not found: {path}")

    suffix = path.suffix.lower()

    if suffix not in {".csv", ".xlsx", ".xls"}:
        raise LoadError(f"Unsupported file type: {suffix}")

    try:
        if suffix == ".csv":
            df = pd.read_csv(path)
        else:
            df = pd.read_excel(path)
    except Exception as exc:
        raise LoadError(f"Failed to parse file: {exc}") from exc

    if df.empty:
        raise LoadError("File contains no data rows.")

    if len(df.columns) == 0:
        raise LoadError("File contains no columns.")

    return df