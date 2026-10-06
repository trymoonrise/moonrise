/**
 * Free Business Finder search: Nominatim (geocode) + Overpass (OpenStreetMap POIs).
 * Map tiles are loaded separately via MapLibre + OpenFreeMap.
 * Public instances: no API key. Keep queries small and sequential.
 */
(function (global) {
  const NOMINATIM = "https://nominatim.openstreetmap.org";
  const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  const RESULT_CAP = 60;
  const MILES_TO_METERS = 1609.34;

  const SKIP_AMENITY = new Set([
    "parking",
    "parking_space",
    "parking_entrance",
    "bench",
    "toilets",
    "waste_basket",
    "waste_disposal",
    "fountain",
    "shelter",
    "bicycle_parking",
    "bicycle_rental",
    "recycling",
    "vending_machine",
    "post_box",
    "telephone",
    "taxi",
    "bus_station",
    "atm",
    "grit_bin",
    "hunting_stand",
  ]);

  const GENERIC_FILTERS = [
    '["shop"]',
    '["craft"]',
    '["amenity"~"^(restaurant|cafe|bar|fast_food|pub|pharmacy|dentist|doctors|clinic|veterinary|car_repair|car_wash|fuel|bank|beauty)$"]',
    '["office"~"^(estate_agent|insurance|lawyer|accountant|tax_advisor|company|advertising_agency|it)$"]',
  ];

  const CATEGORY_RULES = [
    [/barber/i, ['["shop"="hairdresser"]']],
    [/nail/i, ['["shop"="beauty"]', '["shop"="cosmetics"]']],
    [/hair\s*salon|^salon/i, ['["shop"="hairdresser"]', '["shop"="beauty"]']],
    [/massage/i, ['["shop"="massage"]']],
    [/med\s*spa|\bspa\b/i, ['["leisure"="spa"]', '["shop"="beauty"]']],
    [/beauty/i, ['["shop"="beauty"]', '["shop"="cosmetics"]']],
    [/yoga|pilates/i, ['["leisure"="fitness_centre"]', '["sport"="yoga"]']],
    [/martial/i, ['["leisure"="sports_centre"]', '["sport"="martial_arts"]']],
    [/gym|fitness|crossfit|personal trainer/i, ['["leisure"="fitness_centre"]', '["leisure"="sports_centre"]']],
    [/dental|orthodont/i, ['["amenity"="dentist"]']],
    [/chiropract/i, ['["healthcare"="chiropractor"]', '["amenity"="doctors"]']],
    [/physical therapy|physiotherap/i, ['["healthcare"="physiotherapist"]']],
    [/optometr/i, ['["amenity"="doctors"]', '["healthcare"="optometrist"]']],
    [/dermatolog|pediatric|urgent care|\bclinic/i, ['["amenity"="clinic"]', '["amenity"="doctors"]']],
    [/veterinar|\bvets?\b/i, ['["amenity"="veterinary"]']],
    [/pet groom|dog train|pet board/i, ['["shop"="pet_grooming"]', '["amenity"="animal_boarding"]', '["shop"="pet"]']],
    [/pizza/i, ['["amenity"="restaurant"]["cuisine"~"pizza",i]', '["amenity"="fast_food"]["cuisine"~"pizza",i]']],
    [/baker/i, ['["shop"="bakery"]']],
    [/cafe|coffee|juice bar/i, ['["amenity"="cafe"]']],
    [/cater/i, ['["craft"="caterer"]']],
    [/food truck/i, ['["amenity"="fast_food"]']],
    [/restaurant/i, ['["amenity"="restaurant"]']],
    [/tire|tyre/i, ['["shop"="tyres"]']],
    [/detail/i, ['["amenity"="car_wash"]']],
    [/auto|mechanic|oil change|body shop|tow/i, ['["shop"="car_repair"]']],
    [/plumb/i, ['["craft"="plumber"]']],
    [/electric/i, ['["craft"="electrician"]']],
    [/hvac|heating|air condition/i, ['["craft"="hvac"]']],
    [/roof/i, ['["craft"="roofer"]']],
    [/landscap|lawn|tree service/i, ['["craft"="gardener"]']],
    [/pest/i, ['["craft"="pest_control"]']],
    [/pool service|pool clean/i, ['["shop"="swimming_pool"]']],
    [/paint/i, ['["craft"="painter"]']],
    [/carpet/i, ['["shop"="carpet"]']],
    [/pressure wash|cleaning|janitor/i, ['["shop"="dry_cleaning"]', '["craft"="window_cleaner"]']],
    [/floor/i, ['["shop"="flooring"]', '["craft"="floorer"]']],
    [/locksmith/i, ['["shop"="locksmith"]', '["craft"="locksmith"]']],
    [/garage door|handyman|contractor|remodel/i, ['["craft"="handyman"]']],
    [/security system/i, ['["shop"="security"]']],
    [/junk removal|moving/i, ['["office"="moving_company"]']],
    [/storage/i, ['["shop"="storage_rental"]']],
    [/real estate|property management/i, ['["office"="estate_agent"]']],
    [/mortgage|insurance/i, ['["office"="insurance"]']],
    [/tax|accountant/i, ['["office"="tax_advisor"]', '["office"="accountant"]']],
    [/law firm|attorney|lawyer/i, ['["office"="lawyer"]']],
    [/notar/i, ['["office"="lawyer"]']],
    [/daycare|preschool|child ?care/i, ['["amenity"="childcare"]', '["amenity"="kindergarten"]']],
    [/driving school/i, ['["amenity"="driving_school"]']],
    [/tutor|music lesson/i, ['["shop"="music"]', '["amenity"="music_school"]']],
    [/photo|videograph/i, ['["shop"="photo"]', '["craft"="photographer"]']],
    [/florist/i, ['["shop"="florist"]']],
    [/wedding|event plan|\bdj\b/i, ['["shop"="florist"]', '["shop"="wedding"]']],
    [/senior care|home health/i, ['["amenity"="social_facility"]']],
    [/web design|marketing|it support/i, ['["office"="it"]', '["office"="advertising_agency"]']],
    [/phone repair/i, ['["shop"="mobile_phone"]']],
    [/print shop|sign shop/i, ['["shop"="copyshop"]', '["craft"="signmaker"]']],
    [/dry clean|laundromat/i, ['["shop"="dry_cleaning"]', '["shop"="laundry"]']],
    [/tailor/i, ['["shop"="tailor"]', '["craft"="tailor"]']],
    [/appliance/i, ['["shop"="appliance"]']],
    [/furniture/i, ['["shop"="furniture"]']],
    [/thrift/i, ['["shop"="second_hand"]', '["shop"="charity"]']],
    [/boutique|retail/i, ['["shop"="clothes"]']],
    [/tattoo/i, ['["shop"="tattoo"]']],
  ];

  let nominatimReadyAt = 0;
  let searchChain = Promise.resolve();

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function escapeRegex(value) {
    return String(value || "")
      .replace(/["\\]/g, "")
      .replace(/[.*+?^${}()|[\]\\]/g, "")
      .replace(/[^\w\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
  }

  function isGenericType(type) {
    return !type || /^(business|businesses|all|shops?|places?|companies)$/i.test(type);
  }

  function nameFilters(term) {
    const safe = escapeRegex(term);
    if (safe.length < 3) return null;
    const re = '["name"~"' + safe + '",i]';
    return [re + '["shop"]', re + '["amenity"]', re + '["craft"]', re + '["office"]'];
  }

  function filtersForType(type) {
    const raw = String(type || "").trim();
    if (isGenericType(raw)) return GENERIC_FILTERS;
    for (let i = 0; i < CATEGORY_RULES.length; i += 1) {
      if (CATEGORY_RULES[i][0].test(raw)) return CATEGORY_RULES[i][1];
    }
    return nameFilters(raw) || GENERIC_FILTERS;
  }

  function buildQuery(filters, areaClause) {
    const lines = filters.map((filter) => "  nwr" + filter + '["name"](' + areaClause + ");");
    return "[out:json][timeout:25];\n(\n" + lines.join("\n") + "\n);\nout center " + RESULT_CAP + ";";
  }

  async function throttleNominatim() {
    const wait = nominatimReadyAt - Date.now();
    if (wait > 0) await sleep(wait);
    nominatimReadyAt = Date.now() + 1100;
  }

  async function nominatimGet(pathAndQuery) {
    await throttleNominatim();
    const res = await fetch(NOMINATIM + pathAndQuery, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "MoonriseStudio/1.0 (business finder; https://trymoonrise.com)",
      },
    });
    if (!res.ok) {
      throw new Error("Place search failed (" + res.status + "). Try again in a moment.");
    }
    return res.json();
  }

  async function geocodePlace(query) {
    const q = String(query || "").trim();
    if (!q) return null;
    const data = await nominatimGet(
      "/search?format=jsonv2&addressdetails=1&limit=1&q=" + encodeURIComponent(q)
    );
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return hit;
  }

  function placeKind(place) {
    return String(place?.addresstype || place?.type || place?.category || "").toLowerCase();
  }

  function bboxDiagonalMiles(place) {
    const bb = place?.boundingbox;
    if (!Array.isArray(bb) || bb.length < 4) return Infinity;
    const south = Number(bb[0]);
    const north = Number(bb[1]);
    const west = Number(bb[2]);
    const east = Number(bb[3]);
    if (![south, north, west, east].every(Number.isFinite)) return Infinity;
    const midLat = ((south + north) / 2) * (Math.PI / 180);
    const dLat = Math.abs(north - south) * 69;
    const dLng = Math.abs(east - west) * 69 * Math.cos(midLat);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  function isBroadPlace(place) {
    const kind = placeKind(place);
    if (/state|region|country|county/.test(kind)) return true;
    return bboxDiagonalMiles(place) > 35;
  }

  function areaClauseFor(center, radiusMiles) {
    const meters = Math.max(800, Math.round(Number(radiusMiles) * MILES_TO_METERS));
    return "around:" + meters + "," + center.lat + "," + center.lng;
  }

  function defaultRadiusMiles(place, type) {
    if (!place) return isGenericType(type) ? 4 : 8;
    if (isBroadPlace(place)) return isGenericType(type) ? 8 : 12;
    const diagonal = bboxDiagonalMiles(place);
    if (Number.isFinite(diagonal) && diagonal > 0 && diagonal <= 30) {
      return Math.max(2, Math.min(12, diagonal / 2));
    }
    return isGenericType(type) ? 4 : 8;
  }

  async function runOverpass(query) {
    let lastError = "OpenStreetMap search failed.";
    for (let i = 0; i < OVERPASS_ENDPOINTS.length; i += 1) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 28000) : null;
      try {
        const res = await fetch(OVERPASS_ENDPOINTS[i], {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "MoonriseStudio/1.0 (business finder; https://trymoonrise.com)",
          },
          body: "data=" + encodeURIComponent(query),
          signal: controller ? controller.signal : undefined,
        });
        const data = await res.json().catch(() => ({}));
        const remark = String(data?.remark || "");
        if (!res.ok || /timed out|runtime error|too many/i.test(remark)) {
          lastError = /timed out/i.test(remark)
            ? "OpenStreetMap search timed out. Try a smaller area or a specific category."
            : "OpenStreetMap is busy. Try again in a moment.";
          continue;
        }
        return Array.isArray(data?.elements) ? data.elements : [];
      } catch (err) {
        const aborted = err?.name === "AbortError";
        lastError = aborted
          ? "OpenStreetMap search timed out. Try a smaller area or a specific category."
          : "OpenStreetMap search is unreachable. Check your connection and try again.";
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    throw new Error(lastError);
  }

  function tag(el, key) {
    return String(el?.tags?.[key] || "").trim();
  }

  function elementPoint(el) {
    if (el?.type === "node" && Number.isFinite(Number(el.lat)) && Number.isFinite(Number(el.lon))) {
      return { lat: Number(el.lat), lng: Number(el.lon) };
    }
    if (el?.center && Number.isFinite(Number(el.center.lat)) && Number.isFinite(Number(el.center.lon))) {
      return { lat: Number(el.center.lat), lng: Number(el.center.lon) };
    }
    return null;
  }

  function titleCaseToken(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
  }

  function categoryFromTags(tags) {
    const raw = tags.shop || tags.craft || tags.amenity || tags.office || tags.healthcare || tags.leisure || "";
    return titleCaseToken(raw);
  }

  function websiteFromTags(tags) {
    let raw = tags.website || tags["contact:website"] || tags.url || "";
    raw = String(raw || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(raw)) return "https://" + raw.replace(/^\/\//, "");
    return "";
  }

  function addressFromTags(tags) {
    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "";
    const state = tags["addr:state"] || "";
    const zip = tags["addr:postcode"] || "";
    const region = [state, zip].filter(Boolean).join(" ");
    const cityLine = [city, region].filter(Boolean).join(", ");
    return [street, cityLine].filter(Boolean).join(", ");
  }

  function elementToLead(el) {
    const tags = el?.tags || {};
    const name = String(tags.name || "").trim();
    if (!name) return null;
    if (tags.amenity && SKIP_AMENITY.has(tags.amenity)) return null;
    const point = elementPoint(el);
    if (!point) return null;
    const website = websiteFromTags(tags);
    const phone = tags.phone || tags["contact:phone"] || tags["phone:mobile"] || "";
    const hours = tags.opening_hours || "";
    const osmType = el.type === "way" || el.type === "relation" ? el.type : "node";
    const id = "osm:" + osmType + ":" + el.id;
    return {
      id,
      name,
      category: categoryFromTags(tags),
      categoryGroup: categoryFromTags(tags),
      phone: String(phone || "").trim(),
      address: addressFromTags(tags),
      hours: String(hours || "").trim(),
      mapsUrl: "https://www.openstreetmap.org/" + osmType + "/" + el.id,
      website,
      website_url: website,
      hasWebsite: Boolean(website),
      has_website: Boolean(website),
      websiteStatus: website ? "has" : "missing",
      websiteEnriched: true,
      websiteConfirmed: true,
      latitude: point.lat,
      longitude: point.lng,
      source: "openstreetmap",
      formatValid: true,
    };
  }

  async function searchUnlocked(options) {
    const opts = options && typeof options === "object" ? options : {};
    const type = String(opts.type || "").trim();
    const location = String(opts.location || "").trim();
    const lat = Number(opts.latitude);
    const lng = Number(opts.longitude);
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
    let place = null;
    let center = hasGeo ? { lat, lng } : null;

    if (!center) {
      if (!location) {
        throw new Error("Add a city, or tap Scan nearby.");
      }
      place = await geocodePlace(location);
      if (!place) {
        throw new Error('Could not find "' + location + '". Try City, ST, for example Austin, TX.');
      }
      center = { lat: Number(place.lat), lng: Number(place.lon) };
    }

    let radiusMiles = Number(opts.radiusMiles);
    if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) {
      radiusMiles = defaultRadiusMiles(place, type);
    }
    radiusMiles = Math.min(Math.max(radiusMiles, 1), isGenericType(type) ? 8 : 12);

    const filters = filtersForType(type);
    let elements = [];
    try {
      elements = await runOverpass(buildQuery(filters, areaClauseFor(center, radiusMiles)));
    } catch (err) {
      const timedOut = /timed out/i.test(String(err?.message || ""));
      if (!timedOut || radiusMiles <= 2) throw err;
      elements = await runOverpass(buildQuery(filters, areaClauseFor(center, Math.max(2, radiusMiles / 2))));
    }

    const seen = new Set();
    const leads = [];
    elements.forEach((el) => {
      const lead = elementToLead(el);
      if (!lead || seen.has(lead.id)) return;
      seen.add(lead.id);
      lead.searchQuery = [type, location].filter(Boolean).join(" in ");
      leads.push(lead);
    });

    return {
      ok: true,
      leads: leads.slice(0, RESULT_CAP),
      center,
      radiusMiles,
      placeLabel: place?.display_name || location || "",
    };
  }

  function search(options) {
    const run = () => searchUnlocked(options);
    const next = searchChain.then(run, run);
    searchChain = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  async function reverse(lat, lng) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const data = await nominatimGet(
      "/reverse?format=jsonv2&addressdetails=1&zoom=12&lat=" +
        encodeURIComponent(latitude) +
        "&lon=" +
        encodeURIComponent(longitude)
    );
    const address = data?.address || {};
    const city = String(
      address.city || address.town || address.village || address.hamlet || address.municipality || ""
    ).trim();
    const state = String(address.state || "").trim();
    const iso = String(address["ISO3166-2-lvl4"] || "")
      .trim()
      .replace(/^US-/i, "");
    const region = iso || state;
    const label = city && region ? city + ", " + (iso || region) : city || state || "";
    return { city, region, state, label };
  }

  global.OsmFinder = {
    search,
    geocode: geocodePlace,
    reverse,
  };
})(window);
