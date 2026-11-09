/**
 * Built-in Moonrise Special Prompt for the Builder agent.
 * Public file: assets/moonrise-special-prompt.md
 * Bundled copy: worker/craft/PROMPT.md (synced on deploy; the function bundle does not include assets/).
 */
"use strict";

const fs = require("fs");
const path = require("path");

let cached = "";

function readPromptFile(filePath) {
  try {
    return String(fs.readFileSync(filePath, "utf8") || "").trim();
  } catch (_) {
    return "";
  }
}

function loadCraftPrompt() {
  if (cached) return cached;
  const candidates = [
    path.join(__dirname, "..", "..", "assets", "moonrise-special-prompt.md"),
    path.join(__dirname, "PROMPT.md"),
  ];
  for (const filePath of candidates) {
    const text = readPromptFile(filePath);
    if (text) {
      cached = text;
      return cached;
    }
  }
  console.warn("Moonrise Special Prompt missing");
  cached = "";
  return cached;
}

module.exports = {
  loadCraftPrompt,
};
