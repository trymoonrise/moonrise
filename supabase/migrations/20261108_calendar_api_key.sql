-- How a studio employee connected Cal.com. API keys stay in access_token.
-- Worker (service role) only. The key is never returned to the browser.

alter table public.calendar_connections
  add column if not exists auth_kind text not null default 'oauth';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'calendar_connections_auth_kind_check'
  ) then
    alter table public.calendar_connections
      add constraint calendar_connections_auth_kind_check
      check (auth_kind in ('oauth', 'api_key'));
  end if;
end $$;

comment on column public.calendar_connections.auth_kind is
  'oauth uses Cal.com OAuth tokens. api_key stores a Cal.com API key in access_token. Worker only.';
