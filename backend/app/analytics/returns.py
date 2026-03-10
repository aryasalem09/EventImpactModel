"""Return calculations for event impact analysis."""

import numpy as np
import pandas as pd


def simple_returns(prices: pd.Series) -> pd.Series:
    """Compute simple (arithmetic) returns from price series."""
    return prices.pct_change()


def log_returns(prices: pd.Series) -> pd.Series:
    """Compute log returns from price series."""
    return np.log(prices / prices.shift(1))


def cumulative_returns(returns: pd.Series) -> pd.Series:
    """Compute cumulative returns from a return series."""
    return (1 + returns).cumprod() - 1


def cumulative_return_window(prices: pd.Series, start_idx: int, end_idx: int) -> float | None:
    """Compute cumulative return over an index range within a price series."""
    if start_idx < 0 or end_idx >= len(prices) or start_idx >= end_idx:
        return None
    return (prices.iloc[end_idx] / prices.iloc[start_idx]) - 1


def benchmark_adjusted_return(
    asset_return: float | None, benchmark_return: float | None
) -> float | None:
    """Compute benchmark-adjusted (abnormal) return."""
    if asset_return is None or benchmark_return is None:
        return None
    return asset_return - benchmark_return


def mean_adjusted_return(
    event_return: float | None,
    estimation_returns: pd.Series,
) -> float | None:
    """Compute mean-adjusted abnormal return.

    Subtracts the mean return over the estimation window from the event return.
    """
    if event_return is None or estimation_returns.empty:
        return None
    mean_est = estimation_returns.mean()
    if pd.isna(mean_est):
        return None
    return event_return - mean_est
