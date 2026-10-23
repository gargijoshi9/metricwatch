
import pandas as pd


def calculate_rolling_baseline(
    series: pd.Series,
    window: int = 7,
    min_history: int = 5,
) -> pd.DataFrame:
    """
    Calculate a historical baseline for each observation.

    The current observation is excluded from its own baseline.
    """
    if window < 1:
        raise ValueError("window must be at least 1")

    if min_history < 1 or min_history > window:
        raise ValueError("min_history must be between 1 and window")

    values = pd.to_numeric(series, errors="coerce")

    historical_values = values.shift(1)

    baseline = historical_values.rolling(
        window=window,
        min_periods=min_history,
    ).mean()

    # Use sample standard deviation.
    baseline_std = historical_values.rolling(
        window=window,
        min_periods=min_history,
    ).std(ddof=1)

    return pd.DataFrame({
        "baseline": baseline,
        "baseline_std": baseline_std,
    }, index=series.index)
