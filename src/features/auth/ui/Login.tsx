import { BrandLogo } from "../../../shared/ui/BrandLogo";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { requireSupabase } from "../../../infrastructure/supabase/client";
const schema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(8, "Usa al menos ocho caracteres"),
});
export function Login({ onDemo }: { onDemo: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  return (
    <main className="login-page">
      <section className="white-panel login-panel">
        <a
          href="#"
          className="landing-brand"
          onClick={(event) => {
            event.preventDefault();
            onDemo();
          }}
        >
          <BrandLogo />
        </a>
        <h1 className="text-3xl font-semibold mt-8">Ingresa a tu puesto</h1>
        <p className="muted text-sm mt-3 leading-6">
          Coordina tu reposición y consulta las propuestas del mercado.
        </p>
        <form
          className="form mt-6"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              setMessage("");
              setBusy(true);
              const { error } =
                await requireSupabase().auth.signInWithPassword(values);
              if (error) throw error;
            } catch (e) {
              setMessage(
                e instanceof Error && e.message === "Invalid login credentials"
                  ? "Revisa tu correo y contraseña."
                  : "No pudimos iniciar sesión. Revisa tus datos e inténtalo nuevamente.",
              );
            } finally {
              setBusy(false);
            }
          })}
        >
          <label>
            Correo
            <input
              type="email"
              autoComplete="username"
              placeholder="tu@correo.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <small className="error">
                {form.formState.errors.email.message}
              </small>
            )}
          </label>
          <label>
            Contraseña
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...form.register("password")}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {form.formState.errors.password && (
              <small className="error">
                {form.formState.errors.password.message}
              </small>
            )}
          </label>
          {message && (
            <p role="alert" className="error">
              {message}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Ingresando…" : "Iniciar sesión"}
          </Button>
          <Button type="button" variant="ghost" onClick={onDemo}>
            <ArrowLeft size={17} />
            Volver al inicio
          </Button>
        </form>
      </section>
    </main>
  );
}
