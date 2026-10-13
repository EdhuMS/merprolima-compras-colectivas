import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    value,
  );

export const dateLabel=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'short'});
