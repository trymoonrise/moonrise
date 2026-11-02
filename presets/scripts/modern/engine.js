"use strict";

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "..", "presets");

const FAMILIES = {
  editorial: {
    mood: "editorial, premium, quiet",
    fonts:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,640&family=Manrope:wght@400;500;600;700&display=swap",
    root: `:root{--bg:#f3efe7;--surface:#fffcf8;--ink:#1b1814;--muted:#5e574e;--accent:#1b1814;--on:#f6f3ec;--line:rgba(27,24,20,.14);--r:14px;--sh:0 18px 40px rgba(27,24,20,.08);--d:"Fraunces",Georgia,serif;--s:"Manrope",sans-serif;--max:1120px}`,
  },
  studio: {
    mood: "bold, dark, contrast",
    fonts:
      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap",
    root: `:root{--bg:#101114;--surface:#181b22;--ink:#f5f6f8;--muted:#b7bcc7;--accent:#f5f6f8;--on:#121318;--line:rgba(245,246,248,.16);--r:12px;--sh:0 22px 50px rgba(0,0,0,.35);--d:"Syne",sans-serif;--s:"Outfit",sans-serif;--max:1120px}body{color-scheme:dark}`,
  },
  soft: {
    mood: "warm, calm, gentle",
    fonts:
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap",
    root: `:root{--bg:#f6f1ea;--surface:#fff;--ink:#2a241f;--muted:#6f655c;--accent:#6e3824;--on:#fffaf6;--line:rgba(42,36,31,.12);--r:18px;--sh:0 16px 36px rgba(90,52,32,.08);--d:"Newsreader",Georgia,serif;--s:"Figtree",sans-serif;--max:1080px}`,
  },
  sharp: {
    mood: "sharp, crisp, linear",
    fonts:
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap",
    root: `:root{--bg:#f7f7f6;--surface:#fff;--ink:#111;--muted:#4f4f4f;--accent:#111;--on:#f7f7f6;--line:#e4e4e2;--r:6px;--sh:0 1px 0 var(--line);--d:"Instrument Sans",sans-serif;--s:"Instrument Sans",sans-serif;--max:1160px}`,
  },
};

const CORE = `*{box-sizing:border-box}html{font-size:16px}body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.5 var(--s);-webkit-font-smoothing:antialiased}img,video{max-width:100%;display:block;height:auto}a{color:inherit;text-decoration:none}button,input,textarea,select{font:inherit;color:inherit}button{cursor:pointer}h1,h2,h3,p{margin:0}h1,h2,.brand{font-family:var(--d);font-weight:600;letter-spacing:-.03em;line-height:1.04}h1{font-size:clamp(2.5rem,6vw,4.8rem)}h2{font-size:clamp(1.8rem,3vw,2.7rem)}:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.w{width:min(var(--max),calc(100% - 40px));margin-inline:auto}.ey{font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:700}.lede{color:var(--muted);max-width:38rem}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 16px;border-radius:var(--r);border:1px solid transparent;background:var(--accent);color:var(--on);font-weight:700}.gh{background:transparent;color:var(--ink);border-color:var(--line)}.btn[disabled]{opacity:.45;cursor:not-allowed}.fld{display:grid;gap:6px;font-weight:650;font-size:.95rem}.fld input,.fld textarea,.fld select{width:100%;min-height:48px;padding:10px 12px;border:1px solid var(--line);border-radius:calc(var(--r) - 4px);background:var(--surface)}.fld textarea{min-height:120px;resize:vertical}.hint{color:var(--muted);font-weight:500;font-size:.85rem}.g2{display:grid;grid-template-columns:1fr 1fr;gap:22px}.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.block{padding:72px 0}@media(max-width:800px){.g2,.g3{grid-template-columns:1fr}.block{padding:48px 0}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

const PHOTOS = [
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
];

function img(i, alt) {
  const src = PHOTOS[i % PHOTOS.length];
  return `<img src="${src}" alt="${alt}" width="1600" height="1067">`;
}

function svg(paths, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">${paths}</svg>`;
}

const I = {
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.2-3.2"/>'),
  check: svg('<path d="M5 12.5 9.2 17 19 7"/>'),
  pin: svg('<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2"/>'),
  phone: svg('<path d="M8 3.8h2.6l1.2 3.2-1.7 1a12 12 0 0 0 5.9 5.9l1-1.7 3.2 1.2V16a1.8 1.8 0 0 1-2 1.8A15 15 0 0 1 6.2 5.8 1.8 1.8 0 0 1 8 3.8z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'),
  mail: svg('<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>'),
  user: svg('<circle cx="12" cy="8" r="3"/><path d="M5.5 19c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5"/>'),
  info: svg('<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>'),
  alert: svg('<path d="M12 4 3 19h18L12 4z"/><path d="M12 10v4M12 16.5v.5"/>'),
  star: svg('<path d="m12 3.6 2.2 4.8 5.3.6-4 3.6 1.1 5.2L12 15.6 7.4 17.8 8.5 12.6 4.5 9l5.3-.6L12 3.6z"/>'),
  play: svg('<path d="M9 7.2v9.6l8-4.8-8-4.8z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  chev: svg('<path d="m6 9 6 6 6-6"/>'),
};

const JS = {
  nav: `document.querySelectorAll("[data-nav]").forEach((n)=>{const b=n.querySelector("[data-burger]");if(!b)return;b.addEventListener("click",()=>{const on=n.classList.toggle("is-open");b.setAttribute("aria-expanded",on?"true":"false");});});`,
  acc: `document.querySelectorAll("[data-acc]").forEach((r)=>r.addEventListener("click",(e)=>{const b=e.target.closest("button");if(!b||!r.contains(b))return;const p=b.nextElementSibling;const open=p.hidden;r.querySelectorAll("button+div,[data-panel]").forEach((x)=>x.hidden=true);r.querySelectorAll("button").forEach((x)=>x.setAttribute("aria-expanded","false"));if(open){p.hidden=false;b.setAttribute("aria-expanded","true");}}));`,
  tabs: `document.querySelectorAll("[data-tabs]").forEach((r)=>{const bs=[...r.querySelectorAll("[role=tab]")];const ps=[...r.querySelectorAll("[role=tabpanel]")];bs.forEach((b,i)=>b.addEventListener("click",()=>{bs.forEach((x,n)=>{x.setAttribute("aria-selected",n===i?"true":"false");x.tabIndex=n===i?0:-1;});ps.forEach((p,n)=>p.hidden=n!==i);}));});`,
  modal: `document.querySelectorAll("[data-open]").forEach((b)=>b.addEventListener("click",()=>{const d=document.getElementById(b.getAttribute("data-open"));if(d)d.showModal();}));document.querySelectorAll("dialog [data-close]").forEach((b)=>b.addEventListener("click",()=>b.closest("dialog").close()));`,
  drop: `document.querySelectorAll("[data-drop]").forEach((r)=>{const b=r.querySelector("button");const m=r.querySelector("[data-menu]");b.addEventListener("click",()=>{const on=m.hasAttribute("hidden");document.querySelectorAll("[data-menu]").forEach((x)=>x.setAttribute("hidden",""));if(on)m.removeAttribute("hidden");b.setAttribute("aria-expanded",on?"true":"false");});});`,
  toast: `document.querySelector("[data-toast-btn]")?.addEventListener("click",()=>{const t=document.querySelector("[data-toast]");t.hidden=false;clearTimeout(t._t);t._t=setTimeout(()=>t.hidden=true,2400);});`,
  car: `document.querySelectorAll("[data-car]").forEach((r)=>{const s=r.querySelector("[data-scroller]");r.querySelector("[data-prev]")?.addEventListener("click",()=>s.scrollBy({left:-s.clientWidth*.8,behavior:"smooth"}));r.querySelector("[data-next]")?.addEventListener("click",()=>s.scrollBy({left:s.clientWidth*.8,behavior:"smooth"}));});`,
  cmd: `const q=document.querySelector("[data-cmd]");const items=[...document.querySelectorAll("[data-cmd-item]")];q?.addEventListener("input",()=>{const v=q.value.toLowerCase();items.forEach((el)=>{el.hidden=!el.textContent.toLowerCase().includes(v);});});`,
  copy: `document.querySelector("[data-copy]")?.addEventListener("click",async(e)=>{const b=e.currentTarget;try{await navigator.clipboard.writeText(document.querySelector("pre").innerText);b.textContent="Copied";}catch(err){b.textContent="Copy";}});`,
};

let seq = 0;

function render(id, group, variant) {
  const family = FAMILIES[variant.family];
  const tags = [group.category, variant.layout, variant.family, "modern", ...(variant.tags || [])].join(", ");
  const mood = variant.mood || family.mood;
  const slots = (variant.slots || group.slots || ["visual"]).join(", ");
  const role = variant.role || group.role;
  const pageReady = variant.pageReady != null ? variant.pageReady : group.pageReady;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<!--
  @preset
  id: ${id}
  slug: ${variant.slug}
  title: ${variant.title}
  category: ${group.category}
  tags: ${tags}
  role: ${role}
  layout: ${variant.layout}
  mood: ${mood}
  pageReady: ${pageReady ? "true" : "false"}
  slots: ${slots}
-->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} ${variant.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${family.fonts}" rel="stylesheet">
<style>
${family.root}
${CORE}
${variant.css || ""}
</style>
</head>
<body>
${variant.html}
${variant.js ? `<script>${variant.js}</script>` : ""}
</body>
</html>
`;
}

function build(groups) {
  const staging = path.join(__dirname, "..", "..", "presets-next");
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  const files = [];
  seq = 0;
  for (const group of groups) {
    for (const variant of group.variants) {
      seq += 1;
      const id = String(seq).padStart(4, "0");
      const dir = path.join(staging, group.category);
      fs.mkdirSync(dir, { recursive: true });
      const filename = `${id}-${variant.slug}.html`;
      fs.writeFileSync(path.join(dir, filename), render(id, group, variant));
      files.push(`${group.category}/${filename}`);
    }
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.renameSync(staging, OUT);
  console.log(`Wrote ${files.length} modern presets across ${new Set(groups.map((g) => g.category)).size} categories`);
  return files;
}

module.exports = { build, img, I, JS, FAMILIES };
