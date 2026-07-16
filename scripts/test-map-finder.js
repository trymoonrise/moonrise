/**
 * Smoke tests for Business Finder map + OpenStreetMap search.
 * Run: node scripts/test-map-finder.js
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
let passed = 0;
let failed = 0;

function ok(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log("PASS  " + name);
  } else {
    failed += 1;
    console.log("FAIL  " + name + (detail ? " - " + detail : ""));
  }
}

function fetchText(url, opts) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.request(
      url,
      {
        method: (opts && opts.method) || "GET",
        headers: (opts && opts.headers) || {},
        timeout: (opts && opts.timeout) || 12000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: Buffer.concat(chunks).toString("utf8"),
            headers: res.headers,
          });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    if (opts && opts.body) req.write(opts.body);
    req.end();
  });
}

async function main() {
  const html = fs.readFileSync(path.join(ROOT, "leads.html"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "css/leads-map.css"), "utf8");
  const searchJs = fs.readFileSync(path.join(ROOT, "js/leads-search.js"), "utf8");
  const configJs = fs.readFileSync(path.join(ROOT, "js/config.js"), "utf8");

  const osmJs = fs.readFileSync(path.join(ROOT, "js/osm-finder.js"), "utf8");

  ok("leads.html has MapLibre CSS CDN", /cdn\.jsdelivr\.net\/npm\/maplibre-gl@5\.6\.2\/dist\/maplibre-gl\.css/.test(html));
  ok("leads.html has MapLibre JS CDN", /cdn\.jsdelivr\.net\/npm\/maplibre-gl@5\.6\.2\/dist\/maplibre-gl\.js/.test(html));
  ok("leads.html loads osm-finder.js", html.includes("js/osm-finder.js"));
  ok("leads.html has #lf-map", html.includes('id="lf-map"'));
  ok("leads.html has Scan Near Me + All", html.includes("lf-scan-near") && html.includes("lf-scan-all"));
  ok("CSS has dark map stage", css.includes(".ms-lf-map-stage") && css.includes("#0f172a"));
  ok("JS uses OpenFreeMap styles", searchJs.includes("tiles.openfreemap.org/styles/"));
  ok("JS searches via OsmFinder", searchJs.includes("searchViaOpenStreetMap") && osmJs.includes("overpass-api.de"));
  ok("JS has map init + markers", searchJs.includes("initLeadMap") && searchJs.includes("syncMapMarkers"));
  ok("CSP allows OpenFreeMap and Overpass", /tiles\.openfreemap\.org/.test(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")) && /overpass-api\.de/.test(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")));
  ok("config still exposes leadFinderUrl", /leadFinderUrl/.test(configJs));

  try {
    const style = await fetchText("https://tiles.openfreemap.org/styles/positron", { timeout: 15000 });
    ok(
      "OpenFreeMap style reachable",
      style.status === 200 && style.body.includes("openfreemap"),
      "status=" + style.status
    );
  } catch (e) {
    ok("OpenFreeMap style reachable", false, String(e.message || e));
  }

  try {
    const maplibre = await fetchText("https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.2/dist/maplibre-gl.js", {
      timeout: 15000,
    });
    ok(
      "MapLibre CDN reachable",
      maplibre.status === 200 && maplibre.body.includes("maplibregl"),
      "status=" + maplibre.status
    );
  } catch (e) {
    ok("MapLibre CDN reachable", false, String(e.message || e));
  }

  try {
    const geo = await fetchText(
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
        encodeURIComponent("Laguna Beach, CA"),
      {
        timeout: 15000,
        headers: {
          "User-Agent": "MoonriseStudio/1.0 (business finder smoke test)",
          Accept: "application/json",
        },
      }
    );
    let places = [];
    try {
      places = JSON.parse(geo.body);
    } catch (_) {}
    ok(
      "Nominatim geocodes a city",
      geo.status === 200 && Array.isArray(places) && places.length > 0 && places[0].lat,
      "status=" + geo.status
    );
  } catch (e) {
    ok("Nominatim geocodes a city", false, String(e.message || e));
  }

  try {
    const query =
      '[out:json][timeout:20];node["name"]["amenity"="cafe"](around:1200,33.5427,-117.7854);out center 5;';
    const body = "data=" + encodeURIComponent(query);
    const overpass = await fetchText("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Content-Length": Buffer.byteLength(body),
        Accept: "application/json",
        "User-Agent": "MoonriseStudio/1.0 (business finder smoke test)",
      },
      body,
      timeout: 25000,
    });
    let data = {};
    try {
      data = JSON.parse(overpass.body);
    } catch (_) {}
    const elements = Array.isArray(data.elements) ? data.elements : [];
    ok(
      "Overpass returns named cafes",
      overpass.status === 200 && elements.some((el) => el.tags && el.tags.name),
      "status=" + overpass.status + " count=" + elements.length
    );
  } catch (e) {
    ok("Overpass returns named cafes", false, String(e.message || e));
  }

  console.log("");
  console.log(failed ? `RESULT: ${failed} failed, ${passed} passed` : `RESULT: all ${passed} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
