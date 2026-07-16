-- One paid donation of any amount keeps MVP+ for life.
-- Canceling a credit plan must not remove MVP+ from someone who has donated.

create or replace function public.credits_deactivate_plan(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.credit_accounts
  set
    plan_status = 'canceled',
    subscription_credits = 0,
    stripe_subscription_id = null
  where user_id = p_user_id;

  update public.profiles
  set mvp_plus = false
  where id = p_user_id
    and not exists (
      select 1
      from public.payments
      where user_id = p_user_id
        and status = 'paid'
        and kind = 'mvp_donation'
        and coalesce(amount_cents, 0) > 0
    );
end;
$$;

revoke all on function public.credits_deactivate_plan(uuid) from public, anon, authenticated;
grant execute on function public.credits_deactivate_plan(uuid) to service_role;

update public.profiles p
set mvp_plus = true
where exists (
  select 1
  from public.payments pay
  where pay.user_id = p.id
    and pay.status = 'paid'
    and pay.kind = 'mvp_donation'
    and coalesce(pay.amount_cents, 0) > 0
);

comment on column public.profiles.mvp_plus is
  'MVP+ supporter: Builder code access. Lifetime after one paid donation of any amount.';
