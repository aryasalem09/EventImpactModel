"""Tests for data loading and validation."""


from app.config import EVENTS_DIR
from app.data_access.event_loader import (
    events_to_dataframe,
    load_events_from_csv,
    validate_event_row,
)


class TestEventLoader:
    def test_load_cpi_sample(self):
        path = EVENTS_DIR / "cpi_sample.csv"
        _, result = load_events_from_csv(path)
        assert result.total_rows == 20
        assert result.valid_rows == 20
        assert result.skipped_rows == 0
        assert "CPI" in result.event_types

    def test_load_fomc_sample(self):
        path = EVENTS_DIR / "fomc_sample.csv"
        _, result = load_events_from_csv(path)
        assert result.valid_rows > 0
        assert "FOMC" in result.event_types

    def test_load_bad_sample(self):
        path = EVENTS_DIR / "bad_sample.csv"
        records, result = load_events_from_csv(path)
        # Should have errors for bad rows
        assert result.skipped_rows > 0
        assert len(result.errors) > 0
        # BAD-001 and BAD-007 should be valid (BAD-007 has missing optionals)
        valid_ids = {r.event_id for r in records}
        assert "BAD-001" in valid_ids

    def test_load_nonexistent_file(self):
        _, result = load_events_from_csv("/nonexistent/path.csv")
        assert result.total_rows == 0
        assert len(result.errors) > 0

    def test_events_to_dataframe(self):
        path = EVENTS_DIR / "cpi_sample.csv"
        records, _ = load_events_from_csv(path)
        df = events_to_dataframe(records)
        assert len(df) == len(records)
        assert "date" in df.columns
        assert "event_type" in df.columns


class TestValidation:
    def test_valid_row(self):
        row = {
            "event_id": "TEST-1",
            "event_type": "CPI",
            "event_name": "Test",
            "timestamp": "2024-01-15 08:30:00",
        }
        record, err = validate_event_row(row, 1)
        assert record is not None
        assert err is None

    def test_missing_required_field(self):
        row = {
            "event_id": "",
            "event_type": "CPI",
            "event_name": "Test",
            "timestamp": "2024-01-15 08:30:00",
        }
        record, err = validate_event_row(row, 1)
        assert record is None
        assert err is not None
        assert "event_id" in err

    def test_bad_timestamp(self):
        row = {
            "event_id": "TEST-1",
            "event_type": "CPI",
            "event_name": "Test",
            "timestamp": "not-a-date",
        }
        record, err = validate_event_row(row, 1)
        assert record is None
        assert "timestamp" in err

    def test_bad_numeric_handled(self):
        row = {
            "event_id": "TEST-1",
            "event_type": "CPI",
            "event_name": "Test",
            "timestamp": "2024-01-15 08:30:00",
            "expected": "abc",
            "actual": "xyz",
        }
        record, err = validate_event_row(row, 1)
        # Should succeed with None for bad numerics
        assert record is not None
        assert record.expected is None
        assert record.actual is None

