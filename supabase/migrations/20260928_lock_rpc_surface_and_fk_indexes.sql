-- Applied to project erfaxgmnzdropviormpj.
-- Drops the unused leads trigger function, closes public RPC access on
-- helpers and trigger functions, and indexes the three unindexed foreign keys.

drop function if exists public.leads_before_insert();

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

revoke all on function public.profiles_protect_privileged_columns() from public, anon;
grant execute on function public.profiles_protect_privileged_columns() to authenticated, service_role;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

revoke all on function public.is_site_owner() from public, anon;
grant execute on function public.is_site_owner() to authenticated, service_role;

revoke all on function public.is_studio_owner() from public, anon;
grant execute on function public.is_studio_owner() to authenticated, service_role;

do $lead_helpers$
declare fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'json_num_any',
        'json_text_any',
        'json_ts_any',
        'leads_maps_place_key',
        'leads_pick_field',
        'leads_pick_jsonb',
        'leads_pick_ts',
        'leads_upsert_row'
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
    execute format('alter function %s set search_path = public', fn);
  end loop;
end
$lead_helpers$;

do $trigger_helpers$
declare fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'set_updated_at',
        'touch_creator_payouts_updated_at',
        'touch_manual_clients_updated_at',
        'touch_push_subscriptions_updated_at',
        'fold_handle_reserve',
        'handle_is_reserved',
        'profiles_reject_reserved_handle'
      )
  loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
    execute format('alter function %s set search_path = public', fn);
  end loop;
end
$trigger_helpers$;

revoke all on table public.client_hides from anon;
revoke all on table public.manual_clients from anon;
revoke all on table public.owner_clients from anon;

create index if not exists generation_jobs_project_id_idx on public.generation_jobs (project_id);
create index if not exists payments_project_id_idx on public.payments (project_id);
create index if not exists creator_payouts_payment_id_idx on public.creator_payouts (payment_id);

drop policy if exists generation_jobs_all_own on public.generation_jobs;
create policy generation_jobs_all_own on public.generation_jobs
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists contact_leads_select_own on public.contact_leads;
create policy contact_leads_select_own on public.contact_leads
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
