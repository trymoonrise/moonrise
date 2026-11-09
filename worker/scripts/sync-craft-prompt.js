/**
 * Copy the public special prompt into the worker bundle.
 * Vercel functions include worker/ but not assets/.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const src = path.join(root, "assets", "moonrise-special-prompt.md");
const dest = path.join(root, "worker", "craft", "PROMPT.md");

const text = fs.readFileSync(src, "utf8").replace(/^\uFEFF/, "");
const normalized = text.replace(/\s+$/, "") + "\n";
fs.writeFileSync(dest, normalized);
console.log("Synced special prompt -> worker/craft/PROMPT.md");
