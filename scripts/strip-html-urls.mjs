/**
 * Rewrite Moonrise page links from foo.html → foo (index.html → /)
 * only in URL / navigation contexts. Does not rename files on disk.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const pages = [
  "admin-console",
  "builder",
  "clients",
  "contact",
  "course",
  "creator-contact",
  "dashboard",
  "designer-tips",
  "donate",
  "download",
  "editor",
  "guide",
  "help",
  "hosting-billing",
  "index",
  "leaderboard",
  "leads",
  "legal",
  "login",
  "onboarding",
  "orders",
  "pricing",
  "privacy",
  "projects",
  "refund",
  "report",
  "settings",
  "terms",
  "404",
];

const pageAlt = pages
  .slice()
  .sort((a, b) => b.length - a.length)
  .map((p) => p.replace(/-/g, "\\-"))
  .join("|");

function toClean(page) {
  const stem = String(page).toLowerCase();
  return stem === "index" ? "/" : stem;
}

/** href="/x.html", href='x.html#y', href=x.html */
const hrefRe = new RegExp(
  `(href\\s*=\\s*["']?)((?:https?:\\/\\/trymoonrise\\.com\\/)?)(${pageAlt})\\.html\\b`,
  "gi",
);

/** location.(href|replace|assign)("x.html…") */
const locRe = new RegExp(
  `((?:location\\.(?:href|replace|assign)|window\\.location\\.(?:href|replace|assign)|pendingRedirectUrl)\\s*=\\s*(?:["']))(${pageAlt})\\.html\\b`,
  "gi",
);

/** "href": "dashboard.html" / href: "dashboard.html" in JS objects */
const objHrefRe = new RegExp(
  `((?:["']?href["']?\\s*:\\s*["']))(${pageAlt})\\.html\\b`,
  "gi",
);

/** Bare strings used as studio routes: "dashboard.html", 'login.html?next=' */
const strRe = new RegExp(`(["'])(${pageAlt})\\.html\\b`, "gi");

/** Canonical / sitemap absolute URLs */
const absRe = new RegExp(
  `(https:\\/\\/trymoonrise\\.com\\/)(${pageAlt})\\.html\\b`,
  "gi",
);

/** vercel redirects destinations */
const destRe = new RegExp(
  `("destination"\\s*:\\s*")\\/(${pageAlt})\\.html\\b`,
  "gi",
);

const targets = [
  ...fs.readdirSync(root).filter((n) => n.endsWith(".html")).map((n) => path.join(root, n)),
  ...fs.readdirSync(path.join(root, "js")).filter((n) => n.endsWith(".js")).map((n) => path.join(root, "js", n)),
  path.join(root, "vercel.json"),
  path.join(root, "sitemap.xml"),
  path.join(root, "robots.txt"),
  path.join(root, "llms.txt"),
  path.join(root, "manifest.json"),
];

// Product docs that list studio URLs
for (const rel of ["docs/WEBSITE-GENERATION-PROMPT.md", "README.md"]) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) targets.push(p);
}

/** Files where many "index.html" strings mean uploaded site files — only touch href/location/abs. */
const navigationOnly = new Set(
  ["builder.js", "projects.js", "site-features.js"].map((n) => path.join(root, "js", n)),
);

let changed = 0;

for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  const orig = text;
  const base = path.basename(file);
  const navOnly = navigationOnly.has(file);

  text = text.replace(hrefRe, (_m, prefix, host, page) => `${prefix}${host || ""}${toClean(page)}`);
  text = text.replace(locRe, (_m, prefix, page) => `${prefix}${toClean(page)}`);
  text = text.replace(objHrefRe, (_m, prefix, page) => `${prefix}${toClean(page)}`);
  text = text.replace(absRe, (_m, host, page) => `${host}${toClean(page)}`);
  text = text.replace(destRe, (_m, prefix, page) => `${prefix}/${toClean(page)}`);

  if (!navOnly) {
    // Studio route string literals (prefetch lists, PUBLIC maps, fallbacks).
    // Skip regexes and comments that talk about "*.html files".
    text = text.replace(strRe, (full, quote, page, offset) => {
      const before = text.slice(Math.max(0, offset - 24), offset);
      if (/\\[.^]|\/\^|\\\\\.html|files|Upload|entry|hasIndex|mime|extension/i.test(before)) {
        return full;
      }
      // PUBLIC map keys and similar
      return `${quote}${toClean(page)}`;
    });
  }

  text = text.replace(/https:\/\/trymoonrise\.com\/\//g, "https://trymoonrise.com/");

  if (text !== orig) {
    fs.writeFileSync(file, text);
    changed += 1;
    console.log(path.relative(root, file));
  }
}

console.log(`changed ${changed}`);
