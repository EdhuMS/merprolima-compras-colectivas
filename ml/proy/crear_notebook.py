import json, pathlib, re
p=pathlib.Path(__file__).parent
def lines(s): return s.splitlines(keepends=True)
def code(s): return dict(cell_type="code",metadata={},execution_count=None,outputs=[],source=lines(s))
def md(s): return dict(cell_type="markdown",metadata={},source=lines(s))
generator=(p/"generador.py").read_text(encoding="utf-8-sig")
training=(p/"entrenar.py").read_text(encoding="utf-8-sig").replace("from generador import simular, calidad, PRODUCTOS, CAMPOS, FICHAS","").replace('Path(__file__).parent / "resultados"','Path("resultados_proy")').replace('if __name__=="__main__":\n    run()','')
cells=[md("# Sumabasto · Proyecto Final · Hito 1\nModelo candidato. Sin registros reales autorizados aún: no se declara cerrado el criterio 7. APF3 se conserva como referencia histórica.\n[Repositorio y datos](https://github.com/) — sustituir por enlace específico verificado antes de publicar."),
code("%pip install scikit-learn==1.7.2 pandas==2.3.3 numpy==2.2.6 scipy==1.15.3 joblib==1.5.2"),
md("## Generador preservado de APF3"),code(generator),
md("## Protocolo, validación temporal, prueba independiente y exportación"),code(training),
code("run()"),md("## Lectura del resultado\nLa selección por CV es previa al test. La regla al corte sigue siendo la referencia operativa si supera el candidato en MAE. La evidencia real queda pendiente."),code('pd.read_csv(OUT/"metricas.csv")')]
nb=dict(cells=cells,metadata={"kernelspec":{"display_name":"Python 3","language":"python","name":"python3"},"language_info":{"name":"python"}},nbformat=4,nbformat_minor=4)
for i,c in enumerate(cells): c["id"]=f"proy-{i:02}"
cells[0]["source"]=lines("# Sumabasto · Proyecto Final · Hito 1\nModelo candidato. Sin registros reales autorizados aún: no se declara cerrado el criterio 7. APF3 se conserva como referencia histórica.\nLos CSV se generan en resultados_proy al ejecutar el cuaderno.")
(p/"PROY_TD_Grupo8_ML.ipynb").write_text(json.dumps(nb,ensure_ascii=False,indent=1),encoding="utf-8")
