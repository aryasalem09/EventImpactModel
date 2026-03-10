"""Orchestrates analytics computations using the event study engine."""

import logging

from app.analytics.event_study import run_event_study
from app.analytics.summary import (
    compute_asset_event_summaries,
    compute_heatmap,
    compute_regime_splits,
    top_movers,
)
from app.config import settings
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    AssetComparisonResponse,
    EventDetailResponse,
    EventStudyResponse,
    EventWindowMetrics,
    ExportResponse,
    RegimeResponse,
)
from app.services.data_service import data_service

logger = logging.getLogger(__name__)

# Cache for the last computed study results
_cached_metrics: list[EventWindowMetrics] = []


def _ensure_data():
    """Load data if not already loaded."""
    if data_service.events_df.empty:
        data_service.load_events()
    if not data_service.prices:
        data_service.refresh_prices()


def run_study(
    assets: list[str] | None = None,
    event_types: list[str] | None = None,
    windows: list[list[int]] | None = None,
    estimation_window: int | None = None,
    benchmark: str | None = None,
) -> list[EventWindowMetrics]:
    """Run the event study and cache results."""
    global _cached_metrics
    _ensure_data()

    if assets is None:
        assets = data_service.get_loaded_assets() or settings.default_assets

    metrics = run_event_study(
        events_df=data_service.events_df,
        price_data=data_service.prices,
        assets=assets,
        windows=windows,
        estimation_window=estimation_window,
        benchmark=benchmark,
        event_types=event_types,
    )

    _cached_metrics = metrics
    return metrics


def get_summary(
    assets: list[str] | None = None,
    event_types: list[str] | None = None,
) -> AnalyticsSummaryResponse:
    """Compute summary dashboard data."""
    metrics = run_study(assets=assets, event_types=event_types, windows=[[-1, 1]])

    heatmap_ret = compute_heatmap(metrics, "event_day_return", [-1, 1])
    heatmap_vol = compute_heatmap(metrics, "vol_delta", [-1, 1])
    movers = top_movers(metrics, n=10, window_filter=[-1, 1])

    recent = []
    if not data_service.events_df.empty:
        df = data_service.events_df.sort_values("timestamp", ascending=False).head(10)
        recent = df[["event_id", "event_type", "event_name", "timestamp"]].to_dict("records")
        for r in recent:
            r["timestamp"] = str(r["timestamp"])

    return AnalyticsSummaryResponse(
        total_events=len(data_service.events),
        total_assets=len(data_service.get_loaded_assets()),
        event_types=data_service.get_event_types(),
        date_range=data_service.get_date_range(),
        top_movers=movers,
        recent_events=recent,
        heatmap_returns=heatmap_ret,
        heatmap_vol=heatmap_vol,
    )


def get_event_study(
    assets: list[str] | None = None,
    event_types: list[str] | None = None,
    windows: list[list[int]] | None = None,
    estimation_window: int | None = None,
) -> EventStudyResponse:
    """Run event study and return metrics + summaries."""
    metrics = run_study(
        assets=assets, event_types=event_types,
        windows=windows, estimation_window=estimation_window,
    )
    summaries = compute_asset_event_summaries(metrics)
    return EventStudyResponse(metrics=metrics, summaries=summaries)


def get_asset_comparison(
    assets: list[str] | None = None,
    event_types: list[str] | None = None,
    window: list[int] | None = None,
) -> AssetComparisonResponse:
    """Compare assets across events."""
    w = window or [-1, 1]
    metrics = run_study(assets=assets, event_types=event_types, windows=[w])
    summaries = compute_asset_event_summaries(metrics)
    heatmap_ret = compute_heatmap(metrics, "event_day_return", w)
    heatmap_vol = compute_heatmap(metrics, "vol_delta", w)
    return AssetComparisonResponse(
        summaries=summaries,
        heatmap_returns=heatmap_ret,
        heatmap_vol=heatmap_vol,
    )


def get_regime_analysis(
    regime_type: str = "vol_regime",
    assets: list[str] | None = None,
    event_types: list[str] | None = None,
    window: list[int] | None = None,
) -> RegimeResponse:
    """Get regime-split analysis."""
    w = window or [-1, 1]
    metrics = run_study(assets=assets, event_types=event_types, windows=[w])
    splits = compute_regime_splits(metrics, regime_type=regime_type, window_filter=w)
    return RegimeResponse(splits=splits)


def get_event_detail(
    event_id: str,
    assets: list[str] | None = None,
) -> EventDetailResponse:
    """Get detailed metrics for a specific event."""
    _ensure_data()

    events_df = data_service.events_df
    event_row = events_df[events_df["event_id"] == event_id]
    if event_row.empty:
        return EventDetailResponse(event={}, metrics=[], price_series={})

    event_dict = event_row.iloc[0].to_dict()
    for k, v in event_dict.items():
        if hasattr(v, "isoformat"):
            event_dict[k] = str(v)

    if assets is None:
        assets = data_service.get_loaded_assets() or settings.default_assets

    metrics = run_event_study(
        events_df=event_row,
        price_data=data_service.prices,
        assets=assets,
        windows=settings.default_event_windows,
        benchmark=settings.default_benchmark,
    )

    # Build price series around event for charting
    import pandas as pd
    event_date = pd.Timestamp(event_row.iloc[0]["date"])
    price_series = {}
    for asset in assets:
        if asset in data_service.prices:
            close = data_service.prices[asset]["Close"]
            loc = close.index.get_indexer([event_date], method="ffill")[0]
            if loc >= 10 and loc + 10 < len(close):
                window_data = close.iloc[loc - 10:loc + 11]
                base = close.iloc[loc]
                normalized = ((window_data / base) - 1) * 100
                price_series[asset] = {
                    "dates": [str(d.date()) for d in normalized.index],
                    "values": [round(float(v), 4) for v in normalized.values],
                }

    return EventDetailResponse(
        event=event_dict,
        metrics=metrics,
        price_series=price_series,
    )


def get_export(
    assets: list[str] | None = None,
    event_types: list[str] | None = None,
    window: list[int] | None = None,
) -> ExportResponse:
    """Export all computed metrics as flat records."""
    w = window or [-1, 1]
    metrics = run_study(assets=assets, event_types=event_types, windows=[w])
    data = [m.model_dump() for m in metrics]
    columns = list(EventWindowMetrics.model_fields.keys()) if data else []
    return ExportResponse(data=data, columns=columns, row_count=len(data))

