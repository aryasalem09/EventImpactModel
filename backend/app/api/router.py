"""Main API router aggregating all endpoint routers."""

from fastapi import APIRouter

from app.api.endpoints.analytics import router as analytics_router
from app.api.endpoints.config_ep import router as config_router
from app.api.endpoints.data import router as data_router
from app.api.endpoints.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(config_router)
api_router.include_router(data_router)
api_router.include_router(analytics_router)

