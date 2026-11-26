from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import json

import pandas as pd
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from api import main

PRODUCT = "11111111-1111-4111-8111-111111111111"
USER = "22222222-2222-4222-8222-222222222222"
now = datetime.now(ZoneInfo("America/Lima"))
WEEK = (now.date() - timedelta(days=now.weekday())).isoformat()
client = TestClient(main.app)


def test_pipeline_matches_frozen_holdout():
    data = pd.read_csv(main.RESULTS / "prueba_simulada_2028.csv")
    for _, row in data.iloc[:32].iterrows():
        baseline, estimate, status = main.infer(row.producto, [{"features": [row[c] for c in main.FIELDS]}])
        assert estimate == pytest.approx(row.prediccion, abs=1e-6)
        assert baseline == row.al_corte
        assert status == "candidate"


@pytest.mark.parametrize("features", [[-1, 0, 0, 0], [9, 0, 0, 0], [0, float("nan"), 0, 0],
                                      [True, 0, 0, 0], [0, 0, 0], [0, 0, 0, 1.5]])
def test_out_of_domain(features):
    with pytest.raises(HTTPException) as error:
        main.infer(main.CODES[0], [{"features": features}])
    assert error.value.status_code == 422


def test_no_history():
    with pytest.raises(HTTPException):
        main.infer(main.CODES[0], [])


def test_authentication_required():
    assert client.post("/v1/forecast", json={"product_id": PRODUCT, "week": WEEK}).status_code == 401


@pytest.fixture
def fake_gateway(monkeypatch):
    calls = []
    async def gateway(method, path, token, payload=None, **kwargs):
        calls.append((path, payload, kwargs))
        if path == "/auth/v1/user":
            return {"id": USER}
        if path.endswith("purchase_api"):
            return {"identity": {"role": "buyer", "origin": "simulated"},
                    "products": [{"id": PRODUCT, "name": "Azúcar rubia", "brand": "Cartavio", "kg": 50}]}
        if path.endswith("purchase_forecast_inputs"):
            return [{"week": WEEK, "productId": PRODUCT, "features": [5, 2, 1, 0]}]
        if path.endswith("record_proy_forecast"):
            return payload["p_result"]["request_id"]
        raise AssertionError(path)
    monkeypatch.setattr(main, "gateway", gateway)
    return calls


def post(payload=None):
    return client.post("/v1/forecast", headers={"Authorization": "Bearer local-fixture"},
                       json=payload or {"product_id": PRODUCT, "week": WEEK})


def test_success_persists_without_features(fake_gateway):
    result = post()
    assert result.status_code == 200, result.text
    value = result.json()
    assert value["persisted"] is True and value["uncertainty"] is None
    assert value["operational_quantity"] == value["baseline"] == 0
    assert value["status"] == "candidate"
    path, payload, kwargs = fake_gateway[-1]
    assert path.endswith("record_proy_forecast") and kwargs["service"]
    assert payload["p_user"] == USER
    assert payload["p_result"]["input_snapshot"]["features"] == [[5, 2, 1, 0]]
    assert payload["p_result"]["model_sha256"] == main.ARTIFACT_SHA256
    assert "features" not in value


def test_invalid_body_and_cross_account_product(fake_gateway):
    assert post({"product_id": "bad", "week": WEEK}).status_code == 422
    assert post({"product_id": PRODUCT, "week": WEEK, "features": [0]*4}).status_code == 422
    assert post({"product_id": USER, "week": WEEK}).status_code == 403
    assert not any(p.endswith("record_proy_forecast") for p, _, _ in fake_gateway)


def test_model_failure_degrades_to_baseline(fake_gateway, monkeypatch):
    def broken():
        raise OSError("missing artifact")
    monkeypatch.setattr(main, "load_pipeline", broken)
    response = post()
    assert response.status_code == 200
    assert response.json()["status"] == "fallback"
    assert response.json()["estimate"] is None
    assert response.json()["operational_quantity"] == 0


def test_failed_persistence_never_returns_success(fake_gateway, monkeypatch):
    original = main.gateway
    async def fail(method, path, token, payload=None, **kwargs):
        if path.endswith("record_proy_forecast"):
            raise HTTPException(503, "No se pudo registrar")
        return await original(method, path, token, payload, **kwargs)
    monkeypatch.setattr(main, "gateway", fail)
    assert post().status_code == 503


def test_revoked_or_expired_session(monkeypatch):
    async def denied(*args, **kwargs):
        raise HTTPException(403, "Sesión inválida")
    monkeypatch.setattr(main, "gateway", denied)
    assert post().status_code == 403
