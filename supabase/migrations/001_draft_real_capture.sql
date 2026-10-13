-- BORRADOR NO EJECUTADO. Base inicial para el entorno real; no habilita el piloto completo.
create table public.products (
 id uuid primary key default gen_random_uuid(), name text not null, brand text not null,
 variety text not null, package_weight_kg numeric(8,2) not null check (package_weight_kg > 0)
);
create table public.stalls (
 id uuid primary key default gen_random_uuid(), code text unique not null,
 market text not null default 'Merprolima'
);
create table public.profiles (
 user_id uuid primary key references auth.users(id), stall_id uuid references public.stalls(id),
 role text not null default 'buyer' check (role in ('buyer','coordinator'))
);
create table public.needs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 stall_id uuid not null references public.stalls(id), product_id uuid not null references public.products(id),
 package_qty integer not null check (package_qty between 1 and 500),
 needed_date date not null, delivery_mode text not null check (delivery_mode in ('delivery','pickup')),
 status text not null default 'open' check (status in ('open','withdrawn')),
 data_origin text not null default 'real' check (data_origin = 'real'),
 source_ref text not null check (length(source_ref) > 0),
 created_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.stalls enable row level security;
alter table public.profiles enable row level security;
alter table public.needs enable row level security;
create policy products_read on public.products for select to authenticated using (true);
create policy own_profile on public.profiles for select to authenticated using (user_id = auth.uid());
create policy own_stall on public.stalls for select to authenticated using (id in (select stall_id from public.profiles where user_id = auth.uid()));
create policy own_needs_read on public.needs for select to authenticated using (owner_id = auth.uid());
create policy own_needs_insert on public.needs for insert to authenticated with check (owner_id = auth.uid() and stall_id in (select stall_id from public.profiles where user_id = auth.uid()));
create policy own_needs_update on public.needs for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and stall_id in (select stall_id from public.profiles where user_id = auth.uid()));
-- No política de escritura de roles o catálogo para compradores.
-- Falta implementar cotizaciones, agregados seguros, confirmación transaccional y probar RLS con dos cuentas.
