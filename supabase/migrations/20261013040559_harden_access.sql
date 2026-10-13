revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
create policy deny_direct on public.markets for all to authenticated using(false) with check(false);
create policy deny_direct on public.stalls for all to authenticated using(false) with check(false);
create policy deny_direct on public.products for all to authenticated using(false) with check(false);
create policy deny_direct on public.needs for all to authenticated using(false) with check(false);
create policy deny_direct on public.quotes for all to authenticated using(false) with check(false);
create policy deny_direct on public.participations for all to authenticated using(false) with check(false);
create policy deny_direct on public.purchase_events for all to authenticated using(false) with check(false);
