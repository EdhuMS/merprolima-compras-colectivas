import type { Product, Store } from "../domain/model";
export const products: Product[]=[];
export const stalls: string[]=[];
export function demoSeed(): Store {return {schemaVersion:1,needs:[],quotes:[],participations:[]};}
