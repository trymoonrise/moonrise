/**
 * Built-in Moonrise Special Prompt for the Builder agent.
 * Source: worker/craft/PROMPT.md (same text as Designer Tips / trymoonrise/moonrise-special-prompt).
 */
"use strict";

const fs = require("fs");
const path = require("path");

let cached = "";

function loadCraftPrompt() {
  if (cached) return cached;
  const filePath = path.join(__dirname, "PROMPT.md");
  try {
    cached = String(fs.readFileSync(filePath, "utf8") || "").trim();
  } catch (err) {
    console.warn("Moonrise Special Prompt missing:", err?.message || err);
    cached = "";
  }
  return cached;
}

module.exports = {
  loadCraftPrompt,
};
