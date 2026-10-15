create function private.may_read_field_interviews() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
 select 1 from public.memberships m join public.stalls s on s.id=m.stall_id
 where m.user_id=(select auth.uid()) and m.role='coordinator' and m.active and s.origin='real');
$$;
revoke all on function private.may_read_field_interviews() from public,anon;
grant execute on function private.may_read_field_interviews() to authenticated;
alter policy field_anonymous_read on public.field_interviews using ((select private.may_read_field_interviews()));
