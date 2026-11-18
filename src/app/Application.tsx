import { navigate, usePathname } from "./navigation";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BrandLogo } from "../shared/ui/BrandLogo";
import { FieldOverview } from "../features/field/ui/FieldOverview";
import { App } from "../features/purchases/ui/App";
import { Login } from "../features/auth/ui/Login";
import { useSession } from "../features/auth/data/useSession";
import { SupabasePurchaseRepository } from "../features/purchases/data/supabase";
import { requireSupabase } from "../infrastructure/supabase/client";
import { Button } from "../components/ui/button";

export function Application() {
  const pathname = usePathname();
  const { session, loading } = useSession();
  const client = useQueryClient();
  const repository = useMemo(() => new SupabasePurchaseRepository(), [session?.user.id]);

  if (loading) return <div className="loading-screen"><BrandLogo /><p>Cargando Sumabasto…</p></div>;
  if (!session) return pathname !== "/"
    ? <Login onBack={() => navigate("/", true)} />
    : <FieldOverview onPilot={() => navigate("/iniciar-sesion")} />;

  return (
    <App key={session.user.id} mode="pilot" workspaceKey={session.user.id} repository={repository}
      accountAction={<Button variant="ghost" size="sm" onClick={async () => {
        const { error } = await requireSupabase().auth.signOut();
        if (!error) {
          client.clear();
          navigate("/", true);
        }
      }}>Salir</Button>}
    />
  );
}
