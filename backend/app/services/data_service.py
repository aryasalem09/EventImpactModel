"""Manages event and price data loading, caching, and state."""

import logging
from pathlib import Path

import pandas as pd

from app.config import EVENTS_DIR, settings
from app.data_access.event_loader import (
    events_to_dataframe,
    load_all_events,
    load_events_from_csv,
)
from app.data_access.price_loader import (
    fetch_multiple,
    get_price_date_ranges,
)
from app.schemas.events import EventLoadResult, EventRecord
from app.schemas.prices import PriceRefreshResult

logger = logging.getLogger(__name__)


class DataService:
    """In-memory data store for events and prices."""

    def __init__(self):
        self._events: list[EventRecord] = []
        self._events_df: pd.DataFrame = pd.DataFrame()
        self._prices: dict[str, pd.DataFrame] = {}
        self._load_results: list[EventLoadResult] = []

    @property
    def events(self) -> list[EventRecord]:
        return self._events

    @property
    def events_df(self) -> pd.DataFrame:
        return self._events_df

    @property
    def prices(self) -> dict[str, pd.DataFrame]:
        return self._prices

    def load_events(self, filepath: str | Path | None = None) -> EventLoadResult:
        """Load events from a specific CSV or all CSVs in the events directory."""
        if filepath:
            records, result = load_events_from_csv(filepath)
            # Merge with existing events, dedup by event_id
            existing_ids = {e.event_id for e in self._events}
            new = [r for r in records if r.event_id not in existing_ids]
            self._events.extend(new)
            self._events_df = events_to_dataframe(self._events)
            self._load_results.append(result)
            return result
        else:
            records, results = load_all_events()
            self._events = records
            self._events_df = events_to_dataframe(records)
            self._load_results = results
            if results:
                total = sum(r.total_rows for r in results)
                valid = sum(r.valid_rows for r in results)
                errors = []
                for r in results:
                    errors.extend(r.errors)
                event_types = list({et for r in results for et in r.event_types})
                return EventLoadResult(
                    total_rows=total,
                    valid_rows=valid,
                    skipped_rows=total - valid,
                    errors=errors,
                    event_types=event_types,
                )
            return EventLoadResult(total_rows=0, valid_rows=0, skipped_rows=0)

    def refresh_prices(
        self,
        assets: list[str] | None = None,
        force: bool = False,
    ) -> PriceRefreshResult:
        """Fetch/refresh price data for assets."""
        if assets is None:
            assets = settings.default_assets

        succeeded = []
        failed = []
        rows = {}
        errors = []

        data = fetch_multiple(assets, force_refresh=force)
        for asset in assets:
            if asset in data and not data[asset].empty:
                self._prices[asset] = data[asset]
                succeeded.append(asset)
                rows[asset] = len(data[asset])
            else:
                failed.append(asset)
                errors.append(f"No data for {asset}")

        return PriceRefreshResult(
            assets_refreshed=succeeded,
            assets_failed=failed,
            rows_fetched=rows,
            errors=errors,
        )

    def get_event_types(self) -> list[str]:
        if self._events_df.empty:
            return []
        return sorted(self._events_df["event_type"].unique().tolist())

    def get_loaded_assets(self) -> list[str]:
        return sorted(self._prices.keys())

    def get_event_files(self) -> list[str]:
        if not EVENTS_DIR.exists():
            return []
        return [f.name for f in sorted(EVENTS_DIR.glob("*.csv"))]

    def get_price_ranges(self) -> dict[str, list[str]]:
        return get_price_date_ranges()

    def get_date_range(self) -> list[str]:
        if self._events_df.empty:
            return []
        dates = self._events_df["timestamp"]
        return [str(dates.min().date()), str(dates.max().date())]


# Singleton
data_service = DataService()

