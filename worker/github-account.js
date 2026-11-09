/**
 * GitHub OAuth for Builder upload.
 * Access tokens never leave this module.
 */
const crypto = require("crypto");

const GH_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GH_TOKEN = "https://github.com/login/oauth/access_token";
const GH_API = "https://api.github.com";
const GH_UA = "Moonrise-Studio-Import";
const SCOPES = "repo read:user";

function clientId() {
  return String(process.env.GITHUB_OAUTH_CLIENT_ID || "").trim();
}

function clientSecret() {
  return String(process.env.GITHUB_OAUTH_CLIENT_SECRET || "").trim();
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
  const explicit = String(process.env.GITHUB_OAUTH_REDIRECT_URI || "").trim();
  if (explicit) return explicit;
  return studioOrigin() + "/github/callback";
}

function builderLocation(reason) {
  const url = new URL(studioOrigin() + "/builder");
  const code = String(reason || "").trim();
  if (code) url.searchParams.set("github", code);
  return url.toString();
}

async function tokenForUser(supabase, userId) {
  const id = String(userId || "").trim();
  if (!id) return "";
  const { data, error } = await supabase
    .from("github_connections")
    .select("access_token")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw error;
  return String(data?.access_token || "").trim();
}

async function publicConnection(supabase, userId) {
  const id = String(userId || "").trim();
  const base = { connected: false, configured: configured(), login: "" };
  if (!id) return base;
  const { data, error } = await supabase
    .from("github_connections")
    .select("github_login")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return base;
  return {
    connected: true,
    configured: configured(),
    login: String(data.github_login || "").trim(),
  };
}

async function exchangeCode(code) {
  const res = await fetch(GH_TOKEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": GH_UA,
    },
    body: JSON.stringify({
      client_id: clientId(),
      client_secret: clientSecret(),
      code,
      redirect_uri: redirectUri(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error || !data.access_token) {
    const err = new Error("GitHub did not return a connection.");
    err.status = 502;
    throw err;
  }
  return data;
}

async function githubLogin(token) {
  const res = await fetch(GH_API + "/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": GH_UA,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error("Could not read the GitHub account.");
    err.status = res.status === 401 ? 401 : 502;
    throw err;
  }
  return {
    login: String(data.login || "").trim(),
    id: data.id != null ? String(data.id) : "",
  };
}

function sendError(res, e, fallback) {
  const status = Number(e?.status) || 500;
  if (status >= 500) console.error(fallback, e?.message || e);
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: status >= 500 ? fallback : e?.message || fallback,
    code: e?.code || "",
  });
}

function mountRoutes(app, { db, requireUser }) {
  app.get("/github/connect", requireUser, async (req, res) => {
    try {
      if (!configured()) {
        return res.status(503).json({
          error: "GitHub connect is not set up on this site yet. Paste a public repository URL.",
          code: "github_not_configured",
        });
      }
      const supabase = db();
      const state = crypto.randomBytes(24).toString("hex");
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabase.from("github_oauth_states").delete().lt("expires_at", new Date().toISOString());
      const { error } = await supabase.from("github_oauth_states").insert({
        state,
        user_id: req.user.id,
        expires_at: expires,
      });
      if (error) throw error;
      const url = new URL(GH_AUTHORIZE);
      url.searchParams.set("client_id", clientId());
      url.searchParams.set("redirect_uri", redirectUri());
      url.searchParams.set("scope", SCOPES);
      url.searchParams.set("state", state);
      res.json({ url: url.toString() });
    } catch (e) {
      sendError(res, e, "Could not start GitHub");
    }
  });

  app.get("/github/callback", async (req, res) => {
    const code = String(req.query.code || "").trim();
    const state = String(req.query.state || "").trim();
    const oauthError = String(req.query.error || "").trim();
    if (oauthError === "access_denied") return res.redirect(builderLocation("cancelled"));
    if (oauthError || !code || !state) return res.redirect(builderLocation("failed"));
    try {
      if (!configured()) return res.redirect(builderLocation("not_configured"));
      const supabase = db();
      const { data: pending, error: stateErr } = await supabase
        .from("github_oauth_states")
        .select("user_id, expires_at")
        .eq("state", state)
        .maybeSingle();
      if (stateErr) throw stateErr;
      await supabase.from("github_oauth_states").delete().eq("state", state);
      if (!pending?.user_id || new Date(pending.expires_at).getTime() < Date.now()) {
        return res.redirect(builderLocation("failed"));
      }
      const tokens = await exchangeCode(code);
      const profile = await githubLogin(tokens.access_token);
      const now = new Date().toISOString();
      const { error: saveErr } = await supabase.from("github_connections").upsert(
        {
          user_id: pending.user_id,
          github_login: profile.login || null,
          github_user_id: profile.id || null,
          access_token: tokens.access_token,
          scope: String(tokens.scope || SCOPES),
          updated_at: now,
          connected_at: now,
        },
        { onConflict: "user_id" }
      );
      if (saveErr) throw saveErr;
      return res.redirect(builderLocation("connected"));
    } catch (e) {
      console.error("github callback", e?.message || e);
      return res.redirect(builderLocation("failed"));
    }
  });

  app.get("/github/connection", requireUser, async (req, res) => {
    try {
      res.json(await publicConnection(db(), req.user.id));
    } catch (e) {
      sendError(res, e, "Could not load GitHub");
    }
  });

  app.delete("/github/connection", requireUser, async (req, res) => {
    try {
      const { error } = await db().from("github_connections").delete().eq("user_id", req.user.id);
      if (error) throw error;
      res.json({ connected: false, configured: configured(), login: "" });
    } catch (e) {
      sendError(res, e, "Could not disconnect GitHub");
    }
  });
}

module.exports = {
  configured,
  tokenForUser,
  mountRoutes,
};
