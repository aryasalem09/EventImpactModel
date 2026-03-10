"""Data management endpoints: load events, refresh prices, check status."""


from fastapi import APIRouter, File, Query, UploadFile

from app.config import EVENTS_DIR
from app.schemas.analytics import DataStatusResponse
from app.services.data_service import data_service

router = APIRouter(prefix="/api/data", tags=["data"])


@router.post("/refresh-prices")
def refresh_prices(
    assets: list[str] = Query(default=None),
    force: bool = Query(default=False),
):
    result = data_service.refresh_prices(assets=assets, force=force)
    return result


@router.post("/load-events")
def load_events(filepath: str = Query(default=None)):
    """Load events from a CSV file path or reload all from the events directory."""
    result = data_service.load_events(filepath=filepath)
    return result


@router.post("/upload-events")
async def upload_events(file: UploadFile = File(...)):
    """Upload a CSV event file."""
    if not file.filename or not file.filename.endswith(".csv"):
        return {"error": "File must be a .csv file"}

    dest = EVENTS_DIR / file.filename
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    dest.write_bytes(content)

    result = data_service.load_events(filepath=str(dest))
    return result


@router.get("/status")
def data_status():
    return DataStatusResponse(
        assets_loaded=data_service.get_loaded_assets(),
        price_date_ranges=data_service.get_price_ranges(),
        events_loaded=len(data_service.events),
        event_types=data_service.get_event_types(),
        event_files=data_service.get_event_files(),
        cache_status="ok",
    )

