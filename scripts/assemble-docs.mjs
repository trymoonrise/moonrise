/**
 * Assembles docs.html from product fragment + legal sections + license texts.
 * Run: node scripts/assemble-docs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function extractSection(html, id) {
  const re = new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`, "i");
  const m = html.match(re);
  if (!m) throw new Error(`Missing section #${id} in legal.html`);
  return m[0]
    .replace(/href="legal#/g, 'href="#')
    .replace(/class="ms-card ms-legal-article"/g, 'class="ms-legal-article"');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mdLite(md) {
  return escapeHtml(md)
    .replace(/^## (.*)$/gm, "<h3>$1</h3>")
    .replace(/^# (.*)$/gm, "<h3>$1</h3>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><h3>/g, "<h3>")
    .replace(/<\/h3><\/p>/g, "</h3>")
    .replace(/\|[^\n]+\|/g, (row) => {
      if (/^\|?[\s|:-]+$/i.test(row.replace(/&amp;/g, "&"))) return "";
      return `<div class="ms-docs-table-row">${row}</div>`;
    });
}

function loadPolicy(id) {
  const fragPath = path.join(root, "scripts", `docs-legal-${id}.html`);
  let raw;
  if (fs.existsSync(fragPath)) {
    raw = fs.readFileSync(fragPath, "utf8");
  } else {
    raw = extractSection(read("legal.html"), id);
  }
  return raw
    .replace(/href="legal#/g, 'href="#')
    .replace(/class="ms-card ms-legal-article"/g, 'class="ms-legal-article"');
}

const privacy = loadPolicy("privacy");
const terms = loadPolicy("terms");
const refunds = loadPolicy("refunds");
const license = escapeHtml(read("LICENSE").trim());
const notice = escapeHtml(read("NOTICE").trim());
const thirdParty = mdLite(read("THIRD_PARTY_NOTICES.md").trim());

let product = read("scripts/docs-product-fragment.html");
product = product
  .replace("__NOTICE__", notice)
  .replace("__LICENSE__", license)
  .replace("__THIRD_PARTY__", thirdParty)
  .replace("__PRIVACY__", privacy)
  .replace("__TERMS__", terms)
  .replace("__REFUNDS__", refunds);

const sections = [
  ["#getting-started", "Getting started"],
  ["#what-is-moonrise", "What is Moonrise"],
  ["#how-it-works", "How Moonrise works"],
  ["#golden-rules", "Golden rules"],
  ["#get-paid", "How you get paid"],
  ["#finder", "Business Finder"],
  ["#ui", "Studio overview"],
  ["#builder-modes", "Builder modes"],
  ["#builder-editor", "Builder & Editor"],
  ["#website-price", "Website Price"],
  ["#contact-owner", "Contact Owner"],
  ["#editor-tools", "Editor tools"],
  ["#publish", "Publish & watermark"],
  ["#features", "Site features"],
  ["#contact-form", "Contact form"],
  ["#domains", "Custom domains"],
  ["#booking", "Booking"],
  ["#payments-widget", "Payment methods"],
  ["#quotes", "Quotes"],
  ["#maps", "Maps"],
  ["#reviews", "Reviews"],
  ["#socials", "Socials"],
  ["#messaging", "Messaging"],
  ["#ordering", "Ordering"],
  ["#newsletter", "Newsletter"],
  ["#subprocessors", "Subprocessors"],
  ["#security", "Security"],
  ["#licenses", "Licenses"],
  ["#policies", "Policies"],
  ["#privacy", "Privacy"],
  ["#terms", "Terms"],
  ["#refunds", "Refunds"],
  ["#tips", "Tips"],
  ["#support", "Help and support"],
];

const nav = sections
  .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
  .join("\n            ");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<style>
html.ms-boot body{visibility:hidden!important}
#ms-boot{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;align-content:center;gap:1.25rem;background:#ffffff;color:#232427;visibility:visible!important;opacity:1;transition:opacity .22s ease-out,visibility .22s linear}
#ms-boot.is-leaving{opacity:0;visibility:hidden;pointer-events:none}
#ms-boot p{margin:0;font:600 1.4rem/1 system-ui,sans-serif;letter-spacing:-.04em;opacity:0;animation:ms-boot-word .32s cubic-bezier(.22,1,.36,1) forwards}
#ms-boot .ms-boot-bar{width:9rem;height:2.75px;border-radius:99px;background:rgba(15,23,42,.1);overflow:hidden;opacity:0;animation:ms-boot-word .32s cubic-bezier(.22,1,.36,1) .04s forwards}
#ms-boot .ms-boot-bar span{display:block;height:100%;width:100%;border-radius:inherit;background:currentColor;transform:scaleX(0);transform-origin:left center;will-change:transform;transition:transform .2s cubic-bezier(.22,1,.36,1)}
@keyframes ms-boot-word{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){#ms-boot,#ms-boot p,#ms-boot .ms-boot-bar{transition:none!important;animation:none!important;opacity:1!important;transform:none!important}#ms-boot .ms-boot-bar span{transition:none!important}}
</style>
<script>
document.documentElement.classList.add("ms-boot");
(function(){
  try{if("scrollRestoration" in history)history.scrollRestoration="manual"}catch(e){}
  try{window.scrollTo(0,0)}catch(e){}
  var boot=document.createElement("div");
  boot.id="ms-boot";
  boot.setAttribute("role","progressbar");
  boot.setAttribute("aria-label","Loading");
  boot.innerHTML='<p>moonrise.</p><div class="ms-boot-bar" aria-hidden="true"><span></span></div>';
  document.documentElement.appendChild(boot);
  var bar=boot.querySelector(".ms-boot-bar span");
  var progress=0,ready=false,done=false,started=performance.now(),readyAt=0,minMs=180,maxMs=2500,reduce=false;
  try{reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
  function setProgress(p){progress=Math.max(0,Math.min(100,p));if(bar)bar.style.transform="scaleX("+(progress/100).toFixed(4)+")";}
  function finish(){if(done)return true;done=true;window.__msBootReleased=1;setProgress(100);var hide=function(){document.documentElement.classList.remove("ms-boot");document.documentElement.classList.add("ms-boot-done");var el=document.getElementById("ms-boot");if(el)el.remove();};if(reduce){hide();return true;}boot.classList.add("is-leaving");setTimeout(hide,220);return true;}
  function markReady(){if(ready||done)return;ready=true;readyAt=performance.now();}
  function tick(now){if(done)return;var elapsed=now-started;if(!ready){setProgress(Math.min(88,(elapsed/maxMs)*88));if(elapsed>=maxMs)markReady();}else{var settle=Math.max(0,minMs-(now-readyAt));setProgress(settle>0?94:100);if(settle<=0){finish();return;}}requestAnimationFrame(tick);}
  document.addEventListener("DOMContentLoaded",markReady);window.addEventListener("load",markReady);requestAnimationFrame(tick);setTimeout(function(){if(!done){markReady();finish();}},maxMs+minMs);
})();
</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <link rel="manifest" href="manifest.json">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Moonrise">
  <link rel="apple-touch-icon" href="assets/MoonriseLogo.png">
  <title>Docs - Moonrise</title>
  <meta name="description" content="Moonrise documentation: getting started, Studio UI, site features, domains, services, security, licenses, privacy, terms, and refunds.">
  <link rel="canonical" href="https://trymoonrise.com/docs">
  <link rel="stylesheet" href="css/fonts.css?v=20261028-selfhost">
  <link rel="stylesheet" href="css/studio.css?v=20261109-crown">
  <link rel="stylesheet" href="css/studio-ui.css?v=20261108-ink">
  <link rel="stylesheet" href="css/studio-mono.css?v=20261107-soft-radius">
  <link rel="stylesheet" href="css/cream-ink.css?v=20261108-icon-borderless">
  <link rel="stylesheet" href="css/studio-minimal.css?v=20261109-crown">
  <link rel="stylesheet" href="css/public-pages.css?v=20261108-ink">
  <link rel="stylesheet" href="css/docs.css?v=20261110-onpage2">
  <link rel="stylesheet" href="css/site-nav.css?v=20261109-line">
</head>
<body data-page="docs" class="ms-public-doc ms-docs-page" data-docs>
  <header class="ms-site-bar">
    <div class="ms-nav-row">
      <a class="ms-home-btn" href="/" aria-label="Moonrise home"><svg class="ms-nav-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a10 10 0 1 0 9.2 14.2 6.4 6.4 0 0 1-9.2-14.2z"/></svg><span>moonrise</span></a>
      <div class="ms-nav-end">
        <button class="ms-menu-btn" type="button" aria-expanded="false" aria-controls="ms-menu" aria-label="Open menu">
          <span class="ms-menu-label">Menu</span>
          <span class="ms-menu-bars" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    <nav class="ms-menu-screen" id="ms-menu" aria-label="Pages">
      <a href="/" style="--i:0">Home</a>
      <a href="login.html" style="--i:1">Start earning</a>
      <a href="download" style="--i:2">Download</a>
      <a href="orders" style="--i:3">Orders</a>
      <a href="ui-library" style="--i:4">UI Library</a>
      <a href="docs" style="--i:5" aria-current="page">Docs</a>
      <a href="contact" style="--i:6">Contact</a>
      <a href="report" style="--i:7">Report</a>
    </nav>
  </header>

  <div class="ms-docs-layout">
    <header class="ms-docs-hero">
      <h1 class="ms-doc-title">Docs.</h1>
      <p class="ms-doc-lead">Everything about Moonrise—product, features, security, licenses, and policies—in one place.</p>
    </header>
    <main class="ms-docs-main" id="main">
${product}
    </main>
    <aside class="ms-docs-aside">
      <nav class="ms-docs-onpage" aria-label="On this page">
        <h2>On this page</h2>
        <ol class="ms-docs-nav">
            ${nav}
        </ol>
      </nav>
    </aside>
  </div>

  <style>.visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>
  <script defer src="js/config.js?v=20261106-mono"></script>
  <script defer src="js/site-branding.js"></script>
  <script defer src="js/home-menu.js?v=20261109-menu-anim"></script>
  <script defer src="js/docs.js?v=20261110-onpage"></script>
</body>
</html>
`;

const out = path.join(root, "docs.html");
fs.writeFileSync(out, html, "utf8");
console.log("Wrote", out, `(${Math.round(html.length / 1024)} KB)`);
