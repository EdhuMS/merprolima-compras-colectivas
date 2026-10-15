alter policy field_anonymous_read on public.field_interviews
using (exists (
 select 1 from public.memberships m join public.stalls s on s.id=m.stall_id
 where m.user_id=(select auth.uid()) and m.role='coordinator' and m.active and s.origin='real'
));
