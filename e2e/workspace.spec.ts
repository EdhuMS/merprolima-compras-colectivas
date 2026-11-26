import { test, expect, type Page } from "@playwright/test";
const productId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
const monday = new Date(Date.parse(today) - ((new Date(today).getUTCDay()+6)%7)*86400000).toISOString().slice(0,10);
const product = { id: productId, name: "Azúcar rubia", brand: "Cartavio", kg: 50, category: "Azúcar" };

// Local browser fixtures only: no commercial activity or real authentication is claimed.
async function session(page: Page, role: "buyer" | "coordinator") {
  const token = ["eyJhbGciOiJIUzI1NiJ9", Buffer.from(JSON.stringify({ sub: userId, exp: 4102444800 })).toString("base64url"), "fixture"].join(".");
  await page.addInitScript(({ token, userId }) => {
    localStorage.setItem("sb-e2e-auth-token", JSON.stringify({ access_token: token,
      refresh_token: "local-fixture", token_type: "bearer", expires_at: 4102444800,
      user: { id: userId, aud: "authenticated", role: "authenticated", email: "fixture@example.test" } }));
  }, { token, userId });
  await page.route("https://e2e.supabase.co/**", async route => {
    const endpoint = new URL(route.request().url()).pathname.split("/").pop();
    const data = endpoint === "purchase_api" ? {
      schemaVersion: 1, identity: { role, stall: "Puesto local", origin: "simulated" }, products: [product],
      needs: [], quotes: [], participations: [],
    } : endpoint?.includes("forecast") ? [{ productId, week: monday, features: [5, 2, 1, 4] }] : [];
    await route.fulfill({ json: data });
  });
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("inicio, acceso y validación de formulario", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Compra en conjunto con otros puestos de tu mercado" })).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/iniciar-sesion/);
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page.getByText("Usa al menos ocho caracteres")).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: "Volver al inicio" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("tienda, formulario de necesidad y navegación", async ({ page }, info) => {
  await session(page, "buyer");
  await page.goto("/tienda/necesidades");
  await page.locator(".page-heading").getByRole("button", { name: "Nueva necesidad" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("tienda-necesidad.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Crear compra colectiva" })).toHaveCount(0);
});

test("coordinación, inferencia orientativa y caída del servicio", async ({ page }, info) => {
  await session(page, "coordinator");
  let failed = false;
  await page.route("http://127.0.0.1:8000/v1/forecast", async route => {
    const body = route.request().postDataJSON();
    expect(Object.keys(body).sort()).toEqual(["product_id", "week"]);
    await route.fulfill(failed ? { status: 503, json: { detail: "Servicio no disponible" } } : { json: {
      schema_version: 1, request_id: userId, product_id: productId, week: monday,
      model_version: "sumabasto-proy-candidato-v1", generated_at: new Date().toISOString(), data_origin: "simulated",
      status: "candidate", baseline: 4, estimate: 3.7, operational_quantity: 4, coverage: 1,
      uncertainty: null, uncertainty_reason: "Regresión sin intervalo predictivo calibrado; no es una probabilidad.", persisted: true,
    } });
  });
  await page.goto("/coordinacion/solicitudes");
  const query = page.getByRole("button", { name: "Consultar estimación orientativa" });
  await query.click();
  await expect(page.getByText("Referencia operativa al corte:")).toBeVisible();
  await expect(page.getByText(/Estimación orientativa: 3/)).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("coordinacion-resultado.png"), fullPage: true });
  failed = true;
  await query.click();
  await expect(page.getByRole("alert")).toContainText("Las solicitudes siguen disponibles");
  await expect(page.getByRole("button", { name: "Preparar propuesta" })).toBeEnabled();
});
