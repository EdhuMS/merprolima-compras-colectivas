begin;
alter table private.proy_predictions add column input_snapshot jsonb not null, add column model_sha256 text not null check(length(model_sha256)=64);
create or replace function public.record_proy_forecast(p_user uuid, p_result jsonb)
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
