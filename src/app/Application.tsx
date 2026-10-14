import { FieldRecords } from "../features/field/ui/FieldRecords";
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
type Mode="field"|"test"|"pilot";
export function Application(){
 localStorage.removeItem("merprolima:demo:v1");
 const [mode,setMode]=useState<Mode>("field");const {session,loading}=useSession();const client=useQueryClient();
 const cloud=useMemo(()=>new SupabasePurchaseRepository(),[session?.user.id]);
 const tester=useMemo(()=>new LocalDemoRepository(demoSeed,products,"merprolima:testers:v2"),[]);
 const switchMode=(next:Mode)=>{client.clear();setMode(next);};
 if(mode==="field")return <FieldOverview onPilot={()=>switchMode("pilot")} onTest={()=>switchMode("test")} />;
 if(mode==="pilot"&&loading)return <p className="p-10">Comprobando sesión…</p>;
 if(mode==="pilot"&&!session)return <Login onDemo={()=>switchMode("field")} />;
 return <>{mode==="pilot"&&<FieldRecords />}<App key={`${mode}:${session?.user.id??"guest"}`} mode={mode==="test"?"demo":"pilot"} workspaceKey={mode==="test"?"tester":session!.user.id} repository={mode==="test"?tester:cloud} accountAction={<div className="flex gap-2"><Button variant="ghost" size="sm" onClick={()=>switchMode("field")}>Volver a entrevistas</Button>{mode==="pilot"&&<Button variant="outline" size="sm" onClick={async()=>{await requireSupabase().auth.signOut();client.clear();}}>Salir</Button>}</div>} /></>;
}
