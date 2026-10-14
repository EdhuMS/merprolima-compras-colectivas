import { FieldRecords } from "../features/field/ui/FieldRecords";
import { FieldOverview } from "../features/field/ui/FieldOverview";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { App } from "../features/purchases/ui/App";
import { Login } from "../features/auth/ui/Login";
import { useSession } from "../features/auth/data/useSession";
import { SupabasePurchaseRepository } from "../features/purchases/data/supabase";

import { requireSupabase, supabase } from "../infrastructure/supabase/client";
import { Button } from "../components/ui/button";
export function Application() {
  localStorage.removeItem("merprolima:demo:v1");
  const [mode, setMode] = useState<"demo" | "pilot">("demo");
  const { session, loading } = useSession();
  const client = useQueryClient();
  const cloud = useMemo(
    () => new SupabasePurchaseRepository(),
    [session?.user.id],
  );
  if(mode === "demo") return <FieldOverview onPilot={()=>{client.clear();setMode("pilot");}} />;
  if (mode === "pilot" && loading)
    return <p className="p-10">Comprobando sesiÃƒÆ’Ã‚Â³nÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦</p>;
  if (mode === "pilot" && !session)
    return <Login onDemo={() => setMode("demo")} />;
  const switchMode = (next: "demo" | "pilot") => {
    client.clear();
    setMode(next);
  };
  return (
    <><FieldRecords /><App
      key={`${mode}:${session?.user.id ?? "guest"}`}
      mode="pilot"
      workspaceKey={session!.user.id}
      repository={cloud}
      accountAction={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => switchMode("demo")}
            disabled={!supabase}
          >
            Volver a entrevistas
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
    /></>
  );
}
