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
  const EXTRA_KEY = "ms_cal_event_extra_v1";
  let configured = true;
  let loadToken = 0;
  let meetingsLoading = false;

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

  function setMeetingsLoading(on) {
    meetingsLoading = !!on;
    appEl?.classList.toggle("is-skel-loading", meetingsLoading);
    if (meetingsLoading) {
      if (emptyEl) emptyEl.hidden = true;
      hideDetail();
      return;
    }
    window.__msClearChannelSkeleton?.();
  }

  function showGate(on) {
    if (on) {
      setMeetingsLoading(false);
      window.__msClearChannelSkeleton?.();
    }
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

  function readExtras() {
    try {
      const data = JSON.parse(localStorage.getItem(EXTRA_KEY) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch (_) {
      return {};
    }
  }

  function writeExtra(id, extra) {
    const all = readExtras();
    if (!extra) delete all[id];
    else all[id] = extra;
    localStorage.setItem(EXTRA_KEY, JSON.stringify(all));
  }

  function decorate(item) {
    const extra = readExtras()[item.id];
    if (!extra || typeof extra !== "object") return item;
    return {
      ...item,
      attendeePhone: extra.attendeePhone != null ? extra.attendeePhone : item.attendeePhone || "",
      businessName: extra.businessName != null ? extra.businessName : item.businessName || "",
      meetingUrl: extra.meetingUrl != null ? extra.meetingUrl : item.meetingUrl || "",
    };
  }

  function eventsOn(key) {
    const all = bookings.concat(localEvents());
    return all
      .filter((item) => {
        const date = new Date(item.startsAt);
        return Number.isFinite(date.getTime()) && dateKey(date) === key;
      })
      .map(decorate)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }

  function isLocalEvent(item) {
    return item?.local === true || String(item?.id || "").startsWith("local-");
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
    setMeetingsLoading(true);
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

  function contactValue(item) {
    const email = String(item.attendeeEmail || "").trim();
    const phone = String(item.attendeePhone || "").trim();
    if (email && !/@sms\.cal\.com$/i.test(email)) return email;
    return phone || email.replace(/@sms\.cal\.com$/i, "");
  }

  function meetingHref(item) {
    const url = String(item.meetingUrl || "").trim();
    if (!/^https?:\/\//i.test(url)) return "";
    if (/cal\.com/i.test(url)) return "";
    return url;
  }

  function meetingLabel(url) {
    if (/meet\.google\.com/i.test(url)) return "Open Google Meet";
    if (/zoom\.us/i.test(url)) return "Open Zoom";
    if (/teams\.microsoft\.com/i.test(url)) return "Open Teams";
    return "Open meeting";
  }

  function fieldRow(label, control) {
    const row = document.createElement("label");
    row.className = "ms-cal-event-row is-edit";
    const name = document.createElement("span");
    name.textContent = label;
    row.append(name, control);
    return row;
  }

  function textInput(value, placeholder) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "ms-cal-inline-input";
    input.value = value || "";
    input.placeholder = placeholder || "";
    return input;
  }

  function snapshotFromItem(item) {
    const parts = localParts(item.startsAt);
    return {
      date: parts.date,
      time: parts.time,
      mins: String(lengthMins(item)),
      name: String(item.attendeeName || "").trim() === "Guest" ? "" : String(item.attendeeName || "").trim(),
      contact: contactValue(item),
      site: String(item.businessName || "").trim(),
      link: meetingHref(item),
    };
  }

  function readInline(block) {
    const date = String(block.querySelector("[data-field=date]")?.value || "");
    const time = String(block.querySelector("[data-field=time]")?.value || "");
    const mins = Number(block.querySelector("[data-field=mins]")?.value) || 30;
    const name = String(block.querySelector("[data-field=name]")?.value || "").trim();
    const contact = String(block.querySelector("[data-field=contact]")?.value || "").trim();
    const site = String(block.querySelector("[data-field=site]")?.value || "").trim();
    const link = String(block.querySelector("[data-field=link]")?.value || "").trim();
    const start = new Date(date + "T" + time);
    if (!date || !time || !Number.isFinite(start.getTime())) return null;
    const safeMins = Math.min(480, Math.max(5, mins));
    const end = new Date(start.getTime() + safeMins * 60000);
    const email = contact.includes("@") ? contact : "";
    return {
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      attendeeName: name,
      attendeeEmail: email,
      attendeePhone: email ? "" : contact,
      businessName: site,
      meetingUrl: /cal\.com/i.test(link) ? "" : link,
    };
  }

  async function saveInlineEvent(item, block, saveBtn) {
    const fields = readInline(block);
    if (!fields) {
      setError("Choose a day and time.");
      return;
    }
    if (saveBtn) saveBtn.disabled = true;
    setError("");
    try {
      if (isLocalEvent(item)) {
        const items = localEvents();
        const index = items.findIndex((row) => row.id === item.id);
        const next = { ...fields, id: item.id, local: true };
        if (index === -1) items.push(next);
        else items[index] = next;
        saveLocal(items);
      } else {
        const data = await api("/calendar/bookings/" + encodeURIComponent(item.id), {
          method: "PATCH",
          body: JSON.stringify({
            startsAt: fields.startsAt,
            endsAt: fields.endsAt,
            attendeeName: fields.attendeeName,
            attendeeEmail: fields.attendeeEmail,
          }),
        });
        const booking = data?.booking;
        if (!booking?.id) throw new Error("Could not save that event");
        writeExtra(booking.id, {
          attendeePhone: fields.attendeePhone,
          businessName: fields.businessName,
          meetingUrl: fields.meetingUrl,
        });
        const index = bookings.findIndex((row) => row.id === booking.id);
        const merged = {
          ...booking,
          attendeePhone: fields.attendeePhone,
          businessName: fields.businessName,
          meetingUrl: fields.meetingUrl,
        };
        if (index === -1) bookings.push(merged);
        else bookings[index] = merged;
      }
      showSaved(new Date(fields.startsAt));
    } catch (e) {
      setError(e.message || "Could not save that event");
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  function paintDetail(key, items) {
    if (!detailCardEl) return;
    detailCardEl.replaceChildren();
    const day = document.createElement("p");
    day.className = "ms-cal-detail-day";
    day.textContent = shortDay(key);
    detailCardEl.appendChild(day);
    items.forEach((item) => {
      const snap = snapshotFromItem(item);
      const block = document.createElement("article");
      block.className = "ms-cal-event is-editable";
      block.dataset.eventId = item.id;

      const nameInput = textInput(snap.name, "Name");
      nameInput.dataset.field = "name";
      nameInput.classList.add("ms-cal-inline-name");
      block.appendChild(nameInput);

      const whenWrap = document.createElement("div");
      whenWrap.className = "ms-cal-inline-when";
      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.className = "ms-cal-inline-input";
      dateInput.dataset.field = "date";
      dateInput.value = snap.date;
      dateInput.setAttribute("aria-label", "Day");
      const timeInput = document.createElement("input");
      timeInput.type = "time";
      timeInput.className = "ms-cal-inline-input";
      timeInput.dataset.field = "time";
      timeInput.value = snap.time;
      timeInput.setAttribute("aria-label", "Time");
      const minsInput = document.createElement("input");
      minsInput.type = "number";
      minsInput.min = "5";
      minsInput.max = "480";
      minsInput.step = "5";
      minsInput.className = "ms-cal-inline-input ms-cal-inline-mins";
      minsInput.dataset.field = "mins";
      minsInput.value = snap.mins;
      minsInput.setAttribute("aria-label", "Minutes");
      whenWrap.append(dateInput, timeInput, minsInput);
      block.appendChild(fieldRow("When", whenWrap));

      const contactInput = textInput(snap.contact, "Email or phone");
      contactInput.dataset.field = "contact";
      block.appendChild(fieldRow("Contact", contactInput));

      const siteInput = textInput(snap.site, "Site");
      siteInput.dataset.field = "site";
      block.appendChild(fieldRow("Site", siteInput));

      const meetWrap = document.createElement("div");
      meetWrap.className = "ms-cal-inline-meet";
      const linkInput = textInput(snap.link, "Google Meet link");
      linkInput.dataset.field = "link";
      linkInput.type = "url";
      meetWrap.appendChild(linkInput);
      const openMeet = meetingHref(item);
      if (openMeet) {
        const open = document.createElement("a");
        open.href = openMeet;
        open.target = "_blank";
        open.rel = "noopener noreferrer";
        open.className = "ms-cal-meet-open";
        open.textContent = meetingLabel(openMeet);
        meetWrap.appendChild(open);
      }
      block.appendChild(fieldRow("Meeting", meetWrap));

      const actions = document.createElement("div");
      actions.className = "ms-cal-event-actions";
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "ms-cal-save";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => {
        void saveInlineEvent(item, block, saveBtn);
      });
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "ms-cal-remove";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        if (removeBtn.dataset.confirm !== "yes") {
          detailCardEl.querySelectorAll(".ms-cal-remove").forEach((btn) => {
            btn.textContent = "Remove";
            delete btn.dataset.confirm;
          });
          removeBtn.dataset.confirm = "yes";
          removeBtn.textContent = "Remove?";
          return;
        }
        void removeEvent(item, removeBtn);
      });
      actions.append(saveBtn, removeBtn);
      block.appendChild(actions);
      detailCardEl.appendChild(block);
    });
  }

  function hideDetail() {
    if (!detailEl) return;
    detailEl.classList.remove("is-in");
    detailEl.setAttribute("aria-hidden", "true");
    detailCardEl?.replaceChildren();
  }

  function showDetail() {
    if (meetingsLoading) {
      hideDetail();
      if (emptyEl) emptyEl.hidden = true;
      return;
    }
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
      setMeetingsLoading(true);
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
    setMeetingsLoading(true);
    try {
      const range = monthRange(year, month);
      const data = await api(
        "/calendar/bookings?from=" + encodeURIComponent(range.from) + "&to=" + encodeURIComponent(range.to)
      );
      if (token !== loadToken || year !== viewYear || month !== viewMonth) return;
      bookings = (Array.isArray(data.bookings) ? data.bookings : []).map((row) => {
        const meetingUrl = meetingHref(row);
        const phone = String(row.attendeePhone || "").trim();
        const email = String(row.attendeeEmail || "").trim();
        if (row.id && (meetingUrl || phone || row.businessName)) {
          const prior = readExtras()[row.id] || {};
          writeExtra(row.id, {
            ...prior,
            meetingUrl: meetingUrl || prior.meetingUrl || "",
            attendeePhone: phone || prior.attendeePhone || "",
            businessName: row.businessName || prior.businessName || "",
          });
        }
        return {
          ...row,
          attendeeEmail: /@sms\.cal\.com$/i.test(email) ? "" : email,
          attendeePhone: phone || (email.match(/^(\+?\d{7,15})@sms\.cal\.com$/i) || [])[1] || "",
          meetingUrl,
        };
      });
      setMeetingsLoading(false);
      paintGrid();
      showDetail();
    } catch (e) {
      if (token !== loadToken) return;
      setMeetingsLoading(false);
      setError(e.message || "Could not load meetings");
      paintGrid();
      showDetail();
    }
  }

  async function refresh() {
    setError("");
    const conn = await api("/calendar/connection");
    configured = conn?.configured !== false;
    const gateCopy = document.getElementById("cal-gate-copy");
    if (oauthBtn) oauthBtn.hidden = !configured;
    if (gateCopy) {
      gateCopy.textContent = configured
        ? "Continue with Cal.com to see your meetings here."
        : "Cal.com is not set up yet.";
    }
    if (!conn?.connected) {
      showGate(true);
      return;
    }
    bookingUrl = String(conn?.bookingUrl || "");
    setMeetingsLoading(true);
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
    if (!form.hidden && !form.dataset.editing) {
      closeForm();
      return;
    }
    openForm(null);
  });

  document.getElementById("cal-form-cancel")?.addEventListener("click", () => {
    closeForm();
  });

  function formEl() {
    return document.getElementById("cal-form");
  }

  function setSaveLabel(editing) {
    const btn = document.getElementById("cal-form-save");
    if (btn) btn.textContent = editing ? "Save changes" : "Save event";
  }

  function closeForm() {
    const form = formEl();
    if (!form) return;
    form.hidden = true;
    delete form.dataset.editing;
    if (form instanceof HTMLFormElement) form.reset();
    setSaveLabel(false);
  }

  function localParts(iso) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return { date: selected, time: "" };
    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: dateKey(date),
      time: pad(date.getHours()) + ":" + pad(date.getMinutes()),
    };
  }

  function lengthMins(item) {
    const start = new Date(item.startsAt).getTime();
    const end = new Date(item.endsAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 30;
    return Math.min(480, Math.max(5, Math.round((end - start) / 60000)));
  }

  function setField(id, value) {
    const field = document.getElementById(id);
    if (field) field.value = value;
  }

  function openForm(item) {
    const form = formEl();
    if (!form) return;
    if (form instanceof HTMLFormElement) form.reset();
    if (item) {
      const parts = localParts(item.startsAt);
      const contact = String(item.attendeeEmail || item.attendeePhone || "").trim();
      form.dataset.editing = item.id;
      setField("cal-form-date", parts.date);
      setField("cal-form-time", parts.time);
      setField("cal-form-mins", String(lengthMins(item)));
      setField("cal-form-name", String(item.attendeeName || "").trim() === "Guest" ? "" : item.attendeeName || "");
      setField("cal-form-contact", contact);
      setField("cal-form-site", item.businessName || "");
      setField("cal-form-link", item.meetingUrl || "");
      setSaveLabel(true);
    } else {
      delete form.dataset.editing;
      setField("cal-form-date", selected || "");
      setField("cal-form-mins", "30");
      setSaveLabel(false);
    }
    form.hidden = false;
    detailCardEl?.querySelectorAll(".ms-cal-remove").forEach((btn) => {
      btn.textContent = "Remove";
      delete btn.dataset.confirm;
    });
    document.getElementById("cal-form-name")?.focus();
  }

  function readForm() {
    const date = String(document.getElementById("cal-form-date")?.value || "");
    const time = String(document.getElementById("cal-form-time")?.value || "");
    const mins = Number(document.getElementById("cal-form-mins")?.value) || 30;
    const name = String(document.getElementById("cal-form-name")?.value || "").trim();
    const contact = String(document.getElementById("cal-form-contact")?.value || "").trim();
    const site = String(document.getElementById("cal-form-site")?.value || "").trim();
    const link = String(document.getElementById("cal-form-link")?.value || "").trim();
    const start = new Date(date + "T" + time);
    if (!date || !time || !Number.isFinite(start.getTime())) return null;
    const safeMins = Math.min(480, Math.max(5, mins));
    const end = new Date(start.getTime() + safeMins * 60000);
    const email = contact.includes("@") ? contact : "";
    return {
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      attendeeName: name,
      attendeeEmail: email,
      attendeePhone: email ? "" : contact,
      businessName: site,
      meetingUrl: link,
    };
  }

  function showSaved(start) {
    selected = dateKey(start);
    viewYear = start.getFullYear();
    viewMonth = start.getMonth();
    pickerYear = viewYear;
    closeForm();
    paintMonthLabel();
    paintGrid();
    showDetail();
  }

  async function removeEvent(item, button) {
    if (button) button.disabled = true;
    setError("");
    try {
      if (isLocalEvent(item)) {
        saveLocal(localEvents().filter((row) => row.id !== item.id));
      } else {
        await api("/calendar/bookings/" + encodeURIComponent(item.id), { method: "DELETE" });
        bookings = bookings.filter((row) => row.id !== item.id);
        writeExtra(item.id, null);
      }
      const form = formEl();
      if (form?.dataset.editing === item.id) closeForm();
      paintGrid();
      showDetail();
    } catch (e) {
      setError(e.message || "Could not remove that event");
      if (button) {
        button.disabled = false;
        button.textContent = "Remove";
        delete button.dataset.confirm;
      }
    }
  }

  document.getElementById("cal-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fields = readForm();
    if (!fields) return;
    const form = event.currentTarget;
    const editingId = form instanceof HTMLFormElement ? form.dataset.editing || "" : "";
    const saveBtn = document.getElementById("cal-form-save");
    if (saveBtn) saveBtn.disabled = true;
    setError("");
    try {
      if (editingId && !editingId.startsWith("local-")) {
        const data = await api("/calendar/bookings/" + encodeURIComponent(editingId), {
          method: "PATCH",
          body: JSON.stringify({
            startsAt: fields.startsAt,
            endsAt: fields.endsAt,
            attendeeName: fields.attendeeName,
            attendeeEmail: fields.attendeeEmail,
          }),
        });
        const booking = data?.booking;
        if (!booking?.id) throw new Error("Could not save that event");
        writeExtra(booking.id, {
          attendeePhone: fields.attendeePhone,
          businessName: fields.businessName,
          meetingUrl: fields.meetingUrl,
        });
        const index = bookings.findIndex((row) => row.id === booking.id);
        if (index === -1) bookings.push(booking);
        else bookings[index] = booking;
      } else if (editingId) {
        const items = localEvents();
        const index = items.findIndex((row) => row.id === editingId);
        const next = { ...fields, id: editingId, local: true };
        if (index === -1) items.push(next);
        else items[index] = next;
        saveLocal(items);
      } else {
        const items = localEvents();
        items.push({ ...fields, id: "local-" + Date.now(), local: true });
        saveLocal(items);
      }
      showSaved(new Date(fields.startsAt));
    } catch (e) {
      setError(e.message || "Could not save that event");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
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
      setMeetingsLoading(false);
      window.__msClearChannelSkeleton?.();
      showGate(false);
      setError(e.message || "Could not load the calendar");
    }
  }

  window.StudioBoot?.whenAuthReady?.(start) ?? start();
})();
