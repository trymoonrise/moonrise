# Security Policy

## Reporting a vulnerability

If you believe you found a security issue in Moonrise Studio, please report it privately.

**Do not** open a public issue for sensitive security reports.

Email: [trymoonrise@gmail.com](mailto:trymoonrise@gmail.com)

Please include:

- A clear description of the issue
- Steps to reproduce, if possible
- Impact (what an attacker could do)
- Any suggested mitigation

## What to expect

We aim to acknowledge reports as soon as practical, investigate in good faith, and follow up when a fix or next step is available.

## Breach notification plan

If personal account data is leaked or we confirm unauthorized access to production systems that hold personal data, we notify affected people.

**How we notice**

- Production errors and auth failures in Vercel function logs and the Studio API worker
- Supabase Auth, database, and storage logs and alerts
- Stripe webhook and payout anomalies
- Reports sent to [trymoonrise@gmail.com](mailto:trymoonrise@gmail.com)

**Who we tell**

- Affected account holders, by email to the address on the account, from [trymoonrise@gmail.com](mailto:trymoonrise@gmail.com)
- Processors or hosts when their contracts require notice

**What we send**

- What happened, what data categories were involved (as far as we know), what we are doing, and what the person can do (for example reset sessions or contact support)

**Timing**

- We aim to begin investigation within 24 hours of a credible signal
- We aim to notify affected people without undue delay, and within 72 hours of confirming a breach that requires notice under applicable law, unless law enforcement asks us to delay

## Baseline protections (implemented)

- HTTPS + HSTS on production
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP
- CORS allowlist for Studio API (public checkout/embed remain open for live sites)
- Auth lockouts + rate limits on sign-in / sign-up / password reset
- Per-route rate limits on generate, edit, publish, checkout, maps, public orders
- Authenticated routes require a valid Supabase Bearer token
- Stripe webhooks verified with signing secret
- Request body size limits + prompt/input sanitization
- Secrets stay in server env (`.env` is gitignored); public anon keys only in the browser
- Production `/health` does not expose filesystem paths or verbose internals

## Scope

In scope:

- Account access issues
- Unauthorized data exposure
- Payment or checkout abuse risks
- Privilege problems inside Studio

Out of scope (examples):

- Social engineering of individual users
- Reports without a realistic impact
- Issues that only affect outdated local copies you control

## Safe use

- Keep your account credentials private
- Use strong unique passwords
- Contact support if you notice suspicious account activity

Thank you for helping keep Moonrise users safe.
