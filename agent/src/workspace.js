"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

function resolveInside(root, rel) {
  const base = path.resolve(root);
  const raw = String(rel || "").replace(/\\/g, "/").trim();
  if (!raw || raw.includes("\0")) {
    throw new Error("Invalid site path");
  }
  if (path.isAbsolute(raw) || /^[a-zA-Z]:/.test(raw)) {
    throw new Error("Site path must stay inside the workspace");
  }
  const parts = raw.split("/").filter((part) => part && part !== ".");
  if (parts.some((part) => part === "..")) {
    throw new Error("Site path must stay inside the workspace");
  }
  const full = path.resolve(base, ...parts);
  if (full !== base && !full.startsWith(base + path.sep)) {
    throw new Error("Site path must stay inside the workspace");
  }
  return full;
}

function createWorkspace(id) {
  const safe = String(id || "local").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48) || "local";
  const dir = path.join(os.tmpdir(), "moonrise-agent", safe);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function removeWorkspace(dir) {
  if (!dir) return;
  const base = path.resolve(os.tmpdir(), "moonrise-agent");
  const full = path.resolve(dir);
  if (full !== base && !full.startsWith(base + path.sep)) return;
  fs.rmSync(full, { recursive: true, force: true });
}

function writeWorkspaceFile(root, rel, contents) {
  const full = resolveInside(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const body = String(contents ?? "");
  fs.writeFileSync(full, body);
  return Buffer.byteLength(body);
}

module.exports = {
  resolveInside,
  createWorkspace,
  removeWorkspace,
  writeWorkspaceFile,
};
