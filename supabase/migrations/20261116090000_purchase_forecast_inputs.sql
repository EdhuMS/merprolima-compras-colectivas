create or replace function public.purchase_forecast_inputs()
returns jsonb language sql stable security definer set search_path = '' as $$
with member as (
 select m.role,s.id,s.market_id,s.origin from public.memberships m
 join public.stalls s on s.id=m.stall_id where m.active and m.user_id=auth.uid()
), calendar as (
 select date_trunc('week',now() at time zone 'America/Lima')::date as monday
), totals as (
 select n.product_id,n.stall_id,c.monday,
 coalesce(sum(n.qty) filter(where n.needed_date>=c.monday-7 and n.needed_date<c.monday),0) as last,
 coalesce(sum(n.qty) filter(where n.needed_date>=c.monday-21 and n.needed_date<c.monday),0)/3.0 as average3,
 coalesce(sum(n.qty) filter(where n.needed_date<c.monday),0)/8.0 as average8,
 coalesce(sum(n.qty) filter(where n.needed_date>=c.monday),0) as registered
 from member m cross join calendar c
 join public.needs n on n.origin=m.origin
 join public.stalls s on s.id=n.stall_id and s.market_id=m.market_id and s.origin=m.origin
 join public.products p on p.id=n.product_id and p.market_id=m.market_id and p.origin=m.origin
 where (n.stall_id=m.id or m.role='coordinator')
 and exists(select 1 from public.memberships b where b.stall_id=n.stall_id and b.active and b.role='buyer')
 and n.status='open' and n.needed_date between c.monday-56 and c.monday+6
 and n.created_at < (c.monday::timestamp at time zone 'America/Lima')
 and n.updated_at < (c.monday::timestamp at time zone 'America/Lima')
 group by n.product_id,n.stall_id,c.monday
 having count(distinct date_trunc('week',n.needed_date::timestamp))
 filter(where n.needed_date<c.monday)=8
)
select coalesce(jsonb_agg(jsonb_build_object('productId',product_id,'week',monday,
'features',jsonb_build_array(last,average3,average8,registered))), '[]'::jsonb) from totals
$$;
revoke all on function public.purchase_forecast_inputs() from public, anon;
grant execute on function public.purchase_forecast_inputs() to authenticated;
