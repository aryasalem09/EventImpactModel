"""Volatility calculations for event impact analysis."""

import numpy as np
import pandas as pd

from app.config import settings


def realized_volatility(
    log_rets: pd.Series,
    window: int | None = None,
    annualize: bool = True,
) -> pd.Series:
    """Compute rolling realized volatility from log returns.

    Args:
        log_rets: Series of log returns.
        window: Rolling window size. Defaults to config value.
        annualize: Whether to annualize (multiply by sqrt(252)).
    """
    if window is None:
        window = settings.rolling_vol_window

    vol = log_rets.rolling(window=window, min_periods=max(window // 2, 5)).std()
    if annualize:
        vol = vol * np.sqrt(settings.annualization_factor)
    return vol


def ewma_volatility(
    log_rets: pd.Series,
    span: int = 21,
    annualize: bool = True,
) -> pd.Series:
    """Compute EWMA volatility."""
    vol = log_rets.ewm(span=span, min_periods=max(span // 2, 5)).std()
    if annualize:
        vol = vol * np.sqrt(settings.annualization_factor)
    return vol


def window_volatility(log_rets: pd.Series, annualize: bool = True) -> float | None:
    """Compute realized volatility over a fixed window (not rolling)."""
    if log_rets.empty or log_rets.dropna().empty:
        return None
    vol = log_rets.std()
    if pd.isna(vol):
        return None
    if annualize:
        vol = vol * np.sqrt(settings.annualization_factor)
    return float(vol)


def vol_delta(pre_vol: float | None, post_vol: float | None) -> float | None:
    """Change in volatility (post - pre)."""
    if pre_vol is None or post_vol is None:
        return None
    return post_vol - pre_vol


def vol_ratio(pre_vol: float | None, post_vol: float | None) -> float | None:
    """Ratio of post to pre volatility."""
    if pre_vol is None or post_vol is None or pre_vol == 0:
        return None
    return post_vol / pre_vol

