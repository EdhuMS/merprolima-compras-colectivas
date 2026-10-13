create table private.pilot_account_grants(email text primary key,stall_id uuid not null references public.stalls(id),role text not null check(role in ('buyer','coordinator')));
alter table private.pilot_account_grants enable row level security;
revoke all on private.pilot_account_grants from public,anon,authenticated;
create index pilot_account_grants_stall_idx on private.pilot_account_grants(stall_id);
create function private.provision_pilot_account() returns trigger language plpgsql security definer set search_path='' as $$
declare v_grant private.pilot_account_grants;
begin
 -- Auth admin creates accounts without an end-user JWT. End-user updates may only refer to themselves.
 if auth.uid() is not null and auth.uid()<>new.id then raise exception 'Account identity mismatch' using errcode='42501'; end if;
 if new.email_confirmed_at is null or new.email is null then return new; end if;
 select * into v_grant from private.pilot_account_grants where email=lower(new.email) for update;
 if found then
  insert into public.memberships(user_id,stall_id,role) values(new.id,v_grant.stall_id,v_grant.role) on conflict(user_id) do nothing;
  delete from private.pilot_account_grants where email=lower(new.email);
 end if;
 return new;
end; $$;
revoke all on function private.provision_pilot_account() from public,anon,authenticated;
create trigger provision_pilot_account after insert or update of email_confirmed_at,email on auth.users for each row execute function private.provision_pilot_account();
