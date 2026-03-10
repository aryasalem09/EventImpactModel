"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load seeded data on startup."""
    from app.services.data_service import data_service

    logging.info("Loading seeded event data...")
    result = data_service.load_events()
    logging.info(f"Loaded {result.valid_rows} events from {result.total_rows} rows")
    yield


app = FastAPI(
    title=settings.app_name,
    description="Cross-asset event impact analysis platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

