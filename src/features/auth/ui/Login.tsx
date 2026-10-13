import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { requireSupabase } from "../../../infrastructure/supabase/client";
const schema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(8, "Usa al menos ocho caracteres"),
});
export function Login({ onDemo }: { onDemo: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  return (
    <main className="min-h-screen grid place-items-center px-5 bg-[#f6f7f3]">
      <section className="white-panel w-full max-w-md">
        <p className="eyebrow">MERPROLIMA · PILOTO</p>
        <h1 className="text-3xl font-semibold mt-3">Accede a tu puesto.</h1>
        <p className="muted text-sm mt-3 leading-6">
          Usa la cuenta habilitada para el piloto. La cuenta debe tener un
          puesto y rol asignados por el administrador.
        </p>
        <form
          className="form"
          onSubmit={form.handleSubmit(async (values) => {
            setBusy(true);
            setMessage("");
            try {
              const { error } =
                await requireSupabase().auth.signInWithPassword(values);
              if (error) throw error;
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "No se pudo iniciar sesión",
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
            <input
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
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
            {busy ? "Conectando…" : "Iniciar sesión"}
          </Button>
          <Button type="button" variant="outline" onClick={onDemo}>
            Explorar demo sin cuenta
          </Button>
        </form>
        <p className="text-xs muted mt-6 leading-5">
          El registro público está cerrado en la aplicación. Solicita al equipo
          una cuenta del piloto. La demo utiliza únicamente datos ficticios.
        </p>
      </section>
    </main>
  );
}
