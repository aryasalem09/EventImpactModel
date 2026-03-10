"""Tests for the FastAPI endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_get_config(client):
    resp = await client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "default_assets" in data
    assert isinstance(data["default_assets"], list)


@pytest.mark.asyncio
async def test_get_assets(client):
    resp = await client.get("/api/assets")
    assert resp.status_code == 200
    data = resp.json()
    assert "configured" in data


@pytest.mark.asyncio
async def test_get_event_types(client):
    resp = await client.get("/api/event-types")
    assert resp.status_code == 200
    assert "event_types" in resp.json()


@pytest.mark.asyncio
async def test_data_status(client):
    resp = await client.get("/api/data/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "assets_loaded" in data
    assert "events_loaded" in data


@pytest.mark.asyncio
async def test_load_events(client):
    resp = await client.post("/api/data/load-events")
    assert resp.status_code == 200
    data = resp.json()
    assert "valid_rows" in data
    assert data["valid_rows"] > 0

