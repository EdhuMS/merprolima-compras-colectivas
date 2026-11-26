import argparse
from datetime import date, timedelta
from pathlib import Path
from random import Random

import pandas as pd

from generador import calidad, simular


CATALOGO = (
    ("COSTENO-EXTRA-50KG", "Arroz", "Costeño", "Extra, saco de 50 kg"),
    ("CARTAVIO-50KG", "Azúcar", "Cartavio", "Saco de 50 kg"),
    ("DON-VITTORIO-FIDEOS-500G", "Fideos", "Don Vittorio", "Espagueti, paquete de 500 g"),
    ("COSTENO-LENTEJAS-500G", "Lentejas", "Costeño", "Bolsa de 500 g"),
)
INICIO = date(2024, 1, 1)
CORTE = INICIO + timedelta(weeks=52)
SEMILLA = 20261126


def reservar_casos(prueba):
    rng = Random(SEMILLA + 1)
    casos = []
    for indice, (sku, *_resto) in enumerate(CATALOGO):
        filas = prueba[prueba.producto == sku]
        semanas = sorted(filas.semana.unique())
        cantidad = 8 if indice < 2 else 7
        for turno in range(cantidad):
            tramo = semanas[52 * turno // cantidad:52 * (turno + 1) // cantidad]
            semana = rng.choice(tramo)
            grupo = filas[filas.semana == semana]
            rol = "tienda" if (indice + turno) % 2 == 0 else "coordinacion"
            if rol == "tienda":
                con_demanda = grupo[grupo.sacos_al_cierre > 0]
                opciones = con_demanda if turno % 3 != 0 and not con_demanda.empty else grupo
                grupo = opciones.iloc[[rng.randrange(len(opciones))]]
            casos.append({
                "caso": f"SIM-{len(casos) + 1:02d}",
                "rol": rol,
                "semana": semana,
                "producto": sku,
                "puestos": "|".join(grupo.puesto),
                "unidades_al_corte_esperadas": int(grupo.al_corte.sum()),
                "unidades_al_cierre_simuladas": int(grupo.sacos_al_cierre.sum()),
                "comportamiento_esperado": "Consultar pronóstico autorizado y registrar solicitud",
                "resultado_obtenido": "",
                "evidencia": "",
                "estado": "pendiente",
                "origen": "simulado",
            })
    return pd.DataFrame(casos)


def preparar(destino):
    catalogo = pd.DataFrame(CATALOGO, columns=["producto", "categoria", "marca", "presentacion"])
    filas, eventos = simular(SEMILLA, productos=tuple(catalogo.producto), inicio=INICIO, semanas=104)
    desarrollo = filas[filas.semana < CORTE]
    prueba = filas[filas.semana >= CORTE]
    casos = reservar_casos(prueba)
    assert len(desarrollo) == 44 * 32 and len(prueba) == 52 * 32
    assert all(valor == 0 for clave, valor in calidad(filas).items() if clave != "filas")
    assert eventos.semana.nunique() == 104
    assert len(casos) == 30 and casos.rol.value_counts().to_dict() == {"tienda": 15, "coordinacion": 15}
    assert not casos.duplicated(["semana", "producto"]).any()
    destino.mkdir(parents=True, exist_ok=True)
    for nombre, tabla in {
        "catalogo": catalogo,
        "eventos_simulados": eventos,
        "desarrollo": desarrollo,
        "prueba_reservada": prueba,
        "casos_reservados": casos,
    }.items():
        tabla.to_csv(destino / f"{nombre}.csv", index=False, lineterminator="\n")
    print({"eventos": len(eventos), "desarrollo": len(desarrollo), "prueba": len(prueba),
           "casos": len(casos), "calidad": calidad(filas)})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preparar los datos simulados del catálogo revisado.")
    parser.add_argument("destino", type=Path)
    preparar(parser.parse_args().destino)
