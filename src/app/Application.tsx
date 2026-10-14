import { FieldOverview } from "../features/field/ui/FieldOverview";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { App } from "../features/purchases/ui/App";
import { Login } from "../features/auth/ui/Login";
import { useSession } from "../features/auth/data/useSession";
import { SupabasePurchaseRepository } from "../features/purchases/data/supabase";
import { LocalDemoRepository } from "../features/purchases/data/repository";
import { demoSeed, products } from "../features/purchases/data/seed";
import { requireSupabase } from "../infrastructure/supabase/client";
import { Button } from "../components/ui/button";
type Mode = "home" | "workspace" | "pilot";
export function Application() {
  const [selected, setSelected] = useState<Mode | null>(null);
  const { session, loading } = useSession();
  const client = useQueryClient();
  const cloud = useMemo(
    () => new SupabasePurchaseRepository(),
    [session?.user.id],
  );
  const local = useMemo(
    () => new LocalDemoRepository(demoSeed, products, "merprolima:testers:v2"),
    [],
  );
  const switchMode = (next: Mode) => {
    client.clear();
    setSelected(next);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };
  if (loading)
    return (
      <div className="loading-screen">
        <img className="sumabasto-logo" src="/brand/sumabasto-logo.png" alt="Sumabasto" />
        <p>Abriendo tu mercado…</p>
      </div>
    );
  const mode = selected ?? (session ? "pilot" : "home");
  if (mode === "home")
    return (
      <FieldOverview
        onPilot={() => switchMode("pilot")}
        onTest={() => switchMode("workspace")}
      />
    );
  if (mode === "pilot" && !session)
    return <Login onDemo={() => switchMode("home")} />;
  return (
    <App
      key={`${mode}:${session?.user.id ?? "guest"}`}
      mode={mode === "workspace" ? "demo" : "pilot"}
      workspaceKey={mode === "workspace" ? "tester" : session!.user.id}
      repository={mode === "workspace" ? local : cloud}
      accountAction={
        <div className="account-actions">
          <Button variant="ghost" size="sm" onClick={() => switchMode("home")}>
            Inicio
          </Button>
          {mode === "pilot" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await requireSupabase().auth.signOut();
                client.clear();
                setSelected("home");
              }}
            >
              Salir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchMode("pilot")}
            >
              Ingresar
            </Button>
          )}
        </div>
      }
    />
  );
}
