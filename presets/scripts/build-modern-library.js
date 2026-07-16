"use strict";

const engine = require("./modern/engine");
const groups = [
  ...require("./modern/chrome")(engine),
  ...require("./modern/controls")(engine),
  ...require("./modern/overlays")(engine),
  ...require("./modern/bits")(engine),
];

engine.build(groups);
