-- APF2: explicit evidence, unknown costs, delivery estimate and controlled analytic extract.
alter table public.quotes add column evidence_type text not null default 'unclassified' check(evidence_type in ('written_quote','price_list','verbal','simulated','unclassified'));
alter table public.quotes add column delivery_estimate date;
create table private.need_revisions (
 id bigint generated always as identity primary key,
 need_id uuid not null, market_id uuid not null references public.markets(id), origin text not null,
 product_id uuid not null, needed_date date not null, qty integer not null, status text not null,
 mode text not null, revision_action text not null, occurred_at timestamptz not null default now()
);
alter table private.need_revisions enable row level security;
revoke all on private.need_revisions from public,anon,authenticated;
create index need_revisions_market_period_idx on private.need_revisions(market_id,origin,needed_date);
create function private.capture_need_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' and (new.product_id,new.needed_date,new.qty,new.status,new.mode) is not distinct from (old.product_id,old.needed_date,old.qty,old.status,old.mode) then return new; end if;
 insert into private.need_revisions(need_id,market_id,origin,product_id,needed_date,qty,status,mode,revision_action)
 select new.id,s.market_id,new.origin,new.product_id,new.needed_date,new.qty,new.status,new.mode,TG_OP from public.stalls s where s.id=new.stall_id;
 return new;
end; $$;
revoke all on function private.capture_need_revision() from public,anon,authenticated;
create trigger capture_need_revision after insert or update on public.needs for each row execute function private.capture_need_revision();
create function private.export_analytical(p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_member record; v_from date; v_to date; v_weekly jsonb; v_quotes jsonb; v_revisions jsonb;
begin
 if auth.uid() is null then raise exception 'Inicia sesión' using errcode='42501'; end if;
 select m.role,s.market_id,s.origin into v_member from public.memberships m join public.stalls s on s.id=m.stall_id where m.user_id=auth.uid() and m.active;
 if not found or v_member.role<>'coordinator' then raise exception 'Solo el coordinador exporta el análisis del mercado' using errcode='42501'; end if;
 v_from := (p_payload->>'from')::date; v_to := (p_payload->>'to')::date;
 if v_from is null or v_to is null or v_from>v_to or v_to-v_from>366 then raise exception 'Periodo inválido (máximo 366 días)'; end if;
 select coalesce(jsonb_agg(to_jsonb(g) order by g.week_start,g.product_id),'[]') into v_weekly from (
  select date_trunc('week',n.needed_date::timestamp)::date week_start,n.product_id,p.name product_name,p.brand,p.kg,n.mode,n.origin,sum(n.qty)::integer requested_package_qty,count(distinct n.stall_id)::integer active_stall_count
  from public.needs n join public.products p on p.id=n.product_id
  where p.market_id=v_member.market_id and n.origin=v_member.origin and n.status='open' and n.needed_date between v_from and v_to
  group by 1,n.product_id,p.name,p.brand,p.kg,n.mode,n.origin
 ) g;
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'product_id',q.product_id,'needed_date',q.needed_date,'mode',q.mode,'origin',q.origin,'individual',q.individual,'collective',q.collective,'minimum_qty',q.minimum_qty,'transport',q.transport,'distribution',q.distribution,'individual_transport',q.individual_transport,'valid_until',q.valid_until,'version',q.version,'evidence_type',q.evidence_type,'delivery_estimate',q.delivery_estimate)),'[]') into v_quotes
 from public.quotes q join public.products p on p.id=q.product_id where p.market_id=v_member.market_id and q.origin=v_member.origin and q.needed_date between v_from and v_to;
 select coalesce(jsonb_agg(jsonb_build_object('revision_id',r.id,'need_id',r.need_id,'product_id',r.product_id,'needed_date',r.needed_date,'qty',r.qty,'status',r.status,'mode',r.mode,'origin',r.origin,'action',r.revision_action,'occurred_at',r.occurred_at) order by r.id),'[]') into v_revisions
 from private.need_revisions r where r.market_id=v_member.market_id and r.origin=v_member.origin and r.needed_date between v_from and v_to;
 return jsonb_build_object('schema_version',2,'scope','market_analytical','data_origin',v_member.origin,'exported_at',now(),'period',jsonb_build_object('from',v_from,'to',v_to),'basis','needed_date','weekly_needs',v_weekly,'quotes',v_quotes,'need_revisions',v_revisions,'note','Necesidades declaradas, no ventas. Historial desde la aplicación de esta migración. Sin nombres, contactos, proveedor ni textos libres. Semana incompleta si el periodo corta sus límites. Datos pseudonimizados, no anonimización garantizada.');
end; $$;
revoke all on function private.export_analytical(jsonb) from public,anon,authenticated;
create or replace function private.purchase_api(p_action text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid(); v_member record; v_product public.products; v_need public.needs; v_quote public.quotes; v_id uuid; v_date date; v_mode text; v_key text; v_signature text; v_qty integer; v_total integer; v_expected text; v_own jsonb; v_other jsonb; v_products jsonb; v_quotes jsonb; v_parts jsonb; v_versions jsonb; v_freight jsonb;
begin
 if v_user is null then raise exception 'Inicia sesión para acceder al piloto' using errcode='42501'; end if;
 select m.role,s.* into v_member from public.memberships m join public.stalls s on s.id=m.stall_id where m.user_id=v_user and m.active;
 if not found then raise exception 'Tu cuenta aún no tiene un puesto habilitado para el piloto' using errcode='42501'; end if;
 -- All mutations for one market/origin serialize against confirmation. Locks release at commit.
 if p_action<>'read' then perform pg_advisory_xact_lock(hashtextextended(v_member.market_id::text||':'||v_member.origin,0)); end if;
 if p_action='export_analytical' then return private.export_analytical(p_payload); end if;
 if p_action='read' then
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'brand',p.brand,'kg',p.kg,'category',p.category) order by p.name),'[]') into v_products from public.products p where p.market_id=v_member.market_id and p.origin=v_member.origin;
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'stall',v_member.code,'productId',n.product_id,'qty',n.qty,'date',n.needed_date,'mode',n.mode,'status',n.status,'origin',n.origin,'createdAt',n.created_at,'participantCount',1,'sourceRef',n.source_ref)),'[]') into v_own from public.needs n where n.stall_id=v_member.id and n.origin=v_member.origin;
  select coalesce(jsonb_agg(jsonb_build_object('id','aggregate:'||g.product_id||':'||g.needed_date||':'||g.mode,'stall','Otros puestos','productId',g.product_id,'qty',g.qty,'date',g.needed_date,'mode',g.mode,'status','open','origin',v_member.origin,'createdAt',g.created_at,'participantCount',g.participants)),'[]') into v_other from (select n.product_id,n.needed_date,n.mode,sum(n.qty)::integer qty,count(distinct n.stall_id)::integer participants,min(n.created_at) created_at from public.needs n join public.products p on p.id=n.product_id where p.market_id=v_member.market_id and n.origin=v_member.origin and n.status='open' and n.stall_id<>v_member.id group by n.product_id,n.needed_date,n.mode) g;
  select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'productId',q.product_id,'supplier',q.supplier_code,'individual',q.individual,'collective',q.collective,'min',q.minimum_qty,'transport',q.transport,'distribution',q.distribution,'individualTransport',q.individual_transport,'validUntil',q.valid_until,'date',q.needed_date,'mode',q.mode,'version',q.version,'origin',q.origin,'payment',q.payment,'sourceRef',q.source_ref,'evidenceType',q.evidence_type,'deliveryEstimate',q.delivery_estimate)),'[]') into v_quotes from public.quotes q join public.products p on p.id=q.product_id where p.market_id=v_member.market_id and q.origin=v_member.origin;
  select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'stall',v_member.code,'groupKey',a.origin||'|'||a.product_id||'|'||a.needed_date||'|'||a.mode,'signature',a.signature,'status',a.status,'createdAt',a.created_at,'origin',a.origin)),'[]') into v_parts from public.participations a where a.stall_id=v_member.id;
  select coalesce(jsonb_object_agg(g.origin||'|'||g.product_id||'|'||g.needed_date||'|'||g.mode,private.group_signature(g.product_id,g.needed_date,g.mode,g.origin)),'{}') into v_versions from (select distinct n.product_id,n.needed_date,n.mode,n.origin from public.needs n join public.products p on p.id=n.product_id where p.market_id=v_member.market_id and n.origin=v_member.origin and n.status='open') g;
    with quantities as (
   select n.product_id,n.needed_date,n.mode,n.origin,n.stall_id,s.code,sum(n.qty)::numeric qty
   from public.needs n join public.stalls s on s.id=n.stall_id
   where s.market_id=v_member.market_id and n.origin=v_member.origin and n.status='open'
   group by n.product_id,n.needed_date,n.mode,n.origin,n.stall_id,s.code
  ), shares as (
   select g.*,round((q.transport+q.distribution)*100) cents,
    floor(round((q.transport+q.distribution)*100)*g.qty/sum(g.qty) over(partition by g.product_id,g.needed_date,g.mode,g.origin)) base,
    row_number() over(partition by g.product_id,g.needed_date,g.mode,g.origin order by g.code,g.stall_id) rank
   from quantities g join public.quotes q on q.product_id=g.product_id and q.needed_date=g.needed_date and q.mode=g.mode and q.origin=g.origin
  ), allocations as (
   select *,base+case when rank<=cents-sum(base) over(partition by product_id,needed_date,mode,origin) then 1 else 0 end assigned from shares
  )
  select coalesce(jsonb_object_agg(origin||'|'||product_id||'|'||needed_date||'|'||mode,assigned/100),'{}') into v_freight from allocations where stall_id=v_member.id;
  return jsonb_build_object('schemaVersion',1,'products',v_products,'needs',v_own||v_other,'quotes',v_quotes,'participations',v_parts,'groupVersions',v_versions,'groupFreight',v_freight,'identity',jsonb_build_object('stall',v_member.code,'role',v_member.role,'origin',v_member.origin));
 elsif p_action='create_product' then
  if v_member.role<>'coordinator' then raise exception 'Solo el coordinador administra el catálogo' using errcode='42501'; end if;
  insert into public.products(market_id,origin,name,brand,kg,category,source_ref) values(v_member.market_id,v_member.origin,p_payload->>'name',p_payload->>'brand',(p_payload->>'kg')::numeric,p_payload->>'category',p_payload->>'sourceRef') returning id into v_id;
 else
  v_id:=(p_payload->>'id')::uuid;
  if p_action='withdraw' then
   select * into v_need from public.needs where id=v_id and stall_id=v_member.id for update;
   if not found then raise exception 'No se encontró una necesidad de tu puesto'; end if;
   update public.needs set status='withdrawn',updated_at=now() where id=v_id;
  else
   select * into v_product from public.products where id=(p_payload->>'productId')::uuid and market_id=v_member.market_id and origin=v_member.origin;
   if not found then raise exception 'El producto no pertenece a tu entorno' using errcode='42501'; end if;
   v_date:=(p_payload->>'date')::date; v_mode:=p_payload->>'mode';
   if v_date is null or v_mode is null or v_mode not in ('delivery','pickup') then raise exception 'Fecha o modalidad inválida'; end if;
   if p_action='save_need' then
    v_qty:=(p_payload->>'qty')::integer;
    if v_date < (now() at time zone 'America/Lima')::date then raise exception 'La fecha no puede estar en el pasado'; end if;
    select * into v_need from public.needs where id=v_id;
    if found and v_need.stall_id<>v_member.id then raise exception 'No puedes editar otro puesto' using errcode='42501'; end if;
    insert into public.needs(id,stall_id,product_id,qty,needed_date,mode,origin,source_ref) values(v_id,v_member.id,v_product.id,v_qty,v_date,v_mode,v_member.origin,p_payload->>'sourceRef') on conflict(id) do update set product_id=excluded.product_id,qty=excluded.qty,needed_date=excluded.needed_date,mode=excluded.mode,source_ref=excluded.source_ref,updated_at=now();
   elsif p_action='quote' then
    if v_member.role<>'coordinator' then raise exception 'Solo el coordinador modifica cotizaciones' using errcode='42501'; end if;
    select * into v_quote from public.quotes where product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin;
    if found and v_quote.version<>coalesce((p_payload->>'expectedVersion')::integer,0) then raise exception 'La cotización cambió. Recarga y revisa la nueva versión'; end if;
    if coalesce(p_payload->>'evidenceType','') not in ('written_quote','price_list','verbal','simulated') then raise exception 'Clasifica el tipo de evidencia'; end if;
    if (v_member.origin='real') = (p_payload->>'evidenceType'='simulated') then raise exception 'La evidencia no corresponde al entorno'; end if;
    if (p_payload->>'validUntil')::timestamptz < now() then raise exception 'La vigencia no puede estar vencida'; end if;
    insert into public.quotes(product_id,needed_date,mode,origin,supplier_code,individual,collective,minimum_qty,transport,distribution,individual_transport,valid_until,payment,source_ref,evidence_type,delivery_estimate) values(v_product.id,v_date,v_mode,v_member.origin,p_payload->>'supplier',(p_payload->>'individual')::numeric,(p_payload->>'collective')::numeric,(p_payload->>'min')::integer,(p_payload->>'transport')::numeric,(p_payload->>'distribution')::numeric,(p_payload->>'individualTransport')::numeric,(p_payload->>'validUntil')::timestamptz,p_payload->>'payment',p_payload->>'sourceRef',p_payload->>'evidenceType',nullif(p_payload->>'deliveryEstimate','')::date) on conflict(product_id,needed_date,mode,origin) do update set supplier_code=excluded.supplier_code,individual=excluded.individual,collective=excluded.collective,minimum_qty=excluded.minimum_qty,transport=excluded.transport,distribution=excluded.distribution,individual_transport=excluded.individual_transport,valid_until=excluded.valid_until,payment=excluded.payment,source_ref=excluded.source_ref,evidence_type=excluded.evidence_type,delivery_estimate=excluded.delivery_estimate,version=public.quotes.version+1 returning id into v_id;
   elsif p_action='decide' then
    if p_payload->>'decision' is null or p_payload->>'decision' not in ('confirmed','declined') then raise exception 'Decisión inválida'; end if;
    select coalesce(sum(qty),0)::integer into v_qty from public.needs where stall_id=v_member.id and product_id=v_product.id and needed_date=v_date and mode=v_mode and status='open';
    if v_qty=0 then raise exception 'Registra una necesidad antes de participar'; end if;
    v_signature:=private.group_signature(v_product.id,v_date,v_mode,v_member.origin);
    if v_signature is distinct from p_payload->>'expectedSignature' then raise exception 'El volumen o la cotización cambió. Revisa la propuesta'; end if;
    if p_payload->>'decision'='confirmed' then
     select * into v_quote from public.quotes where product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin;
     if not found or v_quote.valid_until<now() then raise exception 'Falta una cotización vigente'; end if;
     select coalesce(sum(qty),0)::integer into v_total from public.needs where product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin and status='open';
     if v_total<v_quote.minimum_qty or v_quote.transport is null or v_quote.distribution is null or v_quote.individual_transport is null then raise exception 'Volumen o gastos insuficientes para confirmar'; end if;
    end if;
    insert into public.participations(stall_id,product_id,needed_date,mode,origin,signature,status) values(v_member.id,v_product.id,v_date,v_mode,v_member.origin,v_signature,p_payload->>'decision') on conflict(stall_id,product_id,needed_date,mode,origin) do update set signature=excluded.signature,status=excluded.status,created_at=now() returning id into v_id;
   else raise exception 'Operación desconocida'; end if;
  end if;
 end if;
 insert into public.purchase_events(actor_id,action,entity_id) values(v_user,p_action,v_id);
 return jsonb_build_object('id',v_id);
end; $$;

notify pgrst, 'reload schema';
