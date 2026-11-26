-- Additive PROY logging; APF3 tables and RPCs are preserved.
begin;
create table private.proy_predictions (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id),
  market_id uuid not null references public.markets(id),
  role text not null check (role in ('buyer','coordinator')),
  origin text not null check (origin in ('simulated','real')),
  product_id uuid not null references public.products(id),
  week date not null check (extract(isodow from week)=1),
  model_version text not null,
  status text not null check (status in ('candidate','fallback')),
  baseline numeric not null check (baseline>=0),
  estimate numeric check (estimate>=0),
  coverage integer not null check (coverage>0),
  input_snapshot jsonb not null,
  model_sha256 text not null check (length(model_sha256)=64),
  uncertainty jsonb,
  generated_at timestamptz not null,
  recorded_at timestamptz not null default now()
);
alter table private.proy_predictions enable row level security;
revoke all on private.proy_predictions from public, anon, authenticated;
create index proy_predictions_user_week on private.proy_predictions(user_id,week);

-- Only trusted inference service may persist outputs. No client INSERT privilege.
create function public.record_proy_forecast(p_user uuid, p_result jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  member record;
  prediction_id uuid := (p_result->>'request_id')::uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'Solo el servicio registra predicciones' using errcode='42501';
  end if;
  select m.role,s.market_id,s.origin into member from public.memberships m
  join public.stalls s on s.id=m.stall_id
  where m.user_id=p_user and m.active and m.role in ('buyer','coordinator');
  if not found then
    raise exception 'Membresía inválida' using errcode='42501';
  end if;
  if p_result->>'data_origin' is distinct from member.origin or not exists (
    select 1 from public.products p where p.id=(p_result->>'product_id')::uuid
    and p.market_id=member.market_id and p.origin=member.origin
  ) then
    raise exception 'Producto u origen inválido' using errcode='42501';
  end if;
  if p_result->>'model_version' <> 'sumabasto-proy-candidato-v1'
     or p_result->>'schema_version' <> '1'
     or coalesce(p_result->'uncertainty','null'::jsonb) <> 'null'::jsonb
     or (p_result->>'operational_quantity')::numeric <> (p_result->>'baseline')::numeric then
    raise exception 'Contrato inválido' using errcode='22023';
  end if;
  insert into private.proy_predictions(request_id,user_id,market_id,role,origin,product_id,
    week,model_version,status,baseline,estimate,coverage,input_snapshot,model_sha256,uncertainty,generated_at)
  values(prediction_id,p_user,member.market_id,member.role,member.origin,
    (p_result->>'product_id')::uuid,(p_result->>'week')::date,p_result->>'model_version',
    p_result->>'status',(p_result->>'baseline')::numeric,(p_result->>'estimate')::numeric,
    (p_result->>'coverage')::integer,p_result->'input_snapshot',p_result->>'model_sha256',
    null,(p_result->>'generated_at')::timestamptz);
  return prediction_id;
end;
$$;
revoke all on function public.record_proy_forecast(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_proy_forecast(uuid,jsonb) to service_role;
commit;
