import pandas as pd
from pathlib import Path


class LoadError(Exception):
    pass


def load_file(file_path: str) -> pd.DataFrame:
    path = Path(file_path)
    suffix = path.suffix.lower()

    try:
        if suffix == ".csv":
            df = pd.read_csv(path)
        elif suffix in (".xlsx", ".xls"):
            df = pd.read_excel(path)
        else:
            raise LoadError(f"Unsupported file type: {suffix}")
    except Exception as e:
        raise LoadError(f"Failed to parse file: {e}")

    if df.empty:
        raise LoadError("File is empty")

    return df