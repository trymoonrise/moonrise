-- Cal.com OAuth, per-employee connections, and synced bookings.
-- Tokens and webhook secrets stay on the worker (service role only).

create table if not exists public.calendar_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists calendar_oauth_states_expires_at_idx
  on public.calendar_oauth_states (expires_at);

comment on table public.calendar_oauth_states is
  'Short-lived Cal.com OAuth state. Worker (service role) only.';

create table if not exists public.calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cal_user_id text,
  username text,
  event_slug text,
  event_types jsonb not null default '[]'::jsonb,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  webhook_id text,
  webhook_secret text,
  webhook_token text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_connections_webhook_token_key unique (webhook_token)
);

comment on table public.calendar_connections is
  'One Cal.com account per studio employee. Worker (service role) only.';

create table if not exists public.calendar_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  provider_uid text not null,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  attendee_name text,
  attendee_email text,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_bookings_provider_uid_key unique (provider_uid)
);

create index if not exists calendar_bookings_user_starts_idx
  on public.calendar_bookings (user_id, starts_at);

comment on table public.calendar_bookings is
  'Meetings synced from a connected Cal.com account. Worker (service role) only.';

alter table public.calendar_oauth_states enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_bookings enable row level security;

revoke all on table public.calendar_oauth_states from anon, authenticated;
revoke all on table public.calendar_connections from anon, authenticated;
revoke all on table public.calendar_bookings from anon, authenticated;

grant all on table public.calendar_oauth_states to service_role;
grant all on table public.calendar_connections to service_role;
grant all on table public.calendar_bookings to service_role;
