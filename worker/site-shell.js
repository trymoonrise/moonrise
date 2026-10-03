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
  "headline": "one plain headline about THIS business",
  "lede": "one or two short sentences",
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
- The headline must describe the actual trade. No metaphors from another industry. A care home is not a gym. A plumber is not a restaurant.
- No "Welcome to", "Your trusted", or "Quality you can count on".
- Palette: five harmonious hex colors for this trade. ink on bg and ink on surface must be easy to read. Accent is a restrained brand color, not neon and not safety orange.
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
    headline: name,
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
    headline: cleanText(data.headline, 72) || base.headline,
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
  const p = copy.palette;

  const services = copy.services
    .map((item, index) => {
      const photo = servicePhotos[index] || hero;
      return `<article class="card">
        <img src="${esc(photo)}" alt="${esc(name + " - " + item.title)}" width="800" height="520">
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
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
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
  <link rel="stylesheet" href="https://trymoonrise.com/css/fonts.css?v=20261003-fonts">
  <style>
    :root {
      --bg: ${p.bg};
      --surface: ${p.surface};
      --ink: ${p.ink};
      --muted: ${p.muted};
      --accent: ${p.accent};
      --accent-soft: color-mix(in srgb, ${p.accent} 14%, ${p.surface});
      --border: color-mix(in srgb, ${p.ink} 12%, transparent);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 18px;
      --shadow: 0 18px 40px rgba(16, 18, 22, 0.08);
      --font-display: "Fraunces", Georgia, serif;
      --font-body: "Sora", "Segoe UI", sans-serif;
      --container: min(1120px, calc(100% - 2rem));
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font-body);
      font-size: 1rem;
      line-height: 1.55;
    }
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
    a { color: inherit; }
    .wrap { width: var(--container); margin: 0 auto; }
    .bar { position: sticky; top: 0; z-index: 20; padding: 0.85rem 0 0; }
    .dock {
      width: min(1120px, calc(100% - 1.25rem));
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.7rem 0.8rem 0.7rem 1.1rem;
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      border: 1px solid var(--border);
      border-radius: 999px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
    }
    .brand { font-family: var(--font-display); font-weight: 650; text-decoration: none; letter-spacing: -0.03em; }
    .nav-links { display: flex; gap: 1rem; margin-left: auto; }
    .nav-links a { text-decoration: none; color: var(--muted); font-size: 0.92rem; font-weight: 500; }
    .nav-links a:hover { color: var(--ink); }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0.75rem 1.15rem;
      border-radius: var(--radius-md);
      text-decoration: none;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .btn-solid { background: var(--ink); color: var(--bg); }
    .btn-ghost { background: transparent; color: #fff; border-color: rgba(255,255,255,0.55); }
    .nav-cta { background: var(--ink); color: var(--bg); border-radius: 999px; padding: 0.7rem 1rem; text-decoration: none; font-weight: 600; font-size: 0.92rem; }
    .hero { position: relative; min-height: 100svh; color: #fff; background: #121418; }
    .hero-stage {
      position: absolute;
      inset: 0;
      background: #121418 center/cover no-repeat;
    }
    .hero-stage::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(10,12,16,0.78) 0%, rgba(10,12,16,0.42) 48%, rgba(10,12,16,0.2) 100%),
        linear-gradient(180deg, rgba(10,12,16,0.15), rgba(10,12,16,0.45));
    }
    .hero-content {
      position: relative;
      z-index: 1;
      width: var(--container);
      margin: 0 auto;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 8rem 0 4.5rem;
    }
    .eyebrow { margin: 0 0 0.8rem; letter-spacing: 0.16em; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; }
    .hero h1 {
      margin: 0;
      max-width: 12ch;
      font-family: var(--font-display);
      font-size: clamp(3.2rem, 7vw, 6.4rem);
      font-weight: 560;
      letter-spacing: -0.045em;
      line-height: 0.92;
    }
    .lede { max-width: 36rem; margin: 1.1rem 0 0; font-size: 1.05rem; color: rgba(255,255,255,0.88); }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 1.6rem; }
    .band { padding: 1.1rem 0; border-bottom: 1px solid var(--border); background: var(--surface); }
    .band ul { display: flex; flex-wrap: wrap; gap: 0.7rem 1.5rem; margin: 0; padding: 0; list-style: none; font-weight: 600; }
    section { padding: clamp(3.5rem, 7vw, 6rem) 0; }
    .section-head { max-width: 40rem; margin-bottom: 2rem; }
    .section-head .eyebrow { color: var(--accent); }
    h2 { margin: 0; font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3.4rem); letter-spacing: -0.04em; line-height: 1.02; font-weight: 560; }
    .section-lead { margin: 0.8rem 0 0; color: var(--muted); }
    .grid-3, .grid-2 { display: grid; gap: 1rem; }
    .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-2 { grid-template-columns: 1.05fr 0.95fr; align-items: center; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow); }
    .card img { aspect-ratio: 16/10; }
    .card-copy { padding: 1.1rem 1.15rem 1.25rem; }
    .card h3 { margin: 0 0 0.35rem; font-size: 1.15rem; letter-spacing: -0.02em; }
    .card p, .about-copy p, .faq p { margin: 0; color: var(--muted); }
    .about-media { border-radius: var(--radius-lg); overflow: hidden; min-height: 360px; aspect-ratio: 4/5; }
    .about-copy h2 { margin-bottom: 0.9rem; }
    .gallery { display: grid; grid-template-columns: 1.3fr 1fr; grid-template-rows: 240px 240px; gap: 0.75rem; }
    .gallery img { border-radius: var(--radius-md); height: 100%; }
    .gallery img:first-child { grid-row: 1 / span 2; }
    .faq { border-top: 1px solid var(--border); padding: 0.95rem 0; }
    .faq summary { cursor: pointer; font-weight: 600; }
    .faq p { margin-top: 0.55rem; }
    .contact { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 2rem; align-items: start; }
    .facts { display: grid; gap: 0.9rem; }
    .facts span { display: block; color: var(--muted); font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; }
    .facts a { font-weight: 600; text-decoration: none; }
    form { display: grid; gap: 0.85rem; }
    label { display: grid; gap: 0.35rem; font-weight: 600; font-size: 0.92rem; }
    input, textarea {
      width: 100%;
      padding: 0.85rem 0.9rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--ink);
      font: inherit;
    }
    textarea { min-height: 140px; resize: vertical; }
    .contact .btn-solid { border: 0; cursor: pointer; }
    footer { background: var(--ink); color: var(--bg); padding: 2rem 0; }
    footer .wrap { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    footer a { color: inherit; }
    @media (max-width: 860px) {
      .grid-3, .grid-2, .contact, .gallery { grid-template-columns: 1fr; }
      .gallery { grid-template-rows: none; }
      .gallery img:first-child { grid-row: auto; min-height: 220px; }
      .hero-content { padding-top: 7rem; }
      .dock { border-radius: 22px; flex-wrap: wrap; }
      .nav-links { width: 100%; order: 3; }
    }
  </style>
</head>
<body>
  <header class="bar">
    <nav class="dock nav" aria-label="Primary">
      <a class="brand" href="#top">${esc(name)}</a>
      <div class="nav-links">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#gallery">Gallery</a>
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact</a>
      </div>
      <a class="nav-cta" href="#contact">${esc(copy.primaryCta)}</a>
    </nav>
  </header>
  <main id="top">
    <section class="hero" aria-label="Introduction">
      <div class="hero-stage" style="background-image:url('${esc(hero)}')"></div>
      <div class="hero-content">
        <p class="eyebrow">${esc(copy.eyebrow)}</p>
        <h1>${esc(copy.headline)}</h1>
        <p class="lede">${esc(copy.lede)}</p>
        <div class="hero-actions">
          <a class="btn btn-solid" href="#contact">${esc(copy.primaryCta)}</a>
          <a class="btn btn-ghost" href="#services">${esc(copy.secondaryCta)}</a>
        </div>
      </div>
    </section>
    <div class="band">
      <div class="wrap"><ul>${highlights}</ul></div>
    </div>
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
