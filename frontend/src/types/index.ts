export interface EventWindowMetrics {
  event_id: string;
  event_type: string;
  event_name: string;
  event_date: string;
  asset: string;
  window: number[];
  event_day_return: number | null;
  event_day_log_return: number | null;
  cumulative_return: number | null;
  benchmark_return: number | null;
  abnormal_return: number | null;
  pre_event_vol: number | null;
  post_event_vol: number | null;
  vol_delta: number | null;
  vol_ratio: number | null;
  abs_move: number | null;
  signed_move: number | null;
  cumulative_move: number | null;
  max_drawdown: number | null;
  max_runup: number | null;
  z_score: number | null;
  percentile_rank: number | null;
  persistence_1d: number | null;
  persistence_3d: number | null;
  persistence_5d: number | null;
  reversal_score: number | null;
  vol_regime: string | null;
  trend_regime: string | null;
  surprise_regime: string | null;
}

export interface AssetEventSummary {
  asset: string;
  event_type: string;
  window: number[];
  count: number;
  mean_return: number | null;
  median_return: number | null;
  std_return: number | null;
  mean_abs_move: number | null;
  positive_freq: number | null;
  negative_freq: number | null;
  hit_rate: number | null;
  mean_vol_delta: number | null;
  median_drawdown: number | null;
  mean_z_score: number | null;
}

export interface HeatmapCell {
  asset: string;
  event_type: string;
  value: number | null;
}

export interface RegimeSplit {
  regime_type: string;
  regime_label: string;
  asset: string;
  event_type: string;
  count: number;
  mean_return: number | null;
  median_return: number | null;
  mean_abs_move: number | null;
  mean_vol_delta: number | null;
}

export interface SummaryResponse {
  total_events: number;
  total_assets: number;
  event_types: string[];
  date_range: string[];
  top_movers: TopMover[];
  recent_events: RecentEvent[];
  heatmap_returns: HeatmapCell[];
  heatmap_vol: HeatmapCell[];
}

export interface TopMover {
  event_id: string;
  event_type: string;
  event_name: string;
  event_date: string;
  asset: string;
  event_day_return: number | null;
  abs_move: number | null;
  z_score: number | null;
}

export interface RecentEvent {
  event_id: string;
  event_type: string;
  event_name: string;
  timestamp: string;
}

export interface EventStudyResponse {
  metrics: EventWindowMetrics[];
  summaries: AssetEventSummary[];
}

export interface AssetComparisonResponse {
  summaries: AssetEventSummary[];
  heatmap_returns: HeatmapCell[];
  heatmap_vol: HeatmapCell[];
}

export interface RegimeResponse {
  splits: RegimeSplit[];
}

export interface EventDetailResponse {
  event: Record<string, unknown>;
  metrics: EventWindowMetrics[];
  price_series: Record<string, { dates: string[]; values: number[] }>;
}

export interface DataStatus {
  assets_loaded: string[];
  price_date_ranges: Record<string, string[]>;
  events_loaded: number;
  event_types: string[];
  event_files: string[];
  cache_status: string;
}

export interface PriceRefreshResult {
  assets_refreshed: string[];
  assets_failed: string[];
  rows_fetched: Record<string, number>;
  errors: string[];
}

export interface EventLoadResult {
  total_rows: number;
  valid_rows: number;
  skipped_rows: number;
  errors: string[];
  event_types: string[];
}

export interface AppConfig {
  app_name: string;
  default_assets: string[];
  default_estimation_window: number;
  default_event_windows: number[][];
  default_benchmark: string;
  rolling_vol_window: number;
  annualization_factor: number;
}
