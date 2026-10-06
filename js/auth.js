/**
 * Supabase Auth helpers + page gate for Studio.
 * Sign-in / sign-up / reset go through the worker so lockouts + rate limits apply.
 */
(function (global) {
  const PUBLIC_PAGES = new Set([
    "index",
    "login",
    "apply",
    "orders",
    "home",
    "contact",
    "privacy",
    "terms",
    "download",
  ]);
  const SUPPORT_EMAIL = "trymoonrise@gmail.com";
  const AUTH_TIMEOUT_MS = 45000;
  const AUTH_RETRY_DELAY_MS = 800;

  function getClient() {
    return global.SiteSupabase?.getClient?.() || null;
  }

  function isLocalFilePage() {
    try {
      return typeof location !== "undefined" && location.protocol === "file:";
    } catch (_) {
      return false;
    }
  }

  function workerUrl() {
    if (typeof global.resolveWorkerUrl === "function") {
      const resolved = String(global.resolveWorkerUrl() || "").replace(/\/$/, "");
      if (resolved) return resolved;
    }
    return String(global.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  function assertAuthReachable() {
    if (isLocalFilePage()) {
      throw authError({
        error:
          "Sign-in does not work when this page is opened as a file. Use https://trymoonrise.com/login.html instead.",
        code: "file_protocol",
      });
    }
    if (!workerUrl()) {
      throw authError({ error: "Worker URL is not configured", code: "worker_missing" });
    }
  }

  function warmAuthService() {
    if (isLocalFilePage()) return;
    const base = workerUrl();
    if (!base) return;
    void fetch(base + "/auth/status", { method: "GET", cache: "no-store" }).catch(() => {});
  }

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error((label || "Request") + " timed out")), ms)
      ),
    ]);
  }

  function isUselessAuthErrorText(text) {
    const value = String(text || "").trim();
    return !value || value === "{}" || value === "[object Object]";
  }

  function pickAuthErrorMessage(payload, fallback) {
    const raw =
      payload && payload.error !== undefined
        ? payload.error
        : payload && payload.message !== undefined
          ? payload.message
          : undefined;
    if (typeof raw === "string") {
      const text = raw.trim();
      if (text && !isUselessAuthErrorText(text)) return text;
    }
    if (raw && typeof raw === "object") {
      if (typeof raw.message === "string" && raw.message.trim()) return raw.message.trim();
    }
    const code = String(payload?.code || "").trim();
    if (code === "signup_exists") {
      return "An account with this email already exists. Sign in instead.";
    }
    if (code === "invalid_auth_code") {
      return "That Employee ID is not valid, or it expired after 6 hours. Ask your admin for a new one.";
    }
    if (code === "auth_code_used") {
      return "That Employee ID was already used. Ask your admin for the next code.";
    }
    if (code === "signup_disabled") {
      return "New accounts are invite-only. Ask your admin for an Employee ID.";
    }
    if (code === "account_frozen") {
      return "This account is frozen. Ask the studio owner to turn it back on.";
    }
    if (code === "email_rate_limited" || code === "over_email_send_rate_limit") {
      return "Too many emails were sent. Wait a minute and try again.";
    }
    if (code === "reset_link_failed") {
      return fallback || "Could not create a reset link right now. Please try again in a minute.";
    }
    if (code === "email_send_failed") {
      return (
        fallback ||
        "Moonrise couldn't send that email. Check spam, wait a minute, then try again - or contact " +
          SUPPORT_EMAIL +
          "."
      );
    }
    if (code === "signup_failed") {
      return fallback || "Sign up failed. Please try again in a few minutes.";
    }
    return fallback || "Authentication failed";
  }

  function authError(payload, fallback) {
    const err = new Error(pickAuthErrorMessage(payload, fallback));
    err.code = payload?.code || "";
    err.retryAfterMs = Number(payload?.retryAfterMs) || 0;
    err.remainingTries = payload?.remainingTries;
    return err;
  }

  function formatAuthError(err, fallback) {
    if (!err) return fallback || "Authentication failed";
    if (typeof err === "string") {
      const text = err.trim();
      return text && text !== "[object Object]" && text !== "{}" ? text : fallback || "Authentication failed";
    }
    const fromMessage = pickAuthErrorMessage(
      {
        error: err.message,
        message: err.message,
        code: err.code,
      },
      fallback
    );
    if (fromMessage && fromMessage !== "Authentication failed") return fromMessage;
    if (typeof err.code === "string" && err.code === "email_rate_limited") {
      return "Too many verification emails were sent. Wait about an hour and try again.";
    }
    return fallback || "Authentication failed";
  }

  function friendlyAuthMessage(err, fallback) {
    const raw = String(err?.message || err || "").trim();
    const lower = raw.toLowerCase();
    if (
      !raw ||
      lower === "failed to fetch" ||
      lower.includes("networkerror") ||
      lower.includes("load failed") ||
      lower.includes("network request failed")
    ) {
      if (isLocalFilePage()) {
        return "Sign-in does not work when this page is opened as a file. Use https://trymoonrise.com/login.html instead.";
      }
      if (fallback) return fallback;
      return "Can't reach the sign-in service. Check your connection and try again.";
    }
    if (lower.includes("timed out") || lower.includes("timeout")) {
      if (fallback) return fallback;
      return "Sign-in timed out. Please try again.";
    }
    return raw || fallback || "Authentication failed";
  }

  async function workerAuth(path, body, headers, attempt = 0) {
    assertAuthReachable();
    const base = workerUrl();
    let res;
    try {
      res = await withTimeout(
        fetch(base + path, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(headers || {}),
          },
          body: JSON.stringify(body || {}),
        }),
        AUTH_TIMEOUT_MS,
        "Auth"
      );
    } catch (e) {
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAY_MS));
        return workerAuth(path, body, headers, attempt + 1);
      }
      throw authError({ error: friendlyAuthMessage(e), code: "network_error" });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw authError(data, "Authentication failed");
    return data;
  }

  async function applySessionTokens(payload) {
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");
    if (!payload?.access_token || !payload?.refresh_token) {
      return payload;
    }
    try {
      const { data, error } = await withTimeout(
        sb.auth.setSession({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
        }),
        AUTH_TIMEOUT_MS,
        "Session"
      );
      if (error) throw error;
      // Confirm the session actually stuck before the auth gate runs on the next page.
      let session = data?.session || null;
      if (!session) {
        const again = await withTimeout(sb.auth.getSession(), 4000, "Session");
        session = again?.data?.session || null;
      }
      if (!session?.access_token || !session?.refresh_token) {
        throw new Error("Could not save your session. Try again.");
      }
      markClientSession();
      global.MsAuthSecurity?.scrubUrlAuthFragments?.();
      return { ...(data || {}), session, user: session.user || data?.user };
    } catch (e) {
      throw authError({
        error: friendlyAuthMessage(e, "Could not save your session. Try again."),
        code: "session_error",
      });
    }
  }

  let hydratePromise = null;

  function hasSessionCookie() {
    try {
      return /(?:^|;\s*)ms_on=1(?:;|$)/.test(global.document.cookie || "");
    } catch (_) {
      return false;
    }
  }

  function hasSessionHint() {
    try {
      return global.sessionStorage?.getItem("ms_session_hint") === "1";
    } catch (_) {
      return false;
    }
  }

  function markClientSession() {
    try {
      global.sessionStorage?.setItem("ms_session_hint", "1");
    } catch (_) {
      /* ignore */
    }
  }

  function clearClientSessionMarker() {
    try {
      global.sessionStorage?.removeItem("ms_session_hint");
    } catch (_) {
      /* ignore */
    }
  }

  let lastSessionProbe = "unknown";

  async function readWorkerSession() {
    const base = workerUrl();
    if (!base || !getClient()) return { status: "unavailable" };
    try {
      const res = await withTimeout(
        fetch(base + "/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
        8000,
        "Session"
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return { status: "expired" };
      if (!res.ok || !data?.access_token || !data?.refresh_token) return { status: "unavailable" };
      return { status: "ok", data };
    } catch (_) {
      return { status: "unavailable" };
    }
  }

  async function hydrateSessionFromCookie() {
    let result = await readWorkerSession();
    // The other channel may have rotated the refresh token first.
    // Only wait when this browser still looks signed in.
    const retry = hasSessionCookie() || hasSessionHint();
    if (result.status === "expired" && retry) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      result = await readWorkerSession();
    }
    if (result.status === "expired" && retry) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      result = await readWorkerSession();
    }
    lastSessionProbe = result.status;
    if (result.status !== "ok") return null;
    const applied = await applySessionTokens(result.data);
    const session = applied?.session || null;
    if (session) markClientSession();
    return session;
  }

  async function getSession() {
    const sb = getClient();
    if (!sb) {
      lastSessionProbe = "unavailable";
      return null;
    }
    try {
      const { data, error } = await withTimeout(sb.auth.getSession(), AUTH_TIMEOUT_MS, "Session");
      const session = data?.session;
      const expiresAt = Number(session?.expires_at || 0);
      const fresh = !!(session?.access_token && expiresAt * 1000 > Date.now() + 60000);
      if (!error && fresh) {
        lastSessionProbe = "ok";
        markClientSession();
        return session;
      }
    } catch (e) {
      console.warn(e);
    }
    if (!hydratePromise) {
      hydratePromise = hydrateSessionFromCookie().finally(() => {
        hydratePromise = null;
      });
    }
    try {
      return (await hydratePromise) || null;
    } catch (e) {
      console.warn(e);
      lastSessionProbe = "unavailable";
      return null;
    }
  }

  function readAuthCallbackParams() {
    if (typeof location === "undefined") {
      return { hash: new URLSearchParams(), query: new URLSearchParams() };
    }
    const hash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
    const query = new URLSearchParams(String(location.search || ""));
    return { hash, query };
  }

  /** Finish email confirm / magic-link / recovery callbacks and persist session. */
  async function completeAuthCallbackFromUrl() {
    if (typeof location === "undefined") return null;
    const { hash, query } = readAuthCallbackParams();
    const accessToken = hash.get("access_token") || query.get("access_token");
    const refreshToken = hash.get("refresh_token") || query.get("refresh_token");
    const code = query.get("code");
    const tokenHash = query.get("token_hash");
    if (!((accessToken && refreshToken) || code || tokenHash)) return null;

    const sb = getClient();
    if (!sb) return null;

    if (accessToken && refreshToken) {
      const data = await applySessionTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      global.MsAuthSecurity?.scrubUrlAuthFragments?.();
      return data?.session || (await getSession());
    }

    if (code) {
      try {
        const { data, error } = await withTimeout(
          sb.auth.exchangeCodeForSession(code),
          AUTH_TIMEOUT_MS,
          "Confirm email"
        );
        if (!error && data?.session) {
          global.MsAuthSecurity?.scrubUrlAuthFragments?.();
          return data.session;
        }
      } catch (e) {
        console.warn(e);
      }
      if (!tokenHash) return null;
    }

    const otpType = String(query.get("type") || hash.get("type") || "signup").toLowerCase();
    if (tokenHash) {
      const verifyType =
        otpType === "recovery"
          ? "recovery"
          : otpType === "email_change"
            ? "email_change"
            : otpType === "invite"
              ? "invite"
              : otpType === "magiclink" || otpType === "email"
                ? "email"
                : "signup";
      try {
        const { data, error } = await withTimeout(
          sb.auth.verifyOtp({ token_hash: tokenHash, type: verifyType }),
          AUTH_TIMEOUT_MS,
          "Verify email"
        );
        if (!error && data?.session) {
          global.MsAuthSecurity?.scrubUrlAuthFragments?.();
          return data.session;
        }
      } catch (e) {
        console.warn(e);
      }
      return null;
    }

    return (await getSession()) || null;
  }

  function clearAuthCallbackFromUrl() {
    if (typeof location === "undefined") return;
    try {
      global.MsAuthSecurity?.scrubUrlAuthFragments?.();
      const params = new URLSearchParams(location.search);
      params.delete("code");
      params.delete("token_hash");
      params.delete("type");
      params.delete("confirmed");
      params.delete("check_email");
      const next = params.get("next") || "dashboard.html";
      params.delete("next");
      const qs = new URLSearchParams();
      if (next !== "dashboard.html") qs.set("next", next);
      if (params.get("mode") === "signup") qs.set("mode", "signup");
      const suffix = qs.toString() ? "?" + qs.toString() : "";
      history.replaceState(null, "", location.pathname + suffix);
    } catch (_) {
      /* ignore */
    }
  }

  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  async function signUp(email, handle, authCode) {
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");
    const handles = global.StudioHandles;
    if (!handles?.assertHandleAllowed) {
      throw new Error("Handle validation is unavailable");
    }
    const cleanHandle = handles.assertHandleAllowed(handle);
    const payload = await workerAuth("/auth/signup", {
      email: String(email || "").trim(),
      handle: cleanHandle,
      authCode: String(authCode || "").trim(),
    });
    const sessionData = await applySessionTokens(payload);
    const user = sessionData?.user || payload.user;
    if (user?.id) {
      Promise.resolve(ensureProfile(user, cleanHandle)).catch(() => {});
    }
    return {
      user: user || null,
      session: sessionData?.session || null,
      needsEmailConfirm: !!payload.needsEmailConfirm,
      pendingId: payload.pendingId || "",
      pendingSecret: payload.pendingSecret || "",
    };
  }

  async function publishEmailHandoff(pendingId, session) {
    const accessToken = session?.access_token;
    const refreshToken = session?.refresh_token;
    if (!pendingId || !accessToken || !refreshToken) return null;
    return workerAuth("/auth/handoff", {
      pendingId,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async function claimEmailHandoff(pendingId, pendingSecret) {
    const payload = await workerAuth("/auth/pending", { pendingId, pendingSecret });
    if (payload?.pending) return { pending: true };
    await applySessionTokens(payload);
    return { pending: false };
  }

  async function abandonEmailHandoff(pendingId, pendingSecret) {
    if (!pendingId || !pendingSecret) return null;
    return workerAuth("/auth/pending", { pendingId, pendingSecret, abandon: true });
  }

  async function signIn(email) {
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");
    const payload = await workerAuth("/auth/signin", {
      email: String(email || "").trim(),
      remember: global.SiteSupabase?.isRememberLoginEnabled?.() !== false,
    });
    const sessionData = await applySessionTokens(payload);
    const user = sessionData?.user || payload.user;
    if (user) {
      Promise.resolve(ensureProfile(user)).catch(() => {});
    }
    return sessionData || payload;
  }

  /** Passkeys only verify for the configured relying party (trymoonrise.com). */
  function passkeyHostAllowed() {
    try {
      const host = String(global.location?.hostname || "").toLowerCase();
      return host === "trymoonrise.com" || host === "www.trymoonrise.com";
    } catch (_) {
      return false;
    }
  }

  function canUsePasskeys() {
    try {
      if (!passkeyHostAllowed()) return false;
      if (!global.isSecureContext) return false;
      if (!global.PublicKeyCredential) return false;
      const sb = getClient();
      return (
        typeof sb?.auth?.signInWithPasskey === "function" &&
        typeof sb?.auth?.registerPasskey === "function"
      );
    } catch (_) {
      return false;
    }
  }

  async function signInWithPasskey() {
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");
    if (!canUsePasskeys()) {
      throw authError({
        error: "Passkeys are not available on this device or browser.",
        code: "passkey_unavailable",
      });
    }
    const { data, error } = await withTimeout(
      sb.auth.signInWithPasskey(),
      120000,
      "Passkey sign-in"
    );
    if (error) {
      const raw = String(error.message || error.name || "");
      const cancelled =
        /cancel|abort|not allowed|timed out/i.test(raw) ||
        error.name === "NotAllowedError";
      const missing =
        /no passkey|not saved|no credential|credential_not_found|empty allowlist|no.*available/i.test(
          raw
        );
      throw authError({
        error: missing
          ? "No passkey is saved for this account yet."
          : cancelled
            ? "Passkey sign-in was cancelled."
            : friendlyAuthMessage(error, error.message || "Passkey sign-in failed"),
        code: missing
          ? "passkey_missing"
          : error.code || (cancelled ? "passkey_cancelled" : "passkey_failed"),
      });
    }
    const session = data?.session || null;
    const user = data?.user || session?.user;
    if (!session?.access_token || !session?.refresh_token) {
      throw authError({
        error: "Passkey sign-in did not start a session. Use the email link instead.",
        code: "passkey_failed",
      });
    }
    markClientSession();
    const synced = await global.SiteSupabase?.waitForSessionCookie?.();
    if (synced === false) {
      throw authError({
        error: "Passkey worked, but this browser could not keep you signed in. Use the email link instead.",
        code: "session_error",
      });
    }
    if (user) {
      Promise.resolve(ensureProfile(user)).catch(() => {});
    }
    return { ...(data || {}), session, user, created: false };
  }

  /**
   * One-button passkey flow:
   * 1) Try passkey sign-in
   * 2) If none exist, use email+password once to sign in and create a passkey
   */
  async function continueWithPasskey(opts) {
    const email = String(opts?.email || "").trim();
    const password = String(opts?.password || "");
    try {
      return await signInWithPasskey();
    } catch (ex) {
      const raw = String(ex?.message || "");
      const missing =
        ex?.code === "passkey_missing" || /no passkey|not saved|credential_not_found/i.test(raw);
      const cancelled =
        ex?.code === "passkey_cancelled" || /cancel|abort|not allowed/i.test(raw);
      // Create path: no passkey yet, or user dismissed the empty OS sheet after filling password.
      const tryCreate = missing || (cancelled && email && password);
      if (!tryCreate) {
        if (cancelled) {
          throw authError({
            error:
              "Enter your email and password, then tap Passkey to create one and sign in.",
            code: "passkey_needs_password",
          });
        }
        throw ex;
      }
      if (!email || !password) {
        throw authError({
          error:
            "Enter your email and password, then tap Passkey again to create one and sign in.",
          code: "passkey_needs_password",
        });
      }
      const signedIn = await signIn(email);
      if (signedIn?.needsEmailConfirm && !signedIn?.access_token) {
        throw authError({
          error: "Check your email and open the sign-in link, then try the passkey again.",
          code: "email_not_confirmed",
        });
      }
      try {
        await registerPasskey();
        return { created: true };
      } catch (regEx) {
        const regCancelled =
          regEx?.code === "passkey_cancelled" ||
          /cancel|abort|not allowed/i.test(String(regEx?.message || ""));
        if (regCancelled) {
          return { created: false, signedInWithPassword: true };
        }
        const err = authError({
          error:
            regEx?.message ||
            "Signed in, but the passkey was not saved. You can add one in Settings -> Passkeys.",
          code: "passkey_create_failed",
        });
        err.sessionOk = true;
        throw err;
      }
    }
  }

  /** Sign up, then create a passkey while the new session is active. */
  async function signUpWithPasskey(email, handle, authCode) {
    const data = await signUp(email, handle, authCode);
    if (!(data?.session || data?.access_token || data?.user)) {
      return { ...(data || {}), created: false, needsEmailConfirm: true };
    }
    // Need an active session to register.
    const session = await getSession();
    if (!session) {
      return { ...(data || {}), created: false, needsEmailConfirm: !!data?.needsEmailConfirm };
    }
    try {
      await registerPasskey();
      return { ...(data || {}), created: true };
    } catch (regEx) {
      const cancelled =
        regEx?.code === "passkey_cancelled" ||
        /cancel|abort|not allowed/i.test(String(regEx?.message || ""));
      if (cancelled) {
        return { ...(data || {}), created: false, signedUp: true };
      }
      const err = authError({
        error:
          regEx?.message ||
          "Account created, but the passkey was not saved. Add one in Settings -> Passkeys.",
        code: "passkey_create_failed",
      });
      err.sessionOk = true;
      throw err;
    }
  }

  /** Register a new passkey and remove previous ones (change/replace). */
  async function replacePasskey() {
    const before = await listPasskeys();
    const created = await registerPasskey();
    const newId = created?.id || null;
    if (newId && before.length) {
      for (const pk of before) {
        if (pk?.id && pk.id !== newId) {
          try {
            await deletePasskey(pk.id);
          } catch (_) {
            /* keep going */
          }
        }
      }
    }
    return created;
  }

  async function registerPasskey() {
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");
    if (!canUsePasskeys()) {
      throw authError({
        error: "Passkeys are not available on this device or browser.",
        code: "passkey_unavailable",
      });
    }
    const { data, error } = await withTimeout(
      sb.auth.registerPasskey(),
      AUTH_TIMEOUT_MS,
      "Passkey setup"
    );
    if (error) {
      const cancelled =
        /cancel|abort|not allowed|timed out/i.test(String(error.message || "")) ||
        error.name === "NotAllowedError";
      throw authError({
        error: cancelled
          ? "Passkey setup was cancelled."
          : friendlyAuthMessage(error, error.message || "Could not create passkey"),
        code: error.code || (cancelled ? "passkey_cancelled" : "passkey_failed"),
      });
    }
    return data;
  }

  async function listPasskeys() {
    const sb = getClient();
    if (!sb?.auth?.passkey?.list) return [];
    const { data, error } = await withTimeout(sb.auth.passkey.list(), 8000, "Passkeys");
    if (error) throw authError({ error: error.message || "Could not load passkeys", code: error.code });
    return Array.isArray(data) ? data : data?.passkeys || [];
  }

  async function deletePasskey(passkeyId) {
    const sb = getClient();
    if (!sb?.auth?.passkey?.delete) {
      throw new Error("Passkey management is not available");
    }
    const id = String(passkeyId || "").trim();
    if (!id) throw new Error("Missing passkey");
    const { error } = await withTimeout(
      sb.auth.passkey.delete({ passkeyId: id }),
      8000,
      "Remove passkey"
    );
    if (error) throw authError({ error: error.message || "Could not remove passkey", code: error.code });
    return true;
  }

  /** Best-effort password-manager save prompt (Chromium PasswordCredential). */
  async function offerPasswordManagerSave(email, password) {
    try {
      if (!global.PasswordCredential || !global.navigator?.credentials?.store) return false;
      const id = String(email || "").trim();
      const pw = String(password || "");
      if (!id || !pw) return false;
      const cred = new global.PasswordCredential({ id, password: pw, name: id });
      await global.navigator.credentials.store(cred);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function signOut() {
    const sb = getClient();
    clearClientSessionMarker();
    try {
      global.MsAuthSecurity?.clearSensitiveClientStorage?.();
    } catch (_) {
      /* ignore */
    }
    try {
      const base = workerUrl();
      if (base) {
        await fetch(base + "/auth/signout", { method: "POST", credentials: "include" });
      }
    } catch (_) {
      /* still clear the in-memory session */
    }
    if (sb) {
      try {
        // Local scope signs out this browser. A global sign-out revokes the
        // shared session and leaves other open tabs with a dead access token.
        await withTimeout(sb.auth.signOut({ scope: "local" }), 4000, "Sign out");
      } catch (e) {
        /* still clear local session best-effort */
      }
    }
    try {
      global.SiteSupabase?.clearPersistedAuth?.();
    } catch (_) {
      /* ignore */
    }
  }

  async function ensureProfile(user, handleOverride) {
    const sb = getClient();
    if (!sb || !user?.id) return;
    const handles = global.StudioHandles;
    const metaHandle = String(user.user_metadata?.handle || "").replace(/^@/, "");
    let base = handles?.cleanHandle
      ? handles.cleanHandle(handleOverride || metaHandle, 18)
      : String(handleOverride || metaHandle || "")
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 18);
    if (!base || handles?.isReservedHandle?.(base)) {
      base = handles?.fallbackHandleBase?.(user.email) || "user";
    }
    const handle = base + "_" + String(user.id).replace(/-/g, "").slice(0, 6);

    try {
      const { data: existing } = await withTimeout(
        sb.from("profiles").select("id").eq("id", user.id).maybeSingle(),
        4000,
        "Profile check"
      );
      if (existing?.id) return;
      await withTimeout(
        sb.from("profiles").upsert(
          {
            id: user.id,
            handle,
            display_name:
              (handleOverride || metaHandle || base).replace(/^@/, "").trim() || base,
            branding_defaults: {},
            notification_prefs: { email: true, clientPurchases: false },
          },
          { onConflict: "id" }
        ),
        4000,
        "Profile save"
      );
    } catch (e) {
      console.warn("ensureProfile", e);
    }
  }

  async function getProfile() {
    const sb = getClient();
    const user = await getUser();
    if (!sb || !user) return null;
    try {
      const { data } = await withTimeout(
        sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        4000,
        "Profile"
      );
      return data || null;
    } catch (e) {
      return null;
    }
  }

  function payoutProfileFrom(profile) {
    return profile?.payout_profile &&
      typeof profile.payout_profile === "object" &&
      !Array.isArray(profile.payout_profile)
      ? profile.payout_profile
      : {};
  }

  function brandingDefaultsFrom(profile) {
    return profile?.branding_defaults &&
      typeof profile.branding_defaults === "object" &&
      !Array.isArray(profile.branding_defaults)
      ? profile.branding_defaults
      : {};
  }

  function payoutProfileComplete(profile) {
    return studioOnboarded(profile);
  }

  function verifiedSecurityCard(payout) {
    const card = payout?.securityCard;
    return !!(
      card &&
      String(card.verifiedAt || "").trim() &&
      String(card.paymentMethodId || "").trim()
    );
  }

  const FORCE_ONBOARDING_REPLAY_KEY = "ms_force_studio_onboarding_replay";

  function hasForceOnboardingReplay() {
    try {
      return sessionStorage.getItem(FORCE_ONBOARDING_REPLAY_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function setForceOnboardingReplay(enabled) {
    try {
      if (enabled) sessionStorage.setItem(FORCE_ONBOARDING_REPLAY_KEY, "1");
      else sessionStorage.removeItem(FORCE_ONBOARDING_REPLAY_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function studioOnboarded(profile) {
    if (!profile) return false;
    if (hasForceOnboardingReplay()) return false;

    const branding = brandingDefaultsFrom(profile);
    if (!String(branding.studioOnboardedAt || "").trim()) return false;

    const payout = payoutProfileFrom(profile);
    if (String(payout.onboardingStatus || "") !== "complete") return false;
    if (String(payout.skippedAt || "").trim()) return false;
    if (!verifiedSecurityCard(payout)) return false;

    return !!(
      String(payout.email || "").trim() &&
      String(payout.phone || "").trim() &&
      String(payout.payoutMethod || payout.payout_method || "").trim() &&
      String(payout.payoutHandle || payout.payout_handle || "").trim()
    );
  }

  async function studioOnboardingRedirect(nextUrl) {
    const destination = String(nextUrl || "dashboard.html");
    const profile = await getProfile();
    if (studioOnboarded(profile)) {
      return destination;
    }
    return "onboarding.html?next=" + encodeURIComponent(destination);
  }

  async function ensureStudioOnboarding(existingSession) {
    const page = document.body?.dataset?.page || "";
    if (PUBLIC_PAGES.has(page)) return null;
    if (page === "onboarding") return null;

    const session = existingSession || (await getSession());
    if (!session) return null;

    const profile = await getProfile();
    if (studioOnboarded(profile)) {
      return null;
    }

    const next =
      (location.pathname.split("/").pop() || "dashboard.html") + location.search + location.hash;
    const replayQs = hasForceOnboardingReplay() ? "replay=1&" : "";
    location.replace(
      "onboarding.html?" + replayQs + "next=" + encodeURIComponent(next)
    );
    return "redirect";
  }

  async function clearStudioOnboardingFlag() {
    setForceOnboardingReplay(true);
    const user = await getUser();
    if (!user) throw new Error("Not signed in");
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");
    const profile = await getProfile();
    const branding = { ...brandingDefaultsFrom(profile) };
    branding.studioOnboardedAt = null;
    delete branding.studioOnboardedAt;
    const { error } = await withTimeout(
      sb.from("profiles").update({ branding_defaults: branding }).eq("id", user.id),
      6000,
      "Clear onboarding"
    );
    if (error) throw error;
    return branding;
  }

  async function requestPasswordReset(email) {
    const address = String(email || "").trim();
    if (!address) throw new Error("Enter your email");
    const redirectTo = new URL("login.html?mode=recover", location.href).href;
    return workerAuth("/auth/forgot", { email: address, redirectTo });
  }

  async function resendConfirmationEmail(email) {
    const address = String(email || "").trim();
    if (!address) throw new Error("Enter your email");
    return workerAuth("/auth/resend-confirm", { email: address });
  }

  async function setPassword(newPassword) {
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");
    const next = String(newPassword || "");
    if (next.length < 8) throw new Error("New password must be at least 8 characters");
    const { data, error } = await withTimeout(
      sb.auth.updateUser({ password: next }),
      AUTH_TIMEOUT_MS,
      "Set password"
    );
    if (error) throw error;
    return data;
  }

  async function changePassword(currentPassword, newPassword) {
    const sb = getClient();
    if (!sb) throw new Error("Supabase is not configured");

    const current = String(currentPassword || "");
    const next = String(newPassword || "");
    if (!current) throw new Error("Enter your current password");
    if (next.length < 8) throw new Error("New password must be at least 8 characters");
    if (current === next) throw new Error("New password must be different from the current one");

    const session = await getSession();
    if (!session?.access_token) throw new Error("Not signed in");

    await workerAuth(
      "/auth/verify-password",
      { password: current },
      { Authorization: "Bearer " + session.access_token }
    );

    const { data, error } = await withTimeout(
      sb.auth.updateUser({ password: next }),
      AUTH_TIMEOUT_MS,
      "Update password"
    );
    if (error) throw error;
    return data;
  }

  function releaseAuthGate() {
    try {
      if (typeof global.__msReleaseAuthGate === "function") {
        global.__msReleaseAuthGate();
        return;
      }
      document.documentElement.classList.remove("ms-auth-gating");
      document.documentElement.classList.add("ms-auth-ready");
    } catch (_) {
      /* ignore */
    }
  }

  async function requireAuth() {
    const page = document.body?.dataset?.page || "";
    if (PUBLIC_PAGES.has(page)) {
      releaseAuthGate();
      return null;
    }
    const session = await getSession();
    if (!session) {
      if (document.prerendering) return null;
      // Worker blip or scripts still loading. Stay on the loader instead of
      // painting the login page and bouncing back.
      if (lastSessionProbe === "unavailable") return null;
      global.__msAuthRedirecting = true;
      clearClientSessionMarker();
      const next = encodeURIComponent(
        (location.pathname.split("/").pop() || "dashboard.html") + location.search + location.hash
      );
      location.replace("login.html?next=" + next);
      return null;
    }
    const profile = await getProfile();
    if (profile?.frozen) {
      try {
        await signOut();
      } catch (_) {
        /* ignore */
      }
      location.replace("login.html?frozen=1");
      return null;
    }
    releaseAuthGate();
    return session;
  }

  const nativeFetch = global.fetch ? global.fetch.bind(global) : null;
  let recoveringSession = null;

  function requestAuthHeader(headers) {
    if (!headers) return "";
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      return headers.get("Authorization") || headers.get("authorization") || "";
    }
    return headers.Authorization || headers.authorization || "";
  }

  function requestUrl(input) {
    if (typeof input === "string") return input;
    return String(input?.url || "");
  }

  function isDeadSessionPayload(data) {
    const code = String(data?.code || "");
    return code === "session_invalid" || code === "unauthorized" || code === "session_expired";
  }

  function sendToLogin() {
    try {
      if (document.prerendering) return;
      const file = (location.pathname.split("/").pop() || "index.html").split("?")[0];
      const page = file.replace(/\.html$/, "") || "index";
      if (PUBLIC_PAGES.has(page) || file === "login.html") return;
      const next = encodeURIComponent(file + location.search + location.hash);
      location.replace("login.html?next=" + next);
    } catch (_) {
      /* ignore */
    }
  }

  async function recoverDeadSession() {
    if (!recoveringSession) {
      recoveringSession = (async () => {
        try {
          global.SiteSupabase?.clearPersistedAuth?.();
        } catch (_) {
          /* ignore */
        }
        return getSession();
      })().finally(() => {
        recoveringSession = null;
      });
    }
    return recoveringSession;
  }

  if (nativeFetch && !global.__msAuthFetch) {
    global.__msAuthFetch = true;
    global.fetch = async function (input, init) {
      const res = await nativeFetch(input, init);
      const base = workerUrl();
      const url = requestUrl(input);
      if (!base || !url.startsWith(base) || res.status !== 401) return res;
      if (url.indexOf("/auth/session") !== -1 || url.indexOf("/auth/signout") !== -1) return res;
      const header = requestAuthHeader(init?.headers);
      if (!header.startsWith("Bearer ")) return res;
      const alreadyRetried =
        (typeof Headers !== "undefined" && init?.headers instanceof Headers
          ? init.headers.get("X-Ms-Auth-Retry")
          : init?.headers?.["X-Ms-Auth-Retry"]) === "1";
      let data = {};
      try {
        data = await res.clone().json();
      } catch (_) {
        data = {};
      }
      if (!isDeadSessionPayload(data) && data.error !== "Invalid auth token") return res;
      if (alreadyRetried) {
        sendToLogin();
        return res;
      }
      const session = await recoverDeadSession();
      if (!session?.access_token) {
        sendToLogin();
        return res;
      }
      const headers = new Headers(init?.headers || {});
      headers.set("Authorization", "Bearer " + session.access_token);
      headers.set("X-Ms-Auth-Retry", "1");
      return nativeFetch(input, Object.assign({}, init, { headers }));
    };
  }

  global.StudioAuth = {
    getClient,
    getSession,
    getUser,
    getProfile,
    friendlyNetworkMessage: friendlyAuthMessage,
    formatAuthError,
    warmAuthService,
    workerUrl,
    payoutProfileComplete,
    studioOnboarded,
    studioOnboardingRedirect,
    ensureStudioOnboarding,
    clearStudioOnboardingFlag,
    hasForceOnboardingReplay,
    setForceOnboardingReplay,
    signUp,
    signIn,
    publishEmailHandoff,
    claimEmailHandoff,
    abandonEmailHandoff,
    canUsePasskeys,
    passkeyHostAllowed,
    signInWithPasskey,
    continueWithPasskey,
    signUpWithPasskey,
    replacePasskey,
    registerPasskey,
    listPasskeys,
    deletePasskey,
    offerPasswordManagerSave,
    signOut,
    completeAuthCallbackFromUrl,
    clearAuthCallbackFromUrl,
    requestPasswordReset,
    resendConfirmationEmail,
    setPassword,
    changePassword,
    ensureProfile,
    requireAuth,
    withTimeout,
    assertHandleAllowed: function (raw, opts) {
      return global.StudioHandles.assertHandleAllowed(raw, opts);
    },
    isReservedHandle: function (raw) {
      return !!global.StudioHandles?.isReservedHandle?.(raw);
    },
  };
})(window);
