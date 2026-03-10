"""Seed script: loads events and fetches price data for the demo asset universe."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.data_service import data_service
from app.config import settings


def main():
    print("=== Event Impact Model - Demo Data Seed ===\n")

    # Load events
    print("Loading events from data/events/...")
    result = data_service.load_events()
    print(f"  Loaded {result.valid_rows}/{result.total_rows} events")
    print(f"  Event types: {result.event_types}")
    if result.errors:
        print(f"  Warnings: {len(result.errors)} validation issues")

    # Fetch prices
    print(f"\nFetching price data for {len(settings.default_assets)} assets...")
    price_result = data_service.refresh_prices()
    print(f"  Refreshed: {price_result.assets_refreshed}")
    if price_result.assets_failed:
        print(f"  Failed: {price_result.assets_failed}")
    for asset, rows in price_result.rows_fetched.items():
        print(f"    {asset}: {rows} rows")

    print("\nDone! You can now start the backend and frontend servers.")
    print("  Backend:  cd backend && python -m uvicorn app.main:app --reload")
    print("  Frontend: cd frontend && npm run dev")


if __name__ == "__main__":
    main()

