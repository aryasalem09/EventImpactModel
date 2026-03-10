"""Pydantic schemas for price data."""

from pydantic import BaseModel


class PriceRecord(BaseModel):
    date: str
    asset: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class PriceRefreshResult(BaseModel):
    assets_refreshed: list[str]
    assets_failed: list[str]
    rows_fetched: dict[str, int]
    errors: list[str]
