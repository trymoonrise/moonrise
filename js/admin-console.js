(function () {
  const codeEl = document.getElementById("admin-code");
  const secondsEl = document.getElementById("admin-seconds");
  const statusEl = document.getElementById("admin-status");
  const ringEl = document.getElementById("admin-ring");
  const copyBtn = document.getElementById("admin-copy");

  const READY = "Copy this ID. It works once and expires in 6 hours if unused.";
  const USED = "This ID was already used. Copy the next one.";

  let snapshot = null;
  let expiresAt = 0;
  let shownCode = "";
  let scrambleToken = 0;
  let refreshing = false;
  let lastSecond = null;
  let nextFetchAt = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function workerBase() {
    const fromConfig = String(window.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
    if (fromConfig) return fromConfig;
    return location.origin;
  }

  function setStatus(text) {
    if (statusEl && statusEl.textContent !== text) statusEl.textContent = text;
  }

  function ensureDigits() {
    if (!codeEl) return [];
    let digits = codeEl.querySelectorAll(".ms-admin-digit");
    if (digits.length === 6) return digits;
    codeEl.textContent = "";
    for (let i = 0; i < 6; i += 1) {
      const span = document.createElement("span");
      span.className = "ms-admin-digit";
      span.textContent = "-";
      codeEl.appendChild(span);
    }
    return codeEl.querySelectorAll(".ms-admin-digit");
  }

  function writeDigits(value) {
    const digits = ensureDigits();
    String(value || "------").padEnd(6, "-").slice(0, 6).split("").forEach((char, i) => {
      if (digits[i]) digits[i].textContent = char;
    });
  }

  function revealCard() {
    document.querySelector(".ms-admin-code-card")?.classList.remove("is-pending");
  }

  function syncClock() {
    if (!snapshot) return;
    const period = (Number(snapshot.periodSeconds) || 30) * 1000;
    const leftMs = Math.max(0, expiresAt - Date.now());
    const second = Math.max(0, Math.ceil(leftMs / 1000));
    if (ringEl) ringEl.style.setProperty("--ms-admin-progress", String(leftMs / period));
    if (secondsEl) secondsEl.textContent = String(second);
    lastSecond = second;
  }

  function scrambleTo(nextCode) {
    const target = String(nextCode || "").replace(/\D/g, "").padStart(6, "0").slice(0, 6);
    const digits = ensureDigits();
    const token = ++scrambleToken;
    if (reduceMotion || !shownCode) {
      writeDigits(target);
      shownCode = target;
      revealCard();
      return;
    }
    const started = performance.now();
    digits.forEach((span, i) => {
      const duration = 160 + Math.random() * 220;
      let nextFlip = started;
      span.classList.add("is-scrambling");
      const step = (now) => {
        if (token !== scrambleToken) {
          span.classList.remove("is-scrambling");
          return;
        }
        const elapsed = now - started;
        if (elapsed >= duration) {
          span.textContent = target[i];
          span.classList.remove("is-scrambling");
          return;
        }
        if (now >= nextFlip) {
          let roll = String(Math.floor(Math.random() * 10));
          if (roll === span.textContent) roll = String((Number(roll) + 1 + Math.floor(Math.random() * 8)) % 10);
          span.textContent = roll;
          const remain = duration - elapsed;
          const gap = remain > 70 ? 14 + Math.random() * 12 : 22 + Math.random() * 16;
          nextFlip = now + gap;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    shownCode = target;
    revealCard();
  }

  function paint() {
    if (!snapshot) return;
    const period = (Number(snapshot.periodSeconds) || 30) * 1000;
    const leftMs = Math.max(0, expiresAt - Date.now());
    const second = Math.max(0, Math.ceil(leftMs / 1000));
    if (ringEl) ringEl.style.setProperty("--ms-admin-progress", String(leftMs / period));
    if (secondsEl && second !== lastSecond) {
      secondsEl.textContent = String(second);
      if (lastSecond != null && !reduceMotion) {
        secondsEl.classList.remove("is-tick");
        void secondsEl.offsetWidth;
        secondsEl.classList.add("is-tick");
      }
      lastSecond = second;
    }
    if (codeEl) codeEl.classList.toggle("is-used", !!snapshot.used);
    setStatus(snapshot.used ? USED : READY);
    if (copyBtn) copyBtn.disabled = !snapshot.code || !!snapshot.used || leftMs <= 0;
    if (leftMs <= 0 && Date.now() >= nextFetchAt) {
      nextFetchAt = Date.now() + 800;
      refresh();
    }
    if (painting) requestAnimationFrame(paint);
  }

  let painting = false;
  function startPaint() {
    if (painting) return;
    painting = true;
    requestAnimationFrame(paint);
  }

  function sendToLogin() {
    const next = encodeURIComponent("admin-console.html" + location.search + location.hash);
    location.replace("login.html?next=" + next);
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    revealCard();
    try {
      const session = await window.StudioAuth?.getSession?.();
      const token = session?.access_token;
      if (!token) {
        clearInterval(pollTimer);
        setStatus("Sign in again to see the Employee ID.");
        sendToLogin();
        return;
      }
      const res = await fetch(workerBase() + "/admin/employee-code", {
        headers: { Accept: "application/json", Authorization: "Bearer " + token },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setStatus("This console is only available on the Moonrise admin account.");
        return;
      }
      if (res.status === 401) {
        clearInterval(pollTimer);
        setStatus(data.error || "Your session ended. Sign in again.");
        sendToLogin();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Could not load the Employee ID");
      const nextCode = String(data.code || "");
      snapshot = data;
      if (!expiresAt || (nextCode && nextCode !== shownCode)) {
        expiresAt = Date.now() + Number(data.secondsLeft || 30) * 1000;
      }
      syncClock();
      if (nextCode && nextCode !== shownCode) scrambleTo(nextCode);
      else revealCard();
      setStatus(data.used ? USED : READY);
      startPaint();
    } catch (err) {
      setStatus(err?.message || "Could not load the Employee ID");
    } finally {
      refreshing = false;
    }
  }

  copyBtn?.addEventListener("click", async () => {
    const code = String(snapshot?.code || "").trim();
    if (!code || snapshot?.used) return;
    try {
      await navigator.clipboard.writeText(code);
      window.StudioToast?.success?.("Employee ID copied");
    } catch (_) {
      setStatus("Couldn't copy. Select the ID instead.");
    }
  });

  window.addEventListener("pagehide", () => {
    painting = false;
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted || !snapshot) return;
    syncClock();
    revealCard();
    startPaint();
  });

  let pollTimer = 0;

  ensureDigits();
  revealCard();
  setStatus("Loading the Employee ID…");
  refresh();
  pollTimer = setInterval(refresh, 2000);
  window.StudioOwner?.gateOwnerPage?.("dashboard.html").then((ok) => {
    if (!ok) clearInterval(pollTimer);
  });
})();
