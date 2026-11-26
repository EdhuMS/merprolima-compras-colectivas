"""Verify reserved scenarios through FastAPI with deterministic Supabase responses."""
import argparse
from datetime import datetime
from pathlib import Path
from unittest.mock import patch
from uuid import UUID, uuid4

import pandas as pd
from fastapi.testclient import TestClient

from api import main
from api.replay import replay


def verify(directory):
    cases = pd.read_csv(directory / "casos_reservados.csv", keep_default_na=False)
    test = pd.read_csv(directory / "prueba_reservada.csv")
    predictions = pd.read_csv(directory / "evaluacion/predicciones.csv")
    for index, case in cases.iterrows():
        product_id = str(uuid4())
        week = case.semana
        role = "buyer" if case.rol == "tienda" else "coordinator"
        brand, name, kg = next(key for key, sku in main.PRESENTATIONS.items() if sku == case.producto)
        key = test.semana.eq(week) & test.producto.eq(case.producto) & test.puesto.isin(case.puestos.split("|"))
        rows = test.loc[key, main.FIELDS].values.tolist()
        expected = predictions.loc[key, "ridge"].sum()
        records = []

        async def gateway(method, path, token, payload=None, *, service=False):
            if path == "/auth/v1/user":
                return {"id": str(UUID(int=1))}
            if path.endswith("/purchase_api"):
                return {"identity": {"role": role, "origin": "simulated"},
                        "products": [{"id": product_id, "brand": brand, "name": name, "kg": kg}]}
            rpc = "purchase_forecast_inputs" if role == "buyer" else "coordinator_forecast_history"
            if path.endswith("/" + rpc):
                return [{"week": week, "productId": product_id, "features": row} for row in rows]
            assert service and path.endswith("/record_proy_forecast")
            records.append(payload["p_result"])

        with patch.object(main, "gateway", gateway), patch.object(main, "datetime") as clock:
            clock.now.return_value = datetime.fromisoformat(week + "T12:00:00+00:00")
            response = TestClient(main.app).post(
                "/v1/forecast", json={"week": week, "product_id": product_id},
                headers={"Authorization": "Bearer fixture"},
            )
        assert response.status_code == 200, (case.caso, response.text)
        result = response.json()
        assert result["model_version"] == main.VERSION
        assert result["operational_quantity"] == case.unidades_al_corte_esperadas
        assert result["coverage"] == (1 if role == "buyer" else 8)
        assert abs(result["estimate"] - expected) <= 1e-6
        assert len(records) == 1 and records[0]["request_id"] == result["request_id"]
        assert replay(records[0])["verified"]
        cases.loc[index, ["resultado_obtenido", "evidencia", "estado"]] = [
            f"HTTP 200; corte {result['baseline']}; Ridge {result['estimate']}; cobertura {result['coverage']}",
            result["request_id"], "aprobado_api_local_con_supabase_simulado",
        ]
    cases.to_csv(directory / "validacion_30_casos_api_local.csv", index=False)
    print(f"{len(cases)} escenarios verificados con API local y Supabase simulado.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("datos", type=Path)
    verify(parser.parse_args().datos)
