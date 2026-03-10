"""Analytics endpoints."""

from fastapi import APIRouter, Query

from app.services.analytics_service import (
    get_asset_comparison,
    get_event_detail,
    get_event_study,
    get_export,
    get_regime_analysis,
    get_summary,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _parse_window(window: str | None) -> list[int] | None:
    """Parse window string like '-1,1' into [int, int]."""
    if not window:
        return None
    try:
        parts = [int(x.strip()) for x in window.split(",")]
        if len(parts) == 2:
            return parts
    except ValueError:
        pass
    return None


@router.get("/summary")
def analytics_summary(
    assets: list[str] = Query(default=None),
    event_types: list[str] = Query(default=None),
):
    return get_summary(assets=assets, event_types=event_types)


@router.get("/event-study")
def event_study(
    assets: list[str] = Query(default=None),
    event_types: list[str] = Query(default=None),
    window: str = Query(default=None),
    estimation_window: int = Query(default=None),
):
    windows = None
    w = _parse_window(window)
    if w:
        windows = [w]
    return get_event_study(
        assets=assets, event_types=event_types,
        windows=windows, estimation_window=estimation_window,
    )


@router.get("/asset-comparison")
def asset_comparison(
    assets: list[str] = Query(default=None),
    event_types: list[str] = Query(default=None),
    window: str = Query(default="-1,1"),
):
    w = _parse_window(window) or [-1, 1]
    return get_asset_comparison(assets=assets, event_types=event_types, window=w)


@router.get("/regimes")
def regimes(
    regime_type: str = Query(default="vol_regime"),
    assets: list[str] = Query(default=None),
    event_types: list[str] = Query(default=None),
    window: str = Query(default="-1,1"),
):
    w = _parse_window(window) or [-1, 1]
    return get_regime_analysis(
        regime_type=regime_type, assets=assets,
        event_types=event_types, window=w,
    )


@router.get("/event/{event_id}")
def event_detail(
    event_id: str,
    assets: list[str] = Query(default=None),
):
    return get_event_detail(event_id=event_id, assets=assets)


@router.get("/export")
def export_data(
    assets: list[str] = Query(default=None),
    event_types: list[str] = Query(default=None),
    window: str = Query(default="-1,1"),
):
    w = _parse_window(window) or [-1, 1]
    return get_export(assets=assets, event_types=event_types, window=w)

