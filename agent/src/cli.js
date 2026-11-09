"use strict";

const fs = require("fs");
const path = require("path");
const { writeWorkspaceFile } = require("./workspace");
const { siteSourceFiles } = require("./sources");

const fixturePath = path.join(__dirname, "..", "fixtures", "bella.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const out = path.join(__dirname, "..", "workspaces", "bella");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const files = siteSourceFiles(fixture.business, fixture.copy, fixture.plan, fixture.media);
for (const file of files) {
  writeWorkspaceFile(out, file.path, file.contents);
}

const page = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${fixture.business.businessName}</title></head><body><h1>${fixture.copy.headline}</h1><p>${fixture.business.businessName}</p></body></html>`;
writeWorkspaceFile(out, "index.html", page);

console.log(
  JSON.stringify(
    {
      workspace: out,
      files: [...files.map((file) => file.path), "index.html"],
    },
    null,
    2
  )
);
