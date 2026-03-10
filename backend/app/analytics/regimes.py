"""Regime classification for event impact analysis."""

import numpy as np
import pandas as pd

from app.config import settings


def classify_vol_regime(
    rolling_vol: pd.Series,
    date: pd.Timestamp,
    lookback: int = 252,
) -> str:
    """Classify volatility regime at a given date.

    Uses percentile rank of current vol vs trailing distribution.
    Returns: 'high_vol', 'low_vol', or 'normal_vol'.
    """
    date = pd.Timestamp(date)
    if date.tz is not None:
        date = date.tz_localize(None)
    idx = rolling_vol.index
    if idx.tz is not None:
        idx = idx.tz_localize(None)
    loc = idx.get_indexer([date], method="ffill")[0]
    if loc < 0 or loc < lookback // 2:
        return "normal_vol"

    start = max(0, loc - lookback)
    trailing = rolling_vol.iloc[start:loc]

    if trailing.empty or trailing.dropna().empty:
        return "normal_vol"

    current = rolling_vol.iloc[loc]
    if pd.isna(current):
        return "normal_vol"

    pct = (trailing < current).sum() / len(trailing.dropna()) * 100

    if pct >= settings.vol_regime_percentile_high:
        return "high_vol"
    elif pct <= settings.vol_regime_percentile_low:
        return "low_vol"
    else:
        return "normal_vol"


def classify_trend_regime(
    prices: pd.Series,
    date: pd.Timestamp,
) -> str:
    """Classify trend regime using moving average crossover.

    Returns: 'bullish', 'bearish', or 'neutral'.
    """
    ma_short = settings.trend_ma_short
    ma_long = settings.trend_ma_long

    date = pd.Timestamp(date)
    if date.tz is not None:
        date = date.tz_localize(None)
    idx = prices.index
    if idx.tz is not None:
        idx = idx.tz_localize(None)
    loc = idx.get_indexer([date], method="ffill")[0]
    if loc < 0 or loc < ma_long:
        return "neutral"

    sma_short = prices.iloc[max(0, loc - ma_short + 1):loc + 1].mean()
    sma_long = prices.iloc[max(0, loc - ma_long + 1):loc + 1].mean()
    current = prices.iloc[loc]

    if pd.isna(sma_short) or pd.isna(sma_long) or pd.isna(current):
        return "neutral"

    if current > sma_short and sma_short > sma_long:
        return "bullish"
    elif current < sma_short and sma_short < sma_long:
        return "bearish"
    else:
        return "neutral"


def classify_surprise_regime(
    surprise: float | None,
    surprise_pct: float | None = None,
) -> str:
    """Classify surprise direction.

    Returns: 'positive_surprise', 'negative_surprise', or 'neutral'.
    """
    if surprise is not None and not (isinstance(surprise, float) and np.isnan(surprise)):
        if surprise > 0:
            return "positive_surprise"
        elif surprise < 0:
            return "negative_surprise"
        else:
            return "neutral"
    return "neutral"


def semantic_label(event_type: str, surprise_regime: str) -> str:
    """Generate semantic labels for specific event types.

    E.g., CPI positive surprise → 'hotter_cpi', FOMC context → 'hawkish_proxy'.
    These are heuristic labels documented in methodology.
    """
    et = event_type.upper()
    if et == "CPI":
        if surprise_regime == "positive_surprise":
            return "hotter_cpi"
        elif surprise_regime == "negative_surprise":
            return "cooler_cpi"
        return "inline_cpi"
    elif et == "NFP":
        if surprise_regime == "positive_surprise":
            return "strong_labor"
        elif surprise_regime == "negative_surprise":
            return "weak_labor"
        return "inline_labor"
    elif et == "FOMC":
        # FOMC surprise is harder to define from a single number;
        # we use surprise field if available as a proxy for hawkish/dovish
        if surprise_regime == "positive_surprise":
            return "hawkish_proxy"
        elif surprise_regime == "negative_surprise":
            return "dovish_proxy"
        return "neutral_fomc"
    return surprise_regime

