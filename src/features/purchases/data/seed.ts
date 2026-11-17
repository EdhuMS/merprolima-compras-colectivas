import type { Product, Store } from "../domain/model";
export const products: Product[] = [{id:"tester-faraon-50",name:"Arroz extra añejo",brand:"Faraón Azul",kg:50,category:"Arroz"}, {id:"tester-cartavio-50",name:"Azúcar rubia",brand:"Cartavio",kg:50,category:"Azúcar"}];
export const stalls = Array.from({ length: 8 }, (_, index) => "TESTER-" + String(index + 1).padStart(2, "0"));
export function demoSeed(): Store {
 const now=new Date();const date=new Date(now.getTime()+3*86400000).toLocaleDateString("en-CA",{timeZone:"America/Lima"});
 return {schemaVersion:1,needs:[3,5].map((qty,i)=>({id:"tester-n"+i,stall:stalls[i],productId:products[0].id,qty,date,mode:"pickup",status:"open",origin:"simulated",createdAt:now.toISOString(),sourceRef:"TESTER: cantidad de caso, no entrevista"})),quotes:[{id:"tester-q",productId:products[0].id,supplier:"Salima · caso de testers",evidenceType:"simulated",individual:197,collective:195,min:8,transport:null,distribution:null,individualTransport:null,validUntil:new Date(now.getTime()+7*86400000).toISOString(),date,mode:"pickup",version:1,origin:"simulated",payment:"Caso de testers: sin orden ni pago",sourceRef:"https://salima.pe/producto/SL100024/arroz-extra-anejo-faraon-azul-x-50-kg · consulta 13/10; mínimo 8 y fechas son entradas de prueba, no condición del vendedor",deliveryEstimate:null}],participations:[]};
}
