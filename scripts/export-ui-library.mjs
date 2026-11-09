/**
 * Write every UI Library category and type as raw HTML into a special-prompt checkout.
 * Usage: node scripts/export-ui-library.mjs --out <repo-root>
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outArg = process.argv.indexOf("--out");
const outRoot = outArg === -1 ? "" : path.resolve(process.argv[outArg + 1] || "");
if (!outRoot) {
  console.error("Pass --out <special-prompt repo root>");
  process.exit(1);
}

const EXTRAS = {
  "menus-modal": "dt-modal",
  "menus-sheet": "dt-sheet",
};

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function loadIndex() {
  const src = read("js/ui-catalog/boot.js");
  const match = src.match(/const INDEX = (\[[\s\S]*?\n  \]);/);
  if (!match) throw new Error("INDEX missing");
  return vm.runInNewContext("(" + match[1] + ")");
}

function loadSpecs() {
  const sandbox = { window: {}, console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of [
    "js/ui-catalog/helpers.js",
    "js/ui-catalog/sections.js",
    "js/ui-catalog/components.js",
    "js/ui-catalog/screens.js",
  ]) {
    vm.runInContext(read(file), sandbox, { filename: file });
  }
  return sandbox.LX.specs;
}

function sliceTag(html, start, tag) {
  const open = "<" + tag;
  const close = "</" + tag + ">";
  let depth = 0;
  let i = start;
  while (i < html.length) {
    const nextOpen = html.indexOf(open, i);
    const nextClose = html.indexOf(close, i);
    if (nextClose === -1) break;
    const openOk = nextOpen !== -1 && nextOpen < nextClose && /[\s>]/.test(html.charAt(nextOpen + open.length) || ">");
    if (openOk) {
      depth += 1;
      i = nextOpen + open.length;
      continue;
    }
    depth -= 1;
    i = nextClose + close.length;
    if (depth === 0) return html.slice(start, i);
  }
  return "";
}

function extractById(html, id, tag) {
  const re = new RegExp("<" + tag + "\\b[^>]*\\bid=\"" + id + "\"[^>]*>", "i");
  const match = re.exec(html);
  if (!match) return "";
  return sliceTag(html, match.index, tag);
}

function extractStage(article) {
  const match = /<div\b[^>]*class="[^"]*\bdt-stage\b[^"]*"[^>]*>/i.exec(article);
  if (!match) return "";
  return sliceTag(article, match.index, "div");
}

function loadAdopted(html) {
  const cards = new Map();
  const re = /<article\b[^>]*\bid="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const article = sliceTag(html, match.index, "article");
    if (!article) continue;
    const title = ((article.match(/<h3>([^<]*)<\/h3>/) || [])[1] || match[1]).trim();
    const stage = extractStage(article);
    if (!stage) continue;
    cards.set(match[1], { id: match[1], title, stage });
  }
  return cards;
}

function classesOf(markup) {
  const found = new Set();
  const re = /class="([^"]+)"/g;
  let match;
  while ((match = re.exec(markup))) {
    match[1].split(/\s+/).filter(Boolean).forEach((name) => found.add(name));
  }
  return [...found];
}

function propertiesOf(markup) {
  const classes = classesOf(markup);
  const tags = [...markup.matchAll(/<([a-z0-9-]+)\b/gi)].map((m) => m[1].toLowerCase());
  const uniqueTags = [...new Set(tags)].filter((tag) => tag !== "div" && tag !== "span");
  const states = classes.filter((name) => /^is-/.test(name) || name === "lx-btn-ghost" || name === "lx-btn-danger" || name === "dt-btn-ghost" || name === "dt-btn-danger" || name === "dt-btn-secondary");
  if (/\sdisabled[\s>]/.test(markup)) states.push("disabled");
  const data = [...markup.matchAll(/\s(data-[a-z0-9-]+)/gi)].map((m) => m[1]);
  return {
    classes,
    elements: uniqueTags,
    states: [...new Set(states)],
    data: [...new Set(data)],
  };
}

function stageWrap(item) {
  const stage = ["dt-stage", "lx-stretch", item.stage].filter(Boolean).join(" ");
  const attrs = item.play ? ' data-demo="' + item.play + '" data-stage-tap="' + item.play + '"' : "";
  return '<div class="' + stage + '"' + attrs + ">" + item.html + "</div>";
}

function fileFor(group, category, id) {
  return "ui/" + group + "/" + category + "/" + id + ".html";
}

function htmlFile(meta, stage, extra) {
  const props = propertiesOf(stage + (extra || ""));
  const lines = [
    "Group: " + meta.groupTitle,
    "Category: " + meta.categoryTitle + " (" + meta.category + ")",
    "Type: " + meta.title,
    "Id: " + meta.id,
    "Classes: " + (props.classes.join(", ") || "none"),
    "Elements: " + (props.elements.join(", ") || "container"),
    "States: " + (props.states.join(", ") || "rest"),
    "Data: " + (props.data.join(", ") || "none"),
    "CSS: ui/css/ui-library.css, ui/css/ui-library-lab.css",
    "Tokens: ink #111, muted #5c5c5c, quiet #8a8a8a, line #ebebeb, fill #f4f4f5, surface #fff, stage #f7f7f8, action #1f6fed, danger #d92d20, ok #067647, radius 18/14.",
    "Keep this structure and these states. Change colors and labels only. Do not redraw the control.",
    "Library: https://trymoonrise.com/ui-library#" + meta.id,
    "Repo: https://github.com/trymoonrise/moonrise-special-prompt/blob/main/" + meta.file,
  ];
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>" + meta.title.replace(/</g, "") + " — " + meta.categoryTitle + " — Moonrise UI</title>",
    '<link rel="stylesheet" href="../../css/ui-library.css">',
    '<link rel="stylesheet" href="../../css/ui-library-lab.css">',
    "<style>",
    "body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px 16px;box-sizing:border-box;background:#f7f7f8}",
    ".dt-ref{width:min(28rem,100%)}",
    ".dt-ref .dt-overlay{position:relative;inset:auto;margin-top:16px;min-height:16rem;border-radius:14px}",
    ".dt-ref .dt-overlay[hidden]{display:grid!important}",
    "</style>",
    "</head>",
    '<body data-page="ui-library" class="dt-page dt-ref-page">',
    "<!--",
    lines.map((line) => "  " + line).join("\n"),
    "-->",
    '<div class="dt-ref">',
    stage,
    extra || "",
    "</div>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

const page = read("ui-library.html");
const adopted = loadAdopted(page);
const specs = loadSpecs();
const index = loadIndex();
const overlays = {
  "dt-modal": extractById(page, "dt-modal", "div").replace(/\shidden(?=[\s>])/, ""),
  "dt-sheet": extractById(page, "dt-sheet", "div").replace(/\shidden(?=[\s>])/, ""),
};

const uiDir = path.join(outRoot, "ui");
fs.rmSync(uiDir, { recursive: true, force: true });
fs.mkdirSync(path.join(uiDir, "css"), { recursive: true });
fs.copyFileSync(path.join(root, "css", "ui-library.css"), path.join(uiDir, "css", "ui-library.css"));
fs.copyFileSync(path.join(root, "css", "ui-library-lab.css"), path.join(uiDir, "css", "ui-library-lab.css"));

const groups = [];
let count = 0;

for (const item of index) {
  if (!item.id) continue;
  let group = groups.find((entry) => entry.id === item.g);
  if (!group) {
    group = { id: item.g, title: item.g[0].toUpperCase() + item.g.slice(1), categories: [] };
    groups.push(group);
  }
  const spec = specs[item.id] || { adopt: [], cards: [] };
  const types = [];
  const seen = new Set();
  function add(entry) {
    if (!entry || seen.has(entry.id)) return;
    seen.add(entry.id);
    const extraId = EXTRAS[entry.id];
    const extra = extraId ? overlays[extraId] : "";
    const rel = fileFor(item.g, item.id, entry.id);
    const meta = {
      id: entry.id,
      title: entry.title,
      group: item.g,
      groupTitle: group.title,
      category: item.id,
      categoryTitle: item.t,
      file: rel,
    };
    const dest = path.join(outRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, htmlFile(meta, entry.stage, extra));
    types.push({
      id: entry.id,
      title: entry.title,
      file: rel,
      classes: classesOf(entry.stage).slice(0, 24),
    });
    count += 1;
  }
  for (const id of spec.adopt || []) {
    add(adopted.get(id));
  }
  for (const card of spec.cards || []) {
    add({ id: card.id, title: card.title, stage: stageWrap(card) });
  }
  const readme = [
    "# " + item.t,
    "",
    group.title + " / " + item.t + ". Each file is one type: the markup, its classes, and the states it already has.",
    "",
    "Shared CSS: [`../../css/ui-library.css`](../../css/ui-library.css), [`../../css/ui-library-lab.css`](../../css/ui-library-lab.css).",
    "",
    "Change colors and labels only. Do not redraw the control.",
    "",
    ...types.map((type) => "- [" + type.title + "](" + type.id + ".html)"),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(uiDir, item.g, item.id, "README.md"), readme);
  group.categories.push({
    id: item.id,
    title: item.t,
    folder: "ui/" + item.g + "/" + item.id,
    types,
  });
}

const catalog = {
  name: "Moonrise UI Library",
  source: "https://trymoonrise.com/ui-library",
  repo: "https://github.com/trymoonrise/moonrise-special-prompt",
  css: ["ui/css/ui-library.css", "ui/css/ui-library-lab.css"],
  count,
  groups,
};
fs.writeFileSync(path.join(uiDir, "index.json"), JSON.stringify(catalog, null, 2) + "\n");
fs.writeFileSync(path.join(uiDir, "README.md"), [
  "# Moonrise UI Library",
  "",
  "Raw code for every category and type on the [UI Library](https://trymoonrise.com/ui-library).",
  "",
  "- [`index.json`](index.json) lists every file. Download all of them before you invent a control.",
  "- [`css/ui-library.css`](css/ui-library.css) and [`css/ui-library-lab.css`](css/ui-library-lab.css) are the shared styles: spacing, type, color, radius, hover, press, focus, disabled, and loading.",
  "- `sections/`, `components/`, and `screens/` each hold one folder per category. A folder holds one HTML file per type.",
  "",
  "A type file is the component as it is built: markup, class names, and a properties note. Keep that structure. Change colors and labels to fit the product. Do not redraw the control.",
  "",
  "Tokens on `body.dt-page`: ink `#111111`, muted `#5c5c5c`, quiet `#8a8a8a`, line `#ebebeb`, fill `#f4f4f5`, surface `#ffffff`, stage `#f7f7f8`, action `#1f6fed`, danger `#d92d20`, ok `#067647`. Radius `18px` / `14px`.",
  "",
].join("\n"));

console.log("Exported " + count + " UI types to " + uiDir);
