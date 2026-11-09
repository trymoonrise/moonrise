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
  const detailEl = document.getElementById("cal-detail");
  const detailCardEl = document.getElementById("cal-detail-card");

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let pickerYear = viewYear;
  let selected = dateKey(now);
  let bookings = [];
  let bookingUrl = "";
  const LOCAL_KEY = "ms_cal_local_events_v1";
  let configured = true;
  let loadToken = 0;

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
    if (on) hideDetail();
  }

  function localEvents() {
    try {
      const data = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocal(items) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }

  function eventsOn(key) {
    const all = bookings.concat(localEvents());
    return all.filter((item) => {
      const date = new Date(item.startsAt);
      return Number.isFinite(date.getTime()) && dateKey(date) === key;
    });
  }

  function paintMonthLabel() {
    if (monthLabel) monthLabel.textContent = MONTHS[viewMonth] + " " + viewYear;
  }

  function setPicker(open) {
    if (pickerEl) pickerEl.hidden = !open;
    monthBtn?.classList.toggle("is-open", !!open);
    monthBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      pickerYear = viewYear;
      paintPicker();
    }
  }

  function goToMonth(year, month) {
    viewYear = year;
    viewMonth = month;
    pickerYear = year;
    const todayKey = dateKey(now);
    const prefix = year + "-" + String(month + 1).padStart(2, "0");
    selected = todayKey.startsWith(prefix) ? todayKey : prefix + "-01";
    bookings = [];
    setPicker(false);
    paintGrid();
    showDetail();
    void loadMonth();
  }

  function shiftMonth(delta) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    goToMonth(next.getFullYear(), next.getMonth());
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
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        goToMonth(pickerYear, index);
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

  function durationLabel(item) {
    const start = new Date(item.startsAt).getTime();
    const end = new Date(item.endsAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "";
    const mins = Math.round((end - start) / 60000);
    if (mins < 60) return mins + " min";
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    if (!rest) return hours + (hours === 1 ? " hour" : " hours");
    return hours + " hr " + rest + " min";
  }

  function timeRange(item) {
    const start = clock(item.startsAt);
    const end = clock(item.endsAt);
    if (start && end && end !== start) return start + " – " + end;
    return start;
  }

  function shortDay(key) {
    const date = parseKey(key);
    return date.getDate() + " " + MONTHS[date.getMonth()].slice(0, 3);
  }

  function addDetailRow(parent, label, value) {
    const text = String(value || "").trim();
    if (!text) return;
    const row = document.createElement("p");
    row.className = "ms-cal-event-row";
    const name = document.createElement("span");
    name.textContent = label;
    const detail = document.createElement("span");
    detail.textContent = text;
    row.append(name, detail);
    parent.appendChild(row);
  }

  function addDetailLink(parent, href) {
    const url = String(href || "").trim();
    if (!/^https?:\/\//i.test(url)) return;
    const row = document.createElement("p");
    row.className = "ms-cal-event-row";
    const name = document.createElement("span");
    name.textContent = "Meeting";
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open link";
    row.append(name, link);
    parent.appendChild(row);
  }

  function contactLine(item) {
    const email = String(item.attendeeEmail || "").trim();
    const phone = String(item.attendeePhone || "").trim();
    if (email && phone) return email + " · " + phone;
    return email || phone;
  }

  function whenLine(item) {
    const time = timeRange(item);
    const length = durationLabel(item);
    if (time && length) return time + " · " + length;
    return time || length;
  }

  function paintDetail(key, items) {
    if (!detailCardEl) return;
    detailCardEl.replaceChildren();
    const day = document.createElement("p");
    day.className = "ms-cal-detail-day";
    day.textContent = shortDay(key);
    detailCardEl.appendChild(day);
    items.forEach((item) => {
      const block = document.createElement("article");
      block.className = "ms-cal-event";
      const person = String(item.attendeeName || "").trim();
      if (person && person !== "Guest") {
        const title = document.createElement("h2");
        title.textContent = person;
        block.appendChild(title);
      }
      addDetailRow(block, "When", whenLine(item));
      addDetailRow(block, "Contact", contactLine(item));
      addDetailRow(block, "Site", item.businessName);
      addDetailLink(block, item.meetingUrl || bookingUrl);
      detailCardEl.appendChild(block);
    });
  }

  function hideDetail() {
    if (!detailEl) return;
    detailEl.classList.remove("is-in");
    detailEl.setAttribute("aria-hidden", "true");
  }

  function showDetail() {
    const items = eventsOn(selected);
    if (!items.length) {
      hideDetail();
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    paintDetail(selected, items);
    if (!detailEl) return;
    detailEl.setAttribute("aria-hidden", "false");
    if (!detailEl.classList.contains("is-in")) {
      requestAnimationFrame(() => detailEl.classList.add("is-in"));
    }
  }

  function selectDay(key) {
    const date = parseKey(key);
    const monthChanged = date.getFullYear() !== viewYear || date.getMonth() !== viewMonth;
    selected = key;
    if (monthChanged) {
      viewYear = date.getFullYear();
      viewMonth = date.getMonth();
      pickerYear = viewYear;
      bookings = [];
      setPicker(false);
      paintGrid();
      showDetail();
      void loadMonth();
      return;
    }
    paintGrid();
    showDetail();
  }

  async function loadMonth() {
    const token = ++loadToken;
    const year = viewYear;
    const month = viewMonth;
    try {
      const range = monthRange(year, month);
      const data = await api(
        "/calendar/bookings?from=" + encodeURIComponent(range.from) + "&to=" + encodeURIComponent(range.to)
      );
      if (token !== loadToken || year !== viewYear || month !== viewMonth) return;
      bookings = Array.isArray(data.bookings) ? data.bookings : [];
      paintGrid();
      showDetail();
    } catch (e) {
      if (token !== loadToken) return;
      setError(e.message || "Could not load meetings");
    }
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
    bookingUrl = String(conn?.bookingUrl || "");
    showGate(false);
    paintGrid();
    await loadMonth();
  }

  monthBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    setPicker(pickerEl?.hidden !== false);
  });

  document.getElementById("cal-add")?.addEventListener("click", () => {
    const form = document.getElementById("cal-form");
    if (!form) return;
    form.hidden = !form.hidden;
    const date = document.getElementById("cal-form-date");
    if (date && !date.value && selected) date.value = selected;
  });

  document.getElementById("cal-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const date = String(document.getElementById("cal-form-date")?.value || "");
    const time = String(document.getElementById("cal-form-time")?.value || "");
    const mins = Number(document.getElementById("cal-form-mins")?.value) || 30;
    const name = String(document.getElementById("cal-form-name")?.value || "").trim();
    const contact = String(document.getElementById("cal-form-contact")?.value || "").trim();
    const site = String(document.getElementById("cal-form-site")?.value || "").trim();
    const link = String(document.getElementById("cal-form-link")?.value || "").trim();
    const start = new Date(date + "T" + time);
    if (!date || !time || !Number.isFinite(start.getTime())) return;
    const end = new Date(start.getTime() + mins * 60000);
    const email = contact.includes("@") ? contact : "";
    const items = localEvents();
    items.push({
      id: "local-" + Date.now(),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      attendeeName: name,
      attendeeEmail: email,
      attendeePhone: email ? "" : contact,
      businessName: site,
      meetingUrl: link,
      local: true,
    });
    saveLocal(items);
    const form = event.currentTarget;
    if (form instanceof HTMLFormElement) {
      form.hidden = true;
      form.reset();
    }
    selected = dateKey(start);
    viewYear = start.getFullYear();
    viewMonth = start.getMonth();
    pickerYear = viewYear;
    paintMonthLabel();
    paintGrid();
    showDetail();
  });

  document.getElementById("cal-prev")?.addEventListener("click", () => shiftMonth(-1));
  document.getElementById("cal-next")?.addEventListener("click", () => shiftMonth(1));

  document.getElementById("cal-year-prev")?.addEventListener("click", (event) => {
    event.stopPropagation();
    pickerYear -= 1;
    paintPicker();
  });
  document.getElementById("cal-year-next")?.addEventListener("click", (event) => {
    event.stopPropagation();
    pickerYear += 1;
    paintPicker();
  });

  document.addEventListener("click", (event) => {
    if (!pickerEl || pickerEl.hidden) return;
    const target = event.target;
    if (target instanceof Node && (pickerEl.contains(target) || monthBtn?.contains(target))) return;
    setPicker(false);
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
