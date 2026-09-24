-- Stop anonymous clients from listing every avatar, writing the leads table,
-- or holding write grants that row-level security does not cover (TRUNCATE).

-- Avatars stay on a public bucket so <img> URLs keep working.
-- Listing and writes are limited to the signed-in owner's own folder.
drop policy if exists "studio_avatars_public_read" on storage.objects;

drop policy if exists "studio_avatars_select_own" on storage.objects;
create policy "studio_avatars_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'studio-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 1
    and storage.filename(name) ~* '^avatar\.(jpe?g|png|webp|gif)$'
  );

drop policy if exists "studio_avatars_insert_own" on storage.objects;
create policy "studio_avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'studio-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 1
    and storage.filename(name) ~* '^avatar\.(jpe?g|png|webp|gif)$'
  );

drop policy if exists "studio_avatars_update_own" on storage.objects;
create policy "studio_avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'studio-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 1
    and storage.filename(name) ~* '^avatar\.(jpe?g|png|webp|gif)$'
  )
  with check (
    bucket_id = 'studio-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 1
    and storage.filename(name) ~* '^avatar\.(jpe?g|png|webp|gif)$'
  );

drop policy if exists "studio_avatars_delete_own" on storage.objects;
create policy "studio_avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'studio-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 1
    and storage.filename(name) ~* '^avatar\.(jpe?g|png|webp|gif)$'
  );

-- Published site images stay publicly downloadable by URL.
-- Uploads stay in the signed-in user's folder, with a size and type cap.
update storage.buckets
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'site-images';

drop policy if exists "site_images_public_read" on storage.objects;

drop policy if exists "site_images_owner_select" on storage.objects;
create policy "site_images_owner_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'site-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "site_images_owner_insert" on storage.objects;
create policy "site_images_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'site-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "site_images_owner_update" on storage.objects;
create policy "site_images_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'site-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'site-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "site_images_owner_delete" on storage.objects;
create policy "site_images_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'site-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Lead import bypasses row-level security. Only the server key may call it.
revoke all on function public.import_leads_csv_rows(jsonb) from public, anon, authenticated;
grant execute on function public.import_leads_csv_rows(jsonb) to service_role;

-- Anonymous visitors do not get table privileges. Signed-in users keep the
-- privileges the app uses; writes that only the server should perform are removed.
revoke all on table public.profiles from anon;
revoke all on table public.projects from anon;
revoke all on table public.payments from anon;
revoke all on table public.generation_jobs from anon;
revoke all on table public.leads from anon;
revoke all on table public.credit_accounts from anon;
revoke all on table public.credit_transactions from anon;
revoke all on table public.creator_payouts from anon;
revoke all on table public.contact_leads from anon;
revoke all on table public.push_subscriptions from anon;

revoke insert, update, delete, truncate on table public.leads from authenticated;
revoke insert, update, delete, truncate on table public.payments from authenticated;
revoke insert, update, delete, truncate on table public.credit_accounts from authenticated;
revoke insert, update, delete, truncate on table public.credit_transactions from authenticated;
revoke insert, update, delete, truncate on table public.generation_jobs from authenticated;

do $$
declare
  rel record;
begin
  for rel in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format(
      'revoke truncate on table public.%I from anon, authenticated',
      rel.relname
    );
  end loop;
end $$;
