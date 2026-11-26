"""Ajusta Ridge en desarrollo y evalúa una sola vez en el bloque reservado."""

import argparse
import hashlib
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.model_selection import TimeSeriesSplit

from entrenar import FEATURES, Y, mae, metrics, predict, prep


def evaluar(datos, salida):
    desarrollo = pd.read_csv(datos / "desarrollo.csv")
    productos = pd.read_csv(datos / "catalogo.csv").producto.tolist()
    semanas = sorted(desarrollo.semana.unique())
    assert len(semanas) == 44
    cv = []
    for alpha in (1, 10, 100):
        errores = []
        for anteriores, siguientes in TimeSeriesSplit(n_splits=5).split(semanas):
            ajuste = desarrollo[desarrollo.semana <= semanas[anteriores[-1]]]
            validacion = desarrollo[desarrollo.semana.isin([semanas[i] for i in siguientes])]
            modelo = prep(Ridge(alpha=alpha), productos).fit(ajuste[FEATURES], ajuste[Y])
            errores.append(mae(validacion, predict(modelo, validacion)))
        cv.append(dict(alpha=alpha, MAE=float(np.mean(errores)), errores=errores))
    alpha = min(cv, key=lambda fila: (fila["MAE"], fila["alpha"]))["alpha"]
    modelo = prep(Ridge(alpha=alpha), productos).fit(desarrollo[FEATURES], desarrollo[Y])

    prueba = pd.read_csv(datos / "prueba_reservada.csv")
    assert desarrollo.semana.max() < prueba.semana.min() and prueba.semana.nunique() == 52
    assert set(prueba.producto) == set(desarrollo.producto) == set(productos)
    prueba = prueba.assign(ridge=predict(modelo, prueba), regla_al_corte=prueba.al_corte)
    resultados = []
    for producto, filas in [("general", prueba), *prueba.groupby("producto", sort=False)]:
        for nombre in ("regla_al_corte", "ridge"):
            resultados.append(dict(producto=producto, modelo=nombre, filas=len(filas),
                                   **metrics(filas, filas[nombre].to_numpy())))
    principal = min(resultados[:2], key=lambda fila: fila["MAE"])["modelo"]

    salida.mkdir(parents=True, exist_ok=True)
    artefacto = salida / "modelo_ridge.joblib"
    joblib.dump(modelo, artefacto)
    np.testing.assert_array_equal(predict(joblib.load(artefacto), prueba), prueba.ridge.to_numpy())
    pd.DataFrame(resultados).to_csv(salida / "metricas.csv", index=False)
    prueba.to_csv(salida / "predicciones.csv", index=False)
    informe = {
        "version": "sumabasto-proy-catalogo-24-meses-v1",
        "alpha": alpha, "validacion_temporal": cv, "estimacion_principal": principal,
        "sha256": hashlib.sha256(artefacto.read_bytes()).hexdigest(),
        "origen": "simulado", "metricas": resultados,
    }
    (salida / "evaluacion.json").write_text(json.dumps(informe, indent=2), encoding="utf-8")
    print(pd.DataFrame(resultados).to_string(index=False))
    print(f"alpha={alpha}, estimación principal={principal}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("datos", type=Path)
    parser.add_argument("salida", type=Path)
    argumentos = parser.parse_args()
    evaluar(argumentos.datos, argumentos.salida)
