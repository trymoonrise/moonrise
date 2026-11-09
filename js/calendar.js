/**
 * Calendar — month of meetings from a connected Cal.com account.
 */
(function () {
  const appEl = document.getElementById("cal-app");
  const gateEl = document.getElementById("cal-gate");
  const monthBtn = document.getElementById("cal-month");
  const monthLabel = document.getElementById("cal-month-label");
  const pickerEl = document.getElementById("cal-picker");
  const yearLabel = document.getElementById("cal-year-label");
  const monthsEl = document.getElementById("cal-months");
  const gridEl = document.getElementById("cal-grid");
  const emptyEl = document.getElementById("cal-day-empty");
  const errorEl = document.getElementById("cal-error");
  const gateErrorEl = document.getElementById("cal-gate-error");
  const oauthBtn = document.getElementById("cal-oauth");
  const bandEl = document.getElementById("cal-band");
  const bandDayEl = document.getElementById("cal-band-day");
  const bandListEl = document.getElementById("cal-band-list");

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let pickerYear = viewYear;
  let selected = dateKey(now);
  let bookings = [];
  let configured = true;

  function workerBase() {
    if (typeof window.resolveWorkerUrl === "function") {
      const resolved = String(window.resolveWorkerUrl() || "").replace(/\/$/, "");
      if (resolved) return resolved;
    }
    return String(window.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function parseKey(key) {
    const parts = String(key || "").split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function monthRange(year, month) {
    return {
      from: new Date(year, month, 1).toISOString(),
      to: new Date(year, month + 1, 1).toISOString(),
    };
  }

  function dayName(key) {
    return parseKey(key).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function clock(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "";
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function setGateError(msg) {
    if (!gateErrorEl) return;
    gateErrorEl.hidden = !msg;
    gateErrorEl.textContent = msg || "";
  }

  function setError(msg) {
    if (!errorEl) return;
    errorEl.hidden = !msg;
    errorEl.textContent = msg || "";
  }

  async function api(path, options) {
    const base = workerBase();
    if (!base) throw new Error("Worker URL is not configured");
    const session = await window.StudioAuth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not signed in");
    const res = await fetch(base + path, {
      method: options?.method || "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options?.body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not load the calendar");
    return data;
  }

  function showGate(on) {
    if (gateEl) gateEl.hidden = !on;
    if (appEl) appEl.hidden = !!on;
    if (on && bandEl) bandEl.classList.remove("is-in");
  }

  function eventsOn(key) {
    return bookings.filter((item) => {
      const date = new Date(item.startsAt);
      return Number.isFinite(date.getTime()) && dateKey(date) === key;
    });
  }

  function paintMonthLabel() {
    if (monthLabel) monthLabel.textContent = MONTHS[viewMonth] + " " + viewYear;
  }

  function paintPicker() {
    if (yearLabel) yearLabel.textContent = String(pickerYear);
    if (!monthsEl) return;
    monthsEl.replaceChildren();
    MONTHS.forEach((name, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = name.slice(0, 3);
      btn.setAttribute("aria-label", name + " " + pickerYear);
      if (pickerYear === viewYear && index === viewMonth) btn.className = "is-on";
      btn.addEventListener("click", () => {
        viewYear = pickerYear;
        viewMonth = index;
        if (pickerEl) pickerEl.hidden = true;
        if (monthBtn) monthBtn.setAttribute("aria-expanded", "false");
        const today = dateKey(now);
        const prefix = viewYear + "-" + String(viewMonth + 1).padStart(2, "0");
        selected = today.startsWith(prefix) ? today : prefix + "-01";
        void loadMonth();
      });
      monthsEl.appendChild(btn);
    });
  }

  function paintGrid() {
    if (!gridEl) return;
    paintMonthLabel();
    const first = new Date(viewYear, viewMonth, 1);
    const lead = (first.getDay() + 6) % 7;
    const start = new Date(viewYear, viewMonth, 1 - lead);
    gridEl.replaceChildren();
    for (let i = 0; i < 42; i += 1) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = dateKey(day);
      const count = eventsOn(key).length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ms-cal-day";
      btn.textContent = String(day.getDate());
      btn.setAttribute("role", "gridcell");
      if (day.getMonth() !== viewMonth) btn.classList.add("is-out");
      if (key === selected) btn.classList.add("is-on");
      if (count) btn.classList.add("has-event");
      const label = dayName(key);
      btn.setAttribute("aria-label", count ? label + ", " + count + (count === 1 ? " meeting" : " meetings") : label);
      if (key === selected) btn.setAttribute("aria-pressed", "true");
      btn.addEventListener("click", () => selectDay(key));
      gridEl.appendChild(btn);
    }
  }

  function paintBand(key, items) {
    if (!bandDayEl || !bandListEl) return;
    bandDayEl.textContent = dayName(key);
    bandListEl.replaceChildren();
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "ms-cal-event";
      const title = document.createElement("strong");
      title.textContent = item.title || "Meeting";
      const when = document.createElement("span");
      const start = clock(item.startsAt);
      const end = clock(item.endsAt);
      when.textContent = end && end !== start ? start + " – " + end : start || "Meeting";
      const who = document.createElement("span");
      const name = String(item.attendeeName || "").trim();
      const site = String(item.businessName || "").trim();
      who.textContent = [name && name !== "Guest" ? name : "", site].filter(Boolean).join(" · ");
      row.appendChild(title);
      row.appendChild(when);
      if (who.textContent) row.appendChild(who);
      bandListEl.appendChild(row);
    });
  }

  function selectDay(key) {
    const date = parseKey(key);
    if (date.getFullYear() !== viewYear || date.getMonth() !== viewMonth) {
      viewYear = date.getFullYear();
      viewMonth = date.getMonth();
      selected = key;
      void loadMonth();
      return;
    }
    selected = key;
    paintGrid();
    const items = eventsOn(key);
    if (!items.length) {
      if (bandEl) {
        bandEl.classList.remove("is-in");
        bandEl.setAttribute("aria-hidden", "true");
      }
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    paintBand(key, items);
    if (!bandEl) return;
    bandEl.setAttribute("aria-hidden", "false");
    if (!bandEl.classList.contains("is-in")) {
      requestAnimationFrame(() => bandEl.classList.add("is-in"));
    }
  }

  async function loadMonth() {
    const range = monthRange(viewYear, viewMonth);
    const data = await api(
      "/calendar/bookings?from=" + encodeURIComponent(range.from) + "&to=" + encodeURIComponent(range.to)
    );
    bookings = Array.isArray(data.bookings) ? data.bookings : [];
    paintGrid();
    selectDay(selected);
  }

  async function refresh() {
    setError("");
    const conn = await api("/calendar/connection");
    configured = conn?.configured !== false;
    if (oauthBtn) oauthBtn.hidden = !configured;
    if (!conn?.connected) {
      showGate(true);
      return;
    }
    showGate(false);
    await loadMonth();
  }

  monthBtn?.addEventListener("click", () => {
    const open = pickerEl?.hidden !== false;
    if (pickerEl) pickerEl.hidden = !open;
    monthBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      pickerYear = viewYear;
      paintPicker();
    }
  });

  document.getElementById("cal-year-prev")?.addEventListener("click", () => {
    pickerYear -= 1;
    paintPicker();
  });
  document.getElementById("cal-year-next")?.addEventListener("click", () => {
    pickerYear += 1;
    paintPicker();
  });

  document.getElementById("cal-api-save")?.addEventListener("click", async () => {
    const input = document.getElementById("cal-api");
    const apiKey = String(input?.value || "").trim();
    const btn = document.getElementById("cal-api-save");
    setGateError("");
    if (!apiKey) {
      setGateError("Paste a Cal.com API key. It starts with cal_.");
      return;
    }
    if (btn) btn.disabled = true;
    try {
      await api("/calendar/api-key", {
        method: "POST",
        body: JSON.stringify({ apiKey }),
      });
      if (input) input.value = "";
      await refresh();
    } catch (e) {
      setGateError(e.message || "Could not save the Cal.com API key");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  oauthBtn?.addEventListener("click", async () => {
    setGateError("");
    oauthBtn.disabled = true;
    try {
      const data = await api("/calendar/connect");
      const dest = new URL(String(data.url || ""));
      if (dest.protocol !== "https:" || dest.hostname !== "app.cal.com") {
        throw new Error("Cal.com could not connect. Try again.");
      }
      location.href = dest.toString();
    } catch (e) {
      setGateError(e.message || "Cal.com could not connect. Try again.");
      oauthBtn.disabled = false;
    }
  });

  async function start() {
    try {
      await refresh();
    } catch (e) {
      showGate(false);
      setError(e.message || "Could not load the calendar");
    }
  }

  window.StudioBoot?.whenAuthReady?.(start) ?? start();
})();
