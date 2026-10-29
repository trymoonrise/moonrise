/**
 * Hand-built business page.
 * The layout, type, and sections are fixed. The model only supplies copy and a palette.
 * Photos always come from the trade stock pack, never from the model.
 */
"use strict";

const { contrastRatio, parseHexColor, buildBusinessBrief } = require("./generate-prompt");

const COPY_SYSTEM_PROMPT = `You write the words and color palette for a local business website. You do not design the page.

Return ONLY valid JSON. No markdown. No HTML.

{
  "palette": { "bg": "#hex", "surface": "#hex", "ink": "#hex", "muted": "#hex", "accent": "#hex" },
  "eyebrow": "short uppercase label, category plus city when known",
  "headline": "2 or 3 words. A hook, not a sentence. Do not include the business name or the city",
  "lede": "one short sentence used later on the page, not in the hero",
  "primaryCta": "2-4 words",
  "secondaryCta": "2-4 words",
  "servicesTitle": "short section title",
  "servicesLead": "one sentence",
  "services": [
    { "title": "service name", "text": "one sentence" },
    { "title": "service name", "text": "one sentence" },
    { "title": "service name", "text": "one sentence" }
  ],
  "aboutTitle": "short title",
  "aboutBody": "two or three short sentences",
  "highlights": ["short fact", "short fact", "short fact"],
  "faqs": [
    { "q": "question a customer would ask", "a": "answer from the facts only" },
    { "q": "question", "a": "answer" },
    { "q": "question", "a": "answer" }
  ],
  "contactTitle": "short title",
  "contactLead": "one sentence"
}

Rules:
- Use only the business facts you are given. Do not invent phone numbers, addresses, awards, years in business, licenses, prices, or review counts.
- If a fact is missing, speak generally ("Call to confirm") instead of making one up.
- The headline is 2 or 3 words. No business name, no city, no period. A barber shop can say "Fresh cuts". A plumber can say "Same-day repairs".
- No "Welcome to", "Your trusted", or "Quality you can count on".
- Palette is unused. The page is black, white, and gray. Do not invent a brand color.
- Keep every string short enough to fit a designed layout.`;

function buildCopyUserPrompt(ctx, plan) {
  const palette = plan?.palette || {};
  return [
    "## Business facts (the only source of truth)",
    buildBusinessBrief(ctx),
    "",
    "## Suggested palette (adjust only if a better trade fit stays readable)",
    `bg=${palette.bg || ""} surface=${palette.surface || ""} ink=${palette.ink || ""} muted=${palette.muted || ""} accent=${palette.accent || ""}`,
    `Voice: ${plan?.voice || "clear and local"}`,
    "",
    "Return the JSON object only.",
  ].join("\n");
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanText(value, max) {
  const text = String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u2014/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
  if (!max || text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "").trim();
}

function hexOr(value, fallback) {
  const raw = String(value || "").trim();
  const parsed = parseHexColor(raw);
  return parsed ? parsed.hex : fallback;
}

function readablePair(ink, bg, fallbackInk) {
  const inkColor = parseHexColor(ink);
  const bgColor = parseHexColor(bg);
  if (!inkColor || !bgColor) return fallbackInk;
  if (contrastRatio(inkColor, bgColor) >= 4.5) return inkColor.hex;
  return fallbackInk;
}

function listOf(value, mapItem, min, max) {
  const rows = Array.isArray(value) ? value : [];
  const out = [];
  for (const row of rows) {
    const item = mapItem(row);
    if (item) out.push(item);
    if (out.length >= max) break;
  }
  return out.slice(0, max).length >= min ? out.slice(0, max) : out;
}

function fallbackSiteCopy(ctx, plan) {
  const name = cleanText(ctx?.businessName, 80) || "Local business";
  const category = cleanText(ctx?.category, 60) || "Local service";
  const place = guessPlace(ctx);
  const description = cleanText(ctx?.description, 280);
  const palette = plan?.palette || {};
  return {
    palette: {
      bg: hexOr(palette.bg, "#f6f5f2"),
      surface: hexOr(palette.surface, "#ffffff"),
      ink: hexOr(palette.ink, "#161616"),
      muted: hexOr(palette.muted, "#5e6570"),
      accent: hexOr(palette.accent, "#1f4b3a"),
    },
    eyebrow: place ? `${category} in ${place}` : category,
    headline: shortHeadline("", name, category),
    lede: description || `${name} helps local customers with ${category.toLowerCase()}.`,
    primaryCta: "Get in touch",
    secondaryCta: "See services",
    servicesTitle: "Services",
    servicesLead: `What ${name} can help with.`,
    services: [
      { title: category, text: description || `Ask ${name} about ${category.toLowerCase()}.` },
      { title: "A visit", text: "Call or send a note and we will help you plan the next step." },
      { title: "Local support", text: place ? `Serving ${place} and the surrounding area.` : "Serving the local area." },
    ],
    aboutTitle: `About ${name}`,
    aboutBody: description || `${name} is a local ${category.toLowerCase()} business.`,
    highlights: [
      category,
      place ? `Based in ${place}` : "Locally owned",
      ctx?.phone ? "Call to talk" : "Message us anytime",
    ],
    faqs: [
      {
        q: `How do I reach ${name}?`,
        a: ctx?.phone ? `Call ${ctx.phone}.` : "Use the contact form and we will reply.",
      },
      {
        q: "Where are you located?",
        a: ctx?.address ? ctx.address : "Send a message and we will share directions.",
      },
      {
        q: "What should I expect?",
        a: description || `We focus on ${category.toLowerCase()} and keep the process straightforward.`,
      },
    ],
    contactTitle: "Contact",
    contactLead: `Tell ${name} what you need.`,
  };
}

function normalizeSiteCopy(raw, ctx, plan) {
  const base = fallbackSiteCopy(ctx, plan);
  const data = raw && typeof raw === "object" ? raw : {};
  const paletteIn = data.palette && typeof data.palette === "object" ? data.palette : {};
  const palette = {
    bg: hexOr(paletteIn.bg, base.palette.bg),
    surface: hexOr(paletteIn.surface, base.palette.surface),
    ink: hexOr(paletteIn.ink, base.palette.ink),
    muted: hexOr(paletteIn.muted, base.palette.muted),
    accent: hexOr(paletteIn.accent, base.palette.accent),
  };
  palette.ink = readablePair(palette.ink, palette.bg, readablePair(palette.ink, palette.surface, base.palette.ink));
  palette.ink = readablePair(palette.ink, palette.surface, "#161616");

  const services = listOf(
    data.services,
    (row) => {
      const title = cleanText(row?.title, 48);
      const text = cleanText(row?.text, 160);
      if (!title || !text) return null;
      return { title, text };
    },
    3,
    3
  );
  const highlights = listOf(data.highlights, (row) => {
    const text = cleanText(row, 48);
    return text || null;
  }, 3, 3).map((row) => (typeof row === "string" ? row : row));
  const faqs = listOf(
    data.faqs,
    (row) => {
      const q = cleanText(row?.q, 90);
      const a = cleanText(row?.a, 220);
      if (!q || !a) return null;
      return { q, a };
    },
    3,
    4
  );

  return {
    palette,
    eyebrow: cleanText(data.eyebrow, 56) || base.eyebrow,
    headline: shortHeadline(data.headline, ctx?.businessName, ctx?.category) || base.headline,
    lede: cleanText(data.lede, 180) || base.lede,
    primaryCta: cleanText(data.primaryCta, 24) || base.primaryCta,
    secondaryCta: cleanText(data.secondaryCta, 24) || base.secondaryCta,
    servicesTitle: cleanText(data.servicesTitle, 40) || base.servicesTitle,
    servicesLead: cleanText(data.servicesLead, 140) || base.servicesLead,
    services: services.length >= 3 ? services : base.services,
    aboutTitle: cleanText(data.aboutTitle, 56) || base.aboutTitle,
    aboutBody: cleanText(data.aboutBody, 420) || base.aboutBody,
    highlights: highlights.length >= 3 ? highlights.slice(0, 3) : base.highlights,
    faqs: faqs.length >= 3 ? faqs : base.faqs,
    contactTitle: cleanText(data.contactTitle, 40) || base.contactTitle,
    contactLead: cleanText(data.contactLead, 140) || base.contactLead,
  };
}

function shortHeadline(value, name, category) {
  let text = cleanText(value, 80);
  const business = cleanText(name, 80);
  if (business) {
    const escaped = business.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escaped, "ig"), " ");
  }
  text = text.replace(/\b(at|in|for|the|a|an)\b/gi, " ").replace(/[.,:;]+/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).slice(0, 3);
  if (words.length) return words.join(" ");
  const trade = cleanText(category, 28);
  return trade || "Local service";
}

function guessPlace(ctx) {
  const address = String(ctx?.address || "");
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return parts[parts.length - 2].replace(/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?$/, "").trim();
  }
  if (parts.length === 2) return parts[1].replace(/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?$/, "").trim();
  return "";
}

function parseCopyJson(raw) {
  let text = String(raw || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (match) text = match[0];
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Copy JSON was not an object");
  return data;
}

function pickVariant(name, salt, options) {
  const text = `${name || ""}:${salt}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) >>> 0;
  return options[hash % options.length];
}

function styleFamily(name) {
  return pickVariant(name, "hero", ["paper", "split", "quiet", "stone"]);
}

function componentKit(name) {
  return {
    hero: styleFamily(name),
    nav: pickVariant(name, "nav", ["bar", "center", "quiet"]),
    services: pickVariant(name, "svc", ["tiles", "list", "feature"]),
    gallery: pickVariant(name, "gal", ["mosaic", "row", "stack"]),
    notes: pickVariant(name, "notes", ["line", "cards"]),
    about: pickVariant(name, "about", ["side", "flip", "band"]),
    faq: pickVariant(name, "faq", ["split", "wide"]),
    contact: pickVariant(name, "contact", ["split", "stack", "flip"]),
    footer: pickVariant(name, "foot", ["bar", "stack", "center"]),
  };
}

function renderBusinessSite(ctx, copy, media) {
  const name = cleanText(ctx?.businessName, 80) || "Local business";
  const phone = cleanText(ctx?.phone, 40);
  const phoneHref = phone.replace(/[^\d+]/g, "");
  const address = cleanText(ctx?.address, 160);
  const hours = cleanText(ctx?.hours, 120);
  const maps = String(ctx?.mapsUrl || "").trim();
  const mapsOk = /^https?:\/\//i.test(maps) ? maps : "";
  const img = media?.images || {};
  const hero = img.hero || "";
  const about = img.about || hero;
  const servicePhotos = [img.service1 || hero, img.service2 || about, img.service3 || hero];
  const gallery = [img.gallery1, img.gallery2, img.gallery3, img.gallery4].filter(Boolean);
  const kit = componentKit(name);
  const family = kit.hero;

  const services = copy.services
    .map((item, index) => {
      const photo = servicePhotos[index] || hero;
      return `<article class="card">
        <img src="${esc(photo)}" alt="${esc(name + " - " + item.title)}" width="800" height="1060">
        <div class="card-copy">
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
        </div>
      </article>`;
    })
    .join("");

  const highlights = copy.highlights.map((item) => `<li>${esc(item)}</li>`).join("");
  const faqs = copy.faqs
    .map(
      (item) => `<details class="faq">
        <summary class="faq-q">${esc(item.q)}</summary>
        <div class="faq-a"><div class="faq-panel"><p>${esc(item.a)}</p></div></div>
      </details>`
    )
    .join("");
  const galleryHtml = gallery
    .map(
      (url, index) =>
        `<img src="${esc(url)}" alt="${esc(name + " photo " + (index + 1))}" width="900" height="680">`
    )
    .join("");

  const facts = [
    phone ? `<p><span>Phone</span><a href="tel:${esc(phoneHref)}">${esc(phone)}</a></p>` : "",
    address ? `<p><span>Address</span>${esc(address)}</p>` : "",
    hours ? `<p><span>Hours</span>${esc(hours)}</p>` : "",
    mapsOk ? `<p><span>Map</span><a href="${esc(mapsOk)}" target="_blank" rel="noopener noreferrer">Directions</a></p>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(name)}</title>
<style>
    :root {
      --bg: #ffffff;
      --ink: #1d1d1f;
      --muted: #6e6e73;
      --line: #d2d2d7;
      --soft: #f5f5f7;
      --font: "Segoe UI", system-ui, -apple-system, sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      font-size: 1rem;
      font-weight: 400;
      line-height: 1.5;
      letter-spacing: -0.011em;
    }
    body.is-stone { background: var(--soft); }
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
    a { color: inherit; }
    .wrap { width: min(1120px, calc(100% - 3rem)); margin: 0 auto; }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      gap: 1rem 1.4rem;
      min-height: 4.75rem;
      padding: 0.75rem 1.6rem;
      border-bottom: 1px solid rgb(0 0 0 / 8%);
      background: rgb(255 255 255 / 92%);
      backdrop-filter: saturate(180%) blur(16px);
    }
    .brand { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.03em; text-decoration: none; }
    .nav-links { display: flex; flex-wrap: wrap; gap: 0.45rem 1.2rem; margin-left: auto; }
    .nav-links a { text-decoration: none; font-size: 0.98rem; font-weight: 500; }
    .nav-cta, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.5rem;
      padding: 0 1.15rem;
      border: 0;
      border-radius: 980px;
      background: var(--ink);
      color: #fff;
      font: inherit;
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
    }
    .nav-cta { margin-left: 0.2rem; }
    .hero { position: relative; min-height: 100svh; color: #fff; background: #070708; overflow: hidden; }
    .hero-stage { position: absolute; inset: 0; background: #070708 center/cover no-repeat; }
    .hero-stage::after { content: ""; position: absolute; inset: 0; background: linear-gradient(transparent 46%, rgb(0 0 0 / 58%)); }
    .hero-content {
      position: relative;
      z-index: 1;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 6.5rem 1.5rem 4rem;
      text-align: center;
    }
    .eyebrow { margin: 0; color: rgb(255 255 255 / 78%); font-size: 0.78rem; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; }
    .hero h1 { margin: 0; max-width: 14ch; font-size: clamp(2.8rem, 7vw, 6.2rem); font-weight: 600; letter-spacing: -0.05em; line-height: 0.92; }
    .lede { max-width: 34rem; margin: 0.7rem 0 0; color: rgb(255 255 255 / 78%); font-size: 1.02rem; }
    .hero-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.8rem 1.1rem; margin-top: 1.2rem; align-items: center; }
    .hero .btn-solid { background: #fff; color: var(--ink); }
    .btn-ghost { background: transparent; color: #fff; text-decoration: underline; text-underline-offset: 0.18em; }
    .notes { padding: 1.35rem 0; background: #fff; border-bottom: 1px solid var(--line); }
    .notes ul { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem 1.6rem; margin: 0; padding: 0; list-style: none; color: var(--muted); }
    section { padding: clamp(4rem, 8vw, 6.5rem) 0; }
    .section-head { max-width: 36rem; margin: 0 auto 2.4rem; text-align: center; }
    .section-head .eyebrow, .about-copy .eyebrow, .contact .eyebrow { color: var(--muted); }
    h2 { margin: 0.35rem 0 0; font-size: clamp(2.1rem, 4.4vw, 3.4rem); font-weight: 600; letter-spacing: -0.045em; line-height: 1.02; }
    .section-lead, .about-copy p, .faq p, .card p { margin: 0.7rem 0 0; color: var(--muted); }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .card { position: relative; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 1.2rem; color: #fff; }
    .card img { position: absolute; inset: 0; }
    .card-copy { position: absolute; left: 0; right: 0; bottom: 0; padding: 4rem 1rem 1rem; background: linear-gradient(transparent, rgb(0 0 0 / 78%)); }
    .card h3 { margin: 0; font-size: 1.35rem; font-weight: 600; letter-spacing: -0.03em; }
    .card p { color: rgb(255 255 255 / 82%); }
    #about { background: var(--soft); }
    .grid-2 { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 2.4rem; align-items: center; }
    .about-media { overflow: hidden; border-radius: 1.2rem; aspect-ratio: 4 / 5; }
    .gallery { display: grid; grid-template-columns: 1.4fr 1fr; gap: 0.8rem; }
    .gallery img { height: 100%; min-height: 220px; border-radius: 1.2rem; }
    .gallery img:first-child { grid-row: span 2; min-height: 460px; }
    #faq { background: #fff; }
    .faq { border-top: 1px solid var(--line); padding: 0.95rem 0; }
    .faq-q {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.15rem 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      font-weight: 600;
      text-align: left;
      list-style: none;
      cursor: pointer;
    }
    .faq-q::-webkit-details-marker { display: none; }
    .faq-q::after {
      content: "";
      width: 0.45rem;
      height: 0.45rem;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg) translateY(-0.1rem);
      transition: transform 0.35s ease;
      flex: none;
    }
    .faq[open] .faq-q::after { transform: rotate(225deg) translateY(-0.05rem); }
    .faq-a { display: grid !important; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
    .faq[open] .faq-a { grid-template-rows: 1fr; }
    .faq-panel { min-height: 0; overflow: hidden; }
    @media (prefers-reduced-motion: reduce) {
      .faq-a, .faq-q::after { transition: none; }
    }
    .contact { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 2.5rem; align-items: start; }
    .facts { display: grid; gap: 1rem; margin-top: 1.4rem; }
    .facts span { display: block; color: var(--muted); font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .facts a { font-weight: 600; text-decoration: none; }
    form { display: grid; gap: 0.85rem; padding: 1.25rem; border-radius: 1.2rem; background: var(--soft); }
    label { display: grid; gap: 0.35rem; font-size: 0.92rem; font-weight: 600; }
    input, textarea {
      width: 100%;
      padding: 0.85rem 0.95rem;
      border: 1px solid var(--line);
      border-radius: 0.9rem;
      background: #fff;
      color: var(--ink);
      font: inherit;
    }
    textarea { min-height: 140px; resize: vertical; }
    footer { background: #000; color: #a1a1a6; padding: 2.4rem 0; }
    footer .wrap { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    footer strong { color: #fff; }
    body.is-split .hero { display: grid; grid-template-columns: 1fr 1fr; min-height: 100svh; color: var(--ink); background: #fff; }
    body.is-split .hero-stage { position: relative; inset: auto; min-height: 100svh; }
    body.is-split .hero-stage::after { display: none; }
    body.is-split .hero-content { min-height: 100svh; align-items: flex-start; text-align: left; padding: 6rem 6vw; }
    body.is-split .eyebrow, body.is-split .lede { color: var(--muted); }
    body.is-split .hero .btn-solid { background: var(--ink); color: #fff; }
    body.is-split .btn-ghost { color: var(--ink); }
    body.is-quiet .hero { min-height: 0; color: var(--ink); background: #fff; }
    body.is-quiet .hero-stage { display: none; }
    body.is-quiet .hero-content { min-height: 0; padding: 5.5rem 1.5rem 2rem; }
    body.is-quiet .eyebrow, body.is-quiet .lede { color: var(--muted); }
    body.is-quiet .hero .btn-solid { background: var(--ink); color: #fff; }
    body.is-quiet .btn-ghost { color: var(--ink); }
    body.is-quiet .hero-photo { display: block; width: min(1120px, calc(100% - 3rem)); height: min(68vh, 640px); margin: 0 auto 0; border-radius: 1.2rem; object-fit: cover; }
    .hero-photo { display: none; }
    body.is-stone .hero-content { align-items: flex-start; text-align: left; justify-content: flex-end; padding-bottom: 4.5rem; }
    body.nav-center .topbar { flex-wrap: wrap; justify-content: center; }
    body.nav-center .brand { width: 100%; text-align: center; }
    body.nav-center .nav-links { margin-left: 0; justify-content: center; }
    body.nav-quiet .nav-cta { background: transparent; color: var(--ink); padding: 0; min-height: 0; border-radius: 0; text-decoration: underline; text-underline-offset: 0.18em; }
    body.svc-list .grid-3 { display: block; counter-reset: svc; }
    body.svc-list .card { aspect-ratio: auto; display: grid; grid-template-columns: 4.5rem 1fr; align-items: center; border-radius: 0; color: var(--ink); background: transparent; border-top: 1px solid var(--line); counter-increment: svc; }
    body.svc-list .card img { display: none; }
    body.svc-list .card-copy { position: static; padding: 1.15rem 0; background: none; }
    body.svc-list .card h3::before { content: counter(svc, decimal-leading-zero); display: block; margin-bottom: 0.2rem; color: var(--muted); font-size: 0.78rem; font-weight: 500; letter-spacing: 0.08em; }
    body.svc-list .card p { color: var(--muted); }
    body.svc-feature .grid-3 { grid-template-columns: 1.15fr 0.85fr; }
    body.svc-feature .card:first-child { grid-row: span 2; }
    body.svc-feature .card:not(:first-child) { aspect-ratio: 16 / 10; }
    body.gal-row .gallery { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    body.gal-row .gallery img, body.gal-row .gallery img:first-child { grid-row: auto; min-height: 220px; aspect-ratio: 3 / 4; }
    body.gal-stack .gallery { grid-template-columns: 1fr 1fr; }
    body.gal-stack .gallery img:first-child { grid-column: 1 / -1; grid-row: auto; min-height: 380px; }
    body.notes-cards .notes ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; }
    body.notes-cards .notes li { padding: 1.15rem 1rem; border-radius: 1rem; background: var(--soft); color: var(--ink); text-align: center; }
    body.about-flip .about-media { order: 2; }
    body.about-band .grid-2 { grid-template-columns: 1fr; }
    body.about-band .about-media { aspect-ratio: 16 / 7; max-height: 440px; }
    body.faq-wide #faq .grid-2 { grid-template-columns: 1fr; max-width: 40rem; }
    body.contact-stack .contact, body.contact-flip .contact { grid-template-columns: minmax(0, 40rem); }
    body.contact-flip form { order: -1; }
    body.foot-stack footer .wrap, body.foot-center footer .wrap { flex-direction: column; align-items: flex-start; }
    body.foot-center footer .wrap { align-items: center; text-align: center; }
    @media (max-width: 860px) {
      .wrap { width: min(1120px, calc(100% - 2rem)); }
      .topbar { flex-wrap: wrap; align-items: flex-start; padding: 0.9rem 1rem; }
      .nav-links { width: 100%; margin-left: 0; }
      .grid-3, .grid-2, .contact, .gallery, body.is-split .hero, body.svc-feature .grid-3, body.gal-row .gallery, body.gal-stack .gallery, body.notes-cards .notes ul { grid-template-columns: 1fr; }
      body.svc-feature .card:first-child, body.gal-stack .gallery img:first-child { grid-row: auto; grid-column: auto; }
      .gallery img:first-child { grid-row: auto; min-height: 240px; }
      body.is-split .hero-stage { min-height: 58vw; }
      body.is-split .hero-content { min-height: 0; padding: 2.5rem 1.25rem 2rem; }
    }
  </style>
</head>
<body class="is-${family} nav-${kit.nav} svc-${kit.services} gal-${kit.gallery} notes-${kit.notes} about-${kit.about} faq-${kit.faq} contact-${kit.contact} foot-${kit.footer}">
  <header class="topbar">
    <a class="brand" href="#top">${esc(name)}</a>
    <nav class="nav-links" aria-label="Primary">
      <a href="#services">Services</a>
      <a href="#about">About</a>
      <a href="#gallery">Gallery</a>
      <a href="#faq">FAQ</a>
      <a href="#contact">Contact</a>
    </nav>
    <a class="nav-cta" href="#contact">${esc(copy.primaryCta)}</a>
  </header>
  <main id="top">
    <section class="hero" aria-label="Introduction">
      <div class="hero-stage" style="background-image:url('${esc(hero)}')"></div>
      <div class="hero-content">
        <h1>${esc(copy.headline)}</h1>
        <div class="hero-actions">
          <a class="btn btn-solid" href="#contact">${esc(copy.primaryCta)}</a>
        </div>
      </div>
    </section>
    <img class="hero-photo" src="${esc(hero)}" alt="">
    <section class="notes" aria-label="Highlights">
      <div class="wrap"><ul>${highlights}</ul></div>
    </section>
    <section id="services">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Services</p>
          <h2>${esc(copy.servicesTitle)}</h2>
          <p class="section-lead">${esc(copy.servicesLead)}</p>
        </div>
        <div class="grid-3">${services}</div>
      </div>
    </section>
    <section id="about">
      <div class="wrap grid-2">
        <div class="about-media"><img src="${esc(about)}" alt="${esc(name)}" width="900" height="1120"></div>
        <div class="about-copy">
          <p class="eyebrow">About</p>
          <h2>${esc(copy.aboutTitle)}</h2>
          <p>${esc(copy.aboutBody)}</p>
        </div>
      </div>
    </section>
    <section id="gallery">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Gallery</p>
          <h2>A closer look</h2>
        </div>
        <div class="gallery">${galleryHtml}</div>
      </div>
    </section>
    <section id="faq">
      <div class="wrap grid-2">
        <div class="section-head">
          <p class="eyebrow">FAQ</p>
          <h2>Questions</h2>
        </div>
        <div>${faqs}</div>
      </div>
    </section>
    <section id="contact">
      <div class="wrap contact">
        <div>
          <p class="eyebrow">Contact</p>
          <h2>${esc(copy.contactTitle)}</h2>
          <p class="section-lead">${esc(copy.contactLead)}</p>
          <div class="facts">${facts}</div>
        </div>
        <form method="post" action="#">
          <label>Name<input name="name" type="text" autocomplete="name" required placeholder="Your name"></label>
          <label>Phone number<input name="phone" type="tel" autocomplete="tel" required placeholder="(555) 123-4567"></label>
          <label>How can we help?<textarea name="message" required placeholder="Tell us what you need"></textarea></label>
          <button class="btn btn-solid" type="submit">Send message</button>
        </form>
      </div>
    </section>
  </main>
  <footer>
    <div class="wrap">
      <strong>${esc(name)}</strong>
      <span>${esc([address, phone].filter(Boolean).join(" · "))}</span>
    </div>
  </footer>
</body>
</html>`;
}

module.exports = {
  COPY_SYSTEM_PROMPT,
  buildCopyUserPrompt,
  fallbackSiteCopy,
  normalizeSiteCopy,
  parseCopyJson,
  renderBusinessSite,
};
