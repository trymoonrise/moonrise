"use strict";

const assert = require("assert");
const { selectStockMedia } = require("../stock-media");
const { fallbackSiteCopy, normalizeSiteCopy, renderBusinessSite } = require("../site-shell");

const care = {
  businessName: "Alexandria Board & Care",
  category: "Home Health Care",
  address: "123 Main St, Murrieta, CA 92562",
  phone: "(951) 555-0100",
  description: "Residential board and care for seniors who need daily help.",
};
const media = selectStockMedia(care);
assert.strictEqual(media.key, "medical");
assert.ok(media.images.hero.startsWith("https://"));

const plan = {
  palette: { bg: "#f4f7f6", surface: "#ffffff", ink: "#14211c", muted: "#5d6b66", accent: "#1f6b4a" },
};
const copy = normalizeSiteCopy(
  {
    headline: "Care that never clocks out",
    lede: "Round the clock board and care, close to family.",
    eyebrow: "Home health care in Murrieta",
    services: [
      { title: "Daily care", text: "Help with meals, medication, and the routine of the day." },
      { title: "A home setting", text: "Residents live in a house, not a hospital ward." },
      { title: "Family updates", text: "Relatives can visit and stay in the loop." },
    ],
    palette: { bg: "#f7f4ef", surface: "#ffffff", ink: "#1c1915", muted: "#6d655c", accent: "#8c4a32" },
  },
  care,
  plan
);
const html = renderBusinessSite(care, copy, media);
assert.ok(html.includes("Alexandria Board &amp; Care"));
assert.ok(html.includes(media.images.hero.replace(/&/g, "&amp;")));
assert.ok(!html.includes("images.unsplash.com/photo-gym"));
assert.ok(/<form[\s>]/i.test(html));
assert.ok(/<footer[\s>]/i.test(html));
assert.ok((html.match(/<section[\s>]/gi) || []).length >= 5);
assert.ok(html.includes("--bg:"));
assert.strictEqual(selectStockMedia({ businessName: "Downtown Athletic Club", category: "Gym" }).key, "fitness");
assert.strictEqual(selectStockMedia({ businessName: "Happy Tails", category: "Pet boarding" }).key, "pets");

const fallback = fallbackSiteCopy(care, plan);
const fallbackHtml = renderBusinessSite(care, fallback, media);
assert.ok(fallbackHtml.includes("(951) 555-0100"));
assert.ok(fallbackHtml.includes("Murrieta"));
console.log("site shell ok", media.key, html.length);
