"""CSV-based event data loading and validation."""

import logging
from pathlib import Path

import pandas as pd

from app.config import EVENTS_DIR
from app.schemas.events import EventLoadResult, EventRecord

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {"event_id", "event_type", "event_name", "timestamp"}
OPTIONAL_COLUMNS = {
    "timezone", "country", "category", "expected", "actual",
    "surprise", "surprise_pct", "importance", "notes", "source",
}
ALL_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS


def validate_event_row(row: dict, row_idx: int) -> tuple[EventRecord | None, str | None]:
    """Validate a single event row. Returns (record, error_message)."""
    for col in REQUIRED_COLUMNS:
        val = row.get(col)
        if val is None or (isinstance(val, str) and val.strip() == ""):
            return None, f"Row {row_idx}: missing required field '{col}'"
        if isinstance(val, float) and pd.isna(val):
            return None, f"Row {row_idx}: missing required field '{col}'"

    try:
        ts = pd.Timestamp(row["timestamp"])
        if pd.isna(ts):
            return None, f"Row {row_idx}: invalid timestamp '{row['timestamp']}'"
    except Exception:
        return None, f"Row {row_idx}: invalid timestamp '{row.get('timestamp')}'"

    clean = {}
    for col in ALL_COLUMNS:
        val = row.get(col)
        if val is None or (isinstance(val, float) and pd.isna(val)):
            if col in ("expected", "actual", "surprise", "surprise_pct"):
                clean[col] = None
            elif col == "importance":
                clean[col] = "medium"
            elif col == "timezone":
                clean[col] = "US/Eastern"
            elif col == "country":
                clean[col] = "US"
            else:
                clean[col] = ""
        else:
            clean[col] = val

    clean["timestamp"] = ts.to_pydatetime()

    for fld in ("expected", "actual", "surprise", "surprise_pct"):
        v = clean.get(fld)
        if v is not None and v != "":
            try:
                clean[fld] = float(v)
            except (ValueError, TypeError):
                clean[fld] = None

    try:
        record = EventRecord(**clean)
        return record, None
    except Exception as e:
        return None, f"Row {row_idx}: validation error: {e}"


def load_events_from_csv(filepath: str | Path) -> tuple[list[EventRecord], EventLoadResult]:
    """Load and validate events from a CSV file."""
    filepath = Path(filepath)
    if not filepath.exists():
        return [], EventLoadResult(
            total_rows=0, valid_rows=0, skipped_rows=0,
            errors=[f"File not found: {filepath}"],
        )

    try:
        df = pd.read_csv(filepath, dtype=str)
    except Exception as e:
        return [], EventLoadResult(
            total_rows=0, valid_rows=0, skipped_rows=0,
            errors=[f"Failed to read CSV: {e}"],
        )

    df.columns = df.columns.str.strip().str.lower()

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        return [], EventLoadResult(
            total_rows=len(df), valid_rows=0, skipped_rows=len(df),
            errors=[f"Missing required columns: {missing}"],
        )

    records = []
    errors = []
    for idx, row in df.iterrows():
        record, err = validate_event_row(row.to_dict(), idx + 1)
        if record:
            records.append(record)
        if err:
            errors.append(err)

    event_types = list({r.event_type for r in records})

    return records, EventLoadResult(
        total_rows=len(df),
        valid_rows=len(records),
        skipped_rows=len(df) - len(records),
        errors=errors,
        event_types=event_types,
    )


def load_all_events() -> tuple[list[EventRecord], list[EventLoadResult]]:
    """Load all CSV files from the events directory."""
    all_records = []
    all_results = []

    if not EVENTS_DIR.exists():
        return [], []

    for csv_file in sorted(EVENTS_DIR.glob("*.csv")):
        records, result = load_events_from_csv(csv_file)
        all_records.extend(records)
        all_results.append(result)
        logger.info(f"Loaded {result.valid_rows}/{result.total_rows} events from {csv_file.name}")

    return all_records, all_results


def events_to_dataframe(events: list[EventRecord]) -> pd.DataFrame:
    """Convert list of EventRecord to a pandas DataFrame."""
    if not events:
        return pd.DataFrame()

    data = [e.model_dump() for e in events]
    df = pd.DataFrame(data)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["date"] = df["timestamp"].dt.date
    return df

