# Architecture

## Overview

The project is split into a React frontend and a FastAPI backend:

```text
Frontend
  Pages -> Query hooks -> API client -> Plotly charts

Backend
  API routes -> Service layer -> Analytics engine -> Data access
```

The frontend focuses on navigation, filtering, and presentation. The backend owns event loading, price loading, analytics computation, and API serialization.

## Backend structure

### `app/data_access`

- `event_loader.py`: parses CSV event files, validates rows, and converts records into typed data
- `price_loader.py`: fetches daily price history from Yahoo Finance and manages local CSV caching

### `app/analytics`

- `returns.py`: simple returns, log returns, cumulative returns, and abnormal-return helpers
- `volatility.py`: realized volatility, window volatility, delta, and ratio calculations
- `event_study.py`: per-event and per-asset metric generation across configurable windows
- `regimes.py`: volatility, trend, and surprise regime labeling
- `summary.py`: overview aggregates, heatmap values, and regime-ready summaries

### `app/services`

- `data_service.py`: singleton-style in-memory state for events and prices
- `analytics_service.py`: orchestration and cache-friendly access to summary and detail analytics

### `app/api`

- REST endpoints expose configuration, data operations, and analytics payloads
- Query parameters support filtering by assets, event types, windows, and regime dimension

## Frontend structure

### `src/pages`

Each dashboard view owns the composition of filters, cards, and tables for one use case.

### `src/hooks`

Thin TanStack Query wrappers around the API client.

### `src/components`

- `layout/`: navigation shell and workspace framing
- `ui/`: cards, filters, page headers, and empty or loading states
- `charts/`: Plotly wrappers and domain-specific chart components

### `src/lib`

API calls, format helpers, class utilities, and event-color mapping.

## Design decisions

1. CSV-first events
   Event inputs are supplied as files instead of scraped live, which keeps the analysis reproducible and easy to inspect.

2. No database
   The app is designed as a local analytical workspace. In-memory dataframes plus CSV caches are enough for the current use case.

3. Compute on request
   Analytics are generated when requested through the API, which keeps the system simple and avoids managing stale precomputed outputs.

4. Daily data only
   The methodology is intentionally transparent about using daily bars, which keeps the app light but limits intraday interpretation.

5. Regime labels use historical context only
   Regime calculations avoid look-ahead bias by relying only on data available up to each event date.
