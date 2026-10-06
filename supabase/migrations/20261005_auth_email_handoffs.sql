-- One-time handoff so the device that requested an email link can sign in
-- after the link is opened on any other device. Service role only.
create table if not exists public.auth_email_handoffs (
  id uuid primary key,
  email text not null,
  secret_hash text not null,
  access_token text,
  refresh_token text,
  ready_at timestamptz,
  claimed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_email_handoffs_expires_at_idx
  on public.auth_email_handoffs (expires_at);

comment on table public.auth_email_handoffs is
  'Short-lived email-link sign-in handoff. Worker (service role) only.';

alter table public.auth_email_handoffs enable row level security;

revoke all on table public.auth_email_handoffs from anon, authenticated;
grant all on table public.auth_email_handoffs to service_role;
