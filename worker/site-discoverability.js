/**
 * Search, answer-engine, GEO, and social tags for a published business page.
 * Uses only facts already on the project. Does not invent ratings, reviews, or awards.
 */

const MARK_START = "<!-- moonrise-discoverability -->";
const MARK_END = "<!-- /moonrise-discoverability -->";

function clean(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripTags(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlaceholder(value) {
  return /lorem ipsum|your business|company name|\[business name\]|\[phone\]|placeholder|todo:|coming soon|untitled business/i.test(
    String(value || "")
  );
}

function httpsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProto = /^https?:\/\//i.test(raw) ? raw : "https://" + raw.replace(/^\/+/, "");
  if (!/^https:\/\//i.test(withProto)) return "";
  try {
    const url = new URL(withProto);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "") || url.origin;
  } catch (_) {
    return "";
  }
}

function sentence(value) {
  const text = clean(value, 220);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : text + ".";
}

function parseAddressParts(address) {
  const raw = clean(address, 180);
  if (!raw) return null;
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  const out = {
    "@type": "PostalAddress",
    streetAddress: parts[0] || raw,
  };
  if (parts.length >= 2) out.addressLocality = parts[1];
  if (parts.length >= 3) {
    const regionZip = parts[2];
    const zip = regionZip.match(/\b\d{5}(?:-\d{4})?\b/);
    const region = regionZip.replace(/\b\d{5}(?:-\d{4})?\b/, "").trim();
    if (region) out.addressRegion = region;
    if (zip) out.postalCode = zip[0];
  }
  if (parts.length >= 2) out.addressCountry = "US";
  return out;
}

function cityFromAddress(address) {
  const parts = parseAddressParts(address);
  return parts && parts.addressLocality ? parts.addressLocality : "";
}

function regionFromAddress(address) {
  const parts = parseAddressParts(address);
  if (parts && parts.addressRegion) {
    const region = String(parts.addressRegion).trim();
    if (/^[A-Z]{2}$/i.test(region)) return "US-" + region.toUpperCase();
  }
  return address ? "US" : "";
}

function buildDescription(ctx) {
  const given = clean(ctx && ctx.description, 220);
  if (given && given.length >= 40 && !isPlaceholder(given)) return given.slice(0, 160);
  const name = clean(ctx && ctx.businessName, 120);
  if (!name || isPlaceholder(name)) return "";
  const category = clean(ctx && ctx.category, 80);
  const address = clean(ctx && ctx.address, 160);
  const phone = clean(ctx && ctx.phone, 40);
  let text = name;
  if (category) text += " is a " + category.replace(/\.$/, "");
  else text += " is a local business";
  if (address) text += " at " + address.replace(/\.$/, "");
  text = sentence(text);
  if (phone) text += " Call " + phone + ".";
  return text.slice(0, 170);
}

function firstContentImage(html) {
  const re = /<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(String(html || "")))) {
    const tag = match[0];
    if (/watermark|logo|icon|sprite|svg/i.test(tag) && !/alt=/i.test(tag)) continue;
    const src = httpsUrl(match[1]);
    if (src) return src;
  }
  return "";
}

function extractFaqs(html) {
  const raw = String(html || "");
  const section = raw.match(/<section\b[^>]*\bid=["']faq["'][^>]*>([\s\S]*?)<\/section>/i);
  const region = section ? section[1] : raw;
  const faqs = [];
  const re = /<details\b([^>]*)>([\s\S]*?)<\/details>/gi;
  let match;
  while ((match = re.exec(region)) && faqs.length < 6) {
    const hinted = section || /faq/i.test(match[1]);
    if (!hinted) continue;
    const summary = match[2].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
    const answer = match[2].match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const q = stripTags(summary && summary[1]);
    const a = stripTags(answer && answer[1]);
    if (q.length < 8 || a.length < 8) continue;
    if (isPlaceholder(q) || isPlaceholder(a)) continue;
    faqs.push({ q: q.slice(0, 180), a: a.slice(0, 400) });
  }
  return faqs;
}

function hasJsonLdType(html, type) {
  return new RegExp(
    "<script\\b[^>]*type=[\"']application/ld\\+json[\"'][^>]*>[\\s\\S]*?" + type,
    "i"
  ).test(String(html || ""));
}

function jsonScript(id, data) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return '<script type="application/ld+json" id="' + id + '">' + json + "</script>";
}

function localBusinessType(category) {
  const c = String(category || "").toLowerCase();
  if (/restaurant|cafe|coffee|bakery|bar|food truck|pizza|diner/.test(c)) return "Restaurant";
  if (/dentist|dental/.test(c)) return "Dentist";
  if (/doctor|clinic|medical|physician|chiropract|therap/.test(c)) return "MedicalBusiness";
  if (/lawyer|attorney|law/.test(c)) return "LegalService";
  if (/plumb/.test(c)) return "PlumbingService";
  if (/electric/.test(c)) return "Electrician";
  if (/hvac|heat|air condition|furnace/.test(c)) return "HVACBusiness";
  if (/salon|barber|spa|beauty|nail/.test(c)) return "BeautySalon";
  if (/gym|fitness|yoga/.test(c)) return "ExerciseGym";
  if (/auto|mechanic|car wash|detail/.test(c)) return "AutomotiveBusiness";
  if (/hotel|motel|inn|lodging/.test(c)) return "LodgingBusiness";
  if (/real estate|realtor/.test(c)) return "RealEstateAgent";
  if (/landscap|lawn|garden/.test(c)) return "HomeAndConstructionBusiness";
  return "LocalBusiness";
}

function localBusiness(ctx, description, image, canonical) {
  const name = clean(ctx && ctx.businessName, 120);
  if (!name || isPlaceholder(name)) return null;
  const node = {
    "@type": localBusinessType(ctx && ctx.category),
    "@id": (canonical || "") + "#business",
    name: name,
  };
  if (description) node.description = description;
  const phone = clean(ctx && ctx.phone, 40);
  if (phone) node.telephone = phone;
  const addr = parseAddressParts(ctx && ctx.address);
  if (addr) node.address = addr;
  const hours = clean(ctx && ctx.hours, 180);
  if (hours && !/copy open hours|hours might differ|suggest an edit/i.test(hours)) {
    node.additionalProperty = { "@type": "PropertyValue", name: "Hours", value: hours };
  }
  if (image) node.image = image;
  const maps = httpsUrl(ctx && ctx.mapsUrl);
  if (maps) node.hasMap = maps;
  if (canonical) node.url = canonical;
  const city = cityFromAddress(ctx && ctx.address);
  if (city) node.areaServed = city;
  const sameAs = [];
  const prior = httpsUrl(ctx && ctx.website);
  if (prior && prior !== canonical && prior !== maps) sameAs.push(prior);
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

function metaContent(html, name) {
  const tag = String(html || "").match(
    new RegExp("<meta\\b[^>]*name=[\"']" + name + "[\"'][^>]*>", "i")
  );
  if (!tag) return null;
  const content = tag[0].match(/\bcontent=["']([^"']*)["']/i);
  return content ? content[1] : "";
}

function buildBlock(html, ctx) {
  const name = clean(ctx && ctx.businessName, 120);
  const description = buildDescription(ctx);
  const image = firstContentImage(html);
  const lines = [MARK_START];
  const existingDesc = metaContent(html, "description");
  const canonical = httpsUrl(ctx && ctx.canonicalUrl);
  const city = cityFromAddress(ctx && ctx.address);
  const geoRegion = regionFromAddress(ctx && ctx.address);

  if (!/<meta[^>]+charset=/i.test(html)) {
    lines.push('<meta charset="utf-8">');
  }
  if (
    description &&
    (existingDesc == null || existingDesc.trim().length < 20 || isPlaceholder(existingDesc))
  ) {
    lines.push('<meta name="description" content="' + escapeHtml(description) + '">');
  }
  lines.push(
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'
  );
  lines.push('<meta name="format-detection" content="telephone=yes">');
  if (city) lines.push('<meta name="geo.placename" content="' + escapeHtml(city) + '">');
  if (geoRegion) lines.push('<meta name="geo.region" content="' + escapeHtml(geoRegion) + '">');

  if (canonical) {
    lines.push('<link rel="canonical" href="' + escapeHtml(canonical) + '">');
    lines.push(
      '<link rel="alternate" type="text/plain" title="Facts for answer engines" href="' +
        escapeHtml(canonical.replace(/\/$/, "") + "/llms.txt") +
        '">'
    );
  }

  const title = name && !isPlaceholder(name) ? name : "";
  const socialTitle = title || "Local business";
  const pageDesc =
    existingDesc && existingDesc.trim().length >= 20 && !isPlaceholder(existingDesc)
      ? existingDesc.trim().slice(0, 200)
      : description;
  const socialDesc = pageDesc || title;
  if (socialDesc) {
    lines.push('<meta property="og:type" content="website">');
    lines.push('<meta property="og:site_name" content="' + escapeHtml(socialTitle) + '">');
    lines.push('<meta property="og:title" content="' + escapeHtml(socialTitle) + '">');
    lines.push('<meta property="og:description" content="' + escapeHtml(socialDesc) + '">');
    lines.push('<meta property="og:locale" content="en_US">');
    if (canonical) lines.push('<meta property="og:url" content="' + escapeHtml(canonical) + '">');
    if (image) {
      lines.push('<meta property="og:image" content="' + escapeHtml(image) + '">');
      lines.push('<meta property="og:image:alt" content="' + escapeHtml(socialTitle) + '">');
    }
    lines.push('<meta name="twitter:card" content="' + (image ? "summary_large_image" : "summary") + '">');
    lines.push('<meta name="twitter:title" content="' + escapeHtml(socialTitle) + '">');
    lines.push('<meta name="twitter:description" content="' + escapeHtml(socialDesc) + '">');
    if (image) {
      lines.push('<meta name="twitter:image" content="' + escapeHtml(image) + '">');
      lines.push('<meta name="twitter:image:alt" content="' + escapeHtml(socialTitle) + '">');
    }
  }

  if (title && !/<title[\s>]/i.test(html)) {
    lines.push("<title>" + escapeHtml(title) + "</title>");
  }

  const graph = [];
  const business = localBusiness(ctx, pageDesc, image, canonical);
  if (business && !hasJsonLdType(html, "LocalBusiness")) graph.push(business);

  if (canonical || title) {
    graph.push({
      "@type": "WebPage",
      "@id": (canonical || "") + "#webpage",
      url: canonical || undefined,
      name: socialTitle,
      description: socialDesc || undefined,
      isPartOf: business ? { "@id": (canonical || "") + "#business" } : undefined,
      inLanguage: "en-US",
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "#about", "#faq", "header", "main"],
      },
    });
    graph.push({
      "@type": "BreadcrumbList",
      "@id": (canonical || "") + "#breadcrumbs",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: socialTitle,
          item: canonical || undefined,
        },
      ],
    });
  }

  if (!hasJsonLdType(html, "FAQPage")) {
    const faqs = extractFaqs(html);
    if (faqs.length) {
      graph.push({
        "@type": "FAQPage",
        "@id": (canonical || "") + "#faq",
        mainEntity: faqs.map(function (item) {
          return {
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          };
        }),
      });
    }
  }

  if (graph.length) {
    lines.push(
      jsonScript("ms-discover-graph", {
        "@context": "https://schema.org",
        "@graph": graph,
      })
    );
  }

  lines.push(MARK_END);
  return lines.join("\n");
}

function ensureDiscoverabilityHtml(html, ctx) {
  let out = String(html || "");
  if (!out.trim()) return out;
  out = out.replace(
    /<!--\s*moonrise-discoverability\s*-->[\s\S]*?<!--\s*\/moonrise-discoverability\s*-->/gi,
    ""
  );
  out = out.replace(/<script[^>]*id=["']ms-discover-(?:business|faq|graph)["'][^>]*>[\s\S]*?<\/script>/gi, "");
  if (!/<html\b[^>]*\blang=/i.test(out)) {
    out = out.replace(/<html\b([^>]*)>/i, '<html lang="en"$1>');
  }
  const title = clean(ctx && ctx.businessName, 120);
  if (title && !isPlaceholder(title)) {
    out = out.replace(/<title>\s*<\/title>/i, "<title>" + escapeHtml(title) + "</title>");
    out = out.replace(
      /<title>\s*(?:untitled(?:\s+business)?|document|page title)\s*<\/title>/i,
      "<title>" + escapeHtml(title) + "</title>"
    );
  }
  const existingDesc = metaContent(out, "description");
  if (existingDesc != null && (existingDesc.trim().length < 20 || isPlaceholder(existingDesc))) {
    out = out.replace(/<meta\b[^>]*name=["']description["'][^>]*>/i, "");
  }
  // Drop stale canonical / og:url that pointed at a prior website before live publish.
  const live = httpsUrl(ctx && ctx.canonicalUrl);
  if (live) {
    out = out.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
    out = out.replace(/<meta\b[^>]*property=["']og:url["'][^>]*>/gi, "");
  }
  if (!/<head[\s>]/i.test(out)) return out;
  const block = buildBlock(out, ctx || {});
  return out.replace(/<head([^>]*)>/i, "<head$1>\n" + block + "\n");
}

function factsFromProject(project, options) {
  const stored =
    project && project.business_context && typeof project.business_context === "object"
      ? project.business_context
      : {};
  const opts = options && typeof options === "object" ? options : {};
  const customRaw = stored.customDomain;
  const customHost =
    typeof customRaw === "string"
      ? customRaw
      : customRaw && typeof customRaw === "object"
        ? String(customRaw.hostname || customRaw.domain || "")
        : "";
  const customEnabled = stored.customDomainEnabled !== false;
  const published =
    httpsUrl(opts.liveUrl) ||
    httpsUrl(customEnabled ? customHost : "") ||
    httpsUrl(project && project.vercel_url) ||
    "";
  return {
    businessName: clean(project && project.business_name, 120) || clean(stored.businessName, 120),
    category: clean(stored.category, 80),
    phone: clean(stored.phone, 40),
    address: clean(stored.address, 180),
    description: clean(stored.description, 500),
    hours: clean(stored.hours, 180),
    mapsUrl: stored.mapsUrl || "",
    website: stored.website || "",
    canonicalUrl: published,
  };
}

function buildClientRobotsTxt(canonical) {
  const origin = httpsUrl(canonical);
  const lines = [
    "# Generated by Moonrise Studio",
    "User-agent: *",
    "Allow: /",
    "",
  ];
  if (origin) {
    lines.push("Allow: /llms.txt");
    lines.push("Sitemap: " + origin.replace(/\/$/, "") + "/sitemap.xml");
  }
  lines.push("");
  return lines.join("\n");
}

function buildClientSitemapXml(canonical) {
  const origin = httpsUrl(canonical);
  if (!origin) return "";
  const loc = origin.replace(/\/$/, "") + "/";
  const today = new Date().toISOString().slice(0, 10);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "  <url>\n" +
    "    <loc>" +
    escapeHtml(loc) +
    "</loc>\n" +
    "    <lastmod>" +
    today +
    "</lastmod>\n" +
    "    <changefreq>weekly</changefreq>\n" +
    "    <priority>1.0</priority>\n" +
    "  </url>\n" +
    "</urlset>\n"
  );
}

function buildClientLlmsTxt(ctx) {
  const name = clean(ctx && ctx.businessName, 120);
  if (!name || isPlaceholder(name)) return "";
  const category = clean(ctx && ctx.category, 80);
  const phone = clean(ctx && ctx.phone, 40);
  const address = clean(ctx && ctx.address, 180);
  const hours = clean(ctx && ctx.hours, 180);
  const description = buildDescription(ctx);
  const canonical = httpsUrl(ctx && ctx.canonicalUrl);
  const maps = httpsUrl(ctx && ctx.mapsUrl);
  const lines = [
    "# " + name,
    canonical ? "# " + canonical : "",
    "",
    "> " + (description || name + " is a local business website."),
    "",
    "## Business facts",
    "",
    "- Name: " + name,
  ];
  if (category) lines.push("- Category: " + category);
  if (phone) lines.push("- Phone: " + phone);
  if (address) lines.push("- Address: " + address);
  if (hours) lines.push("- Hours: " + hours);
  if (maps) lines.push("- Map: " + maps);
  if (canonical) lines.push("- Website: " + canonical);
  lines.push("");
  lines.push("## Cite");
  lines.push("");
  lines.push(
    "Use only the facts listed here. Do not invent reviews, ratings, years in business, awards, or services that are not stated on the page."
  );
  if (canonical) {
    lines.push("");
    lines.push("Primary page: " + canonical.replace(/\/$/, "") + "/");
  }
  lines.push("");
  return lines.filter((line, i) => !(i === 1 && !line)).join("\n");
}

function discoverabilityDeployFiles(project, options) {
  const facts = factsFromProject(project, options);
  const canonical = httpsUrl(facts.canonicalUrl);
  if (!canonical) return [];
  const files = [
    {
      file: "robots.txt",
      data: Buffer.from(buildClientRobotsTxt(canonical)).toString("base64"),
      encoding: "base64",
    },
    {
      file: "llms.txt",
      data: Buffer.from(buildClientLlmsTxt(facts)).toString("base64"),
      encoding: "base64",
    },
  ];
  const sitemap = buildClientSitemapXml(canonical);
  if (sitemap) {
    files.push({
      file: "sitemap.xml",
      data: Buffer.from(sitemap).toString("base64"),
      encoding: "base64",
    });
  }
  return files;
}

module.exports = {
  ensureDiscoverabilityHtml,
  factsFromProject,
  buildDescription,
  extractFaqs,
  buildClientRobotsTxt,
  buildClientSitemapXml,
  buildClientLlmsTxt,
  discoverabilityDeployFiles,
  httpsUrl,
};
