begin;
insert into public.products(market_id,origin,name,brand,kg,category,source_ref)
select distinct p.market_id,'simulated',v.name,v.brand,0.5,v.category,'PROY catálogo revisado'
from public.products p
cross join (values ('Espagueti','Don Vittorio','Fideos'), ('Lentejas','Costeño','Lentejas')) v(name,brand,category)
where p.origin='simulated' and p.brand='Cartavio' and p.kg=50
on conflict (market_id,origin,name,brand,kg) do nothing;

-- Seed only the existing presentation account. These requests exercise the
-- live integration and are independent of the 30 reserved evaluation cases.
with demo as (
  select s.id, s.market_id
  from public.memberships m
  join auth.users u on u.id=m.user_id
  join public.stalls s on s.id=m.stall_id
  where u.email='cliente1@sumabasto.test' and m.active and m.role='buyer'
    and s.origin='simulated'
), fixture as (
  select d.id stall_id,p.id product_id,w.offset_weeks,
    date_trunc('week',now() at time zone 'America/Lima')::date - 7*w.offset_weeks as monday
  from demo d
  join public.products p on p.market_id=d.market_id and p.origin='simulated'
    and (p.brand,p.name,p.kg) in (('Don Vittorio','Espagueti',0.5),('Costeño','Lentejas',0.5))
  cross join generate_series(0,8) w(offset_weeks)
)
insert into public.needs(id,stall_id,product_id,qty,needed_date,mode,status,origin,source_ref,created_at,updated_at)
select md5('proy-catalogo-v1:' || stall_id || ':' || product_id || ':' || monday)::uuid,
  stall_id,product_id,1+offset_weeks%4,monday+3,'delivery','open','simulated',
  'PROY demostración de catálogo revisado',
  (monday-2)::timestamp at time zone 'America/Lima',
  (monday-2)::timestamp at time zone 'America/Lima'
from fixture
on conflict (id) do nothing;
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
  if coalesce(p_result->>'model_version','') not in ('sumabasto-proy-candidato-v1','sumabasto-proy-catalogo-24-meses-v1')
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
