create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.markets (id uuid primary key default gen_random_uuid(), name text not null unique);
create table public.stalls (id uuid primary key default gen_random_uuid(), market_id uuid not null references public.markets(id), code text not null, origin text not null check(origin in ('real','simulated')), unique(market_id,code,origin));
create table public.memberships (user_id uuid primary key references auth.users(id), stall_id uuid not null references public.stalls(id), role text not null check(role in ('buyer','coordinator')), active boolean not null default true);
create table public.products (id uuid primary key default gen_random_uuid(), market_id uuid not null references public.markets(id), origin text not null check(origin in ('real','simulated')), name text not null check(length(name) between 2 and 120), brand text not null check(length(brand) between 2 and 80), kg numeric(8,2) not null check(kg>0), category text not null, source_ref text not null check(length(source_ref)>0), unique(market_id,origin,name,brand,kg));
create table public.needs (id uuid primary key, stall_id uuid not null references public.stalls(id), product_id uuid not null references public.products(id), qty integer not null check(qty between 1 and 500), needed_date date not null, mode text not null check(mode in ('delivery','pickup')), status text not null default 'open' check(status in ('open','withdrawn')), origin text not null check(origin in ('real','simulated')), source_ref text not null check(length(source_ref)>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.quotes (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id), needed_date date not null, mode text not null check(mode in ('delivery','pickup')), origin text not null check(origin in ('real','simulated')), supplier_code text not null, individual numeric(12,2) not null check(individual>0), collective numeric(12,2) not null check(collective>0), minimum_qty integer not null check(minimum_qty>0), transport numeric(12,2) check(transport>=0), distribution numeric(12,2) check(distribution>=0), individual_transport numeric(12,2) check(individual_transport>=0), valid_until timestamptz not null, payment text not null, source_ref text not null check(length(source_ref)>0), version integer not null default 1, created_at timestamptz not null default now(), unique(product_id,needed_date,mode,origin));
create table public.participations (id uuid primary key default gen_random_uuid(), stall_id uuid not null references public.stalls(id), product_id uuid not null references public.products(id), needed_date date not null, mode text not null, origin text not null check(origin in ('real','simulated')), signature text not null, status text not null check(status in ('confirmed','declined')), created_at timestamptz not null default now(), unique(stall_id,product_id,needed_date,mode,origin));
create table public.purchase_events (id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id), action text not null, entity_id uuid, occurred_at timestamptz not null default now());
create index stalls_market_idx on public.stalls(market_id);
create index memberships_stall_idx on public.memberships(stall_id);
create index products_market_idx on public.products(market_id);
create index needs_stall_idx on public.needs(stall_id);
create index needs_group_idx on public.needs(product_id,needed_date,mode,origin) where status='open';
create index quotes_product_idx on public.quotes(product_id);
create index participations_product_idx on public.participations(product_id);
create index events_actor_idx on public.purchase_events(actor_id);
insert into public.markets(name) values ('Merprolima');

alter table public.markets enable row level security;
alter table public.stalls enable row level security;
alter table public.memberships enable row level security;
alter table public.products enable row level security;
alter table public.needs enable row level security;
alter table public.quotes enable row level security;
alter table public.participations enable row level security;
alter table public.purchase_events enable row level security;
revoke all on public.markets,public.stalls,public.memberships,public.products,public.needs,public.quotes,public.participations,public.purchase_events from anon,authenticated;
grant select on public.memberships to authenticated;
create policy own_membership on public.memberships for select to authenticated using(user_id=(select auth.uid()));
-- Business rows are accessible only through the authorized RPC, not raw REST reads/writes.

create function private.group_signature(p_product uuid,p_date date,p_mode text,p_origin text) returns text language sql stable set search_path='' as $$
 select md5(coalesce((select string_agg(n.id::text||':'||n.qty::text,',' order by n.id) from public.needs n where n.product_id=p_product and n.needed_date=p_date and n.mode=p_mode and n.origin=p_origin and n.status='open'),'') || ':' || coalesce((select q.id::text||':'||q.version::text from public.quotes q where q.product_id=p_product and q.needed_date=p_date and q.mode=p_mode and q.origin=p_origin),''));
$$;
revoke all on function private.group_signature(uuid,date,text,text) from public,anon,authenticated;

create function private.purchase_api(p_action text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid:=auth.uid(); v_member record; v_product public.products; v_need public.needs; v_quote public.quotes; v_id uuid; v_date date; v_mode text; v_key text; v_signature text; v_qty integer; v_total integer; v_expected text; v_own jsonb; v_other jsonb; v_products jsonb; v_quotes jsonb; v_parts jsonb; v_versions jsonb; v_freight jsonb;
begin
 if v_user is null then raise exception 'Inicia sesión para acceder al piloto' using errcode='42501'; end if;
 select m.role,s.* into v_member from public.memberships m join public.stalls s on s.id=m.stall_id where m.user_id=v_user and m.active;
 if not found then raise exception 'Tu cuenta aún no tiene un puesto habilitado para el piloto' using errcode='42501'; end if;
 -- All mutations for one market/origin serialize against confirmation. Locks release at commit.
 if p_action<>'read' then perform pg_advisory_xact_lock(hashtextextended(v_member.market_id::text||':'||v_member.origin,0)); end if;
 if p_action='read' then
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'brand',p.brand,'kg',p.kg,'category',p.category) order by p.name),'[]') into v_products from public.products p where p.market_id=v_member.market_id and p.origin=v_member.origin;
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'stall',v_member.code,'productId',n.product_id,'qty',n.qty,'date',n.needed_date,'mode',n.mode,'status',n.status,'origin',n.origin,'createdAt',n.created_at,'participantCount',1,'sourceRef',n.source_ref)),'[]') into v_own from public.needs n where n.stall_id=v_member.id and n.origin=v_member.origin;
  select coalesce(jsonb_agg(jsonb_build_object('id','aggregate:'||g.product_id||':'||g.needed_date||':'||g.mode,'stall','Otros puestos','productId',g.product_id,'qty',g.qty,'date',g.needed_date,'mode',g.mode,'status','open','origin',v_member.origin,'createdAt',g.created_at,'participantCount',g.participants)),'[]') into v_other from (select n.product_id,n.needed_date,n.mode,sum(n.qty)::integer qty,count(distinct n.stall_id)::integer participants,min(n.created_at) created_at from public.needs n join public.products p on p.id=n.product_id where p.market_id=v_member.market_id and n.origin=v_member.origin and n.status='open' and n.stall_id<>v_member.id group by n.product_id,n.needed_date,n.mode) g;
  select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'productId',q.product_id,'supplier',q.supplier_code,'individual',q.individual,'collective',q.collective,'min',q.minimum_qty,'transport',q.transport,'distribution',q.distribution,'individualTransport',q.individual_transport,'validUntil',q.valid_until,'date',q.needed_date,'mode',q.mode,'version',q.version,'origin',q.origin,'payment',q.payment,'sourceRef',q.source_ref)),'[]') into v_quotes from public.quotes q join public.products p on p.id=q.product_id where p.market_id=v_member.market_id and q.origin=v_member.origin;
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
    insert into public.quotes(product_id,needed_date,mode,origin,supplier_code,individual,collective,minimum_qty,transport,distribution,individual_transport,valid_until,payment,source_ref) values(v_product.id,v_date,v_mode,v_member.origin,p_payload->>'supplier',(p_payload->>'individual')::numeric,(p_payload->>'collective')::numeric,(p_payload->>'min')::integer,(p_payload->>'transport')::numeric,(p_payload->>'distribution')::numeric,(p_payload->>'individualTransport')::numeric,(p_payload->>'validUntil')::timestamptz,p_payload->>'payment',p_payload->>'sourceRef') on conflict(product_id,needed_date,mode,origin) do update set supplier_code=excluded.supplier_code,individual=excluded.individual,collective=excluded.collective,minimum_qty=excluded.minimum_qty,transport=excluded.transport,distribution=excluded.distribution,individual_transport=excluded.individual_transport,valid_until=excluded.valid_until,payment=excluded.payment,source_ref=excluded.source_ref,version=public.quotes.version+1 returning id into v_id;
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
revoke all on function private.purchase_api(text,jsonb) from public,anon;
grant execute on function private.purchase_api(text,jsonb) to authenticated;
create function public.purchase_api(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.purchase_api(p_action,p_payload); $$;
revoke all on function public.purchase_api(text,jsonb) from public,anon;
grant execute on function public.purchase_api(text,jsonb) to authenticated;
