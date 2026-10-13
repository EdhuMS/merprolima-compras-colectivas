import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { App } from "../features/purchases/ui/App";
import { Login } from "../features/auth/ui/Login";
import { useSession } from "../features/auth/data/useSession";
import { SupabasePurchaseRepository } from "../features/purchases/data/supabase";
import { repository as demoRepository } from "../features/purchases/data/repository";
import { requireSupabase, supabase } from "../infrastructure/supabase/client";
import { Button } from "../components/ui/button";
export function Application() {
  const [mode, setMode] = useState<"demo" | "pilot">("demo");
  const { session, loading } = useSession();
  const client = useQueryClient();
  const cloud = useMemo(
    () => new SupabasePurchaseRepository(),
    [session?.user.id],
  );
  if (mode === "pilot" && loading)
    return <p className="p-10">Comprobando sesión…</p>;
  if (mode === "pilot" && !session)
    return <Login onDemo={() => setMode("demo")} />;
  const switchMode = (next: "demo" | "pilot") => {
    client.clear();
    setMode(next);
  };
  return (
    <App
      key={`${mode}:${session?.user.id ?? "guest"}`}
      mode={mode}
      workspaceKey={mode === "demo" ? "demo" : session!.user.id}
      repository={mode === "demo" ? demoRepository : cloud}
      accountAction={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => switchMode(mode === "demo" ? "pilot" : "demo")}
            disabled={!supabase}
          >
            {mode === "demo" ? "Acceder al piloto" : "Ir a demo"}
          </Button>
          {mode === "pilot" && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await requireSupabase().auth.signOut();
                client.clear();
              }}
            >
              Salir
            </Button>
          )}
        </div>
      }
    />
  );
}
