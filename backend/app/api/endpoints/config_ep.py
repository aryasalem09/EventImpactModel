"""Configuration and metadata endpoints."""

from fastapi import APIRouter

from app.config import settings
from app.services.data_service import data_service

router = APIRouter(prefix="/api", tags=["config"])


@router.get("/config")
def get_config():
    return {
        "app_name": settings.app_name,
        "default_assets": settings.default_assets,
        "default_estimation_window": settings.default_estimation_window,
        "default_event_windows": settings.default_event_windows,
        "default_benchmark": settings.default_benchmark,
        "rolling_vol_window": settings.rolling_vol_window,
        "annualization_factor": settings.annualization_factor,
    }


@router.get("/assets")
def get_assets():
    loaded = data_service.get_loaded_assets()
    return {
        "configured": settings.default_assets,
        "loaded": loaded,
    }


@router.get("/event-types")
def get_event_types():
    return {"event_types": data_service.get_event_types()}

