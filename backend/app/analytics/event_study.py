"""Core event study engine.

Computes all per-event, per-asset, per-window metrics including returns,
volatility, drawdown, z-score, persistence, and regime labels.
"""

import logging

import numpy as np
import pandas as pd

from app.analytics.regimes import (
    classify_surprise_regime,
    classify_trend_regime,
    classify_vol_regime,
)
from app.analytics.returns import (
    benchmark_adjusted_return,
    log_returns,
    mean_adjusted_return,
    simple_returns,
)
from app.analytics.volatility import (
    realized_volatility,
    vol_delta,
    vol_ratio,
    window_volatility,
)
from app.config import settings
from app.schemas.analytics import EventWindowMetrics

logger = logging.getLogger(__name__)


def _find_trading_day(dates_index: pd.DatetimeIndex, target: pd.Timestamp) -> int | None:
    """Find the index of the closest trading day on or after target."""
    # Normalize target to tz-naive Timestamp to match price index
    target = pd.Timestamp(target)
    if target.tz is not None:
        target = target.tz_localize(None)
    if dates_index.tz is not None:
        dates_index = dates_index.tz_localize(None)

    try:
        loc = dates_index.get_indexer([target], method="ffill")[0]
        if loc < 0:
            loc = dates_index.get_indexer([target], method="bfill")[0]
        return loc if loc >= 0 else None
    except Exception:
        return None


def _max_drawdown(prices: pd.Series) -> float:
    """Compute maximum drawdown within a price window."""
    if len(prices) < 2:
        return 0.0
    running_max = prices.cummax()
    drawdown = (prices - running_max) / running_max
    return float(drawdown.min())


def _max_runup(prices: pd.Series) -> float:
    """Compute maximum run-up within a price window."""
    if len(prices) < 2:
        return 0.0
    running_min = prices.cummin()
    runup = (prices - running_min) / running_min
    return float(runup.max())


def compute_event_metrics(
    event_date: pd.Timestamp,
    event_id: str,
    event_type: str,
    event_name: str,
    surprise: float | None,
    surprise_pct: float | None,
    asset: str,
    prices: pd.DataFrame,
    benchmark_prices: pd.DataFrame | None,
    window: list[int],
    estimation_window: int,
) -> EventWindowMetrics | None:
    """Compute all metrics for a single event-asset-window combination.

    Args:
        event_date: The date of the event.
        event_id: Unique event identifier.
        event_type: E.g., 'CPI', 'FOMC'.
        event_name: Human-readable event name.
        surprise: Actual minus expected.
        surprise_pct: Surprise as percentage.
        asset: Ticker symbol.
        prices: OHLCV DataFrame for the asset (DatetimeIndex).
        benchmark_prices: OHLCV DataFrame for the benchmark (optional).
        window: [pre_days, post_days], e.g., [-5, 5].
        estimation_window: Number of days for the estimation period.
    """
    if prices.empty or "Close" not in prices.columns:
        return None

    close = prices["Close"].dropna()
    if close.empty:
        return None

    # Find the event day in the trading calendar
    event_loc = _find_trading_day(close.index, event_date)
    if event_loc is None:
        return None

    # Window boundaries
    pre_days = abs(window[0])
    post_days = abs(window[1])
    win_start = event_loc - pre_days
    win_end = event_loc + post_days
    est_start = event_loc - pre_days - estimation_window

    if win_start < 0 or win_end >= len(close) or est_start < 0:
        return None

    # Price slices
    win_prices = close.iloc[win_start:win_end + 1]
    est_prices = close.iloc[est_start:win_start]
    pre_prices = close.iloc[win_start:event_loc + 1]
    post_prices = close.iloc[event_loc:win_end + 1]

    # Returns
    asset_log_rets = log_returns(close)
    asset_simple_rets = simple_returns(close)

    event_day_simple = asset_simple_rets.iloc[event_loc]
    event_day_log = asset_log_rets.iloc[event_loc]
    event_day_ret = float(event_day_simple) if not pd.isna(event_day_simple) else None
    event_day_log_ret = float(event_day_log) if not pd.isna(event_day_log) else None

    cum_ret = (win_prices.iloc[-1] / win_prices.iloc[0]) - 1 if len(win_prices) > 1 else None

    # Benchmark return
    bench_ret = None
    abnormal_ret = None
    if benchmark_prices is not None and "Close" in benchmark_prices.columns:
        bench_close = benchmark_prices["Close"].dropna()
        bench_loc = _find_trading_day(bench_close.index, event_date)
        if bench_loc is not None:
            b_start = bench_loc - pre_days
            b_end = bench_loc + post_days
            if 0 <= b_start and b_end < len(bench_close):
                bench_win = bench_close.iloc[b_start:b_end + 1]
                if len(bench_win) > 1:
                    bench_ret = float((bench_win.iloc[-1] / bench_win.iloc[0]) - 1)
                abnormal_ret = benchmark_adjusted_return(cum_ret, bench_ret)

    # Fallback to mean-adjusted abnormal return
    if abnormal_ret is None and not est_prices.empty:
        est_rets = simple_returns(est_prices).dropna()
        if event_day_ret is not None:
            abnormal_ret = mean_adjusted_return(event_day_ret, est_rets)

    # Volatility
    pre_log_rets = log_returns(pre_prices).dropna()
    post_log_rets = log_returns(post_prices).dropna()

    pre_vol = window_volatility(pre_log_rets)
    post_vol = window_volatility(post_log_rets)
    vd = vol_delta(pre_vol, post_vol)
    vr = vol_ratio(pre_vol, post_vol)

    # Event metrics
    abs_move = abs(event_day_ret) if event_day_ret is not None else None
    signed_move = event_day_ret
    cum_move = cum_ret

    dd = _max_drawdown(win_prices) if len(win_prices) > 1 else None
    ru = _max_runup(win_prices) if len(win_prices) > 1 else None

    # Z-score vs trailing vol
    rolling_vol = realized_volatility(asset_log_rets, annualize=False)
    prior_vol = rolling_vol.iloc[event_loc - 1] if event_loc > 0 else None
    trailing_vol_val = prior_vol if prior_vol is not None and not pd.isna(prior_vol) else None
    z_score = None
    if event_day_ret is not None and trailing_vol_val is not None and trailing_vol_val > 0:
        z_score = event_day_ret / trailing_vol_val

    # Percentile rank vs non-event days
    pct_rank = None
    if event_day_ret is not None:
        all_rets = asset_simple_rets.dropna()
        if len(all_rets) > 10:
            pct_rank = float((all_rets.abs() < abs(event_day_ret)).sum() / len(all_rets) * 100)

    # Persistence: cumulative return over +1/+3/+5 days after event
    persistence_1d = None
    persistence_3d = None
    persistence_5d = None
    for offset, attr in [(1, "persistence_1d"), (3, "persistence_3d"), (5, "persistence_5d")]:
        end_loc = event_loc + offset
        if end_loc < len(close):
            p = (close.iloc[end_loc] / close.iloc[event_loc]) - 1
            if attr == "persistence_1d":
                persistence_1d = float(p)
            elif attr == "persistence_3d":
                persistence_3d = float(p)
            else:
                persistence_5d = float(p)

    # Reversal score: sign of day+1 return vs event day return
    reversal = None
    if event_day_ret is not None and persistence_1d is not None:
        if event_day_ret != 0:
            reversal = -1.0 if (persistence_1d * event_day_ret < 0) else 1.0
        else:
            reversal = 0.0

    # Regimes
    rolling_vol_series = realized_volatility(asset_log_rets)
    v_regime = classify_vol_regime(rolling_vol_series, event_date)
    t_regime = classify_trend_regime(close, event_date)
    s_regime = classify_surprise_regime(surprise, surprise_pct)

    return EventWindowMetrics(
        event_id=event_id,
        event_type=event_type,
        event_name=event_name,
        event_date=str(event_date.date()),
        asset=asset,
        window=window,
        event_day_return=_r(event_day_ret),
        event_day_log_return=_r(event_day_log_ret),
        cumulative_return=_r(cum_ret),
        benchmark_return=_r(bench_ret),
        abnormal_return=_r(abnormal_ret),
        pre_event_vol=_r(pre_vol),
        post_event_vol=_r(post_vol),
        vol_delta=_r(vd),
        vol_ratio=_r(vr),
        abs_move=_r(abs_move),
        signed_move=_r(signed_move),
        cumulative_move=_r(cum_move),
        max_drawdown=_r(dd),
        max_runup=_r(ru),
        z_score=_r(z_score),
        percentile_rank=_r(pct_rank),
        persistence_1d=_r(persistence_1d),
        persistence_3d=_r(persistence_3d),
        persistence_5d=_r(persistence_5d),
        reversal_score=_r(reversal),
        vol_regime=v_regime,
        trend_regime=t_regime,
        surprise_regime=s_regime,
    )


def _r(val: float | None, decimals: int = 6) -> float | None:
    """Round a value for output."""
    if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
        return None
    return round(val, decimals)


def run_event_study(
    events_df: pd.DataFrame,
    price_data: dict[str, pd.DataFrame],
    assets: list[str],
    windows: list[list[int]] | None = None,
    estimation_window: int | None = None,
    benchmark: str | None = None,
    event_types: list[str] | None = None,
) -> list[EventWindowMetrics]:
    """Run the full event study across events, assets, and windows.

    Args:
        events_df: DataFrame with event records (must have 'date', 'event_id', etc.).
        price_data: Dict of ticker -> OHLCV DataFrame.
        assets: List of tickers to analyze.
        windows: List of [pre, post] windows. Defaults to config.
        estimation_window: Estimation window length. Defaults to config.
        benchmark: Benchmark ticker for abnormal returns.
        event_types: Filter to these event types if provided.
    """
    if windows is None:
        windows = settings.default_event_windows
    if estimation_window is None:
        estimation_window = settings.default_estimation_window
    if benchmark is None:
        benchmark = settings.default_benchmark

    if event_types:
        events_df = events_df[events_df["event_type"].isin(event_types)]

    benchmark_prices = price_data.get(benchmark)

    results = []
    for _, event in events_df.iterrows():
        event_date = pd.Timestamp(event["date"])
        event_id = str(event["event_id"])
        event_type = str(event["event_type"])
        event_name = str(event["event_name"])
        surprise = event.get("surprise")
        surprise_pct = event.get("surprise_pct")

        if surprise is not None and isinstance(surprise, float) and pd.isna(surprise):
            surprise = None
        if surprise_pct is not None and isinstance(surprise_pct, float) and pd.isna(surprise_pct):
            surprise_pct = None

        for asset in assets:
            if asset not in price_data:
                continue
            prices = price_data[asset]
            bp = benchmark_prices if asset != benchmark else None

            for window in windows:
                m = compute_event_metrics(
                    event_date=event_date,
                    event_id=event_id,
                    event_type=event_type,
                    event_name=event_name,
                    surprise=surprise,
                    surprise_pct=surprise_pct,
                    asset=asset,
                    prices=prices,
                    benchmark_prices=bp,
                    window=window,
                    estimation_window=estimation_window,
                )
                if m is not None:
                    results.append(m)

    logger.info(f"Event study produced {len(results)} metric records")
    return results

