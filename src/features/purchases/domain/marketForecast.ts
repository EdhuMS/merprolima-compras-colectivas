import tree from "./tree-four-products.json";
import reference from "./colab-reference.json";
import type { Product } from "./model";

export type ForecastInput = { productId: string; week: string; features: number[]; stallIndex?: number; actual?: number | null };
const names = [
  ["cartavio", "azucar rubia", 20],
  ["costeno", "arroz extra", 23],
  ["faraon azul", "arroz extra anejo", 25],
  ["paramonga", "azucar rubia", 18],
] as const;
const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function productCategory(product: Product) {
  return product.kg === 50 ? names.findIndex(([brand, name]) =>
    normalize(product.brand) === brand && normalize(product.name) === name) : -1;
}

export function predictProduct(product: Product, input: ForecastInput) {
  const category = productCategory(product);
  if (category < 0 || input.features.length !== 4 || !input.features.every(Number.isFinite)) return undefined;
  const features = [
    ...Array<number>(8).fill(0),
    ...names.map((_, index) => Number(index === category)),
    ...input.features.map((value, index) => Math.fround((value - tree.media[index]) / tree.escala[index])),
  ];
  let node = 0;
  while (tree.left[node] !== -1) {
    node = features[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
  }
  return tree.value[node];
}

export function referenceInputs(products: Product[], stall?: number) {
  return products.flatMap(product => {
    const category = productCategory(product);
    if (category < 0) return [];
    return reference.rows.slice(category * 8, (category + 1) * 8)
      .flatMap(([last, sum3, sum8, registered], index) => stall === undefined || stall === index
        ? [{ productId: product.id, week: reference.week, features: [last, sum3 / 3, sum8 / 8, registered], stallIndex: index }]
        : []);
  });
}

export function marketForecasts(products: Product[], inputs: ForecastInput[]) {
  return products.flatMap(product => {
    const rows = inputs.filter(row => row.productId === product.id);
    const estimates = rows.flatMap(input => {
      const estimate = predictProduct(product, input);
      return estimate === undefined ? [] : [{ input, estimate }];
    });
    return estimates.length ? [{
      product, week: rows[0].week, stores: estimates.length, estimates, version: tree.version,
      referenceMinimum: rows[0].stallIndex === undefined ? undefined : names[productCategory(product)][2],
      estimate: estimates.reduce((total, row) => total + row.estimate, 0),
    }] : [];
  });
}
