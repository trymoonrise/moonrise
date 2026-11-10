import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src =
  [".tmp/legal-from-git.html", "legal.html"]
    .map((p) => path.join(root, p))
    .find((p) => fs.existsSync(p) && fs.readFileSync(p, "utf8").includes('id="privacy"'));

if (!src) throw new Error("No legal source with privacy section found");
const html = fs.readFileSync(src, "utf8");

function extract(id) {
  const m = html.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`, "i"));
  if (!m) throw new Error(`Missing #${id}`);
  return m[0];
}

for (const id of ["privacy", "terms", "refunds"]) {
  const out = path.join(root, "scripts", `docs-legal-${id}.html`);
  fs.writeFileSync(out, extract(id), "utf8");
  console.log("Wrote", out);
}
