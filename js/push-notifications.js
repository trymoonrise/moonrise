/**
 * Creator Web Push helpers for Settings → Notifications.
 */
(function (global) {
  const ALERT_KEYS = ["clientPurchases", "siteVisits", "contactMessages"];
  const PREF_KEY = "clientPurchases";
  const LEGACY_PURCHASE = "purchaseAlerts";

  function workerBase() {
    if (typeof global.resolveWorkerUrl === "function") {
      const resolved = String(global.resolveWorkerUrl() || "").replace(/\/$/, "");
      if (resolved) return resolved;
    }
    return String(global.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  function supported() {
    return (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
    return out;
  }

  async function authHeaders() {
    const session = await global.StudioAuth?.getSession?.();
    if (!session?.access_token) throw new Error("Sign in to manage notifications.");
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.access_token,
    };
  }

  async function fetchVapidPublicKey() {
    const base = workerBase();
    if (!base) throw new Error("Worker URL is not configured.");
    const res = await fetch(base + "/push/vapid-public-key", {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Push notifications are not available yet.");
    }
    const key = String(data.publicKey || "").trim();
    if (!key) throw new Error("Missing VAPID public key.");
    return key;
  }

  async function readyRegistration() {
    if (!supported()) throw new Error("Push notifications are not supported in this browser.");
    try {
      await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
    } catch (_) {
      /* ignore - ready may still resolve if already registered */
    }
    const reg = await navigator.serviceWorker.ready;
    if (!reg?.pushManager) throw new Error("Push manager is unavailable.");
    return reg;
  }

  async function currentSubscription() {
    try {
      const reg = await readyRegistration();
      return (await reg.pushManager.getSubscription()) || null;
    } catch (_) {
      return null;
    }
  }

  async function subscribe() {
    if (!supported()) {
      throw new Error("This browser does not support push notifications.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission was not granted.");
    }

    const publicKey = await fetchVapidPublicKey();
    const reg = await readyRegistration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = sub.toJSON();
    const headers = await authHeaders();
    const base = workerBase();
    const res = await fetch(base + "/push/subscribe", {
      method: "POST",
      headers,
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not save push subscription.");
    return { subscription: sub, data };
  }

  async function unsubscribe() {
    const sub = await currentSubscription();
    if (!sub) return { ok: true, skipped: true };

    try {
      const headers = await authHeaders();
      const base = workerBase();
      await fetch(base + "/push/unsubscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    } catch (_) {
      /* still drop local subscription */
    }

    try {
      await sub.unsubscribe();
    } catch (_) {
      /* ignore */
    }
    return { ok: true };
  }

  function normalizePrefs(prefs) {
    const src = prefs && typeof prefs === "object" && !Array.isArray(prefs) ? prefs : {};
    const next = {
      email: src.email !== false,
      clientPurchases: src.clientPurchases === true || src[LEGACY_PURCHASE] === true,
      siteVisits: src.siteVisits === true,
      contactMessages: src.contactMessages === true,
    };
    return next;
  }

  function anyAlertEnabled(prefs) {
    const n = normalizePrefs(prefs);
    return ALERT_KEYS.some((key) => n[key] === true);
  }

  function readPref(prefs) {
    return normalizePrefs(prefs).clientPurchases === true;
  }

  function readPrefs(prefs) {
    return normalizePrefs(prefs);
  }

  function withPref(prefs, enabled) {
    const next = normalizePrefs(prefs);
    next[PREF_KEY] = !!enabled;
    return next;
  }

  function withAlert(prefs, key, enabled) {
    const next = normalizePrefs(prefs);
    if (!ALERT_KEYS.includes(key)) return next;
    next[key] = !!enabled;
    return next;
  }

  async function savePrefs(notification_prefs) {
    const user = await global.StudioAuth?.getUser?.();
    if (!user) throw new Error("Not signed in");
    const { error } = await global.SiteSupabase.getClient()
      .from("profiles")
      .update({
        notification_prefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) throw error;
    return notification_prefs;
  }

  async function savePref(enabled) {
    const profile = await global.StudioAuth?.getProfile?.();
    return savePrefs(withPref(profile?.notification_prefs, enabled));
  }

  /**
   * Toggle one alert type. Keeps the push subscription while any alert is on.
   */
  async function setAlert(key, enabled) {
    if (!ALERT_KEYS.includes(key)) throw new Error("Unknown notification setting.");
    const profile = await global.StudioAuth?.getProfile?.();
    const next = withAlert(profile?.notification_prefs, key, enabled);
    if (anyAlertEnabled(next)) {
      await subscribe();
      await savePrefs(next);
    } else {
      await savePrefs(next);
      await unsubscribe();
    }
    return next;
  }

  /**
   * Turn client-purchase alerts on or off: save pref + manage push subscription.
   */
  async function setClientPurchaseAlerts(enabled) {
    return setAlert(PREF_KEY, enabled);
  }

  function summaryLabel(prefs) {
    const n = normalizePrefs(prefs);
    const count = ALERT_KEYS.filter((key) => n[key]).length;
    if (!count) return "Off";
    if (count === ALERT_KEYS.length) return "All on";
    return count + " on";
  }

  global.MoonrisePush = {
    PREF_KEY,
    ALERT_KEYS,
    supported,
    readPref,
    readPrefs,
    summaryLabel,
    anyAlertEnabled,
    currentSubscription,
    subscribe,
    unsubscribe,
    setAlert,
    setClientPurchaseAlerts,
    savePref,
    savePrefs,
  };
})(window);
