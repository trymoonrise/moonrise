/**
 * Secured auth routes - lockouts + rate limits in front of Supabase Auth.
 */
const { createClient } = require("@supabase/supabase-js");
const { clientError, isProduction } = require("./api-errors");
const { sendPasswordResetEmail } = require("./contact-mail");
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

  app.post("/auth/signin", authIpLimiter, signinEmailLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      const ip = clientIp(req);
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required", code: "invalid_input" });
      }

      const gate = await assertNotLocked(db(), { email, ip });
      if (!gate.ok) {
        return res.status(429).json({
          error: gate.message,
          code: gate.code || "auth_locked",
          retryAfterMs: gate.retryAfterMs,
        });
      }

      const { data, error } = await authClient().auth.signInWithPassword({ email, password });
      if (error || !data?.session) {
        const authMessage = String(error?.message || "");
        if (/banned|disabled user/i.test(authMessage)) {
          return res.status(403).json({
            error: "This account is frozen. Ask the studio owner to turn it back on.",
            code: "account_frozen",
          });
        }
        if (/email not confirmed/i.test(authMessage)) {
          return res.status(403).json({
            error:
              "Verify your email first. Check your inbox for the Moonrise confirmation link, then sign in.",
            code: "email_not_confirmed",
          });
        }
        const fail = await recordAuthFailure(db(), { email, ip });
        const status = fail.locked ? 429 : 401;
        return res.status(status).json({
          error: fail.message,
          code: fail.code,
          retryAfterMs: fail.retryAfterMs || 0,
          remainingTries: fail.remainingTries,
        });
      }

      const { data: profile } = await db()
        .from("profiles")
        .select("frozen")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.frozen) {
        try {
          await db().auth.admin.signOut(data.session.access_token, "global");
        } catch (_) {
          /* The frozen flag still blocks the next page load. */
        }
        return res.status(403).json({
          error: "This account is frozen. Ask the studio owner to turn it back on.",
          code: "account_frozen",
        });
      }

      await clearAuthFailures(db(), { email, ip });
      writeAuthCookies(req, res, data.session);
      res.json(sessionJson(data.session, data.user));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Sign in failed") });
    }
  });

  app.post("/auth/signup", authIpLimiter, signupLimiter, signupEmailLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const email = normalizeEmail(req.body?.email);
      const password = String(req.body?.password || "");
      const handle = String(req.body?.handle || "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
      const authCode = String(req.body?.authCode || req.body?.auth_code || "").trim();
      const ip = clientIp(req);
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required", code: "invalid_input" });
      }

      const pwCheck = validatePassword(password, email);
      if (!pwCheck.ok) {
        return res.status(400).json({ error: pwCheck.error, code: pwCheck.code });
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

      const publicAppUrl = String(process.env.PUBLIC_APP_URL || "https://trymoonrise.com").replace(/\/$/, "");
      const { data, error } = await authClient().auth.signUp({
        email,
        password,
        options: {
          data: handle ? { handle } : undefined,
          emailRedirectTo: `${publicAppUrl}/login.html?confirmed=1`,
        },
      });
      if (error) {
        await releaseEmployeeId(db(), codeGate.step);
        const mapped = mapSignupAuthError(error);
        return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
      }

      if (data?.user && !data?.session) {
        const identities = data.user.identities;
        if (!identities || identities.length === 0) {
          await releaseEmployeeId(db(), codeGate.step);
          return res.status(400).json({
            error: "An account with this email already exists. Sign in instead.",
            code: "signup_exists",
          });
        }
      }

      await attachEmployeeIdUser(db(), codeGate.step, data?.user?.id);

      if (data?.session) {
        await clearAuthFailures(db(), { email, ip });
        writeAuthCookies(req, res, data.session);
        return res.json(sessionJson(data.session, data.user, { needsEmailConfirm: false }));
      }

      res.json({
        user: data?.user || null,
        needsEmailConfirm: true,
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
      const redirectTo = safeAuthRedirect(req.body?.redirectTo, "/login.html?mode=recover");
      if (!email) {
        return res.status(400).json({ error: "Enter your email", code: "invalid_input" });
      }

      // Generate the recovery link with the service role, then deliver via Resend.
      // Supabase SMTP recover was rate-limited and the old handler still told the UI
      // "link sent" even when nothing went out.
      const { data, error } = await db().auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });

      if (error) {
        const msg = String(error.message || "");
        const code = String(error.code || "");
        // Unknown account - same success shape (no email enumeration).
        if (/user not found|unable to find|not found/i.test(msg) || code === "user_not_found") {
          return res.json({ ok: true, message: "If that email exists, a reset link is on the way." });
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

      const actionLink =
        data?.properties?.action_link ||
        data?.action_link ||
        data?.user?.action_link ||
        "";
      if (!actionLink) {
        console.warn("generateLink recovery missing action_link", data);
        return res.status(503).json({
          error: "Could not create a reset link right now. Please try again in a minute.",
          code: "reset_link_failed",
        });
      }

      try {
        await sendPasswordResetEmail({ to: email, resetUrl: actionLink });
      } catch (mailErr) {
        console.error("sendPasswordResetEmail", mailErr);
        return res.status(503).json({
          error:
            "Moonrise couldn't send the reset email. Check spam in a minute, or try again. If it keeps failing, contact " +
            SUPPORT_EMAIL +
            ".",
          code: "email_send_failed",
        });
      }

      res.json({ ok: true, message: "If that email exists, a reset link is on the way." });
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
      const publicAppUrl = String(process.env.PUBLIC_APP_URL || "https://trymoonrise.com").replace(/\/$/, "");
      const { error } = await authClient().auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${publicAppUrl}/login.html?confirmed=1`,
        },
      });
      if (error) {
        const mapped = mapSignupAuthError(error);
        return res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
      }
      res.json({ ok: true, message: "Confirmation email sent. Check your inbox." });
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
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Session check failed" });
    }
  });

  app.post("/auth/signout", async (req, res) => {
    clearAuthCookies(req, res);
    res.json({ ok: true });
  });

  app.post("/auth/verify-password", authIpLimiter, verifyPasswordLimiter, async (req, res) => {
    if (!authConfigured(res)) return;
    try {
      const password = String(req.body?.password || "");
      if (!password) {
        return res.status(400).json({ error: "Password required", code: "invalid_input" });
      }

      const header = String(req.headers.authorization || "");
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";
      let email = normalizeEmail(req.body?.email);
      if (token) {
        const { data, error } = await db().auth.getUser(token);
        if (error || !data?.user) {
          return res.status(401).json({
            error: "Your session ended. Sign in again.",
            code: "session_invalid",
          });
        }
        email = normalizeEmail(data.user.email || email);
      }
      if (!email) {
        return res.status(400).json({ error: "Email required", code: "invalid_input" });
      }

      const ip = clientIp(req);
      const gate = await assertNotLocked(db(), { email, ip });
      if (!gate.ok) {
        return res.status(429).json({
          error: gate.message,
          code: gate.code || "auth_locked",
          retryAfterMs: gate.retryAfterMs,
        });
      }

      const { data, error } = await authClient().auth.signInWithPassword({ email, password });
      if (error || !data?.session) {
        const fail = await recordAuthFailure(db(), { email, ip });
        const status = fail.locked ? 429 : 401;
        return res.status(status).json({
          error: fail.message,
          code: fail.code,
          retryAfterMs: fail.retryAfterMs || 0,
          remainingTries: fail.remainingTries,
        });
      }

      await clearAuthFailures(db(), { email, ip });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: clientError(e, "Verify failed") });
    }
  });
}

module.exports = { mountAuthRoutes, createAuthClient };
