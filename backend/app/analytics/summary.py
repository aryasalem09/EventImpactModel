"""Summary statistics and aggregations for event study results."""

import numpy as np
import pandas as pd

from app.schemas.analytics import (
    AssetEventSummary,
    EventWindowMetrics,
    HeatmapCell,
    RegimeSplit,
)


def compute_asset_event_summaries(
    metrics: list[EventWindowMetrics],
) -> list[AssetEventSummary]:
    """Aggregate metrics by asset + event_type + window."""
    if not metrics:
        return []

    df = pd.DataFrame([m.model_dump() for m in metrics])

    # Stringify window for grouping
    df["window_key"] = df["window"].apply(lambda w: f"{w[0]},{w[1]}")

    summaries = []
    for (asset, etype, wkey), group in df.groupby(["asset", "event_type", "window_key"]):
        rets = group["event_day_return"].dropna()
        abs_moves = group["abs_move"].dropna()
        vol_deltas = group["vol_delta"].dropna()
        drawdowns = group["max_drawdown"].dropna()
        z_scores = group["z_score"].dropna()
        window = [int(x) for x in wkey.split(",")]

        pos = (rets > 0).sum() if len(rets) > 0 else 0
        neg = (rets < 0).sum() if len(rets) > 0 else 0
        total = len(rets)

        summaries.append(AssetEventSummary(
            asset=asset,
            event_type=etype,
            window=window,
            count=len(group),
            mean_return=_safe(rets.mean()),
            median_return=_safe(rets.median()),
            std_return=_safe(rets.std()),
            mean_abs_move=_safe(abs_moves.mean()),
            positive_freq=round(pos / total, 4) if total > 0 else None,
            negative_freq=round(neg / total, 4) if total > 0 else None,
            hit_rate=round(pos / total, 4) if total > 0 else None,
            mean_vol_delta=_safe(vol_deltas.mean()),
            median_drawdown=_safe(drawdowns.median()),
            mean_z_score=_safe(z_scores.mean()),
        ))

    return summaries


def compute_heatmap(
    metrics: list[EventWindowMetrics],
    value_field: str = "event_day_return",
    window_filter: list[int] | None = None,
) -> list[HeatmapCell]:
    """Compute average value per asset x event_type for heatmap."""
    if not metrics:
        return []

    df = pd.DataFrame([m.model_dump() for m in metrics])

    if window_filter:
        df = df[df["window"].apply(lambda w: w == window_filter)]

    if df.empty:
        return []

    pivot = df.groupby(["asset", "event_type"])[value_field].mean()
    cells = []
    for (asset, etype), val in pivot.items():
        cells.append(HeatmapCell(
            asset=asset,
            event_type=etype,
            value=_safe(val),
        ))
    return cells


def compute_regime_splits(
    metrics: list[EventWindowMetrics],
    regime_type: str = "vol_regime",
    window_filter: list[int] | None = None,
) -> list[RegimeSplit]:
    """Split metrics by a regime dimension."""
    if not metrics:
        return []

    df = pd.DataFrame([m.model_dump() for m in metrics])

    if window_filter:
        df = df[df["window"].apply(lambda w: w == window_filter)]

    if df.empty or regime_type not in df.columns:
        return []

    splits = []
    for (regime_label, asset, etype), group in df.groupby([regime_type, "asset", "event_type"]):
        rets = group["event_day_return"].dropna()
        abs_moves = group["abs_move"].dropna()
        vol_deltas = group["vol_delta"].dropna()

        splits.append(RegimeSplit(
            regime_type=regime_type,
            regime_label=str(regime_label),
            asset=asset,
            event_type=etype,
            count=len(group),
            mean_return=_safe(rets.mean()),
            median_return=_safe(rets.median()),
            mean_abs_move=_safe(abs_moves.mean()),
            mean_vol_delta=_safe(vol_deltas.mean()),
        ))

    return splits


def top_movers(
    metrics: list[EventWindowMetrics],
    n: int = 10,
    window_filter: list[int] | None = None,
) -> list[dict]:
    """Return the top N events by absolute move."""
    if not metrics:
        return []

    df = pd.DataFrame([m.model_dump() for m in metrics])

    if window_filter:
        df = df[df["window"].apply(lambda w: w == window_filter)]

    if df.empty:
        return []

    df = df.dropna(subset=["abs_move"])
    top = df.nlargest(n, "abs_move")
    return top[["event_id", "event_type", "event_name", "event_date", "asset",
                 "event_day_return", "abs_move", "z_score"]].to_dict("records")


def _safe(val, decimals: int = 6) -> float | None:
    if val is None:
        return None
    if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
        return None
    return round(float(val), decimals)

