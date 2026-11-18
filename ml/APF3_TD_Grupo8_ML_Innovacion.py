# %% Simulación condicionada por los rangos de las entrevistas
from collections import defaultdict
from datetime import date, timedelta
import json
from pathlib import Path
from random import Random

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor

OUT = Path("entrega_sumabasto")
OUT.mkdir(exist_ok=True)
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

def simular(semilla, anticipacion=.45, retiro=.06, pesos=(1,1,1,1)):
    rng = Random(semilla)
    eventos = []
    cierres, iniciales = defaultdict(int), defaultdict(int)
    for puesto, (min_sacos, max_sacos, min_dias, max_dias) in enumerate(FICHAS):
        dia = rng.randrange(max_dias)
        while dia < SEMANAS * 7:
            semana = dia // 7
            producto = rng.choices(range(4), weights=pesos, k=1)[0]
            sacos = rng.randint(min_sacos, max_sacos)
            anticipado = rng.random() < anticipacion
            decide_retiro = rng.random()
            retirado = anticipado and decide_retiro < retiro
            clave = (puesto, producto, semana)
            iniciales[clave] += sacos if anticipado else 0
            cierres[clave] += 0 if retirado else sacos
            eventos.append({"puesto": f"P{puesto+1:02}", "producto": PRODUCTOS[producto],
                            "fecha_objetivo": INICIO + timedelta(days=dia),
                            "semana": INICIO + timedelta(weeks=semana), "sacos": sacos,
                            "al_corte": anticipado, "retirado_antes_del_cierre": retirado,
                            "origen": "simulado"})
            dia += rng.randint(min_dias, max_dias)
    filas = []
    for semana in range(8, SEMANAS):
        for producto, nombre in enumerate(PRODUCTOS):
            for puesto in range(8):
                historia = [cierres[puesto, producto, s] for s in range(semana-8, semana)]
                filas.append({"semana": INICIO + timedelta(weeks=semana), "producto": nombre,
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

desarrollo, eventos_desarrollo = simular(42)
semanas = sorted(desarrollo.semana.unique())
train = desarrollo[desarrollo.semana < semanas[103]]
valid = desarrollo[(desarrollo.semana >= semanas[103]) & (desarrollo.semana < semanas[125])]
ajuste = desarrollo[desarrollo.semana < semanas[125]]
assert calidad(desarrollo) == {"filas": 4736, "duplicados": 0, "nulos": 0, "negativos": 0, "sobre_8": 0}
print("Partición temporal:", len(train), len(valid), len(ajuste))
print("Rangos observados en el generador:", eventos_desarrollo.groupby("puesto").sacos.agg(["min","max"]))

# %% Selección de modelo antes de abrir la trayectoria de prueba
def matriz(tabla):
    categorias = np.column_stack([(tabla.producto == p).to_numpy(dtype=float) for p in PRODUCTOS])
    # Se mantienen las ocho posiciones del contrato original, siempre en cero.
    # Así no se aprende el identificador ficticio de un puesto.
    return np.column_stack([np.zeros((len(tabla), 8)), categorias, tabla[CAMPOS].to_numpy()])

def objetivo(tabla):
    return tabla.sacos_al_cierre.to_numpy()

def predecir(modelo, tabla):
    return np.maximum(0, modelo.predict(matriz(tabla)))

def opcional(modelo):
    transformacion = ColumnTransformer(
        [("categorias", "passthrough", list(range(12))),
         ("volumen", StandardScaler(), list(range(12,16)))])
    return make_pipeline(transformacion, modelo)

def validar(modelo):
    modelo.fit(matriz(train), objetivo(train))
    return [mean_absolute_error(objetivo(t), predecir(modelo,t)) for t in [train,valid]]

busqueda = []
for profundidad in (3,5,7):
    for hoja in (20,50,100):
        resultados = validar(opcional(DecisionTreeRegressor(max_depth=profundidad,
                              min_samples_leaf=hoja, random_state=42)))
        busqueda.append(dict(modelo="Árbol", profundidad=profundidad, hoja=hoja,
                             train=resultados[0], valid=resultados[1]))
for alpha in (1,10,100):
    resultados = validar(opcional(Ridge(alpha=alpha)))
    busqueda.append(dict(modelo="Ridge", alpha=alpha, train=resultados[0], valid=resultados[1]))
mejor_arbol = min((r for r in busqueda if r["modelo"]=="Árbol"), key=lambda r:r["valid"])
mejor_ridge = min((r for r in busqueda if r["modelo"]=="Ridge"), key=lambda r:r["valid"])
# Árbol preseleccionado para despliegue auditable. Se declara si Ridge mejora el error.
arbol = opcional(DecisionTreeRegressor(max_depth=mejor_arbol["profundidad"],
                 min_samples_leaf=mejor_arbol["hoja"], random_state=42)).fit(matriz(ajuste), objetivo(ajuste))
ridge = opcional(Ridge(alpha=mejor_ridge["alpha"])).fit(matriz(ajuste), objetivo(ajuste))
print(pd.DataFrame(busqueda).to_string(index=False))
print("Línea base en validación:", mean_absolute_error(objetivo(valid), valid.media_3))

# %% Evaluación independiente, sensibilidad y exportación
test, eventos_test = simular(2027)
assert calidad(test) == calidad(desarrollo)
pred = predecir(arbol,test)
y = objetivo(test)

def evaluar(y,p):
    return {"MAE": mean_absolute_error(y,p), "RMSE": mean_squared_error(y,p)**.5,
            "R2": r2_score(y,p), "WAPE": np.abs(y-p).sum()/np.abs(y).sum()*100}

metricas = {"Promedio de tres semanas": evaluar(y,test.media_3.to_numpy()),
            "Siempre cero": evaluar(y,np.zeros(len(test))),
            "Sacos al corte": evaluar(y,test.al_corte.to_numpy()),
            "Ridge": evaluar(y,predecir(ridge,test)), "Árbol": evaluar(y,pred)}
predicciones = {"Promedio de tres semanas": test.media_3.to_numpy(),
                "Siempre cero": np.zeros(len(test)), "Sacos al corte": test.al_corte.to_numpy(),
                "Ridge": predecir(ridge,test), "Árbol": pred}
por_corte = {}
for nombre, mascara in [("Con solicitudes al corte", test.al_corte.gt(0)),
                        ("Sin solicitudes al corte", test.al_corte.eq(0))]:
    por_corte[nombre] = {"filas": int(mascara.sum()), "MAE": {
        metodo: mean_absolute_error(y[mascara], valores[mascara])
        for metodo,valores in predicciones.items()}}
test["prediccion"] = pred
test["residual"] = y-pred
errores = pd.concat([test.nlargest(2,"residual"),test.nsmallest(1,"residual")]).copy()
errores["semana"] = errores.semana.astype(str)
sensibilidad = []
for nombre,a,r,pesos in [("Menos anticipación",.25,.06,(1,1,1,1)),
    ("Más retiros",.45,.15,(1,1,1,1)), ("Mezcla desigual",.45,.06,(1,1,3,1))]:
    s,_ = simular(2027,a,r,pesos)
    sensibilidad.append({"escenario":nombre, "MAE":float(evaluar(objetivo(s),predecir(arbol,s))["MAE"])})
desc = train.groupby("producto").sacos_al_cierre.agg(["mean","median","std","min","max"])
desc["ceros_pct"] = train.groupby("producto").sacos_al_cierre.apply(lambda s:100*s.eq(0).mean())
diag = train.assign(corte=train.al_corte.gt(0), historia=train.media_3.gt(0))
relaciones = {k:{str(a):round(float(b),3) for a,b in diag.groupby(k).sacos_al_cierre.mean().items()}
              for k in ["corte","historia"]}
modelo = arbol[-1]
escala = arbol[0].named_transformers_["volumen"]
t= modelo.tree_
pesos = modelo.feature_importances_
importancia = {"producto": float(pesos[8:12].sum()), **dict(zip(CAMPOS,map(float,pesos[12:])))}
artefacto = dict(version=VERSION, media=escala.mean_.tolist(), escala=escala.scale_.tolist(),
                 left=t.children_left.tolist(), right=t.children_right.tolist(),
                 feature=t.feature.tolist(), threshold=t.threshold.tolist(), value=t.value[:,0,0].tolist())
muestra = test[test.semana == test.semana.iloc[0]]
referencia = {"week":str(muestra.semana.iloc[0]), "version":VERSION,
              "rows":[[int(r.ultima),round(r.media_3*3),round(r.media_8*8),int(r.al_corte),r.prediccion]
                      for r in muestra.itertuples()]}
# Una fila con señal al corte para que el recorrido de demostración sea interpretable.
fila = muestra.loc[muestra.al_corte.idxmax()]
entrada = dict(productId=fila.producto, week=str(fila.semana), features=[float(fila[c]) for c in CAMPOS],
               stallIndex=int(fila.puesto[1:])-1, actual=None)
salida = dict(estimate=float(fila.prediccion), version=VERSION, stores=1)
resumen = dict(metricas=metricas, mejor_arbol=mejor_arbol, mejor_ridge=mejor_ridge, busqueda=busqueda,
               por_corte=por_corte,
               valid_base=float(mean_absolute_error(objetivo(valid),valid.media_3)), calidad=calidad(test),
               descriptivos=desc.to_dict("index"), relaciones=relaciones, importancia=importancia,
               sensibilidad=sensibilidad, errores=errores.to_dict("records"), entrada=entrada,salida=salida,
               residual_promedio=float(test.residual.mean()), ceros=int((y==0).sum()),
               total_eventos=len(eventos_test), total_sacos=int(y.sum()))
for nombre,obj in [("tree-four-products.json",artefacto),("colab-reference.json",referencia),
                    ("resultados.json",resumen),("prediccion_ejemplo.json",{"entrada":entrada,"salida":salida})]:
    (OUT/nombre).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding="utf-8")
joblib.dump(arbol, OUT/"sumabasto_modelo.joblib")
assert np.allclose(predecir(joblib.load(OUT/"sumabasto_modelo.joblib"),muestra),muestra.prediccion)
test.to_csv(OUT/"sumabasto_prueba_puesto_producto.csv",index=False)
eventos_test.to_csv(OUT/"sumabasto_eventos_simulados.csv",index=False)
print(pd.DataFrame(metricas).T.round(4))
print(pd.DataFrame({grupo: valores["MAE"] for grupo,valores in por_corte.items()}).round(4))
print(json.dumps({"entrada":entrada,"salida":salida},ensure_ascii=False,indent=2))

# %% Figuras reproducibles
plt.rcParams.update({"font.family":"DejaVu Sans","font.size":11,"axes.spines.top":False,"axes.spines.right":False})

def guardar(fig,nombre):
    fig.tight_layout()
    fig.savefig(OUT/nombre,dpi=180,bbox_inches="tight",facecolor="white")
    plt.close(fig)

fig,ax=plt.subplots(figsize=(7,2.35))
conteo=train.sacos_al_cierre.value_counts().sort_index()
ax.bar(conteo.index,conteo.values,color="#32634c")
ax.set(xlabel="Sacos al cierre",ylabel="Observaciones",xticks=range(9))
guardar(fig,"distribution.png")

for clave,etiquetas,nombre,xlabel in [
    ("corte",["Sin registro al corte","Con registro al corte"],"cut.png","Estado al inicio del lunes"),
    ("historia",["Sin volumen reciente","Con volumen reciente"],"history.png","Promedio de las tres semanas previas")]:
    fig,ax=plt.subplots(figsize=(7,2.25))
    ax.bar(etiquetas,[relaciones[clave]["False"],relaciones[clave]["True"]],color=["#9bb4a8","#32634c"],width=.55)
    ax.set(xlabel=xlabel,ylabel="Sacos al cierre (media)")
    guardar(fig,nombre)

fig,ax=plt.subplots(figsize=(7,2.4))
for j,(nombre,serie,color) in enumerate([("Promedio móvil",test.media_3,"#9bb4a8"),
    ("Sacos al corte",test.al_corte,"#c18346"),("Árbol",pred,"#32634c")]):
    medidas=[mean_absolute_error(test.loc[test.producto==p,"sacos_al_cierre"],np.asarray(serie)[test.producto==p]) for p in PRODUCTOS]
    ax.bar(np.arange(4)+(j-1)*.24,medidas,width=.24,label=nombre,color=color)
ax.set(xticks=range(4),xticklabels=MARCAS,ylabel="MAE (sacos)")
ax.legend(frameon=False)
guardar(fig,"mae.png")

fig,ax=plt.subplots(figsize=(7,2.65))
malla=ax.hexbin(pred,y-pred,gridsize=20,mincnt=1,bins="log",cmap="Greens")
ax.axhline(0,color="#555555",linestyle="--",linewidth=1)
ax.set(xlabel="Pronóstico (sacos)",ylabel="Residual (sacos)")
fig.colorbar(malla,ax=ax,label="Observaciones")
guardar(fig,"residuals.png")
print("Archivos verificados en",OUT.resolve())
