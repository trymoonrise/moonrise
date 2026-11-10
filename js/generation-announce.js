/**
 * Floating generation announcement - standalone UI component.
 * Requires generation-lock.js (loaded automatically if missing).
 * Only shows when a real server job (or fresh lock) is active.
 */
(function (global) {
  const ROOT_ID = "ms-gen-announce";
  const LIVE_ID = "ms-gen-announce-live";
  const CSS_HREF = "css/generation-announce.css?v=20261110-durable";
  const LOCK_SRC = "js/generation-lock.js?v=20260721-one-gen";
  const VERIFY_MS = 12000;

  let mounted = false;
  let wasVisible = false;
  let verifyTimer = null;
  let verifyInFlight = false;

  function ensureStyles() {
    if (document.querySelector('link[data-ms-gen-announce-css="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_HREF;
    link.dataset.msGenAnnounceCss = "1";
    document.head.appendChild(link);
  }

  function ensureGenerationLock() {
    if (global.MsGenerationLock) return Promise.resolve();
    if (document.querySelector('script[src*="generation-lock.js"]')) {
      return new Promise((resolve) => {
        const wait = () => {
          if (global.MsGenerationLock) resolve();
          else global.requestAnimationFrame(wait);
        };
        if (document.readyState === "complete") wait();
        else global.addEventListener("load", wait, { once: true });
      });
    }
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = LOCK_SRC;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  function isAppShellPage() {
    return !!document.getElementById("shell");
  }

  function workerBase() {
    if (typeof global.resolveWorkerUrl === "function") {
      return String(global.resolveWorkerUrl() || "").replace(/\/$/, "");
    }
    return String(global.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  function shouldShow() {
    if (!global.MsGenerationLock?.isActive?.()) return false;
    const page = document.body?.dataset?.page || "";
    if (page === "editor") {
      const previewLoading = document.getElementById("preview-loading");
      if (previewLoading && !previewLoading.hidden) return false;
    }
    return true;
  }

  function mount() {
    if (mounted || document.getElementById(ROOT_ID)) return;
    mounted = true;
    ensureStyles();

    const root = document.createElement("aside");
    root.id = ROOT_ID;
    root.className = "ms-gen-announce";
    root.hidden = true;
    root.setAttribute("aria-label", "Website generation status");
    root.innerHTML =
      '<div class="ms-gen-announce-card">' +
      '<span class="ms-gen-announce-spinner" aria-hidden="true"></span>' +
      '<div class="ms-gen-announce-copy">' +
      "<span>Generating your website...</span>" +
      '<span class="ms-gen-announce-sub">You can leave this page — we keep building.</span>' +
      "</div>" +
      "</div>" +
      '<span class="ms-sr-only" id="' +
      LIVE_ID +
      '" aria-live="polite" aria-atomic="true"></span>';

    document.body.appendChild(root);
  }

  function setVisible(visible) {
    const root = document.getElementById(ROOT_ID);
    const live = document.getElementById(LIVE_ID);
    if (!root) return;

    root.classList.toggle("is-visible", visible);
    root.hidden = !visible;
    if (visible) root.removeAttribute("hidden");
    else root.setAttribute("hidden", "");

    if (visible && !wasVisible && live) {
      live.textContent =
        "Your website is being generated. You can leave this page — generation keeps running.";
    }
    if (!visible && live) live.textContent = "";
    wasVisible = visible;
  }

  function sync() {
    if (!isAppShellPage()) return;
    mount();
    setVisible(shouldShow());
    scheduleVerify();
  }

  async function verifyAgainstServer() {
    if (verifyInFlight) return;
    if (!global.MsGenerationLock?.isActive?.()) {
      setVisible(false);
      return;
    }
    const base = workerBase();
    if (!base || !global.StudioAuth?.getSession) return;

    verifyInFlight = true;
    try {
      const session = await global.StudioAuth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(base + "/generate/active", {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (!data.active) {
        // Stale local lock (failed, finished, or never started on server).
        global.MsGenerationLock.clearInflight?.();
        setVisible(false);
        return;
      }
      const inflight = global.MsGenerationLock.readInflight?.();
      const serverRid = String(data.requestId || "").trim();
      if (serverRid && inflight?.requestId && serverRid !== inflight.requestId) {
        global.MsGenerationLock.writeInflight?.({
          ...inflight,
          requestId: serverRid,
          startedAt: inflight.startedAt || Date.now(),
        });
      }
      setVisible(shouldShow());
    } catch (_) {
      /* keep local lock if network fails */
    } finally {
      verifyInFlight = false;
    }
  }

  function scheduleVerify() {
    if (verifyTimer) return;
    if (!global.MsGenerationLock?.isActive?.()) return;
    void verifyAgainstServer();
    verifyTimer = global.setInterval(() => {
      if (!global.MsGenerationLock?.isActive?.()) {
        global.clearInterval(verifyTimer);
        verifyTimer = null;
        setVisible(false);
        return;
      }
      void verifyAgainstServer();
    }, VERIFY_MS);
  }

  function bindListeners() {
    if (bindListeners.done) return;
    bindListeners.done = true;

    document.addEventListener("ms:generation-lock-changed", sync);
    document.addEventListener("ms:shell-ready", sync);
    global.addEventListener("storage", (e) => {
      if (e.key === global.MsGenerationLock?.KEY) sync();
    });
    global.addEventListener("pageshow", sync);
  }

  function init() {
    if (!isAppShellPage()) return;
    void ensureGenerationLock().then(() => {
      bindListeners();
      sync();
    });
  }

  global.MsGenerationAnnounce = {
    init,
    sync,
    mount,
    verifyAgainstServer,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
