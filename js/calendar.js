/**
 * Calendar — upcoming meetings from a connected Cal.com account.
 */
(function () {
  const listEl = document.getElementById("cal-list");
  const emptyEl = document.getElementById("cal-empty");
  const errorEl = document.getElementById("cal-error");

  function workerBase() {
    if (typeof window.resolveWorkerUrl === "function") {
      const resolved = String(window.resolveWorkerUrl() || "").replace(/\/$/, "");
      if (resolved) return resolved;
    }
    return String(window.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  function setError(msg) {
    if (!errorEl) return;
    errorEl.hidden = !msg;
    errorEl.textContent = msg || "";
  }

  function whenLabel(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "";
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function render(bookings) {
    if (!listEl) return;
    listEl.querySelectorAll(".ms-set-row").forEach((row) => row.remove());
    const rows = Array.isArray(bookings) ? bookings : [];
    if (emptyEl) emptyEl.hidden = rows.length > 0;
    rows.forEach((item) => {
      const row = document.createElement("div");
      row.className = "ms-set-row ms-set-row--static";
      const copy = document.createElement("div");
      copy.className = "ms-set-row-copy";
      copy.style.cursor = "default";
      const title = document.createElement("strong");
      title.textContent = item.attendeeName || "Guest";
      const meta = document.createElement("span");
      const when = whenLabel(item.startsAt);
      const site = String(item.businessName || "").trim();
      meta.textContent = [site, when].filter(Boolean).join(" · ") || item.title || "Meeting";
      copy.appendChild(title);
      copy.appendChild(meta);
      row.appendChild(copy);
      listEl.appendChild(row);
    });
  }

  async function load() {
    const base = workerBase();
    if (!base) throw new Error("Worker URL is not configured");
    const session = await window.StudioAuth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not signed in");
    const res = await fetch(base + "/calendar/bookings", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load meetings");
    render(data.bookings);
  }

  async function start() {
    try {
      await load();
    } catch (e) {
      if (emptyEl) emptyEl.hidden = true;
      setError(e.message || "Could not load meetings");
      window.StudioToast?.error?.(e.message || "Could not load meetings");
    }
  }

  window.StudioBoot?.whenAuthReady?.(start) ?? start();
})();
