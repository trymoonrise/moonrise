-- Creators can delete their own projects after payment.
-- Unpublish stays a separate action and still takes a live site offline.

drop policy if exists "projects_delete_own_unpaid" on public.projects;

create policy "projects_delete_own"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
