"""Construye el cuaderno autónomo para Google Colab."""

import json
from pathlib import Path

ROOT = Path(__file__).parent


def fuente(nombre, excluir=()):
    lineas = (ROOT / nombre).read_text(encoding="utf-8-sig").splitlines(keepends=True)
    return "".join(linea for linea in lineas if not linea.startswith(excluir)).split(
        '\nif __name__ == "__main__":'
    )[0]


def celda(tipo, texto):
    base = dict(cell_type=tipo, metadata={}, source=texto.splitlines(keepends=True))
    return dict(base, execution_count=None, outputs=[]) if tipo == "code" else base


entrenamiento = fuente("entrenar.py", ("from generador ", "OUT"))
ayudas = entrenamiento[:entrenamiento.index("def checks(")]
celdas = [
    celda("markdown", "# Sumabasto · PROY · Catálogo revisado\n"
          "Cuatro productos y dos bloques de 52 semanas de datos simulados. "
          "Los 30 casos quedan reservados para verificar la aplicación en el paso 4."),
    celda("code", "%pip install -q scikit-learn==1.7.2 pandas==2.3.3 numpy==2.2.6 scipy==1.15.3 joblib==1.5.2"),
    celda("markdown", "## Catálogo, simulación y partición temporal\n"
          "Las variables de historial usan semanas anteriores. Una unidad corresponde a la presentación del producto."),
    celda("code", fuente("generador.py")),
    celda("code", fuente("preparar_24_meses.py", ("from generador ",))),
    celda("code", 'datos = Path("sumabasto_datos")\npreparar(datos)\npd.read_csv(datos / "catalogo.csv")'),
    celda("markdown", "## Ajuste de Ridge y evaluación reservada\n"
          "Se elige alpha por MAE en cinco divisiones temporales del primer bloque. "
          "El segundo bloque compara Ridge con la regla al corte, en general y por producto."),
    celda("code", ayudas),
    celda("code", fuente("evaluar_24_meses.py", ("from entrenar ",))),
    celda("code", 'salida = Path("sumabasto_evaluacion")\nevaluar(datos, salida)\n'
          'pd.read_csv(salida / "metricas.csv")'),
    celda("markdown", "## Decisión operativa\n"
          "El menor MAE general decide la estimación principal. Con esta simulación se mantiene "
          "la regla al corte y Ridge queda como referencia. La validación de la aplicación sigue en el paso 4."),
]
for i, contenido in enumerate(celdas):
    contenido["id"] = f"proy-{i:02}"
cuaderno = dict(cells=celdas, nbformat=4, nbformat_minor=5, metadata={
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python"},
    "colab": {"provenance": []},
})
(ROOT / "PROY_TD_Grupo8_ML.ipynb").write_text(
    json.dumps(cuaderno, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
)
