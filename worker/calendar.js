/**
 * Cal.com OAuth for studio employees.
 * Access tokens, refresh tokens, and webhook secrets never leave this module.
 */
const crypto = require("crypto");
const { notifyCreatorMeeting } = require("./creator-push");

const CAL_API = "https://api.cal.com/v2";
const CAL_AUTHORIZE = "https://app.cal.com/auth/oauth2/authorize";
const CAL_VERSION = "2024-08-13";
const SCOPES = [
  "PROFILE_READ",
  "EVENT_TYPE_READ",
  "BOOKING_READ",
  "WEBHOOK_READ",
  "WEBHOOK_WRITE",
].join(",");
const WEBHOOK_TRIGGERS = ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clientId() {
  return String(process.env.CALCOM_CLIENT_ID || "").trim();
}

function clientSecret() {
  return String(process.env.CALCOM_CLIENT_SECRET || "").trim();
}

function configured() {
  return !!(clientId() && clientSecret());
}

function studioOrigin() {
  const fromEnv = String(process.env.PUBLIC_APP_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) return fromEnv;
  return "https://trymoonrise.com";
}

function redirectUri() {
  const explicit = String(process.env.CALCOM_REDIRECT_URI || "").trim();
  if (explicit) return explicit;
  return studioOrigin() + "/calendar/callback";
}

function safeSegment(value) {
  const s = String(value || "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,80}$/.test(s)) return "";
  return s;
}

function preferredEventSlug(row) {
  const chosen = safeSegment(row?.event_slug);
  if (chosen) return chosen;
  const types = Array.isArray(row?.event_types) ? row.event_types : [];
  for (const item of types) {
    const slug = safeSegment(item?.slug);
    if (slug) return slug;
  }
  return "";
}

function bookingPageUrl(username, slug, projectId) {
  const user = safeSegment(username);
  if (!user) return "";
  const event = safeSegment(slug);
  const url = new URL(event ? "https://cal.com/" + user + "/" + event : "https://cal.com/" + user);
  const id = String(projectId || "").trim();
  if (id && UUID_RE.test(id)) url.searchParams.set("metadata[projectId]", id);
  return url.toString();
}

function isCalBookingUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && /^(www\.|app\.)?cal\.com$/i.test(url.hostname);
  } catch (_) {
    return false;
  }
}

function verifyCalSignature(rawBody, header, secret) {
  const sig = String(header || "").trim().toLowerCase();
  const key = String(secret || "");
  if (!sig || !key || sig === "no-secret-provided") return false;
  const expected = crypto.createHmac("sha256", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function calErrorMessage(data, fallback) {
  if (!data || typeof data !== "object") return fallback;
  const desc = data.error_description || data.message;
  if (typeof desc === "string" && desc.trim()) return desc.trim();
  if (data.error && typeof data.error === "object" && data.error.message) {
    return String(data.error.message);
  }
  if (typeof data.error === "string" && data.error.trim() && data.error !== "invalid_request") {
    return data.error.trim();
  }
  return fallback;
}

function callbackReason(data) {
  const code = String(data?.error || "").toLowerCase();
  const desc = String(data?.error_description || data?.message || "").toLowerCase();
  if (code === "access_denied") return "cancelled";
  if (
    code === "unauthorized_client" ||
    /not approved|pending|not yet ready/.test(desc)
  ) {
    return "not_approved";
  }
  return "failed";
}

function settingsLocation(reason) {
  const url = new URL("/settings", studioOrigin());
  url.searchParams.set("calendar", reason || "failed");
  return url.toString();
}

async function calTokenRequest(body) {
  const res = await fetch(CAL_API + "/auth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const err = new Error(calErrorMessage(data, "Cal.com could not connect."));
    err.status = res.status || 502;
    err.reason = callbackReason(data);
    throw err;
  }
  return data;
}

async function exchangeCode(code) {
  return calTokenRequest({
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
  });
}

async function refreshTokens(refreshToken) {
  return calTokenRequest({
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function calFetch(token, path, options) {
  const opts = options || {};
  const headers = {
    Authorization: "Bearer " + token,
    "cal-api-version": CAL_VERSION,
    Accept: "application/json",
  };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(CAL_API + path, {
    method: opts.method || "GET",
    headers,
    body: opts.body || undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(calErrorMessage(data, "Cal.com request failed."));
    err.status = res.status || 502;
    throw err;
  }
  return data;
}

function normalizeEventTypes(payload) {
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const slug = safeSegment(row?.slug);
    if (!slug || row?.hidden === true || seen.has(slug)) continue;
    seen.add(slug);
    const length = Number(row.lengthInMinutes || row.length || 0);
    out.push({
      slug,
      title: String(row.title || slug).trim().slice(0, 80) || slug,
      length: Number.isFinite(length) && length > 0 ? length : null,
    });
    if (out.length >= 20) break;
  }
  return out;
}

function normalizeStatus(raw, trigger) {
  const value = String(raw || "").trim().toLowerCase();
  if (trigger === "BOOKING_CANCELLED" || value === "cancelled" || value === "canceled" || value === "rejected") {
    return "cancelled";
  }
  return "accepted";
}

function textField(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") return textField(value.value || value.label || "");
  return "";
}

function timeValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") {
    if (value.dateTime) return value.dateTime;
    if (value.utc) return value.utc;
    if (value.date && value.time) return String(value.date) + "T" + String(value.time);
    if (value.date) return value.date;
  }
  return "";
}

function bookingRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  return [];
}

function pushUrlCandidate(list, value) {
  if (value == null || value === "") return;
  if (typeof value === "string" || typeof value === "number") {
    list.push(String(value).trim());
    return;
  }
  if (typeof value !== "object") return;
  pushUrlCandidate(list, value.videoCallUrl);
  pushUrlCandidate(list, value.url);
  pushUrlCandidate(list, value.uri);
  pushUrlCandidate(list, value.href);
  pushUrlCandidate(list, value.link);
  pushUrlCandidate(list, value.value);
  pushUrlCandidate(list, value.optionValue);
  pushUrlCandidate(list, value.meetingUrl);
  if (Array.isArray(value.entryPoints)) {
    value.entryPoints.forEach((entry) => pushUrlCandidate(list, entry));
  }
}

function extractMeetingUrl(src) {
  const bag = [];
  const meta = src?.metadata && typeof src.metadata === "object" ? src.metadata : {};
  pushUrlCandidate(bag, meta.videoCallUrl);
  pushUrlCandidate(bag, meta.videoCallUrl?.url);
  pushUrlCandidate(bag, src?.videoCallUrl);
  pushUrlCandidate(bag, src?.videoCallData);
  pushUrlCandidate(bag, src?.meetingUrl);
  pushUrlCandidate(bag, src?.conferenceData);
  pushUrlCandidate(bag, src?.location);
  if (Array.isArray(src?.references)) {
    src.references.forEach((ref) => pushUrlCandidate(bag, ref));
  }
  if (Array.isArray(src?.appsStatus)) {
    src.appsStatus.forEach((app) => {
      pushUrlCandidate(bag, app?.success?.url);
      pushUrlCandidate(bag, app?.success?.meetingUrl);
      pushUrlCandidate(bag, app);
    });
  }
  const unique = [...new Set(bag.filter(Boolean))];
  const meet = unique.find((url) => /^https?:\/\/meet\.google\.com\//i.test(url));
  if (meet) return meet.slice(0, 500);
  const other = unique.find(
    (url) =>
      /^https?:\/\//i.test(url) &&
      !/(^|\.)cal\.com(\/|$)/i.test(url) &&
      !/sms\.cal\.com/i.test(url)
  );
  return other ? other.slice(0, 500) : "";
}

function extractAttendeePhone(src, email) {
  const attendees = Array.isArray(src?.attendees) ? src.attendees : [];
  const attendee = attendees[0] || {};
  const responses = src?.responses && typeof src.responses === "object" ? src.responses : {};
  const direct = textField(
    attendee.phoneNumber ||
      attendee.phone ||
      responses.phone ||
      responses.smsReminderNumber ||
      src.attendeePhone
  ).trim();
  if (direct) return direct.replace(/[^\d+]/g, "").slice(0, 32);
  const sms = String(email || "").match(/^(\+?\d{7,15})@sms\.cal\.com$/i);
  return sms ? sms[1].slice(0, 32) : "";
}

function normalizeBooking(raw, trigger) {
  const src = raw && raw.payload && raw.triggerEvent ? raw.payload : raw || {};
  const uid = String(src.uid || src.bookingUid || src.id || "").trim().slice(0, 200);
  const startRaw = timeValue(src.startTime || src.start || src.startsAt);
  const endRaw = timeValue(src.endTime || src.end || src.endsAt);
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  const attendees = Array.isArray(src.attendees) ? src.attendees : [];
  const attendee = attendees[0] || {};
  const responses = src.responses && typeof src.responses === "object" ? src.responses : {};
  const metadata = src.metadata && typeof src.metadata === "object" ? src.metadata : {};
  const projectId = String(metadata.projectId || metadata.project_id || "").trim();
  const name = textField(attendee.name || responses.name || src.attendeeName).trim();
  let email = textField(attendee.email || responses.email).trim().toLowerCase();
  const phone = extractAttendeePhone(src, email);
  // Cal SMS addresses are not useful contact emails in the studio calendar.
  if (/@sms\.cal\.com$/i.test(email)) email = "";
  return {
    uid,
    title: String(src.title || src.eventTitle || src.eventType?.title || "Meeting").trim().slice(0, 200) || "Meeting",
    startsAt: Number.isFinite(start.getTime()) ? start.toISOString() : null,
    endsAt: Number.isFinite(end.getTime()) ? end.toISOString() : null,
    attendeeName: (name || email || phone || "Guest").slice(0, 120),
    attendeeEmail: email.slice(0, 200),
    attendeePhone: phone,
    meetingUrl: extractMeetingUrl(src),
    status: normalizeStatus(src.status, trigger),
    projectId: UUID_RE.test(projectId) ? projectId : "",
  };
}

function boundInstant(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return "";
  return new Date(time).toISOString();
}

function parseApiKey(raw) {
  const key = String(raw || "").trim();
  if (!/^cal_(live_|test_)?[A-Za-z0-9_-]{16,180}$/.test(key)) return "";
  return key;
}

function publicConnection(row) {
  if (!row) {
    return {
      connected: false,
      configured: configured(),
      authKind: "",
      username: "",
      eventSlug: "",
      eventTypes: [],
      bookingUrl: "",
    };
  }
  const types = Array.isArray(row.event_types) ? row.event_types : [];
  return {
    connected: true,
    configured: true,
    authKind: row.auth_kind === "api_key" ? "api_key" : "oauth",
    username: row.username || "",
    eventSlug: row.event_slug || "",
    eventTypes: types
      .map((item) => ({
        slug: safeSegment(item?.slug),
        title: String(item?.title || item?.slug || "").slice(0, 80),
        length: Number(item?.length) || null,
      }))
      .filter((item) => item.slug),
    bookingUrl: bookingPageUrl(row.username, row.event_slug),
  };
}

async function loadConnection(supabase, userId) {
  const { data, error } = await supabase
    .from("calendar_connections")
    .select(
      "user_id, cal_user_id, username, event_slug, event_types, auth_kind, access_token, refresh_token, token_expires_at, webhook_id, webhook_secret, webhook_token"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function accessTokenFor(supabase, row) {
  if (row.auth_kind === "api_key") {
    const key = String(row.access_token || "").trim();
    if (!parseApiKey(key)) {
      const err = new Error("Cal.com connection expired. Connect again.");
      err.status = 401;
      throw err;
    }
    return key;
  }
  const exp = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  if (row.access_token && exp > Date.now() + 60 * 1000) return row.access_token;
  if (!row.refresh_token) {
    const err = new Error("Cal.com connection expired. Connect again.");
    err.status = 401;
    throw err;
  }
  const tokens = await refreshTokens(row.refresh_token);
  const next = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || row.refresh_token,
    token_expires_at: new Date(Date.now() + (Number(tokens.expires_in) || 1800) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("calendar_connections").update(next).eq("user_id", row.user_id);
  if (error) throw error;
  row.access_token = next.access_token;
  row.refresh_token = next.refresh_token;
  row.token_expires_at = next.token_expires_at;
  return next.access_token;
}

async function ownedProjectId(supabase, userId, projectId) {
  if (!projectId) return null;
  const { data, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.user_id !== userId) return null;
  return data.id;
}

async function upsertBooking(supabase, userId, booking, trigger) {
  if (!booking.uid || !booking.startsAt) return { isNew: false };
  const { data: existing, error: readErr } = await supabase
    .from("calendar_bookings")
    .select("id, status")
    .eq("provider_uid", booking.uid)
    .maybeSingle();
  if (readErr) throw readErr;
  if (existing?.status === "cancelled") return { isNew: false };
  if (existing?.status === "edited" && trigger !== "BOOKING_CANCELLED") return { isNew: false };
  let projectId = null;
  if (booking.projectId) {
    projectId = await ownedProjectId(supabase, userId, booking.projectId);
  } else if (existing?.id) {
    const { data: prior, error: priorErr } = await supabase
      .from("calendar_bookings")
      .select("project_id")
      .eq("id", existing.id)
      .maybeSingle();
    if (priorErr) throw priorErr;
    projectId = prior?.project_id || null;
  }
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    project_id: projectId,
    provider_uid: booking.uid,
    title: booking.title,
    starts_at: booking.startsAt,
    ends_at: booking.endsAt,
    attendee_name: booking.attendeeName,
    attendee_email: booking.attendeeEmail || null,
    status: booking.status,
    updated_at: now,
  };
  const { error } = await supabase.from("calendar_bookings").upsert(row, { onConflict: "provider_uid" });
  if (error) throw error;
  const isNew = !existing && trigger === "BOOKING_CREATED" && booking.status !== "cancelled";
  if (isNew) {
    try {
      await notifyCreatorMeeting(supabase, {
        userId,
        attendeeName: booking.attendeeName,
        startsAt: booking.startsAt,
        projectId,
      });
    } catch (e) {
      console.error("meeting push", e?.message || e);
    }
  }
  return { isNew };
}

async function listRemoteBookings(token) {
  const paths = [
    "/bookings?status=upcoming&take=100",
    "/bookings?status=past&take=100",
    "/bookings?take=100",
  ];
  const seen = new Set();
  const rows = [];
  for (const path of paths) {
    try {
      const payload = await calFetch(token, path);
      for (const row of bookingRows(payload)) {
        const key = String(row?.uid || row?.bookingUid || row?.id || "");
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        rows.push(row);
      }
    } catch (e) {
      console.error("cal bookings sync", e?.status || "", e?.message || e);
    }
  }
  return rows;
}

async function syncUpcoming(supabase, userId, token) {
  const rows = await listRemoteBookings(token);
  for (const raw of rows) {
    const booking = normalizeBooking(raw, "BOOKING_CREATED");
    if (booking.status === "cancelled") continue;
    try {
      await upsertBooking(supabase, userId, booking, "SYNC");
    } catch (e) {
      console.error("cal booking upsert", e?.message || e);
    }
  }
}

async function removeRemoteWebhook(token, webhookId) {
  const id = String(webhookId || "").trim();
  if (!token || !id) return;
  try {
    await calFetch(token, "/webhooks/" + encodeURIComponent(id), { method: "DELETE" });
  } catch (e) {
    console.error("cal webhook delete", e?.message || e);
  }
}

async function createRemoteWebhook(token, webhookToken) {
  const secret = crypto.randomBytes(32).toString("hex");
  const subscriberUrl = studioOrigin() + "/webhooks/cal/" + webhookToken;
  const body = {
    active: true,
    subscriberUrl,
    triggers: WEBHOOK_TRIGGERS,
    secret,
    version: "2021-10-20",
  };
  let created;
  try {
    created = await calFetch(token, "/webhooks", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (e) {
    created = await calFetch(token, "/webhooks", {
      method: "POST",
      body: JSON.stringify({ ...body, eventTriggers: WEBHOOK_TRIGGERS }),
    });
  }
  return {
    webhookId: String(created?.data?.id || ""),
    webhookSecret: secret,
  };
}

function toClientBooking(row, businessName, extra) {
  const more = extra && typeof extra === "object" ? extra : {};
  const email = String(more.attendeeEmail != null ? more.attendeeEmail : row.attendee_email || "").trim();
  const phone = String(more.attendeePhone != null ? more.attendeePhone : row.attendee_phone || "").trim();
  const meetingUrl = String(more.meetingUrl != null ? more.meetingUrl : row.meeting_url || "").trim();
  return {
    id: row.id,
    providerUid: row.provider_uid || "",
    title: row.title || "Meeting",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    attendeeName: row.attendee_name || "Guest",
    attendeeEmail: /@sms\.cal\.com$/i.test(email) ? "" : email,
    attendeePhone: phone || (String(email).match(/^(\+?\d{7,15})@sms\.cal\.com$/i) || [])[1] || "",
    meetingUrl: /cal\.com/i.test(meetingUrl) ? "" : meetingUrl,
    status: row.status || "accepted",
    businessName: businessName || "",
  };
}

async function businessNamesFor(supabase, rows) {
  const projectIds = [...new Set(rows.map((row) => row.project_id).filter(Boolean))];
  const names = {};
  if (!projectIds.length) return names;
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, business_name")
    .in("id", projectIds);
  if (error) throw error;
  for (const project of projects || []) {
    names[project.id] = String(project.business_name || "").trim();
  }
  return names;
}

function parseEventEdit(body) {
  const start = new Date(body?.startsAt);
  const end = new Date(body?.endsAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    const err = new Error("Choose a day and time.");
    err.status = 400;
    throw err;
  }
  const mins = (end.getTime() - start.getTime()) / 60000;
  if (mins < 5 || mins > 480) {
    const err = new Error("Meetings can be from 5 minutes to 8 hours.");
    err.status = 400;
    throw err;
  }
  const name = String(body?.attendeeName || "").trim().slice(0, 120);
  const email = String(body?.attendeeEmail || "").trim().toLowerCase().slice(0, 200);
  if (email && !email.includes("@")) {
    const err = new Error("Enter an email address, or a phone number.");
    err.status = 400;
    throw err;
  }
  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    attendeeName: name || "Guest",
    attendeeEmail: email,
  };
}

async function loadOwnedBooking(supabase, userId, id) {
  if (!UUID_RE.test(String(id || ""))) return null;
  const { data, error } = await supabase
    .from("calendar_bookings")
    .select("id, user_id, project_id, provider_uid, title, starts_at, ends_at, attendee_name, attendee_email, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.user_id !== userId || data.status === "cancelled") return null;
  return data;
}

async function cancelRemoteBooking(token, uid) {
  const id = encodeURIComponent(String(uid || "").trim());
  if (!token || !id) return;
  try {
    await calFetch(token, "/bookings/" + id + "/cancel", {
      method: "POST",
      body: JSON.stringify({ cancellationReason: "Removed in Moonrise" }),
    });
  } catch (e) {
    if (e.status === 404) return;
    try {
      await calFetch(token, "/bookings/" + id, { method: "DELETE" });
    } catch (err) {
      console.error("cal booking cancel", err?.status || "", err?.message || err);
    }
  }
}

function sendError(res, e, fallback) {
  const status = Number(e?.status) || 500;
  if (status >= 500) console.error(fallback, e?.message || e);
  const message = status >= 500 ? fallback : e?.message || fallback;
  res.status(status).json({ error: message });
}

async function connectAccount(supabase, userId, token, extras) {
  const profile = await calFetch(token, "/me");
  const me = profile?.data || {};
  let types = [];
  try {
    const listed = await calFetch(token, "/event-types");
    types = normalizeEventTypes(listed);
  } catch (e) {
    console.error("cal event types", e?.message || e);
  }
  if (!types.length && me.username) {
    try {
      const listed = await calFetch(
        token,
        "/event-types?username=" + encodeURIComponent(String(me.username))
      );
      types = normalizeEventTypes(listed);
    } catch (e) {
      console.error("cal event types by username", e?.message || e);
    }
  }
  const existing = await loadConnection(supabase, userId);
  if (existing?.webhook_id && existing.access_token) {
    try {
      const oldToken = await accessTokenFor(supabase, existing);
      await removeRemoteWebhook(oldToken, existing.webhook_id);
    } catch (e) {
      console.error("cal replace webhook", e?.message || e);
    }
  }
  const webhookToken = crypto.randomBytes(24).toString("hex");
  let webhookId = "";
  let webhookSecret = "";
  try {
    const hook = await createRemoteWebhook(token, webhookToken);
    webhookId = hook.webhookId;
    webhookSecret = hook.webhookSecret;
  } catch (e) {
    console.error("cal webhook create", e?.message || e);
  }
  const now = new Date().toISOString();
  const expiresIn = Number(extras?.expiresIn);
  const row = {
    user_id: userId,
    cal_user_id: me.id != null ? String(me.id) : null,
    username: safeSegment(me.username) || null,
    event_slug: types[0]?.slug || null,
    event_types: types,
    auth_kind: "oauth",
    access_token: token,
    refresh_token: extras?.refreshToken || null,
    token_expires_at: Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null,
    webhook_id: webhookId || null,
    webhook_secret: webhookSecret || null,
    webhook_token: webhookToken,
    updated_at: now,
  };
  if (!existing) row.connected_at = now;
  const { error: saveErr } = await supabase
    .from("calendar_connections")
    .upsert(row, { onConflict: "user_id" });
  if (saveErr) throw saveErr;
  await syncUpcoming(supabase, userId, token);
  return loadConnection(supabase, userId);
}

function mountWebhook(app, express, db) {
  app.post("/webhooks/cal/:token", express.raw({ type: "application/json" }), async (req, res) => {
    const token = String(req.params.token || "").trim();
    if (!/^[a-f0-9]{32,64}$/i.test(token)) return res.status(404).json({ error: "Not found" });
    try {
      const supabase = db();
      const { data: conn, error } = await supabase
        .from("calendar_connections")
        .select("user_id, webhook_secret")
        .eq("webhook_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!conn?.webhook_secret) return res.status(404).json({ error: "Not found" });
      const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
      const header = req.headers["x-cal-signature-256"];
      if (!verifyCalSignature(raw, header, conn.webhook_secret)) {
        return res.status(401).json({ error: "Invalid signature" });
      }
      let body;
      try {
        body = JSON.parse(raw.toString("utf8"));
      } catch (_) {
        return res.status(400).json({ error: "Invalid payload" });
      }
      const trigger = String(body?.triggerEvent || "");
      if (!WEBHOOK_TRIGGERS.includes(trigger)) return res.json({ received: true, ignored: true });
      const booking = normalizeBooking(body, trigger);
      await upsertBooking(supabase, conn.user_id, booking, trigger);
      return res.json({ received: true });
    } catch (e) {
      console.error("cal webhook", e?.message || e);
      return res.status(500).json({ error: "Webhook failed" });
    }
  });
}

function mountRoutes(app, { db, requireUser }) {
  app.get("/calendar/connect", requireUser, async (req, res) => {
    try {
      if (!configured()) {
        return res.status(503).json({
          error: "Cal.com is not set up yet.",
          code: "cal_not_configured",
        });
      }
      const supabase = db();
      const state = crypto.randomBytes(24).toString("hex");
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabase.from("calendar_oauth_states").delete().lt("expires_at", new Date().toISOString());
      const { error } = await supabase.from("calendar_oauth_states").insert({
        state,
        user_id: req.user.id,
        expires_at: expires,
      });
      if (error) throw error;
      const url = new URL(CAL_AUTHORIZE);
      url.searchParams.set("client_id", clientId());
      url.searchParams.set("redirect_uri", redirectUri());
      url.searchParams.set("state", state);
      url.searchParams.set("scope", SCOPES);
      res.json({ url: url.toString() });
    } catch (e) {
      sendError(res, e, "Could not start Cal.com");
    }
  });

  app.get("/calendar/callback", async (req, res) => {
    const code = String(req.query.code || "").trim();
    const state = String(req.query.state || "").trim();
    const oauthError = String(req.query.error || "").trim();
    if (oauthError || !code || !state) {
      const reason = oauthError ? callbackReason({ error: oauthError, error_description: req.query.error_description }) : "failed";
      return res.redirect(settingsLocation(reason));
    }
    try {
      if (!configured()) return res.redirect(settingsLocation("not_configured"));
      const supabase = db();
      const { data: pending, error: stateErr } = await supabase
        .from("calendar_oauth_states")
        .select("user_id, expires_at")
        .eq("state", state)
        .maybeSingle();
      if (stateErr) throw stateErr;
      await supabase.from("calendar_oauth_states").delete().eq("state", state);
      if (!pending?.user_id || new Date(pending.expires_at).getTime() < Date.now()) {
        return res.redirect(settingsLocation("failed"));
      }
      const tokens = await exchangeCode(code);
      await connectAccount(supabase, pending.user_id, tokens.access_token, {
        refreshToken: tokens.refresh_token || null,
        expiresIn: Number(tokens.expires_in) || 1800,
      });
      return res.redirect(settingsLocation("connected"));
    } catch (e) {
      console.error("cal callback", e?.message || e);
      return res.redirect(settingsLocation(e?.reason || "failed"));
    }
  });

  app.get("/calendar/connection", requireUser, async (req, res) => {
    try {
      const row = await loadConnection(db(), req.user.id);
      res.json(publicConnection(row));
    } catch (e) {
      sendError(res, e, "Could not load Calendar");
    }
  });

  app.post("/calendar/event", requireUser, async (req, res) => {
    try {
      const slug = safeSegment(req.body?.slug);
      if (!slug) return res.status(400).json({ error: "Choose a booking page." });
      const supabase = db();
      const row = await loadConnection(supabase, req.user.id);
      if (!row) return res.status(404).json({ error: "Connect Cal.com first." });
      const types = Array.isArray(row.event_types) ? row.event_types : [];
      if (!types.some((item) => safeSegment(item?.slug) === slug)) {
        return res.status(400).json({ error: "That booking page is not on this Cal.com account." });
      }
      const { error } = await supabase
        .from("calendar_connections")
        .update({ event_slug: slug, updated_at: new Date().toISOString() })
        .eq("user_id", req.user.id);
      if (error) throw error;
      row.event_slug = slug;
      res.json(publicConnection(row));
    } catch (e) {
      sendError(res, e, "Could not save the booking page");
    }
  });

  app.delete("/calendar/connection", requireUser, async (req, res) => {
    try {
      const supabase = db();
      const row = await loadConnection(supabase, req.user.id);
      if (row) {
        try {
          const token = await accessTokenFor(supabase, row);
          await removeRemoteWebhook(token, row.webhook_id);
        } catch (e) {
          console.error("cal disconnect webhook", e?.message || e);
        }
        const { error } = await supabase.from("calendar_connections").delete().eq("user_id", req.user.id);
        if (error) throw error;
      }
      res.json(publicConnection(null));
    } catch (e) {
      sendError(res, e, "Could not disconnect Cal.com");
    }
  });

  app.get("/calendar/bookings", requireUser, async (req, res) => {
    try {
      const supabase = db();
      const conn = await loadConnection(supabase, req.user.id);
      const liveByUid = new Map();
      if (conn) {
        try {
          const token = await accessTokenFor(supabase, conn);
          await syncUpcoming(supabase, req.user.id, token);
          const liveRows = await listRemoteBookings(token);
          for (const raw of liveRows) {
            const booking = normalizeBooking(raw, "SYNC");
            if (!booking.uid) continue;
            liveByUid.set(booking.uid, {
              meetingUrl: booking.meetingUrl || "",
              attendeePhone: booking.attendeePhone || "",
              attendeeEmail: booking.attendeeEmail || "",
            });
          }
        } catch (e) {
          console.error("cal bookings refresh", e?.message || e);
        }
      }
      const from = boundInstant(req.query.from);
      const to = boundInstant(req.query.to);
      let query = supabase
        .from("calendar_bookings")
        .select(
          "id, provider_uid, title, starts_at, ends_at, attendee_name, attendee_email, status, project_id"
        )
        .eq("user_id", req.user.id)
        .neq("status", "cancelled")
        .order("starts_at", { ascending: true })
        .limit(200);
      if (from) query = query.gte("starts_at", from);
      if (to) query = query.lt("starts_at", to);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      const names = await businessNamesFor(supabase, rows);
      res.json({
        connected: !!conn,
        bookings: rows.map((row) =>
          toClientBooking(
            row,
            row.project_id ? names[row.project_id] || "" : "",
            liveByUid.get(String(row.provider_uid || "")) || null
          )
        ),
      });
    } catch (e) {
      sendError(res, e, "Could not load meetings");
    }
  });

  app.patch("/calendar/bookings/:id", requireUser, async (req, res) => {
    try {
      const supabase = db();
      const row = await loadOwnedBooking(supabase, req.user.id, req.params.id);
      if (!row) return res.status(404).json({ error: "That event is no longer on the calendar." });
      const parsed = parseEventEdit(req.body);
      const { data, error } = await supabase
        .from("calendar_bookings")
        .update({
          starts_at: parsed.startsAt,
          ends_at: parsed.endsAt,
          attendee_name: parsed.attendeeName,
          attendee_email: parsed.attendeeEmail || null,
          status: "edited",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("user_id", req.user.id)
        .select("id, title, starts_at, ends_at, attendee_name, attendee_email, status, project_id")
        .single();
      if (error) throw error;
      const names = await businessNamesFor(supabase, [data]);
      res.json({
        booking: toClientBooking(data, data.project_id ? names[data.project_id] || "" : ""),
      });
    } catch (e) {
      sendError(res, e, "Could not save that event");
    }
  });

  app.delete("/calendar/bookings/:id", requireUser, async (req, res) => {
    try {
      const supabase = db();
      const row = await loadOwnedBooking(supabase, req.user.id, req.params.id);
      if (!row) return res.status(404).json({ error: "That event is no longer on the calendar." });
      const { error } = await supabase
        .from("calendar_bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("user_id", req.user.id);
      if (error) throw error;
      if (row.provider_uid) {
        try {
          const conn = await loadConnection(supabase, req.user.id);
          if (conn) {
            const token = await accessTokenFor(supabase, conn);
            await cancelRemoteBooking(token, row.provider_uid);
          }
        } catch (e) {
          console.error("cal booking cancel", e?.message || e);
        }
      }
      res.json({ ok: true });
    } catch (e) {
      sendError(res, e, "Could not remove that event");
    }
  });

  app.get("/public-booking", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const projectId = String(req.query.projectId || "").trim();
    if (!UUID_RE.test(projectId)) return res.json({ url: "" });
    try {
      const supabase = db();
      const { data: project, error } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      if (!project?.user_id) return res.json({ url: "" });
      const { data: conn, error: connErr } = await supabase
        .from("calendar_connections")
        .select("username, event_slug, event_types")
        .eq("user_id", project.user_id)
        .maybeSingle();
      if (connErr) throw connErr;
      const url = bookingPageUrl(conn?.username, preferredEventSlug(conn), project.id);
      res.json({ url: isCalBookingUrl(url) ? url : "" });
    } catch (e) {
      console.error("public booking", e?.message || e);
      res.json({ url: "" });
    }
  });
}

module.exports = {
  mountWebhook,
  mountRoutes,
  verifyCalSignature,
  bookingPageUrl,
  isCalBookingUrl,
  normalizeBooking,
  configured,
};
