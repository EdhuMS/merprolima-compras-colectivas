create or replace function public.coordinator_outstanding_demand()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_member record;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Inicia sesión para consultar las necesidades recibidas'
      using errcode = '42501';
  end if;

  select m.role, s.id as stall_id, s.market_id, s.origin
    into v_member
  from public.memberships m
  join public.stalls s on s.id = m.stall_id
  where m.user_id = v_user and m.active;

  if not found or v_member.role <> 'coordinator' then
    raise exception 'Solo coordinación puede consultar la demanda recibida'
      using errcode = '42501';
  end if;

  with by_stall as (
    select
      n.product_id,
      n.needed_date,
      n.mode,
      n.origin,
      n.stall_id,
      sum(n.qty)::integer as qty,
      min(n.created_at) as created_at
    from public.needs n
    join public.products p
      on p.id = n.product_id
      and p.market_id = v_member.market_id
    join public.stalls s
      on s.id = n.stall_id
      and s.market_id = v_member.market_id
    where n.origin = v_member.origin
      and n.status = 'open'
      and n.needed_date >= (now() at time zone 'America/Lima')::date
      and n.stall_id <> v_member.stall_id
      and not exists (
        select 1
        from public.participations a
        where a.stall_id = n.stall_id
          and a.product_id = n.product_id
          and a.needed_date = n.needed_date
          and a.mode = n.mode
          and a.origin = n.origin
          and a.status in ('confirmed', 'pending')
      )
    group by n.product_id, n.needed_date, n.mode, n.origin, n.stall_id
  ), aggregates as (
    select
      product_id,
      needed_date,
      mode,
      sum(qty)::integer as qty,
      count(*)::integer as participants,
      min(created_at) as created_at
    from by_stall
    group by product_id, needed_date, mode
  )
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', 'aggregate:' || g.product_id || ':' || g.needed_date || ':' || g.mode,
      'stall', 'Otros puestos',
      'productId', g.product_id,
      'qty', g.qty,
      'date', g.needed_date,
      'mode', g.mode,
      'status', 'open',
      'origin', v_member.origin,
      'createdAt', g.created_at,
      'participantCount', g.participants
    )),
    '[]'::jsonb
  ) into v_result
  from aggregates g;

  return v_result;
end;
$$;

revoke all on function public.coordinator_outstanding_demand() from public, anon;
grant execute on function public.coordinator_outstanding_demand() to authenticated;

notify pgrst, 'reload schema';
