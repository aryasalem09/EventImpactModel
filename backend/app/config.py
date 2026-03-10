"""Application configuration driven by environment variables and defaults."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
EVENTS_DIR = DATA_DIR / "events"
PRICES_DIR = DATA_DIR / "prices"
CACHE_DIR = DATA_DIR / "cache"


class Settings(BaseSettings):
    app_name: str = "Event Impact Model"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Default asset universe
    default_assets: list[str] = Field(
        default=[
            "SPY", "QQQ", "IWM", "TLT", "GLD",
            "USO", "UUP", "FXE", "EEM",
        ]
    )

    # Analytics defaults
    default_estimation_window: int = 120
    default_event_windows: list[list[int]] = Field(
        default=[[-1, 1], [-3, 3], [-5, 5], [0, 1], [0, 3], [0, 5]]
    )
    default_benchmark: str = "SPY"

    # Volatility params
    rolling_vol_window: int = 21
    annualization_factor: float = 252.0

    # Regime thresholds
    vol_regime_percentile_high: float = 75.0
    vol_regime_percentile_low: float = 25.0
    trend_ma_short: int = 50
    trend_ma_long: int = 200

    # Data
    price_cache_days: int = 7
    max_history_years: int = 10

    model_config = {"env_prefix": "EIM_", "env_file": str(PROJECT_ROOT / ".env")}


settings = Settings()
