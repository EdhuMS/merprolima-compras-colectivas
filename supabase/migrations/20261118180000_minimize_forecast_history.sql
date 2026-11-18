-- Refresh inputs for the open week when source revisions have changed.
-- Keep stored historical inputs and previously observed outcomes.
create or replace function public.coordinator_forecast_history()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  member record;
  monday date := date_trunc('week', now() at time zone 'America/Lima')::date;
begin
  select s.market_id,s.origin into member
  from public.memberships m join public.stalls s on s.id=m.stall_id
  where m.user_id=auth.uid() and m.active and m.role='coordinator';
  if not found then
    raise exception 'Solo coordinación puede consultar el pronóstico del mercado' using errcode='42501';
  end if;

  with events as (
    select n.id,n.stall_id,r.product_id,r.needed_date,r.qty,r.status,r.id revision,
      case when r.revision_action='INSERT' then least(n.created_at,r.occurred_at)
        else r.occurred_at end happened
    from private.need_revisions r
    join public.needs n on n.id=r.need_id and n.origin=r.origin
    join public.stalls s on s.id=n.stall_id and s.market_id=r.market_id and s.origin=r.origin
    where r.market_id=member.market_id and r.origin=member.origin
  ), cuts as (
    select monday-7*i as week from generate_series(0,8) i
  ), states as (
    select distinct on (c.week,b.closing,e.id)
      c.week,b.closing,e.stall_id,e.product_id,e.needed_date,e.qty,e.status
    from cuts c cross join (values(false),(true)) b(closing)
    join events e on e.happened < ((c.week + case when b.closing then 7 else 0 end)::timestamp at time zone 'America/Lima')
    where not b.closing or c.week<monday
    order by c.week,b.closing,e.id,e.happened desc,e.revision desc
  ), inputs as (
    select week,stall_id,product_id,jsonb_build_array(
      coalesce(sum(qty) filter(where status='open' and needed_date between week-7 and week-1),0),
      coalesce(sum(qty) filter(where status='open' and needed_date between week-21 and week-1),0)/3.0,
      coalesce(sum(qty) filter(where status='open' and needed_date<week),0)/8.0,
      coalesce(sum(qty) filter(where status='open' and needed_date>=week),0)
    ) features
    from states
    where not closing and needed_date between week-56 and week+6
    group by week,stall_id,product_id
    having count(distinct date_trunc('week',needed_date::timestamp)) filter(where needed_date<week)=8
  ), outcomes as (
    select week,stall_id,product_id,coalesce(sum(qty) filter(where status='open'),0)::integer actual
    from states
    where closing and needed_date between week and week+6
    group by week,stall_id,product_id
  )
  insert into private.coordinator_weekly_forecast(market_id,origin,week,product_id,stall_id,features,actual)
  select member.market_id,member.origin,i.week,i.product_id,i.stall_id,i.features,o.actual
  from inputs i join public.products p on p.id=i.product_id and p.market_id=member.market_id and p.origin=member.origin
  left join outcomes o using(week,stall_id,product_id)
  on conflict(market_id,origin,week,product_id,stall_id) do update
  set features=case when excluded.week=monday then excluded.features
                    else coordinator_weekly_forecast.features end,
      actual=coalesce(coordinator_weekly_forecast.actual,excluded.actual)
  where (excluded.week=monday and coordinator_weekly_forecast.features is distinct from excluded.features)
     or (coordinator_weekly_forecast.actual is null and excluded.actual is not null);

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'week',week,'productId',product_id,'features',features,'actual',actual
    ) order by week desc, product_id), '[]'::jsonb)
    from private.coordinator_weekly_forecast
    where market_id=member.market_id and origin=member.origin and week>=monday-56 and (week=monday or actual is not null)
  );
end;
$$;
revoke all on function public.coordinator_forecast_history() from public, anon;
grant execute on function public.coordinator_forecast_history() to authenticated;
