"""Price data fetching via yfinance with local CSV caching."""

import logging
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import yfinance as yf

from app.config import PRICES_DIR, settings

logger = logging.getLogger(__name__)


def _cache_path(ticker: str) -> Path:
    return PRICES_DIR / f"{ticker.replace('^', '_').upper()}.csv"


def _is_cache_fresh(path: Path, max_age_days: int) -> bool:
    if not path.exists():
        return False
    import os
    mtime = datetime.fromtimestamp(os.path.getmtime(path))
    return (datetime.now() - mtime) < timedelta(days=max_age_days)


def fetch_prices(
    ticker: str,
    start: str | None = None,
    end: str | None = None,
    force_refresh: bool = False,
) -> pd.DataFrame:
    """Fetch OHLCV data for a ticker. Uses local CSV cache when available."""
    cache = _cache_path(ticker)

    if not force_refresh and _is_cache_fresh(cache, settings.price_cache_days):
        logger.info(f"Loading cached prices for {ticker}")
        df = pd.read_csv(cache, parse_dates=["Date"], index_col="Date")
        if df.index.tz is not None:
            df.index = df.index.tz_localize(None)
        return df

    if start is None:
        start_date = datetime.now() - timedelta(days=365 * settings.max_history_years)
        start = start_date.strftime("%Y-%m-%d")
    if end is None:
        end = datetime.now().strftime("%Y-%m-%d")

    logger.info(f"Fetching prices for {ticker} from {start} to {end}")
    try:
        t = yf.Ticker(ticker)
        df = t.history(start=start, end=end, auto_adjust=True)

        if df.empty:
            logger.warning(f"No data returned for {ticker}")
            return pd.DataFrame()

        # Strip timezone info for compatibility with event dates
        if df.index.tz is not None:
            df.index = df.index.tz_localize(None)
        df.index.name = "Date"
        # Keep standard columns
        keep_cols = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in df.columns]
        df = df[keep_cols]

        PRICES_DIR.mkdir(parents=True, exist_ok=True)
        df.to_csv(cache)
        logger.info(f"Cached {len(df)} rows for {ticker}")
        return df

    except Exception as e:
        logger.error(f"Failed to fetch {ticker}: {e}")
        if cache.exists():
            logger.info(f"Falling back to stale cache for {ticker}")
            return pd.read_csv(cache, parse_dates=["Date"], index_col="Date")
        return pd.DataFrame()


def fetch_multiple(
    tickers: list[str],
    force_refresh: bool = False,
) -> dict[str, pd.DataFrame]:
    """Fetch prices for multiple tickers."""
    results = {}
    for ticker in tickers:
        df = fetch_prices(ticker, force_refresh=force_refresh)
        if not df.empty:
            results[ticker] = df
    return results


def get_cached_tickers() -> list[str]:
    """Return list of tickers with cached price data."""
    if not PRICES_DIR.exists():
        return []
    return [
        f.stem.replace("_", "^")
        for f in PRICES_DIR.glob("*.csv")
    ]


def get_price_date_ranges() -> dict[str, list[str]]:
    """Return date ranges for cached price data."""
    ranges = {}
    if not PRICES_DIR.exists():
        return ranges
    for f in PRICES_DIR.glob("*.csv"):
        try:
            df = pd.read_csv(f, parse_dates=["Date"], usecols=["Date"])
            ticker = f.stem.replace("_", "^")
            ranges[ticker] = [
                str(df["Date"].min().date()),
                str(df["Date"].max().date()),
            ]
        except Exception:
            pass
    return ranges

