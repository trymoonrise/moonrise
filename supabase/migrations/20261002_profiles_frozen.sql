-- Owner can suspend an employee without deleting their account.

alter table public.profiles
  add column if not exists frozen boolean not null default false;

comment on column public.profiles.frozen is
  'When true, the studio owner has suspended this employee. They cannot sign in.';
