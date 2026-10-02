-- One-time Employee ID steps. Only the worker (service role) may read or write.
-- No policies: anon and authenticated clients cannot see which codes were used.

create table if not exists public.employee_signup_redemptions (
  step bigint primary key,
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table public.employee_signup_redemptions enable row level security;

revoke all on table public.employee_signup_redemptions from public, anon, authenticated;
