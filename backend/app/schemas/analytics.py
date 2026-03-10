"""Pydantic schemas for analytics responses."""

from pydantic import BaseModel


class EventWindowMetrics(BaseModel):
    """Metrics for a single event-asset-window combination."""

    event_id: str
    event_type: str
    event_name: str
    event_date: str
    asset: str
    window: list[int]

    # Returns
    event_day_return: float | None = None
    event_day_log_return: float | None = None
    cumulative_return: float | None = None
    benchmark_return: float | None = None
    abnormal_return: float | None = None

    # Volatility
    pre_event_vol: float | None = None
    post_event_vol: float | None = None
    vol_delta: float | None = None
    vol_ratio: float | None = None

    # Event metrics
    abs_move: float | None = None
    signed_move: float | None = None
    cumulative_move: float | None = None
    max_drawdown: float | None = None
    max_runup: float | None = None
    z_score: float | None = None
    percentile_rank: float | None = None
    persistence_1d: float | None = None
    persistence_3d: float | None = None
    persistence_5d: float | None = None
    reversal_score: float | None = None

    # Regime
    vol_regime: str | None = None
    trend_regime: str | None = None
    surprise_regime: str | None = None


class AssetEventSummary(BaseModel):
    """Summary stats for an asset across events of a given type."""

    asset: str
    event_type: str
    window: list[int]
    count: int = 0
    mean_return: float | None = None
    median_return: float | None = None
    std_return: float | None = None
    mean_abs_move: float | None = None
    positive_freq: float | None = None
    negative_freq: float | None = None
    hit_rate: float | None = None
    mean_vol_delta: float | None = None
    median_drawdown: float | None = None
    mean_z_score: float | None = None


class HeatmapCell(BaseModel):
    asset: str
    event_type: str
    value: float | None = None


class RegimeSplit(BaseModel):
    regime_type: str
    regime_label: str
    asset: str
    event_type: str
    count: int = 0
    mean_return: float | None = None
    median_return: float | None = None
    mean_abs_move: float | None = None
    mean_vol_delta: float | None = None


class AnalyticsSummaryResponse(BaseModel):
    total_events: int
    total_assets: int
    event_types: list[str]
    date_range: list[str]
    top_movers: list[dict]
    recent_events: list[dict]
    heatmap_returns: list[HeatmapCell]
    heatmap_vol: list[HeatmapCell]


class EventStudyResponse(BaseModel):
    metrics: list[EventWindowMetrics]
    summaries: list[AssetEventSummary]


class AssetComparisonResponse(BaseModel):
    summaries: list[AssetEventSummary]
    heatmap_returns: list[HeatmapCell]
    heatmap_vol: list[HeatmapCell]


class RegimeResponse(BaseModel):
    splits: list[RegimeSplit]


class EventDetailResponse(BaseModel):
    event: dict
    metrics: list[EventWindowMetrics]
    price_series: dict


class ExportResponse(BaseModel):
    data: list[dict]
    columns: list[str]
    row_count: int


class DataStatusResponse(BaseModel):
    assets_loaded: list[str]
    price_date_ranges: dict[str, list[str]]
    events_loaded: int
    event_types: list[str]
    event_files: list[str]
    cache_status: str
