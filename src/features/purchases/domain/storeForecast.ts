import model from "./store-tree.json";

export const forecastSource = "APF3:arbol-puesto";
const products = [
  { key: "cartavio", id: "tester-cartavio-50", minimum: 20, individual: 185, collective: 183 },
  { key: "faraon", id: "tester-faraon-50", minimum: 25, individual: 197, collective: 195 },
] as const;

export function storeForecasts(caseIndex: number) {
  const scenario = model.cases[caseIndex];
  return products.map((product, category) => {
    const forecasts = scenario[product.key].map((history, stall) => {
      const estimate = predictStore(stall, category, history);
      return { stall: `TESTER-${String(stall + 1).padStart(2, "0")}`, estimate };
    });
    const estimate = forecasts.reduce((sum, row) => sum + row.estimate, 0);
    return { ...product, estimate, qualifies: estimate >= product.minimum, forecasts };
  });
}

export function predictStore(stall: number, category: number, history: number[]) {
  const inputs = [
    ...Array.from({ length: 8 }, (_, index) => Number(index === stall)),
    Number(category === 0), Number(category === 1),
    ...history.map((value, index) => Math.fround((value - model.media[index]) / model.escala[index])),
  ];
  let node = 0;
  while (model.left[node] !== -1) {
    node = inputs[model.feature[node]] <= model.threshold[node]
      ? model.left[node] : model.right[node];
  }
  return model.value[node];
}
