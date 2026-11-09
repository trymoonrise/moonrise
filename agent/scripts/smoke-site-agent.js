"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { resolveInside, writeWorkspaceFile } = require("../src/workspace");
const { siteSourceFiles } = require("../src/sources");

const root = fs.mkdtempSync(path.join(os.tmpdir(), "mr-agent-"));

assert.throws(() => resolveInside(root, "../escape.txt"), /workspace/);
assert.throws(() => resolveInside(root, "src/../../escape.txt"), /workspace/);
assert.throws(() => resolveInside(root, "/etc/passwd"), /workspace/);

const files = siteSourceFiles(
  {
    businessName: "Bella's Hair Salon",
    phone: "(951) 555-0148",
    address: "12 Ivy Street, Murrieta, CA",
  },
  {
    headline: "Fresh cuts",
    primaryCta: "Book a visit",
    services: [{ title: "Haircut", text: "A clean cut." }],
  },
  {
    palette: { bg: "#fff", surface: "#fff", ink: "#111111", muted: "#666666", accent: "#111111" },
    type: { display: "Manrope", body: "Manrope" },
  }
);

const hero = files.find((file) => file.path === "src/components/Hero.jsx");
const nav = files.find((file) => file.path === "src/components/Nav.jsx");
assert.ok(hero, "hero file");
assert.ok(hero.contents.includes("Fresh cuts"));
assert.ok(nav.contents.includes("Bella's Hair Salon"));
assert.ok(files.some((file) => file.path === "src/App.jsx"));
assert.ok(!files.some((file) => String(file.path).includes("..")));

const bytes = writeWorkspaceFile(root, "src/components/Hero.jsx", hero.contents);
assert.ok(bytes > 20);
assert.ok(fs.existsSync(path.join(root, "src", "components", "Hero.jsx")));
assert.throws(() => writeWorkspaceFile(root, "../nope.txt", "x"), /workspace/);

fs.rmSync(root, { recursive: true, force: true });
console.log("site agent smoke ok");
