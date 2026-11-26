"""Authenticated PROY inference. Browser supplies identifiers, never features or roles."""
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Literal
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo
import hashlib
import json
import math
import os
import unicodedata

import httpx
import joblib
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, field_validator

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "ml/proy/catalogo_revisado"
VERSION = "sumabasto-proy-catalogo-24-meses-v1"
ARTIFACT_SHA256 = "a5c928291a3d13f9f29b1f9263031dbf31d35ddd6243fdc5f59b8f0d69a8e021"
LEGACY_SHA256 = "abc4f18d092a45ea17a8ccc2085ffa3e1bfb2480cccbbb60afb7864a4c19263f"
FIELDS = ["ultima", "media_3", "media_8", "al_corte"]
PRESENTATIONS = {
    ("cartavio", "azucar rubia", 50): "CARTAVIO-50KG",
    ("costeno", "arroz extra", 50): "COSTENO-EXTRA-50KG",
    ("don vittorio", "espagueti", 0.5): "DON-VITTORIO-FIDEOS-500G",
    ("costeno", "lentejas", 0.5): "COSTENO-LENTEJAS-500G",
}
app = FastAPI(title="Sumabasto forecasts", version="1.0.0", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv(
    "ALLOWED_ORIGINS", "http://127.0.0.1:5173").split(","),
    allow_methods=["POST", "GET"], allow_headers=["Authorization", "Content-Type"])
bearer = HTTPBearer(auto_error=False)


@app.exception_handler(RequestValidationError)
async def validation_error(_request, _error):
    # Do not echo credentials, arbitrary payloads or input values in error responses.
    return JSONResponse(status_code=422, content={"detail": "Solicitud inválida."})


@app.middleware("http")
async def response_headers(request, call_next):
    try:
        length = int(request.headers.get("content-length", "0"))
    except ValueError:
        return JSONResponse(status_code=400, content={"detail": "Cabecera inválida."})
    if length > 4096:
        return JSONResponse(status_code=413, content={"detail": "Solicitud demasiado grande."})
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


class ForecastRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: UUID
    week: date

    @field_validator("week")
    @classmethod
    def monday_only(cls, value):
        if value.weekday() != 0:
            raise ValueError("La semana debe comenzar en lunes")
        return value


class ForecastResponse(BaseModel):
    schema_version: Literal[1] = 1
    request_id: UUID
    product_id: UUID
    week: date
    model_version: str
    generated_at: datetime
    data_origin: Literal["real", "simulated"]
    status: Literal["candidate", "fallback"]
    baseline: float
    estimate: float | None
    operational_quantity: float
    coverage: int
    uncertainty: None = None
    uncertainty_reason: str = "Regresión sin intervalo predictivo calibrado; no es una probabilidad."
    persisted: Literal[True] = True


def configuration():
    values = {key: os.getenv(key, "") for key in
              ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY")}
    if not all(values.values()) or not values["SUPABASE_URL"].startswith("https://"):
        raise HTTPException(503, "Servicio pendiente de configuración.")
    return values


async def gateway(method, path, token, payload=None, *, service=False):
    config = configuration()
    key = config["SUPABASE_SERVICE_ROLE_KEY" if service else "SUPABASE_PUBLISHABLE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key if service else token}"}
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            result = await client.request(method, config["SUPABASE_URL"] + path,
                                          headers=headers, json=payload)
        if result.status_code in (401, 403) and not service:
            raise HTTPException(403, "Sesión o permiso insuficiente.")
        if result.is_error:
            raise HTTPException(503, "No se pudo consultar o registrar el pronóstico.")
        return result.json() if result.content else None
    except (httpx.HTTPError, ValueError):
        raise HTTPException(503, "Servicio de datos no disponible.") from None


async def current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]):
    if credentials is None:
        raise HTTPException(401, "Inicia sesión para consultar el pronóstico.")
    user = await gateway("GET", "/auth/v1/user", credentials.credentials)
    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(401, "Sesión inválida.")
    return credentials.credentials, str(UUID(user["id"]))


def load_pipeline(*, legacy=False):
    if legacy:
        directory = ROOT / "ml/proy/resultados"
        version, digest = "sumabasto-proy-candidato-v1", LEGACY_SHA256
        metadata_name, artifact_name = "resultados.json", "modelo_candidato.joblib"
    else:
        directory = RESULTS
        version, digest = VERSION, ARTIFACT_SHA256
        metadata_name, artifact_name = "evaluacion.json", "modelo_ridge.joblib"
    metadata = json.loads((directory / metadata_name).read_text(encoding="utf-8"))
    artifact = directory / artifact_name
    if (metadata["version"] != version or metadata["sha256"] != digest
            or hashlib.sha256(artifact.read_bytes()).hexdigest() != digest):
        raise ValueError("Artefacto o versión no verificados")
    # Only the trusted repository artifact is deserialized, never an uploaded joblib.
    return joblib.load(artifact)


def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFD", value.lower().strip())
                   if unicodedata.category(c) != "Mn")


def product_code(product):
    key = normalize(product["brand"]), normalize(product["name"]), product.get("kg")
    if key not in PRESENTATIONS:
        raise HTTPException(422, "Presentación fuera del dominio del modelo.")
    return PRESENTATIONS[key]


def infer(code, rows, *, legacy=False):
    features = [row["features"] for row in rows]
    if not features or any(len(values) != 4 or any(
            isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v)
            or v < 0 or v > 8 for v in values) or
            any(values[i] != int(values[i]) for i in (0, 3)) for values in features):
        raise HTTPException(422, "Historial insuficiente o fuera del dominio de 0 a 8 unidades por puesto.")
    baseline = sum(values[3] for values in features)
    try:
        pipeline = load_pipeline(legacy=True) if legacy else load_pipeline()
        frame = pd.DataFrame([dict(zip(FIELDS, values), producto=code) for values in features])
        predictions = pipeline.predict(frame[["producto"] + FIELDS])
        if not all(math.isfinite(float(value)) for value in predictions):
            raise ValueError("Predicción no finita")
        return baseline, round(sum(max(0, float(value)) for value in predictions), 6), "candidate"
    except (OSError, ValueError, KeyError, TypeError):
        return baseline, None, "fallback"


@app.get("/health")
def health():
    try:
        load_pipeline()
        configuration()
        return {"status": "ready", "model_version": VERSION}
    except (OSError, ValueError, KeyError, HTTPException):
        raise HTTPException(503, "Servicio no preparado.") from None


@app.post("/v1/forecast", response_model=ForecastResponse)
async def forecast(request: ForecastRequest, user=Depends(current_user)):
    token, user_id = user
    now = datetime.now(ZoneInfo("America/Lima"))
    if request.week != now.date() - timedelta(days=now.weekday()):
        raise HTTPException(422, "Solo se consulta la semana vigente.")
    snapshot = await gateway("POST", "/rest/v1/rpc/purchase_api", token,
                             {"p_action": "read", "p_payload": {}})
    identity = snapshot.get("identity", {})
    if identity.get("role") not in ("buyer", "coordinator"):
        raise HTTPException(403, "Se requiere una membresía activa.")
    product = next((p for p in snapshot.get("products", []) if p["id"] == str(request.product_id)), None)
    if product is None:
        raise HTTPException(403, "Producto no disponible para tu cuenta.")
    code = product_code(product)
    rpc = "coordinator_forecast_history" if identity["role"] == "coordinator" else "purchase_forecast_inputs"
    inputs = await gateway("POST", "/rest/v1/rpc/" + rpc, token, {})
    rows = [row for row in inputs if row["productId"] == str(request.product_id)
            and row["week"] == request.week.isoformat()]
    baseline, estimate, status = infer(code, rows)
    response = ForecastResponse(request_id=uuid4(), product_id=request.product_id, week=request.week,
        model_version=VERSION, generated_at=datetime.now(timezone.utc), data_origin=identity["origin"],
        status=status, baseline=baseline, estimate=estimate, operational_quantity=baseline, coverage=len(rows))
    # A successful response guarantees a persisted result. Do not pretend logging succeeded.
    record = response.model_dump(mode="json")
    record.update(model_sha256=ARTIFACT_SHA256,
                  input_snapshot={"producto": code, "fields": FIELDS,
                                  "features": [row["features"] for row in rows]})
    await gateway("POST", "/rest/v1/rpc/record_proy_forecast", token,
                  {"p_user": user_id, "p_result": record}, service=True)
    return response
