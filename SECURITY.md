# Security Policy

## Reporting a vulnerability

If you believe you found a security issue in Moonrise Studio, please report it privately.

**Do not** open a public issue for sensitive security reports.

Preferred options:

1. **GitHub private vulnerability reporting** on this repository (Security → Report a vulnerability)
2. Email: [trymoonrise@gmail.com](mailto:trymoonrise@gmail.com)

Please include:

- A clear description of the issue
- Steps to reproduce, if possible
- Impact (what an attacker could do)
- Any suggested mitigation
- Affected URL, commit, or version when known

## What to expect

We aim to acknowledge reports within a few business days, investigate in good faith, and follow up when a fix or next step is available. Please give us a reasonable window before any public disclosure.

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

**What can identify a creator**

Moonrise does not claim that account data can never be breached. No product is breach-proof. We use commercially reasonable protections and try to minimize what would identify a Moonrise creator if data were exposed. Moonrise never asks for a Moonrise account password, a government-issued ID, a driver's license, a passport, photo or face recognition, a Social Security number, or similar identity documents, so those are not records we hold. Full payment card numbers are not stored. For payouts, we only store the method and the public username, handle, email, or phone entered for Cash App, Venmo, PayPal, Zelle, or another method — not passwords or login credentials for those apps. If account data were exposed, these records can still be linked to that creator:

- Account email, username, display name, profile photo, and account id
- Phone number and country, if one was added
- Session records and sign-in security events that can be tied to an email address or IP address. A passkey, if the creator adds one, can be linked to the account. Moonrise does not ask for or store a Moonrise account password.
- Short-lived email sign-in links, while they are still valid
- Notification preferences, when the account was created or updated, and whether the account is frozen
- Contact email and phone saved for clients, including when those details are copied onto a published site
- Payout method and the username, handle, email, or phone entered for Cash App, Venmo, PayPal, Zelle, or another method (not passwords or app login credentials), plus earnings and payout amounts and status
- Card brand, last four digits, expiration, and a card fingerprint if a security card was verified
- Credit plan, credit balance, credit history, Stripe customer and subscription identifiers, donation or support status, and Store purchases
- Saved projects: business name, address, phone, map link, notes, category, website price, site HTML and files, publish URL, and watermark status
- Generation prompts, generated site HTML, and error messages from those jobs
- Contact-form settings and form submissions on that creator's projects, including a sender's name, phone, and message, and the notification email or endpoint
- Custom domain hostname and DNS or verification status, if a domain was connected
- Clients added by hand: business name, phone, website, price, and notes
- GitHub username and GitHub account id, plus the access token, if GitHub was connected
- Calendar username and connected account id, access tokens, and synced bookings (title, time, guest name, email, phone, and meeting link), if a calendar was connected
- Browser push subscription and the browser used for it, if notifications were turned on
- IP address, device and browser type, approximate location from network data, pages used, and timestamps in logs tied to the account
- Payments on that creator's projects: amount, status, and Stripe payment identifiers
- An employee signup redemption, if one was used on the account

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
- Product fonts are self-hosted (`assets/fonts/`, `css/fonts.css`); no Google Fonts or third-party font CDN requests
- Studio source may be downloaded and showcased under the Moonrise Studio License with required credit to Moonrise (trymoonrise.com); creators remain independent users, not Moonrise employees

## Scope

In scope:

- Account access issues
- Unauthorized data exposure
- Payment or checkout abuse risks
- Privilege problems inside Studio

Out of scope (examples):

- Social engineering of individual users
- Reports without a realistic impact
- Issues that do not affect the live product at trymoonrise.com

## Secrets

Do not post passwords, tokens, customer data, or payment details in an issue, a screenshot, or a public report. If a secret was exposed, say so in the private report and we will rotate it.

## Safe use

- Keep your account credentials private
- Use strong unique passwords or a passkey when available
- Contact support if you notice suspicious account activity

Thank you for helping keep Moonrise users safe.
