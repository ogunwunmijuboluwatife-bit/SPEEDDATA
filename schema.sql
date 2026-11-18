-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists docs (path text primary key, coll text not null, uid uuid not null, data jsonb not null default '{}', updated timestamptz default now());
create index if not exists docs_coll on docs(coll);
create table if not exists staff (uid uuid primary key, role text not null check (role in ('super','admin')));
create or replace function is_staff() returns boolean language sql security definer stable as $$ select exists(select 1 from staff where uid=auth.uid()) $$;
create or replace function is_super() returns boolean language sql security definer stable as $$ select exists(select 1 from staff where uid=auth.uid() and role='super') $$;
alter table docs enable row level security; alter table staff enable row level security;
create policy staff_self on staff for select using (uid=auth.uid());
create policy docs_read on docs for select to authenticated using (
  path like 'data/users/'||auth.uid()||'/%' or coll in ('pf_flags','pf_settings') or coll='profiles'
  or path='pf_users/'||auth.uid() or path='pf_feedback/'||auth.uid()
  or (is_staff() and path not like 'data/users/%'));
create policy docs_write on docs for all to authenticated using (
  path like 'data/users/'||auth.uid()||'/%' or path in ('pf_users/'||auth.uid(),'pf_feedback/'||auth.uid(),'profiles/'||auth.uid())
  or (is_staff() and coll in ('pf_flags','pf_settings','pf_fbstat','pf_audit')) or (is_super() and coll='pf_roles'))
with check (
  path like 'data/users/'||auth.uid()||'/%' or path in ('pf_users/'||auth.uid(),'pf_feedback/'||auth.uid(),'profiles/'||auth.uid())
  or (is_staff() and coll in ('pf_flags','pf_settings','pf_fbstat','pf_audit')) or (is_super() and coll='pf_roles'));
-- AFTER you create your own account in the app, make yourself Super Admin (replace the email):
-- insert into staff select id,'super' from auth.users where email='YOU@EXAMPLE.COM';
-- To add an Admin or Support person later (they sign up first):
-- insert into staff select id,'admin' from auth.users where email='STAFF@EXAMPLE.COM';
