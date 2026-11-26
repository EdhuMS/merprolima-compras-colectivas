from collections import defaultdict
from datetime import date, timedelta
from random import Random
import pandas as pd
PRODUCTOS = ["CARTAVIO-50KG", "COSTENO-EXTRA-50KG", "FARAON-AZUL-50KG", "PARAMONGA-RUBIA-50KG"]
MARCAS = ["Cartavio", "Costeño", "Faraón Azul", "Paramonga"]
# APF2, Anexo G, Tabla 19. Cada perfil corresponde a un arquetipo sintético.
# Tupla: sacos mínimo/máximo, días mínimo/máximo. No se vinculan cuentas ni identidades.
FICHAS = [(5,5,9,9), (4,4,7,7), (6,6,12,12), (5,5,10,10),
          (4,4,8,10), (5,5,10,10), (6,6,10,10), (7,8,12,14)]
INICIO = date(2023, 10, 16)
SEMANAS = 156
VERSION = "sumabasto-apf3-calibrado-v2"
CAMPOS = ["ultima", "media_3", "media_8", "al_corte"]

def simular(semilla, anticipacion=.45, retiro=.06, pesos=(1,1,1,1), *,
            productos=PRODUCTOS, inicio=INICIO, semanas=SEMANAS):
    rng = Random(semilla)
    eventos = []
    cierres, iniciales = defaultdict(int), defaultdict(int)
    for puesto, (min_sacos, max_sacos, min_dias, max_dias) in enumerate(FICHAS):
        dia = rng.randrange(max_dias)
        while dia < semanas * 7:
            semana = dia // 7
            producto = rng.choices(range(len(productos)), weights=pesos, k=1)[0]
            sacos = rng.randint(min_sacos, max_sacos)
            anticipado = rng.random() < anticipacion
            decide_retiro = rng.random()
            retirado = anticipado and decide_retiro < retiro
            clave = (puesto, producto, semana)
            iniciales[clave] += sacos if anticipado else 0
            cierres[clave] += 0 if retirado else sacos
            eventos.append({"puesto": f"P{puesto+1:02}", "producto": productos[producto],
                            "fecha_objetivo": inicio + timedelta(days=dia),
                            "semana": inicio + timedelta(weeks=semana), "sacos": sacos,
                            "al_corte": anticipado, "retirado_antes_del_cierre": retirado,
                            "origen": "simulado"})
            dia += rng.randint(min_dias, max_dias)
    filas = []
    for semana in range(8, semanas):
        for producto, nombre in enumerate(productos):
            for puesto in range(8):
                historia = [cierres[puesto, producto, s] for s in range(semana-8, semana)]
                filas.append({"semana": inicio + timedelta(weeks=semana), "producto": nombre,
                              "puesto": f"P{puesto+1:02}", "ultima": historia[-1],
                              "media_3": sum(historia[-3:])/3, "media_8": sum(historia)/8,
                              "al_corte": iniciales[puesto, producto, semana],
                              "sacos_al_cierre": cierres[puesto, producto, semana], "origen": "simulado"})
    return pd.DataFrame(filas), pd.DataFrame(eventos)

def calidad(tabla):
    columnas = CAMPOS + ["sacos_al_cierre"]
    return {"filas": len(tabla), "duplicados": int(tabla.duplicated(["semana","producto","puesto"]).sum()),
            "nulos": int(tabla.isna().any(axis=1).sum()),
            "negativos": int((tabla[columnas] < 0).any(axis=1).sum()),
            "sobre_8": int((tabla[columnas] > 8).any(axis=1).sum())}


