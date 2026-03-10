# Event Impact Model

Event Impact Model is a cross-asset analytics workspace for studying how markets react around scheduled macro and market events such as CPI, FOMC, NFP, and earnings releases.

## What it does

- Measures event-window returns, drawdowns, volatility shifts, z-scores, and persistence
- Compares reactions across assets, event families, and market regimes
- Loads event definitions from CSV files with validation and reproducible inputs
- Refreshes daily market history from Yahoo Finance for a configurable asset universe
- Presents the results in an interactive React dashboard with tables and Plotly charts

## Stack

- Backend: Python, FastAPI, pandas, numpy, scipy, statsmodels, yfinance
- Frontend: React, TypeScript, Vite, Tailwind CSS, Plotly, TanStack Query
- Testing: pytest, Vitest

## Repository layout

```text
EventImpactModel/
  backend/
    app/
      analytics/          Core event-study calculations
      api/                FastAPI routes and endpoint handlers
      data_access/        CSV loading and price-history fetching
      schemas/            Pydantic response and request models
      services/           Orchestration layer and in-memory state
      config.py           Runtime settings
      main.py             FastAPI application entrypoint
    tests/                Backend test suite
    pyproject.toml        Backend dependencies and tooling
  frontend/
    src/
      components/         Shared layout, UI primitives, and charts
      hooks/              TanStack Query hooks
      lib/                API client and utility helpers
      pages/              Dashboard screens
      types/              Shared TypeScript interfaces
    tests/                Frontend test suite
  data/
    events/               Seed event CSV files
    prices/               Cached price history
  docs/
    architecture.md       System overview
  scripts/
    seed_demo_data.py     Seed helper for demo data
```

## Quick start

### 1. Install dependencies

```bash
# Backend
cd backend
pip install -e ".[dev]"

# Frontend
cd ../frontend
npm install
```

### 2. Seed demo data

From the repository root:

```bash
python scripts/seed_demo_data.py
```

This loads the bundled event CSV files and refreshes prices for the default asset universe:
`SPY`, `QQQ`, `IWM`, `TLT`, `GLD`, `USO`, `UUP`, `FXE`, and `EEM`.

### 3. Run the application

Start the backend and frontend in separate terminals:

```bash
# Terminal 1
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Dashboard sections

1. Overview: market-wide summary, heatmaps, top movers, and recent events
2. Event Explorer: event-by-event inspection with normalized return paths
3. Asset Comparison: cross-asset distributions, volatility response, and drawdown tables
4. Regime Analysis: splits by volatility regime, trend regime, or surprise direction
5. Data Manager: event loading, price refresh, cache visibility, and runtime defaults
6. Methodology: formulas, caveats, and CSV schema reference

## Running tests

```bash
# Backend
cd backend
python -m pytest tests -v

# Frontend
cd frontend
npm test
```

## Configuration

Settings are driven by environment variables prefixed with `EIM_` or by a `.env` file at the repository root. See `.env.example`.

Useful settings:

- `EIM_DEFAULT_ASSETS`
- `EIM_DEFAULT_ESTIMATION_WINDOW`
- `EIM_DEFAULT_BENCHMARK`
- `EIM_ROLLING_VOL_WINDOW`

## API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/api/config` | Frontend configuration payload |
| GET | `/api/assets` | Configured and loaded assets |
| GET | `/api/event-types` | Available event families |
| POST | `/api/data/load-events` | Load event CSV files |
| POST | `/api/data/refresh-prices` | Refresh price history |
| GET | `/api/data/status` | Data status and cache visibility |
| GET | `/api/analytics/summary` | Overview summary payload |
| GET | `/api/analytics/event-study` | Event-window metrics |
| GET | `/api/analytics/asset-comparison` | Cross-asset aggregates |
| GET | `/api/analytics/regimes` | Regime-split aggregates |
| GET | `/api/analytics/event/{id}` | Single-event detail payload |
| GET | `/api/analytics/export` | Exportable analytics rows |

## Event CSV schema

| Field | Required | Description |
| --- | --- | --- |
| `event_id` | Yes | Unique identifier |
| `event_type` | Yes | CPI, FOMC, NFP, EARNINGS, and so on |
| `event_name` | Yes | Human-readable event label |
| `timestamp` | Yes | ISO datetime |
| `expected` | No | Consensus expectation |
| `actual` | No | Reported value |
| `surprise` | No | Actual minus expected |
| `importance` | No | `high`, `medium`, or `low` |

Sample files live in `data/events/`.
