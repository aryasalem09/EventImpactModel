"""Pydantic schemas for event data."""

from datetime import datetime

from pydantic import BaseModel


class EventRecord(BaseModel):
    """A single scheduled event."""

    event_id: str
    event_type: str
    event_name: str
    timestamp: datetime
    timezone: str = "US/Eastern"
    country: str = "US"
    category: str = ""
    expected: float | None = None
    actual: float | None = None
    surprise: float | None = None
    surprise_pct: float | None = None
    importance: str = "medium"
    notes: str = ""
    source: str = ""


class EventLoadResult(BaseModel):
    total_rows: int
    valid_rows: int
    skipped_rows: int
    errors: list[str] = []
    event_types: list[str] = []


class EventFilter(BaseModel):
    event_types: list[str] | None = None
    assets: list[str] | None = None
    start_date: str | None = None
    end_date: str | None = None
    importance: list[str] | None = None
    surprise_direction: str | None = None  # "positive", "negative", "neutral"


class EventSummary(BaseModel):
    event_id: str
    event_type: str
    event_name: str
    timestamp: str
    actual: float | None = None
    expected: float | None = None
    surprise: float | None = None
    importance: str = "medium"
