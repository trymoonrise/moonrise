/**
 * Shared Supabase browser client.
 * The access token stays in memory. The refresh token stays in an HttpOnly cookie
 * (ms_rt) that expires after a day without use. localStorage is not a session store.
 */
(function (global) {
  const AUTH_STORAGE_KEY = "moonrise-studio-auth";
  const REMEMBER_LOGIN_KEY = "ms_auth_autosave_enabled";
  const memory = new Map();
  let lastSyncedRefresh = "";
  let sessionCookieSync = Promise.resolve(true);
  let sessionCookieSyncHeld = false;

  let client = null;
  let rememberForClient = null;

  function purgeLegacyTokenStorage() {
    try {
      global.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
    try {
      global.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  purgeLegacyTokenStorage();

  function cfg() {
    const c = global.SITE_CONFIG || {};
    return {
      url: String(c.supabaseUrl || "").trim(),
      key: String(c.supabaseAnonKey || "").trim(),
    };
  }

  function canUse() {
    const { url, key } = cfg();
    return !!(url && key && global.supabase?.createClient);
  }

  function isRememberLoginEnabled() {
    try {
      return global.localStorage.getItem(REMEMBER_LOGIN_KEY) !== "0";
    } catch (_) {
      return true;
    }
  }

  function setRememberLoginEnabled(on) {
    const enabled = !!on;
    try {
      global.localStorage.setItem(REMEMBER_LOGIN_KEY, enabled ? "1" : "0");
    } catch (_) {
      /* ignore */
    }
    purgeLegacyTokenStorage();
    if (rememberForClient !== null && rememberForClient !== enabled) {
      resetClient();
    }
  }

  function setSessionCookieSyncHeld(held) {
    sessionCookieSyncHeld = !!held;
  }

  function syncRefreshCookie(raw) {
    if (sessionCookieSyncHeld) return sessionCookieSync;
    let refresh = "";
    try {
      const parsed = JSON.parse(raw);
      refresh =
        parsed?.refresh_token ||
        parsed?.session?.refresh_token ||
        parsed?.currentSession?.refresh_token ||
        "";
    } catch (_) {
      return sessionCookieSync;
    }
    if (!refresh || refresh === lastSyncedRefresh) return sessionCookieSync;
    lastSyncedRefresh = refresh;
    const base = String(global.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
    if (!base) {
      lastSyncedRefresh = "";
      sessionCookieSync = Promise.resolve(false);
      return sessionCookieSync;
    }
    sessionCookieSync = fetch(base + "/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh, remember: isRememberLoginEnabled() }),
    })
      .then(async (res) => {
        if (!res.ok) {
          lastSyncedRefresh = "";
          return false;
        }
        const data = await res.json().catch(() => ({}));
        if (data?.access_token && data?.refresh_token) {
          lastSyncedRefresh = data.refresh_token;
          rememberRefreshedSession(data.access_token, data.refresh_token);
          return {
            ok: true,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          };
        }
        return true;
      })
      .catch(() => {
        lastSyncedRefresh = "";
        return false;
      });
    return sessionCookieSync;
  }

  function rememberRefreshedSession(accessToken, refreshToken) {
    const raw = readStoredAuthRaw();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const apply = (obj) => {
        if (!obj || typeof obj !== "object") return;
        if (!obj.access_token && !obj.refresh_token) return;
        obj.access_token = accessToken;
        obj.refresh_token = refreshToken;
      };
      apply(parsed);
      apply(parsed.session);
      apply(parsed.currentSession);
      memory.set(AUTH_STORAGE_KEY, JSON.stringify(parsed));
    } catch (_) {
      /* the cookie still holds the refreshed session */
    }
  }

  function waitForSessionCookie() {
    return sessionCookieSync;
  }

  /** Write the in-memory refresh token into the sign-in cookie. */
  function flushSessionCookie() {
    sessionCookieSyncHeld = false;
    const raw = readStoredAuthRaw();
    if (!raw) {
      sessionCookieSync = Promise.resolve(false);
      return sessionCookieSync;
    }
    return syncRefreshCookie(raw);
  }

  function memoryStorage() {
    return {
      getItem(key) {
        return memory.has(key) ? memory.get(key) : null;
      },
      setItem(key, value) {
        const raw = String(value);
        memory.set(key, raw);
        if (key === AUTH_STORAGE_KEY) syncRefreshCookie(raw);
        purgeLegacyTokenStorage();
      },
      removeItem(key) {
        memory.delete(key);
      },
    };
  }

  function readStoredAuthRaw() {
    return memory.has(AUTH_STORAGE_KEY) ? memory.get(AUTH_STORAGE_KEY) : null;
  }

  function clearPersistedAuth() {
    memory.delete(AUTH_STORAGE_KEY);
    lastSyncedRefresh = "";
    purgeLegacyTokenStorage();
  }

  function resetClient() {
    if (client?.auth?.stopAutoRefresh) {
      try {
        client.auth.stopAutoRefresh();
      } catch (_) {
        /* ignore */
      }
    }
    client = null;
    rememberForClient = null;
  }

  function getClient() {
    const remember = isRememberLoginEnabled();
    if (client && rememberForClient === remember) return client;
    if (!canUse()) return null;
    // Keep any existing session when recreating the client (e.g. Auto save toggle).
    // Only drop the inactive store AFTER the new client is up, and only if the
    // active store already has a session copy.
    const { url, key } = cfg();
    const prev = client;
    if (prev?.auth?.stopAutoRefresh) {
      try {
        prev.auth.stopAutoRefresh();
      } catch (_) {
        /* ignore */
      }
    }
    client = global.supabase.createClient(url, key, {
      auth: {
        storageKey: AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: true,
        storage: memoryStorage(),
        // Password sign-in goes through the worker then setSession - not PKCE.
        flowType: "implicit",
        // WebAuthn passkeys (Face ID / fingerprint / password manager).
        experimental: { passkey: true },
      },
    });
    rememberForClient = remember;
    purgeLegacyTokenStorage();
    return client;
  }

  global.SiteSupabase = {
    AUTH_STORAGE_KEY,
    REMEMBER_LOGIN_KEY,
    getClient,
    canUse,
    resetClient,
    isRememberLoginEnabled,
    setRememberLoginEnabled,
    readStoredAuthRaw,
    clearPersistedAuth,
    waitForSessionCookie,
    flushSessionCookie,
    setSessionCookieSyncHeld,
  };
})(window);
