alter table public.participations drop constraint participations_status_check;
alter table public.participations add constraint participations_status_check check(status in ('confirmed','declined','pending'));
-- Coordination manages proposals; only buyers declare needs or participate.
-- Only presentation coordinator requests are withdrawn, not deleted. Revision triggers preserve history.
update public.needs n set status='withdrawn',updated_at=now()
where n.status='open' and n.origin='simulated' and exists(select 1 from public.memberships m join public.stalls s on s.id=m.stall_id join public.markets ma on ma.id=s.market_id where m.stall_id=n.stall_id and m.role='coordinator' and m.active and s.origin='simulated' and ma.name='Merprolima · Presentación');
update public.participations a set status='declined'
where a.status='confirmed' and a.origin='simulated' and exists(select 1 from public.memberships m join public.stalls s on s.id=m.stall_id join public.markets ma on ma.id=s.market_id where m.stall_id=a.stall_id and m.role='coordinator' and m.active and s.origin='simulated' and ma.name='Merprolima · Presentación');

create or replace function private.purchase_api(p_action text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_decision text; v_user uuid:=auth.uid(); v_member record; v_product public.products; v_need public.needs; v_quote public.quotes; v_id uuid; v_date date; v_mode text; v_key text; v_signature text; v_qty integer; v_total integer; v_expected text; v_own jsonb; v_other jsonb; v_products jsonb; v_quotes jsonb; v_parts jsonb; v_versions jsonb; v_freight jsonb;
begin
 if v_user is null then raise exception 'Inicia sesión para acceder al piloto' using errcode='42501'; end if;
 select m.role,s.* into v_member from public.memberships m join public.stalls s on s.id=m.stall_id where m.user_id=v_user and m.active;
 if not found then raise exception 'Tu cuenta aún no tiene un puesto habilitado para el piloto' using errcode='42501'; end if;
 -- All mutations for one market/origin serialize against confirmation. Locks release at commit.
 if p_action<>'read' then perform pg_advisory_xact_lock(hashtextextended(v_member.market_id::text||':'||v_member.origin,0)); end if;
 if v_member.role='coordinator' and p_action in ('save_need','withdraw','decide') then raise exception 'La cuenta de coordinación solo gestiona propuestas y necesidades recibidas' using errcode='42501'; end if;
 if p_action='export_analytical' then return private.export_analytical(p_payload); end if;
 if p_action='read' then
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'brand',p.brand,'kg',p.kg,'category',p.category) order by p.name),'[]') into v_products from public.products p where p.market_id=v_member.market_id and p.origin=v_member.origin;
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'stall',v_member.code,'productId',n.product_id,'qty',n.qty,'date',n.needed_date,'mode',n.mode,'status',n.status,'origin',n.origin,'createdAt',n.created_at,'participantCount',1,'sourceRef',n.source_ref)),'[]') into v_own from public.needs n where n.stall_id=v_member.id and n.origin=v_member.origin and v_member.role='buyer';
  select coalesce(jsonb_agg(jsonb_build_object('id','aggregate:'||g.product_id||':'||g.needed_date||':'||g.mode,'stall','Otros puestos','productId',g.product_id,'qty',g.qty,'date',g.needed_date,'mode',g.mode,'status','open','origin',v_member.origin,'createdAt',g.created_at,'participantCount',g.participants)),'[]') into v_other from (select n.product_id,n.needed_date,n.mode,sum(n.qty)::integer qty,count(distinct n.stall_id)::integer participants,min(n.created_at) created_at from public.needs n join public.products p on p.id=n.product_id where p.market_id=v_member.market_id and n.origin=v_member.origin and n.status='open' and n.stall_id<>v_member.id group by n.product_id,n.needed_date,n.mode) g;
  select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'productId',q.product_id,'supplier',q.supplier_code,'individual',q.individual,'collective',q.collective,'min',q.minimum_qty,'transport',q.transport,'distribution',q.distribution,'individualTransport',q.individual_transport,'validUntil',q.valid_until,'date',q.needed_date,'mode',q.mode,'version',q.version,'origin',q.origin,'payment',q.payment,'sourceRef',q.source_ref,'evidenceType',q.evidence_type,'deliveryEstimate',q.delivery_estimate)),'[]') into v_quotes from public.quotes q join public.products p on p.id=q.product_id where p.market_id=v_member.market_id and q.origin=v_member.origin;
  select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'stall',v_member.code,'groupKey',a.origin||'|'||a.product_id||'|'||a.needed_date||'|'||a.mode,'signature',a.signature,'status',a.status,'createdAt',a.created_at,'origin',a.origin)),'[]') into v_parts from public.participations a where a.stall_id=v_member.id and v_member.role='buyer';
  select coalesce(jsonb_object_agg(g.origin||'|'||g.product_id||'|'||g.needed_date||'|'||g.mode,private.group_signature(g.product_id,g.needed_date,g.mode,g.origin)),'{}') into v_versions from (select distinct n.product_id,n.needed_date,n.mode,n.origin from public.needs n join public.products p on p.id=n.product_id where p.market_id=v_member.market_id and n.origin=v_member.origin and n.status='open' union select q.product_id,q.needed_date,q.mode,q.origin from public.quotes q join public.products p on p.id=q.product_id where p.market_id=v_member.market_id and q.origin=v_member.origin) g;
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
    insert into public.needs(id,stall_id,product_id,qty,needed_date,mode,origin,source_ref) values(v_id,v_member.id,v_product.id,v_qty,v_date,v_mode,v_member.origin,coalesce(nullif(trim(p_payload->>'sourceRef'),''),v_need.source_ref,'APP:'||v_id::text)) on conflict(id) do update set product_id=excluded.product_id,qty=excluded.qty,needed_date=excluded.needed_date,mode=excluded.mode,source_ref=excluded.source_ref,updated_at=now();
   elsif p_action='quote' then
    if v_member.role<>'coordinator' then raise exception 'Solo el coordinador modifica cotizaciones' using errcode='42501'; end if;
    select * into v_quote from public.quotes where product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin;
    if found and v_quote.version<>coalesce((p_payload->>'expectedVersion')::integer,0) then raise exception 'La cotización cambió. Recarga y revisa la nueva versión'; end if;
    if coalesce(p_payload->>'evidenceType','') not in ('written_quote','price_list','verbal','simulated') then raise exception 'Clasifica el tipo de evidencia'; end if;
    if (v_member.origin='real') = (p_payload->>'evidenceType'='simulated') then raise exception 'La evidencia no corresponde al entorno'; end if;
    if (p_payload->>'validUntil')::timestamptz < now() then raise exception 'La vigencia no puede estar vencida'; end if;
    insert into public.quotes(product_id,needed_date,mode,origin,supplier_code,individual,collective,minimum_qty,transport,distribution,individual_transport,valid_until,payment,source_ref,evidence_type,delivery_estimate) values(v_product.id,v_date,v_mode,v_member.origin,p_payload->>'supplier',(p_payload->>'individual')::numeric,(p_payload->>'collective')::numeric,(p_payload->>'min')::integer,(p_payload->>'transport')::numeric,(p_payload->>'distribution')::numeric,(p_payload->>'individualTransport')::numeric,(p_payload->>'validUntil')::timestamptz,p_payload->>'payment',p_payload->>'sourceRef',p_payload->>'evidenceType',nullif(p_payload->>'deliveryEstimate','')::date) on conflict(product_id,needed_date,mode,origin) do update set supplier_code=excluded.supplier_code,individual=excluded.individual,collective=excluded.collective,minimum_qty=excluded.minimum_qty,transport=excluded.transport,distribution=excluded.distribution,individual_transport=excluded.individual_transport,valid_until=excluded.valid_until,payment=excluded.payment,source_ref=excluded.source_ref,evidence_type=excluded.evidence_type,delivery_estimate=excluded.delivery_estimate,version=public.quotes.version+1 returning id into v_id;
   elsif p_action='decide' then
    v_decision:=p_payload->>'decision';
    if p_payload->>'decision' is null or p_payload->>'decision' not in ('confirmed','declined') then raise exception 'Decisión inválida'; end if;
    v_signature:=private.group_signature(v_product.id,v_date,v_mode,v_member.origin);
    if v_signature is distinct from p_payload->>'expectedSignature' then raise exception 'El volumen o la cotización cambió. Revisa la propuesta'; end if;
    select coalesce(sum(qty),0)::integer into v_qty from public.needs where stall_id=v_member.id and product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin and status='open';
    if p_payload->>'decision'='confirmed' then
     if v_date < (now() at time zone 'America/Lima')::date then raise exception 'La fecha de esta compra ya pasó'; end if;
     select * into v_quote from public.quotes where product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin;
     if not found or v_quote.valid_until<now() then raise exception 'Falta una propuesta publicada con cotización vigente'; end if;
     if v_qty=0 then
      if coalesce(p_payload->>'qty','') !~ '^[0-9]{1,3}$' then raise exception 'Indica una cantidad entera entre 1 y 500 sacos'; end if;
      v_qty:=(p_payload->>'qty')::integer;
      if v_qty not between 1 and 500 then raise exception 'Indica una cantidad entre 1 y 500 sacos'; end if;
      v_id:=gen_random_uuid();
      insert into public.needs(id,stall_id,product_id,qty,needed_date,mode,origin,source_ref)
      values(v_id,v_member.id,v_product.id,v_qty,v_date,v_mode,v_member.origin,'APP:JOIN:'||v_id::text);
     elsif p_payload ? 'qty' and (p_payload->>'qty')::integer is distinct from v_qty then
      raise exception 'Tu cantidad cambió. Revisa el pedido antes de confirmar';
     end if;
     select coalesce(sum(qty),0)::integer into v_total from public.needs where product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin and status='open';
     if v_total<v_quote.minimum_qty or v_quote.transport is null or v_quote.distribution is null or v_quote.individual_transport is null then v_decision:='pending'; end if;
    elsif not exists(select 1 from public.participations where stall_id=v_member.id and product_id=v_product.id and needed_date=v_date and mode=v_mode and origin=v_member.origin) then
     raise exception 'No tienes una participación que retirar';
    end if;
    v_signature:=private.group_signature(v_product.id,v_date,v_mode,v_member.origin);
    insert into public.participations(stall_id,product_id,needed_date,mode,origin,signature,status) values(v_member.id,v_product.id,v_date,v_mode,v_member.origin,v_signature,v_decision) on conflict(stall_id,product_id,needed_date,mode,origin) do update set signature=excluded.signature,status=excluded.status,created_at=now() returning id into v_id;
   else raise exception 'Operación desconocida'; end if;
  end if;
 end if;
 insert into public.purchase_events(actor_id,action,entity_id) values(v_user,p_action,v_id);
 return jsonb_build_object('id',v_id);
end; $$;

notify pgrst, 'reload schema';
