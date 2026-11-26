"""PROY: protocol frozen before evaluation; calibration and external real validation remain separate."""
from pathlib import Path
import json, hashlib
import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from generador import simular, calidad, PRODUCTOS, CAMPOS, FICHAS

OUT = Path(__file__).parent / "resultados"
OUT.mkdir(exist_ok=True)
SEED = 42
FEATURES = ["producto"] + CAMPOS
Y = "sacos_al_cierre"
VERSION = "sumabasto-proy-candidato-v1"
def prep(model):
    return Pipeline([("preprocesamiento", ColumnTransformer([
        ("producto", OneHotEncoder(categories=[PRODUCTOS], handle_unknown="error", sparse_output=False), ["producto"]),
        ("volumen", StandardScaler(), CAMPOS)])), ("modelo", model)])
def predict(model, data):
    return np.maximum(0, model.predict(data[FEATURES]))
def mae(data, pred):
    return float(mean_absolute_error(data[Y], pred))
def metrics(data, pred):
    return dict(MAE=mae(data,pred), RMSE=float(mean_squared_error(data[Y],pred)**.5),
                R2=float(r2_score(data[Y],pred)), WAPE=float(100*np.abs(data[Y]-pred).sum()/data[Y].sum()))
def checks(data, events):
    q=calidad(data)
    daily=events.sort_values(["puesto","fecha_objetivo"])
    expected = {f"P{i+1:02}": f for i,f in enumerate(FICHAS)}
    ranges = all(g.sacos.between(expected[p][0],expected[p][1]).all() and
                 pd.to_datetime(g.fecha_objetivo).diff().dropna().dt.days.between(expected[p][2],expected[p][3]).all()
                 for p,g in daily.groupby("puesto"))
    reconstructed = data.copy()
    reconstructed["semana"]=pd.to_datetime(reconstructed.semana)
    e=events.copy(); e["semana"]=pd.to_datetime(e.semana)
    e["cierre"]=e.sacos.where(~e.retirado_antes_del_cierre,0)
    e["corte"]=e.sacos.where(e.al_corte,0)
    sums=e.groupby(["puesto","producto","semana"])[["cierre","corte"]].sum()
    def lookup(row, weeks, col):
        return sums[col].get((row.puesto,row.producto,row.semana-pd.Timedelta(weeks=weeks)),0)
    temporal=all(np.isclose(row.ultima,lookup(row,1,"cierre")) and
                 np.isclose(row.media_3,np.mean([lookup(row,i,"cierre") for i in range(1,4)])) and
                 np.isclose(row.media_8,np.mean([lookup(row,i,"cierre") for i in range(1,9)])) and
                 row.al_corte==lookup(row,0,"corte") and row.sacos_al_cierre==lookup(row,0,"cierre")
                 for row in reconstructed.itertuples())
    corr=float(data.al_corte.corr(data[Y]))
    tests={"escala":len(data)==8*4*148 and data.puesto.nunique()==8 and data.producto.nunique()==4,
           "rangos_unidades":ranges and q["negativos"]==q["sobre_8"]==0,
           "consistencia_temporal":bool(temporal and q["duplicados"]==q["nulos"]==0),
           "relaciones_plausibles":bool(data.loc[data.al_corte.gt(0),Y].mean()>data.loc[data.al_corte.eq(0),Y].mean()),
           "senal_no_perfecta":bool(0<corr<1),
           "contrato":bool(set(FEATURES+[Y,"origen","semana","puesto"])<=set(data.columns) and data.origen.eq("simulado").all()),
           "mezcla_real_simulado":False}
    return {"criterios":tests,"correlacion_corte_cierre":corr,"real":0,"simulado":len(data)}
def run():
    development, events=simular(SEED)
    report=checks(development,events)
    assert all(v for k,v in report["criterios"].items() if k!="mezcla_real_simulado"),report
    weeks=sorted(development.semana.unique())
    fit=development[development.semana<weeks[125]].copy()
    # Same development cut as APF3; complete weeks never cross fold boundaries.
    train_weeks=sorted(fit.semana.unique())
    splits=list(TimeSeriesSplit(n_splits=5).split(train_weeks))
    configs={"arbol_corregido":DecisionTreeRegressor(max_depth=5,min_samples_leaf=20,random_state=SEED)}
    # Reproduce original tree configuration selected by the original validation window.
    legacy_train=development[development.semana<weeks[103]]
    legacy_val=development[(development.semana>=weeks[103])&(development.semana<weeks[125])]
    old=[]
    for d in [3,5,7]:
        for leaf in [20,50,100]:
            m=prep(DecisionTreeRegressor(max_depth=d,min_samples_leaf=leaf,random_state=SEED)).fit(legacy_train[FEATURES],legacy_train[Y])
            old.append((mae(legacy_val,predict(m,legacy_val)),d,leaf))
    _,d,leaf=min(old)
    configs["arbol_corregido"]=DecisionTreeRegressor(max_depth=d,min_samples_leaf=leaf,random_state=SEED)
    for depth in [2,3,5,7]:
        for n in [10,20,50,100]:
            configs[f"arbol_{depth}_{n}"]=DecisionTreeRegressor(max_depth=depth,min_samples_leaf=n,random_state=SEED)
    for alpha in [1,10,100]:
        configs[f"ridge_{alpha}"]=Ridge(alpha=alpha)
    for depth in [3,5,8]:
        for n in [10,30]:
            configs[f"forest_{depth}_{n}"]=RandomForestRegressor(n_estimators=80,max_depth=depth,min_samples_leaf=n,random_state=SEED,n_jobs=1)
    cv=[]
    for name,model in configs.items():
        errors=[]
        for a,b in splits:
            tr=fit[fit.semana.isin([train_weeks[i] for i in a])]
            va=fit[fit.semana.isin([train_weeks[i] for i in b])]
            assert tr.semana.max()<va.semana.min()
            m=prep(model).fit(tr[FEATURES],tr[Y]); errors.append(mae(va,predict(m,va)))
        cv.append({"modelo":name,"MAE_cv":float(np.mean(errors)),"folds":errors})
    cv.sort(key=lambda r:(r["MAE_cv"],r["modelo"]))
    chosen=cv[0]["modelo"]
    # Freeze selection prior to generating new held-out trajectory, not the already known APF3 seed 2027.
    (OUT/"seleccion.json").write_text(json.dumps({"criterio":"menor MAE medio en 5 folds temporales; desempate por nombre","seleccion":chosen,"cv":cv},indent=2),encoding="utf-8")
    fitted={name:prep(configs[name]).fit(fit[FEATURES],fit[Y]) for name in dict.fromkeys(["arbol_corregido",chosen])}
    test, test_events=simular(2028)
    dummy=prep(DummyRegressor(strategy="median")).fit(fit[FEATURES],fit[Y])
    outputs={"dummy_mediana":predict(dummy,test),"regla_al_corte":test.al_corte.to_numpy(),"promedio_3":test.media_3.to_numpy()}
    outputs.update({name:predict(m,test) for name,m in fitted.items()})
    table=[{"modelo":name,**metrics(test,values)} for name,values in outputs.items()]
    candidate=outputs[chosen]
    by_cut={str(flag):{name:mae(test[mask],values[mask]) for name,values in outputs.items()}
            for flag,mask in [(0,test.al_corte.eq(0)),(1,test.al_corte.gt(0))]}
    sensitivity=[]
    for label,a,r,w in [("menos anticipacion",.25,.06,(1,1,1,1)),("mas retiros",.45,.15,(1,1,1,1)),("mezcla desigual",.45,.06,(1,1,3,1))]:
        s,_=simular(2029,a,r,w)
        sensitivity.append({"escenario":label,**metrics(s,predict(fitted[chosen],s))})
    # Paired bootstrap by complete week, descriptive uncertainty only.
    diff=pd.DataFrame({"semana":test.semana,"d":np.abs(test[Y]-candidate)-np.abs(test[Y]-test.al_corte)}).groupby("semana").d.mean().to_numpy()
    rng=np.random.default_rng(SEED)
    interval=np.quantile(rng.choice(diff,(1000,len(diff)),replace=True).mean(1),[.025,.975]).tolist()
    artifact=OUT/"modelo_candidato.joblib"
    joblib.dump(fitted[chosen],artifact)
    example=test.iloc[[0]][FEATURES]
    assert np.allclose(predict(joblib.load(artifact),example),predict(fitted[chosen],example))
    result={"version":VERSION,"sha256":hashlib.sha256(artifact.read_bytes()).hexdigest(),"seleccion":chosen,
            "status":"candidato; falta validacion real y criterio siete","coherencia_desarrollo":report,
            "coherencia_prueba":checks(test,test_events),"metricas":table,"por_corte":by_cut,"sensibilidad":sensitivity,
            "delta_MAE_vs_corte_IC95_bootstrap_semanal":interval,
            "regla_operativa":"mantener corte si candidato no supera MAE de regla; recomendaciones solo apoyo",
            "ejemplo":{"entrada":example.iloc[0].to_dict(),"estimado":float(predict(fitted[chosen],example)[0])},
            "particion":{"entrenamiento_semillas":[42],"semanas_ajuste":125,"prueba_nueva_semilla":2028,"real_reservado":0}}
    (OUT/"resultados.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    pd.DataFrame(table).to_csv(OUT/"metricas.csv",index=False)
    development.to_csv(OUT/"desarrollo_simulado.csv",index=False)
    test.assign(prediccion=candidate).to_csv(OUT/"prueba_simulada_2028.csv",index=False)
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=="__main__":
    run()
