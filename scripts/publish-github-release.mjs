/**
 * Publish GitHub Releases from brain/releases.json.
 *
 * Usage:
 *   node scripts/publish-github-release.mjs
 *   node scripts/publish-github-release.mjs --all
 *   node scripts/publish-github-release.mjs --version 1.0.1
 *
 * Auth: GITHUB_TOKEN or GH_TOKEN from E:/MasterVault/Moonrise/accesstokens.env
 * (or moonrise-studio/.env). Never prints the token.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vaultEnv = path.resolve(root, "..", "accesstokens.env");
loadEnv(vaultEnv);
loadEnv(path.join(root, ".env"));
loadEnv(path.join(root, "worker", ".env"));

const log = JSON.parse(fs.readFileSync(path.join(root, "brain", "log.json"), "utf8"));
const [defaultOwner, defaultRepo] = String(log.repo || "trymoonrise/moonrise").split("/");
const OWNER = process.env.GITHUB_OWNER || defaultOwner || "trymoonrise";
const REPO = process.env.GITHUB_REPO || defaultRepo || "moonrise";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!token) {
  console.error("Missing GITHUB_TOKEN / GH_TOKEN — cannot publish GitHub Releases.");
  process.exit(1);
}

const releasesDoc = JSON.parse(fs.readFileSync(path.join(root, "brain", "releases.json"), "utf8"));
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const args = process.argv.slice(2);
const all = args.includes("--all");
const versionArgIdx = args.indexOf("--version");
const onlyVersion = versionArgIdx >= 0 ? args[versionArgIdx + 1] : all ? null : pkg.version;

const targets = (releasesDoc.updates || []).filter((u) =>
  onlyVersion ? u.version === onlyVersion : true,
);

if (!targets.length) {
  console.error(
    onlyVersion
      ? `No brain release notes for version ${onlyVersion}.`
      : "brain/releases.json has no updates.",
  );
  process.exit(1);
}

// Publish oldest first so a bulk backfill does not leave v1.0.0 as GitHub "Latest".
// The current package version is always marked make_latest after the loop.
const ordered = [...targets].sort((a, b) => compareSemver(a.version, b.version));
const latestVersion = String(pkg.version);

const results = [];
for (const update of ordered) {
  results.push(await publishOne(update, update.version === latestVersion));
}
if (!results.some((r) => r.action === "error")) {
  const tip = ordered.find((u) => u.version === latestVersion) || ordered[ordered.length - 1];
  if (tip) results.push(await publishOne(tip, true));
}

console.log(
  JSON.stringify(
    {
      repo: `${OWNER}/${REPO}`,
      published: results
        .filter((r) => r.action === "created" || r.action === "created-latest")
        .map((r) => r.tag),
      existed: results.filter((r) => r.action === "exists").map((r) => r.tag),
      updated: results.filter((r) => r.action === "updated" || r.action === "latest").map((r) => r.tag),
      latest: results.filter((r) => r.action === "latest" || r.action === "created-latest").map((r) => r.tag),
      failed: results.filter((r) => r.action === "error"),
    },
    null,
    2,
  ),
);
if (results.some((r) => r.action === "error")) process.exit(1);

async function publishOne(update, makeLatest = false) {
  const tag = update.tag || `v${update.version}`;
  const name = `${releasesDoc.product || "Moonrise"} ${update.version}: ${update.title}`;
  const body = formatReleaseBody(update);
  const targetCommitish = resolveTarget(process.env.GITHUB_RELEASE_TARGET || "main");
  const latestFlag = makeLatest ? "true" : "false";

  const existing = await api("GET", `/repos/${OWNER}/${REPO}/releases/tags/${tag}`);
  if (existing.ok) {
    const release = await existing.json();
    const patch = await api("PATCH", `/repos/${OWNER}/${REPO}/releases/${release.id}`, {
      name,
      body,
      draft: false,
      prerelease: false,
      make_latest: latestFlag,
    });
    if (!patch.ok) {
      const text = await patch.text();
      return { tag, action: "error", status: patch.status, detail: text.slice(0, 200) };
    }
    return { tag, action: makeLatest ? "latest" : "updated", url: release.html_url };
  }

  if (existing.status !== 404) {
    const text = await existing.text();
    return { tag, action: "error", status: existing.status, detail: text.slice(0, 200) };
  }

  const created = await api("POST", `/repos/${OWNER}/${REPO}/releases`, {
    tag_name: tag,
    target_commitish: targetCommitish,
    name,
    body,
    draft: false,
    prerelease: false,
    generate_release_notes: false,
    make_latest: latestFlag,
  });
  if (!created.ok) {
    const text = await created.text();
    return { tag, action: "error", status: created.status, detail: text.slice(0, 300) };
  }
  const release = await created.json();
  return { tag, action: makeLatest ? "created-latest" : "created", url: release.html_url };
}

function compareSemver(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function formatReleaseBody(update) {
  const lines = [`## ${update.title}`, "", `_Shipped ${update.date}_`, ""];
  for (const section of update.sections || []) {
    lines.push(`### ${section.heading}`, "");
    if (section.added?.length) {
      lines.push("**Added**");
      for (const note of section.added) lines.push(`- ${note}`);
      lines.push("");
    }
    if (section.fixes?.length) {
      lines.push("**Fixes**");
      for (const note of section.fixes) lines.push(`- ${note}`);
      lines.push("");
    }
  }
  lines.push("---", "", "_Notes from `brain/log.json`._", "");
  return lines.join("\n");
}

async function api(method, apiPath, body) {
  return fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "moonrise-release-bot",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function resolveTarget(ref) {
  if (!ref || ref === "master" || ref === "main") return ref;
  try {
    return execSync(`git -c safe.directory=${root.replace(/\\/g, "/")} rev-parse ${ref}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return ref;
  }
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}
