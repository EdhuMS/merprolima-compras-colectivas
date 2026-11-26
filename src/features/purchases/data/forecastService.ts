import { z } from "zod";
import { requireSupabase } from "../../../infrastructure/supabase/client";

const nonnegative = z.number().finite().nonnegative();
export const forecastResponseSchema = z.object({
  schema_version: z.literal(1), request_id: z.uuid(), product_id: z.uuid(),
  week: z.iso.date(), model_version: z.literal("sumabasto-proy-candidato-v1"),
  generated_at: z.iso.datetime({ offset: true }), data_origin: z.enum(["real", "simulated"]),
  status: z.enum(["candidate", "fallback"]), baseline: nonnegative,
  estimate: nonnegative.nullable(), operational_quantity: nonnegative,
  coverage: z.number().int().positive(), uncertainty: z.null(),
  uncertainty_reason: z.string(), persisted: z.literal(true),
}).refine(r => r.operational_quantity === r.baseline &&
  (r.status === "fallback" ? r.estimate === null : r.estimate !== null));
export type ServiceForecast = z.infer<typeof forecastResponseSchema>;

export async function requestForecast(productId: string, week: string): Promise<ServiceForecast> {
  const endpoint = import.meta.env.VITE_FORECAST_API_URL;
  if (!endpoint) throw new Error("El servicio de estimación aún no está configurado.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname)))
    throw new Error("El servicio requiere una conexión segura.");
  const { data, error } = await requireSupabase().auth.getSession();
  if (error || !data.session) throw new Error("Inicia sesión nuevamente.");
  const response = await fetch(new URL("/v1/forecast", url), {
    method: "POST", signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ product_id: productId, week }),
  });
  if (!response.ok) throw new Error(response.status === 422
    ? "El historial no cumple el dominio de la estimación."
    : "La estimación no está disponible. Revisa las solicitudes vigentes.");
  const result = forecastResponseSchema.parse(await response.json());
  const age = Date.now() - Date.parse(result.generated_at);
  if (result.product_id !== productId || result.week !== week || age > 120000 || age < -60000)
    throw new Error("La respuesta no corresponde a una consulta vigente.");
  return result;
}
