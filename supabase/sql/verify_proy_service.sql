-- Authorized synthetic smoke test. All inserted rows are rolled back.
begin;
do $$
begin
  assert not has_function_privilege('anon','public.record_proy_forecast(uuid,jsonb)','execute');
  assert not has_function_privilege('authenticated','public.record_proy_forecast(uuid,jsonb)','execute');
  assert has_function_privilege('service_role','public.record_proy_forecast(uuid,jsonb)','execute');
  assert not has_table_privilege('authenticated','private.proy_predictions','select,insert');
end;
$$;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
do $$
declare u uuid; p uuid; r uuid:=gen_random_uuid(); found_id uuid; payload jsonb;
begin
  select m.user_id,pd.id into u,p from public.memberships m
  join public.stalls s on s.id=m.stall_id
  join public.products pd on pd.market_id=s.market_id and pd.origin=s.origin
  where m.active and s.origin='simulated' and pd.kg=50 and pd.brand='Cartavio' limit 1;
  if u is null then raise exception 'No simulated context for verification'; end if;
  payload:=jsonb_build_object('schema_version',1,'request_id',r,'product_id',p,
    'week',date_trunc('week',now() at time zone 'America/Lima')::date,
    'model_version','sumabasto-proy-candidato-v1','generated_at',now(),'data_origin','simulated',
    'status','candidate','baseline',4,'estimate',3.7,'operational_quantity',4,'coverage',1,'uncertainty',null,
    'model_sha256','abc4f18d092a45ea17a8ccc2085ffa3e1bfb2480cccbbb60afb7864a4c19263f',
    'input_snapshot',jsonb_build_object('producto','CARTAVIO-50KG','fields',jsonb_build_array('ultima','media_3','media_8','al_corte'),
      'features',jsonb_build_array(jsonb_build_array(5,2,1,4))));
  found_id:=public.record_proy_forecast(u,payload);
  assert found_id=r and exists(select 1 from private.proy_predictions where request_id=r
    and baseline=4 and estimate=3.7 and input_snapshot->>'producto'='CARTAVIO-50KG'
    and uncertainty is null and length(model_sha256)=64);
  perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
  begin
    perform public.record_proy_forecast(u,payload);
    raise exception 'Unauthenticated service write unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
select 'permissions_and_persistence_passed_rolled_back' as test;
