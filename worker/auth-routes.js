/**
 * Secured auth routes - lockouts + rate limits in front of Supabase Auth.
 */
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { clientError, isProduction } = require("./api-errors");
const { sendEmailVerifyLink } = require("./contact-mail");
const {
  redeemEmployeeId,
  releaseEmployeeId,
  attachEmployeeIdUser,
} = require("./employee-id");

const SUPPORT_EMAIL =
  String(process.env.MOONRISE_SUPPORT_EMAIL || "trymoonrise@gmail.com").trim() ||
  "trymoonrise@gmail.com";

function publicAppBase() {
  return String(process.env.PUBLIC_APP_URL || "https://trymoonrise.com").replace(/\/$/, "");
}

/** Keep recovery redirects on Moonrise hosts only. */
function safeAuthRedirect(raw, fallbackPath) {
  const fallback = `${publicAppBase()}${fallbackPath.startsWith("/") ? fallbackPath : "/" + fallbackPath}`;
  const candidate = String(raw || "").trim();
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    const allowed =
      host === "trymoonrise.com" ||
      host === "www.trymoonrise.com" ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      (host.endsWith(".vercel.app") && host.includes("moonrise"));
    if (!allowed || (url.protocol !== "https:" && host !== "localhost" && host !== "127.0.0.1")) {
      return fallback;
    }
    return url.href;
  } catch (_) {
    return fallback;
  }
}

const SESSION_IDLE_SECONDS = 24 * 60 * 60;
const REMEMBER_SECONDS = 30 * 24 * 60 * 60;

function idleLimitSeconds(req) {
  return readCookie(req, "ms_keep") === "1" ? REMEMBER_SECONDS : SESSION_IDLE_SECONDS;
}

function cookieSecure(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  if (proto === "https") return true;
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}

function readCookie(req, name) {
  const raw = String(req.headers.cookie || "");
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    try {
      return decodeURIComponent(trimmed.slice(eq + 1));
    } catch (_) {
      return "";
    }
  }
  return "";
}

function serializeCookie(name, value, opts) {
  const parts = [name + "=" + encodeURIComponent(value), "Path=/", "SameSite=Lax"];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.maxAge === 0) parts.push("Max-Age=0");
  else if (Number.isFinite(opts.maxAge)) parts.push("Max-Age=" + String(opts.maxAge));
  return parts.join("; ");
}

function appendCookies(res, cookies) {
  const prev = res.getHeader("Set-Cookie");
  const list = prev ? (Array.isArray(prev) ? prev.slice() : [String(prev)]) : [];
  res.setHeader("Set-Cookie", list.concat(cookies));
}

function rememberRequested(req) {
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "remember")) {
    return req.body.remember !== false && req.body.remember !== "0" && req.body.remember !== 0;
  }
  return readCookie(req, "ms_keep") !== "0";
}

function writeAuthCookies(req, res, session) {
  const remember = rememberRequested(req);
  const secure = cookieSecure(req);
  const maxAge = remember ? REMEMBER_SECONDS : undefined;
  const refresh = String(session?.refresh_token || "");
  if (!refresh) return;
  appendCookies(res, [
    serializeCookie("ms_rt", refresh, { httpOnly: true, secure, maxAge }),
    serializeCookie("ms_seen", String(Date.now()), { httpOnly: true, secure, maxAge }),
    serializeCookie("ms_keep", remember ? "1" : "0", { httpOnly: true, secure, maxAge }),
    serializeCookie("ms_on", "1", { httpOnly: false, secure, maxAge }),
  ]);
}

function clearAuthCookies(req, res) {
  const secure = cookieSecure(req);
  appendCookies(res, [
    serializeCookie("ms_rt", "", { httpOnly: true, secure, maxAge: 0 }),
    serializeCookie("ms_seen", "", { httpOnly: true, secure, maxAge: 0 }),
    serializeCookie("ms_keep", "", { httpOnly: true, secure, maxAge: 0 }),
    serializeCookie("ms_on", "", { httpOnly: false, secure, maxAge: 0 }),
  ]);
}

function sessionIsIdle(req) {
  const seen = Number(readCookie(req, "ms_seen") || 0);
  // A missing stamp is not proof the session died. Wiping cookies here
  // logged people out on the next channel and flashed the login page.
  if (!Number.isFinite(seen) || seen <= 0) return false;
  return Date.now() - seen > idleLimitSeconds(req) * 1000;
}

function sessionJson(session, user, extra) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type || "bearer",
    user: user || session.user || null,
    ...(extra || {}),
  };
}

function createAuthClient() {
  const url = String(process.env.SUPABASE_URL || "").trim();
  const anon = String(process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !anon) {
    const err = new Error(
      "Supabase auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to worker/.env (local) or Vercel env vars, then restart the worker."
    );
    err.status = 503;
    err.code = "SUPABASE_NOT_CONFIGURED";
    throw err;
  }
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapSignupAuthError(error) {
  const msg = String(error?.message || "").trim();
  const code = String(error?.code || "").trim();
  if (!msg || msg === "{}" || msg === "[object Object]") {
    console.error("signup confirmation email failed", error);
    return {
      status: 503,
      error: isProduction()
        ? "We couldn't send the confirmation email. Try again in a few minutes."
        : "Moonrise can't send confirmation emails yet because trymoonrise.com isn't verified in Resend. Open resend.com/domains, click Verify on trymoonrise.com, then try again. Until then, sign up with trymoonrise@gmail.com.",
      code: "email_send_failed",
    };
  }
  if (/email rate limit exceeded/i.test(msg) || code === "over_email_send_rate_limit") {
    return {
      status: 429,
      error:
        `Too many verification emails were sent. Wait about an hour and try again, or contact ${SUPPORT_EMAIL}.`,
      code: "email_rate_limited",
    };
  }
  if (
    /could not send email|error sending confirmation|testing emails to your own email|domain is not verified|verify a domain/i.test(
      msg
    )
  ) {
    console.error("signup confirmation email failed", msg);
    return {
      status: 503,
      error: isProduction()
        ? "We couldn't send the confirmation email. Try again in a few minutes."
        : "trymoonrise.com DNS looks set up, but Resend hasn't verified the domain yet. Go to resend.com/domains -> trymoonrise.com -> Verify, wait a few minutes, then try signup again.",
      code: "email_send_failed",
    };
  }
  if (/already registered|already exists|user already registered/i.test(msg)) {
    return {
      status: 400,
      error: "An account with this email already exists. Sign in instead.",
      code: "signup_exists",
    };
  }
  if (isProduction()) console.error("signup failed", msg);
  return {
    status: 400,
    error: isProduction() ? "Sign up failed. Please try again." : msg || "Sign up failed",
    code: "signup_failed",
  };
}

function validatePassword(password, email) {
  const value = String(password || "");
  if (value.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters", code: "weak_password" };
  }
  if (value.length > 128) {
    return { ok: false, error: "Password is too long", code: "weak_password" };
  }
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return {
      ok: false,
      error: "Password must include at least one letter and one number",
      code: "weak_password",
    };
  }
  const local = String(email || "").split("@")[0].toLowerCase();
  if (local && local.length >= 3 && value.toLowerCase().includes(local)) {
    return {
      ok: false,
      error: "Password must not contain your email address",
      code: "weak_password",
    };
  }
  const common = new Set([
    "password",
    "password1",
    "12345678",
    "qwerty123",
    "moonrise",
    "admin123",
    "letmein1",
    "welcome1",
    "passw0rd",
  ]);
  if (common.has(value.toLowerCase())) {
    return { ok: false, error: "Choose a stronger password", code: "weak_password" };
  }
  return { ok: true };
}

function mountAuthRoutes(app, { db, security }) {
  const {
    clientIp,
    normalizeEmail,
    emailHash,
    createDistributedRateLimiter,
    assertNotLocked,
    recordAuthFailure,
    clearAuthFailures,
  } = security;

  const limit = (opts) => createDistributedRateLimiter(db, opts);

  const authIpLimiter = limit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    name: "auth",
    keyFn: (req) => "auth-ip:" + clientIp(req),
  });

  const signupLimiter = limit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    name: "signup",
    keyFn: (req) => "signup-ip:" + clientIp(req),
  });

  const signinEmailLimiter = limit({
    windowMs: 15 * 60 * 1000,
    max: 12,
    name: "signin-email",
    keyFn: (req) => "signin-email:" + emailHash(normalizeEmail(req.body?.email || "")),
    shouldCount: (req) => !!normalizeEmail(req.body?.email),
  });

  const signupEmailLimiter = limit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    name: "signup-email",
    keyFn: (req) => "signup-email:" + emailHash(normalizeEmail(req.body?.email || "")),
    shouldCount: (req) => !!normalizeEmail(req.body?.email),
  });

  const forgotLimiter = limit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    name: "password-reset",
    keyFn: (req) => "forgot-ip:" + clientIp(req),
  });

  const forgotEmailLimiter = limit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    name: "password-reset-email",
    keyFn: (req) => "forgot-email:" + emailHash(normalizeEmail(req.body?.email || "")),
    shouldCount: (req) => !!normalizeEmail(req.body?.email),
  });

  const resendLimiter = limit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    name: "resend-confirm",
    keyFn: (req) => "resend-ip:" + clientIp(req),
  });

  const resendEmailLimiter = limit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    name: "resend-confirm-email",
    keyFn: (req) => "resend-email:" + emailHash(normalizeEmail(req.body?.email || "")),
    shouldCount: (req) => !!normalizeEmail(req.body?.email),
  });

  const verifyPasswordLimiter = limit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    name: "verify-password",
    keyFn: (req) => "verify-pw-ip:" + clientIp(req),
  });

  const pendingLimiter = limit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    name: "auth-pending",
    keyFn: (req) => "pending:" + String(req.body?.pendingId || clientIp(req)),
  });

  let _auth = null;
  function authClient() {
    if (!_auth) _auth = createAuthClient();
    return _auth;
  }

  function authConfigured(res) {
    try {
      authClient();
      db();
      return true;
    } catch (e) {
      res.status(503).json({
        error: "Auth service is not configured on the worker.",
        code: "auth_unavailable",
      });
      return false;
    }
  }

  app.get("/auth/status", authIpLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const ip = clientIp(req);
      const gate = await assertNotLocked(db(), { email: null, ip });
      res.json({
        locked: !!gate.locked,
        retryAfterMs: gate.retryAfterMs || 0,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Status check failed" });
    }
  });

  function emailLinkRedirect() {
    return `${publicAppBase()}/login.html?confirmed=1`;
  }

  function browserVerifyUrl({ tokenHash, verifyType, pendingId }) {
    const url = new URL(`${publicAppBase()}/login.html`);
    url.searchParams.set("confirmed", "1");
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", verifyType || "magiclink");
    if (pendingId) url.searchParams.set("pending", pendingId);
    return url.toString();
  }

  function verifyUrlFromLink(link, pendingId) {
    if (link?.tokenHash) {
      return browserVerifyUrl({
        tokenHash: link.tokenHash,
        verifyType: link.verifyType,
        pendingId,
      });
    }
    return link?.actionLink || "";
  }

  function hashPendingSecret(secret) {
    return crypto.createHash("sha256").update(String(secret || "")).digest("hex");
  }

  function pendingSecretMatches(secret, hash) {
    const got = Buffer.from(hashPendingSecret(secret), "hex");
    const want = Buffer.from(String(hash || ""), "hex");
    if (!want.length || got.length !== want.length) return false;
    return crypto.timingSafeEqual(got, want);
  }

  function isPendingId(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      String(value || "")
    );
  }

  async function beginEmailHandoff(email) {
    const id = crypto.randomUUID();
    const secret = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await db()
      .from("auth_email_handoffs")
      .delete()
      .lt("expires_at", new Date().toISOString());
    const { error } = await db().from("auth_email_handoffs").insert({
      id,
      email,
      secret_hash: hashPendingSecret(secret),
      expires_at: expiresAt,
    });
    if (error) throw error;
    return { id, secret };
  }

  async function dropEmailHandoff(id) {
    if (!id) return;
    try {
      await db().from("auth_email_handoffs").delete().eq("id", id);
    } catch (err) {
      console.warn("dropEmailHandoff", err);
    }
  }

  function actionLinkFrom(data) {
    return (
      data?.properties?.action_link ||
      data?.action_link ||
      data?.user?.action_link ||
      ""
    );
  }

  function matchAuthUserByEmail(users, email) {
    const target = normalizeEmail(email);
    if (!target) return null;
    return (
      (Array.isArray(users) ? users : []).find((user) => normalizeEmail(user?.email) === target) ||
      null
    );
  }

  /** Existing auth user only. Magic-link generation creates an account when none exists. */
  async function findAuthUserByEmail(email) {
    const target = normalizeEmail(email);
    if (!target) return null;
    const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (!url || !key) {
      const err = new Error("Supabase is not configured");
      err.status = 503;
      err.code = "auth_unavailable";
      throw err;
    }
    const perPage = 200;
    for (let page = 1; page <= 20; page += 1) {
      const endpoint = new URL(url + "/auth/v1/admin/users");
      endpoint.searchParams.set("page", String(page));
      endpoint.searchParams.set("per_page", String(perPage));
      endpoint.searchParams.set("filter", target);
      const res = await fetch(endpoint, {
        headers: {
          Authorization: "Bearer " + key,
          apikey: key,
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error("Could not check that email");
        err.status = 503;
        err.code = "user_lookup_failed";
        throw err;
      }
      const users = Array.isArray(body?.users) ? body.users : [];
      const match = matchAuthUserByEmail(users, target);
      if (match) return match;
      if (users.length < perPage) return null;
    }
    return null;
  }

  async function createEmailLink(type, email, extra) {
    const options = { redirectTo: emailLinkRedirect() };
    if (extra?.data) options.data = extra.data;
    const { data, error } = await db().auth.admin.generateLink({
      type,
      email,
      options,
    });
    return {
      data,
      error,
      actionLink: actionLinkFrom(data),
      tokenHash: data?.properties?.hashed_token || "",
      verifyType: String(data?.properties?.verification_type || type || "magiclink"),
    };
  }

  app.post("/auth/signin", authIpLimiter, signinEmailLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const email = normalizeEmail(req.body?.email);
      const ip = clientIp(req);
      if (!email) {
        return res.status(400).json({ error: "Email is required", code: "invalid_input" });
      }

      const gate = await assertNotLocked(db(), { email, ip });
      if (!gate.ok) {
        return res.status(429).json({
          error: gate.message,
          code: gate.code || "auth_locked",
          retryAfterMs: gate.retryAfterMs,
        });
      }

      const existing = await findAuthUserByEmail(email);
      if (!existing) {
        return res.status(404).json({
          error: "No Moonrise account for that email. Sign up with your Employee ID first.",
          code: "no_account",
        });
      }

      const { data, error, actionLink, tokenHash, verifyType } = await createEmailLink("magiclink", email);
      if (error || (!actionLink && !tokenHash)) {
        const msg = String(error?.message || "");
        const code = String(error?.code || "");
        if (/user not found|unable to find|not found/i.test(msg) || code === "user_not_found") {
          return res.status(404).json({
            error: "No Moonrise account for that email. Sign up with your Employee ID first.",
            code: "no_account",
          });
        }
        if (/rate limit|over_email_send_rate_limit/i.test(msg) || code === "over_email_send_rate_limit") {
          return res.status(429).json({
            error: "Too many verification emails were sent. Wait a minute and try again.",
            code: "email_rate_limited",
          });
        }
        console.warn("generateLink magiclink", msg || error);
        return res.status(503).json({
          error: "Could not send a sign-in email right now. Try again in a minute.",
          code: "email_send_failed",
        });
      }

      const userId = data?.user?.id;
      if (userId) {
        const { data: profile } = await db()
          .from("profiles")
          .select("frozen")
          .eq("id", userId)
          .maybeSingle();
        if (profile?.frozen) {
          return res.status(403).json({
            error: "This account is frozen. Ask the studio owner to turn it back on.",
            code: "account_frozen",
          });
        }
      }

      const handoff = await beginEmailHandoff(email);
      const verifyUrl = verifyUrlFromLink({ tokenHash, verifyType, actionLink }, handoff.id);
      try {
        await sendEmailVerifyLink({ to: email, verifyUrl, kind: "signin" });
      } catch (mailErr) {
        console.error("sendEmailVerifyLink signin", mailErr);
        await dropEmailHandoff(handoff.id);
        return res.status(503).json({
          error: "Moonrise couldn't send the sign-in email. Check spam in a minute, or try again.",
          code: "email_send_failed",
        });
      }

      await clearAuthFailures(db(), { email, ip });
      res.json({
        ok: true,
        needsEmailConfirm: true,
        pendingId: handoff.id,
        pendingSecret: handoff.secret,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Sign in failed") });
    }
  });

  app.post("/auth/signup", authIpLimiter, signupLimiter, signupEmailLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const email = normalizeEmail(req.body?.email);
      const handle = String(req.body?.handle || "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
      const authCode = String(req.body?.authCode || req.body?.auth_code || "").trim();
      const ip = clientIp(req);
      if (!email) {
        return res.status(400).json({ error: "Email is required", code: "invalid_input" });
      }

      const gate = await assertNotLocked(db(), { email, ip });
      if (!gate.ok) {
        return res.status(429).json({
          error: gate.message,
          code: gate.code || "auth_locked",
          retryAfterMs: gate.retryAfterMs,
        });
      }

      const codeGate = await redeemEmployeeId(db(), authCode);
      if (!codeGate.ok) {
        return res.status(codeGate.status).json({ error: codeGate.error, code: codeGate.code });
      }

      const { data, error, actionLink, tokenHash, verifyType } = await createEmailLink("invite", email, {
        data: handle ? { handle } : undefined,
      });
      if (error || (!actionLink && !tokenHash)) {
        await releaseEmployeeId(db(), codeGate.step);
        const mapped = mapSignupAuthError(error || { message: "missing action link" });
        return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
      }

      const handoff = await beginEmailHandoff(email);
      const verifyUrl = verifyUrlFromLink({ tokenHash, verifyType, actionLink }, handoff.id);
      try {
        await sendEmailVerifyLink({ to: email, verifyUrl, kind: "signup" });
      } catch (mailErr) {
        console.error("sendEmailVerifyLink signup", mailErr);
        await dropEmailHandoff(handoff.id);
        const createdId = data?.user?.id;
        if (createdId) {
          try {
            await db().auth.admin.deleteUser(createdId);
          } catch (deleteErr) {
            console.warn("delete invited user after email failure", deleteErr);
          }
        }
        await releaseEmployeeId(db(), codeGate.step);
        return res.status(503).json({
          error: "Moonrise couldn't send the confirmation email. Try again in a minute.",
          code: "email_send_failed",
        });
      }

      await attachEmployeeIdUser(db(), codeGate.step, data?.user?.id);
      await clearAuthFailures(db(), { email, ip });
      res.json({
        user: data?.user || null,
        needsEmailConfirm: true,
        pendingId: handoff.id,
        pendingSecret: handoff.secret,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Sign up failed") });
    }
  });

  app.post("/auth/forgot", authIpLimiter, forgotLimiter, forgotEmailLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const email = normalizeEmail(req.body?.email);
      if (!email) {
        return res.status(400).json({ error: "Enter your email", code: "invalid_input" });
      }

      // Passwords are retired. A forgotten-password request sends a sign-in link instead.
      // Do not call magic-link generation for an unknown email: that creates an account.
      const existing = await findAuthUserByEmail(email);
      if (!existing) {
        return res.json({
          ok: true,
          message: "If that email has an account, a sign-in link is on the way.",
        });
      }
      const { error, actionLink } = await createEmailLink("magiclink", email);

      if (error) {
        const msg = String(error.message || "");
        const code = String(error.code || "");
        // Unknown account - same success shape (no email enumeration).
        if (/user not found|unable to find|not found/i.test(msg) || code === "user_not_found") {
          return res.json({
            ok: true,
            message: "If that email has an account, a sign-in link is on the way.",
          });
        }
        if (/rate limit|over_email_send_rate_limit/i.test(msg) || code === "over_email_send_rate_limit") {
          return res.status(429).json({
            error: "Too many reset emails were sent. Wait about a minute and try again.",
            code: "email_rate_limited",
          });
        }
        console.warn("generateLink recovery", msg || error);
        return res.status(503).json({
          error: "Could not create a reset link right now. Please try again in a minute.",
          code: "reset_link_failed",
        });
      }

      if (!actionLink) {
        console.warn("generateLink magiclink missing action_link");
        return res.status(503).json({
          error: "Could not send a sign-in email right now. Please try again in a minute.",
          code: "email_send_failed",
        });
      }

      try {
        await sendEmailVerifyLink({ to: email, verifyUrl: actionLink, kind: "signin" });
      } catch (mailErr) {
        console.error("sendEmailVerifyLink forgot", mailErr);
        return res.status(503).json({
          error:
            "Moonrise couldn't send the sign-in email. Check spam in a minute, or try again. If it keeps failing, contact " +
            SUPPORT_EMAIL +
            ".",
          code: "email_send_failed",
        });
      }

      res.json({
        ok: true,
        needsEmailConfirm: true,
        message: "Passwords are no longer used. If that email has an account, a sign-in link is on the way.",
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Reset failed") });
    }
  });

  app.post("/auth/resend-confirm", authIpLimiter, resendLimiter, resendEmailLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const email = normalizeEmail(req.body?.email);
      if (!email) {
        return res.status(400).json({ error: "Enter your email", code: "invalid_input" });
      }
      const existing = await findAuthUserByEmail(email);
      if (!existing) {
        return res.status(404).json({
          error: "No Moonrise account for that email. Sign up first.",
          code: "no_account",
        });
      }
      const { error, actionLink } = await createEmailLink("magiclink", email);
      if (error || !actionLink) {
        const msg = String(error?.message || "");
        if (/user not found|not found/i.test(msg)) {
          return res.status(404).json({
            error: "No Moonrise account for that email. Sign up first.",
            code: "no_account",
          });
        }
        const mapped = mapSignupAuthError(error || { message: "missing action link" });
        return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
      }
      await sendEmailVerifyLink({ to: email, verifyUrl: actionLink, kind: "signin" });
      res.json({ ok: true, message: "Verification email sent. Check your inbox." });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Resend failed") });
    }
  });

  /**
   * Verify current password under lockout rules (Settings -> change password).
   * Body: { email?, password } - email defaults from Bearer user.
   */
  app.get("/auth/session", async (req, res) => {
    if (!authConfigured(res)) return;
    res.set("Cache-Control", "no-store");
    try {
      const refresh = readCookie(req, "ms_rt");
      if (!refresh) {
        return res.status(401).json({ error: "Session expired", code: "session_expired" });
      }
      if (sessionIsIdle(req)) {
        clearAuthCookies(req, res);
        return res.status(401).json({ error: "Session expired", code: "session_expired" });
      }
      const { data, error } = await authClient().auth.refreshSession({ refresh_token: refresh });
      if (error || !data?.session) {
        // A parallel channel load may have already rotated this token.
        // Clearing cookies here deletes the session the other request just saved.
        return res.status(401).json({ error: "Session expired", code: "session_expired" });
      }
      writeAuthCookies(req, res, data.session);
      res.json(sessionJson(data.session, data.user));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Session check failed" });
    }
  });

  app.post("/auth/session", async (req, res) => {
    if (!authConfigured(res)) return;
    res.set("Cache-Control", "no-store");
    try {
      if (sessionIsIdle(req) && readCookie(req, "ms_seen")) {
        clearAuthCookies(req, res);
        return res.status(401).json({ error: "Session expired", code: "session_expired" });
      }
      const cookieRefresh = readCookie(req, "ms_rt");
      const refresh = String(req.body?.refresh_token || cookieRefresh || "");
      if (!refresh) {
        return res.status(401).json({ error: "Session expired", code: "session_expired" });
      }
      // The sign-in response already stored this token. Refreshing it again
      // rotates it and races the next page, which revokes the session.
      if (cookieRefresh && refresh === cookieRefresh) {
        writeAuthCookies(req, res, { refresh_token: cookieRefresh });
        return res.json({ ok: true });
      }
      const { data, error } = await authClient().auth.refreshSession({ refresh_token: refresh });
      if (error || !data?.session) {
        return res.status(401).json({ error: "Session expired", code: "session_expired" });
      }
      writeAuthCookies(req, res, data.session);
      res.json({
        ok: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Session check failed" });
    }
  });

  app.post("/auth/signout", async (req, res) => {
    clearAuthCookies(req, res);
    res.json({ ok: true });
  });

  app.post("/auth/handoff", authIpLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const pendingId = String(req.body?.pendingId || "").trim();
      const accessToken = String(req.body?.access_token || "").trim();
      const refreshToken = String(req.body?.refresh_token || "").trim();
      if (!isPendingId(pendingId) || !accessToken || !refreshToken) {
        return res.status(400).json({ error: "Missing sign-in handoff", code: "invalid_input" });
      }
      const { data: userData, error: userError } = await db().auth.getUser(accessToken);
      const email = normalizeEmail(userData?.user?.email);
      if (userError || !email) {
        return res.status(401).json({ error: "That email link is no longer valid.", code: "session_invalid" });
      }
      const { data: row, error } = await db()
        .from("auth_email_handoffs")
        .select("id, email, expires_at, claimed_at, ready_at")
        .eq("id", pendingId)
        .maybeSingle();
      if (error) throw error;
      if (!row || row.claimed_at || new Date(row.expires_at).getTime() <= Date.now()) {
        return res.status(410).json({
          error: "That sign-in request expired. Go back and request a new email.",
          code: "pending_expired",
        });
      }
      if (normalizeEmail(row.email) !== email) {
        return res.status(403).json({ error: "This link does not match the sign-in request.", code: "pending_mismatch" });
      }
      if (row.ready_at) {
        return res.json({ ok: true });
      }
      const { error: updateError } = await db()
        .from("auth_email_handoffs")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          ready_at: new Date().toISOString(),
        })
        .eq("id", pendingId)
        .is("claimed_at", null)
        .is("ready_at", null);
      if (updateError) throw updateError;
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Could not finish email verification") });
    }
  });

  app.post("/auth/pending", authIpLimiter, pendingLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const pendingId = String(req.body?.pendingId || "").trim();
      const pendingSecret = String(req.body?.pendingSecret || "");
      if (!isPendingId(pendingId) || !pendingSecret) {
        return res.status(400).json({ error: "Missing sign-in request", code: "invalid_input" });
      }
      const { data: row, error } = await db()
        .from("auth_email_handoffs")
        .select("id, secret_hash, access_token, refresh_token, expires_at, claimed_at, ready_at")
        .eq("id", pendingId)
        .maybeSingle();
      if (error) throw error;
      if (!row || !pendingSecretMatches(pendingSecret, row.secret_hash)) {
        return res.status(404).json({
          error: "That sign-in request is no longer waiting. Request a new email.",
          code: "pending_missing",
        });
      }
      if (req.body?.abandon === true) {
        await db().from("auth_email_handoffs").delete().eq("id", pendingId);
        return res.json({ ok: true, abandoned: true });
      }
      if (row.claimed_at || new Date(row.expires_at).getTime() <= Date.now()) {
        return res.status(410).json({
          error: "That email link expired. Request a new one.",
          code: "pending_expired",
        });
      }
      if (!row.ready_at || !row.access_token || !row.refresh_token) {
        return res.json({ ok: true, pending: true });
      }
      const accessToken = row.access_token;
      const refreshToken = row.refresh_token;
      const { data: claimed, error: claimError } = await db()
        .from("auth_email_handoffs")
        .update({
          claimed_at: new Date().toISOString(),
          access_token: null,
          refresh_token: null,
        })
        .eq("id", pendingId)
        .is("claimed_at", null)
        .select("id")
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) {
        return res.json({ ok: true, pending: true });
      }
      res.json({
        ok: true,
        pending: false,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Could not finish signing in") });
    }
  });

  app.post("/auth/verify-password", authIpLimiter, verifyPasswordLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    res.status(410).json({
      error: "Moonrise no longer uses passwords. Sign in with the link we email you.",
      code: "password_disabled",
    });
  });
}

module.exports = { mountAuthRoutes, createAuthClient };
