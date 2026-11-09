-- GitHub account links for Builder upload.
-- Access tokens stay on the worker (service role only).

create table if not exists public.github_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists github_oauth_states_expires_at_idx
  on public.github_oauth_states (expires_at);

comment on table public.github_oauth_states is
  'Short-lived GitHub OAuth state. Worker (service role) only.';

create table if not exists public.github_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  github_login text,
  github_user_id text,
  access_token text,
  scope text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.github_connections is
  'One GitHub account per studio user. Worker (service role) only.';

alter table public.github_oauth_states enable row level security;
alter table public.github_connections enable row level security;

revoke all on table public.github_oauth_states from anon, authenticated;
revoke all on table public.github_connections from anon, authenticated;

grant all on table public.github_oauth_states to service_role;
grant all on table public.github_connections to service_role;
