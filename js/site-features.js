/**
 * Optional site services. Each feature is a toggle; inside it, each provider
 * is its own toggle plus the link or number that should appear on the site.
 * Shared by the editor preview, publish, and website generation prompt.
 */
(function (factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.MoonriseSiteFeatures = api;
})(function siteFeaturesFactory() {
  const BLOCK_RE =
    /<!--\s*moonrise:site-features\s*-->[\s\S]*?<!--\s*\/moonrise:site-features\s*-->/gi;

  const ICONS = {
    booking:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>',
    payments:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
    quote:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    maps:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    reviews:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.4 4.8L20 8.6l-4 3.9.9 5.5L12 15.8 7.1 18l.9-5.5-4-3.9 5.6-.8z"/></svg>',
    social:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    messaging:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    ordering:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
    newsletter:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="m4 7 8 6 8-6"/></svg>',
  };

  function provider(id, label, extra) {
    return Object.assign({ id: id, label: label, input: "url", kind: "link" }, extra || {});
  }

  const FEATURES = [
    {
      id: "booking",
      title: "Booking System",
      siteTitle: "Book",
      summary: "Appointments on the site",
      emptyMessage: "Turn on a booking service and paste its link.",
      note: true,
      providers: [
        provider("cal", "Cal.com", { primary: true, placeholder: "https://cal.com/your-name", kind: "cal" }),
        provider("square", "Square Appointments", { placeholder: "https://squareup.com/appointments/book/..." }),
        provider("calendly", "Calendly", { placeholder: "https://calendly.com/your-name" }),
        provider("acuity", "Acuity", { placeholder: "https://yourbusiness.as.me" }),
        provider("setmore", "Setmore", { placeholder: "https://booking.setmore.com/scheduleappointment/..." }),
      ],
    },
    {
      id: "payments",
      title: "Payments",
      siteTitle: "Pay",
      summary: "How customers pay the business",
      emptyMessage: "Turn on a payment service and paste its link.",
      hint: "Shown on the website for customers. This is separate from the Website Price watermark.",
      note: true,
      providers: [
        provider("stripe", "Stripe", { primary: true, placeholder: "https://buy.stripe.com/..." }),
        provider("square", "Square", { placeholder: "https://square.link/u/..." }),
        provider("paypal", "PayPal", { placeholder: "https://paypal.me/yourbusiness" }),
        provider("venmo", "Venmo", { placeholder: "https://venmo.com/u/yourbusiness" }),
        provider("cashapp", "Cash App", { placeholder: "https://cash.app/$yourbusiness" }),
      ],
    },
    {
      id: "quote",
      title: "Quote / Leads",
      siteTitle: "Request a quote",
      summary: "Forms that collect a lead",
      emptyMessage: "Turn on a form service and paste its link.",
      note: true,
      providers: [
        provider("tally", "Tally", { primary: true, placeholder: "https://tally.so/r/your-form", kind: "tally" }),
        provider("typeform", "Typeform", { placeholder: "https://form.typeform.com/to/your-form", kind: "typeform" }),
        provider("jotform", "Jotform", { placeholder: "https://form.jotform.com/your-form", kind: "jotform" }),
        provider("formspree", "Formspree", { placeholder: "https://formspree.io/f/your-id", kind: "formspree" }),
        provider("googleforms", "Google Forms", { placeholder: "https://docs.google.com/forms/d/e/.../viewform" }),
      ],
    },
    {
      id: "maps",
      title: "Maps",
      siteTitle: "Find us",
      summary: "Address and directions",
      emptyMessage: "Turn on a map service and add an address or link.",
      note: true,
      providers: [
        provider("google", "Google Maps", {
          primary: true,
          input: "place",
          kind: "google-map",
          placeholder: "120 Main St, Austin or a Google Maps link",
        }),
        provider("apple", "Apple Maps", {
          input: "place",
          kind: "apple-map",
          placeholder: "Address or an Apple Maps link",
        }),
        provider("mapbox", "Mapbox", { kind: "mapbox", placeholder: "https://api.mapbox.com/... or a Mapbox map link" }),
        provider("waze", "Waze", { input: "place", kind: "waze", placeholder: "Address or a Waze link" }),
      ],
    },
    {
      id: "reviews",
      title: "Reviews",
      siteTitle: "Reviews",
      summary: "Links to public reviews",
      emptyMessage: "Turn on a review site and paste the business page.",
      providers: [
        provider("google", "Google Maps", { primary: true, placeholder: "https://maps.google.com/?cid=..." }),
        provider("yelp", "Yelp", { placeholder: "https://www.yelp.com/biz/your-business" }),
        provider("trustpilot", "Trustpilot", { placeholder: "https://www.trustpilot.com/review/yourbusiness.com" }),
        provider("facebook", "Facebook", { placeholder: "https://facebook.com/yourbusiness/reviews" }),
      ],
    },
    {
      id: "social",
      title: "Social",
      siteTitle: "Social",
      summary: "Profile links",
      emptyMessage: "Turn on a network and paste the profile link.",
      providers: [
        provider("instagram", "Instagram", { primary: true, placeholder: "https://instagram.com/yourbusiness" }),
        provider("tiktok", "TikTok", { placeholder: "https://www.tiktok.com/@yourbusiness" }),
        provider("facebook", "Facebook", { placeholder: "https://facebook.com/yourbusiness" }),
        provider("youtube", "YouTube", { kind: "youtube", placeholder: "https://youtube.com/@yourbusiness" }),
        provider("x", "X", { placeholder: "https://x.com/yourbusiness" }),
        provider("linkedin", "LinkedIn", { placeholder: "https://linkedin.com/company/yourbusiness" }),
        provider("nextdoor", "Nextdoor", { placeholder: "https://nextdoor.com/pages/your-business" }),
        provider("pinterest", "Pinterest", { placeholder: "https://pinterest.com/yourbusiness" }),
      ],
    },
    {
      id: "messaging",
      title: "Messaging",
      siteTitle: "Message us",
      summary: "Text, chat, or call",
      emptyMessage: "Turn on a channel and add the number or link.",
      providers: [
        provider("sms", "SMS", { primary: true, input: "phone", kind: "sms", placeholder: "(512) 555-0148" }),
        provider("whatsapp", "WhatsApp", { input: "phone", kind: "whatsapp", placeholder: "+1 512 555 0148" }),
        provider("call", "Phone call", { input: "phone", kind: "tel", placeholder: "(512) 555-0148" }),
        provider("messenger", "Messenger", { placeholder: "https://m.me/yourbusiness" }),
        provider("email", "Email", { input: "email", kind: "email", placeholder: "hello@business.com" }),
        provider("telegram", "Telegram", { placeholder: "https://t.me/yourbusiness" }),
      ],
    },
    {
      id: "ordering",
      title: "Ordering",
      siteTitle: "Order",
      summary: "Online orders and menus",
      emptyMessage: "Turn on an ordering service and paste its link.",
      providers: [
        provider("square", "Square Online", { primary: true, placeholder: "https://yourbusiness.square.site" }),
        provider("shopify", "Shopify", { placeholder: "https://yourbusiness.myshopify.com" }),
        provider("toast", "Toast", { placeholder: "https://www.toasttab.com/local/..." }),
        provider("doordash", "DoorDash", { placeholder: "https://www.doordash.com/store/..." }),
      ],
    },
    {
      id: "newsletter",
      title: "Newsletter",
      siteTitle: "Stay in touch",
      summary: "Email signup",
      emptyMessage: "Turn on a newsletter service and paste the signup link.",
      providers: [
        provider("mailchimp", "Mailchimp", { primary: true, placeholder: "https://yourbusiness.us1.list-manage.com/subscribe?u=..." }),
        provider("beehiiv", "Beehiiv", { placeholder: "https://yourbusiness.beehiiv.com" }),
        provider("substack", "Substack", { placeholder: "https://yourbusiness.substack.com" }),
      ],
    },
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clip(value, max) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function featureById(id) {
    return FEATURES.find((feature) => feature.id === id) || null;
  }

  function safeHref(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    let url;
    try {
      url = new URL(value);
    } catch (_) {
      if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(value)) {
        try {
          url = new URL("https://" + value);
        } catch (__) {
          return "";
        }
      } else {
        return "";
      }
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.href;
  }

  function emailOk(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function phoneDigits(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return "";
    return digits;
  }

  function dialHref(raw, scheme) {
    const digits = phoneDigits(raw);
    if (!digits) return "";
    const plus = String(raw || "").trim().startsWith("+");
    return scheme + ":" + (plus ? "+" : "") + digits;
  }

  function placeText(value) {
    const href = safeHref(value);
    if (href) return href;
    const text = clip(value, 240);
    return text.length >= 6 ? text : "";
  }

  function providerValueOk(item, value) {
    if (item.input === "phone") return !!phoneDigits(value);
    if (item.input === "email") return emailOk(value);
    if (item.input === "place") return !!placeText(value);
    return !!safeHref(value);
  }

  function emptyProviders(feature) {
    const providers = {};
    feature.providers.forEach((item) => {
      providers[item.id] = { on: false, value: "" };
    });
    return providers;
  }

  function legacyProviderValues(feature, source) {
    const out = {};
    const put = (id, value) => {
      if (!feature.providers.some((item) => item.id === id)) return;
      const text = String(value || "").trim();
      if (!text || out[id]) return;
      out[id] = { on: true, value: text };
    };
    const url = String(source.url || "");
    if (feature.id === "booking") {
      if (/cal\.com/i.test(url)) put("cal", url);
      else if (/square/i.test(url)) put("square", url);
      else if (/calendly/i.test(url)) put("calendly", url);
      else if (/acuity|as\.me/i.test(url)) put("acuity", url);
      else if (/setmore/i.test(url)) put("setmore", url);
      else put("cal", url);
    } else if (feature.id === "payments") {
      if (/square/i.test(url)) put("square", url);
      else if (/paypal/i.test(url)) put("paypal", url);
      else if (/venmo/i.test(url)) put("venmo", url);
      else if (/cash\.app/i.test(url)) put("cashapp", url);
      else put("stripe", url);
    } else if (feature.id === "quote") {
      if (/typeform/i.test(url)) put("typeform", url);
      else if (/jotform/i.test(url)) put("jotform", url);
      else if (/formspree/i.test(url)) put("formspree", url);
      else if (/docs\.google\.com\/forms/i.test(url)) put("googleforms", url);
      else put("tally", url);
    } else if (feature.id === "maps") {
      put("google", source.url || source.address);
    } else if (feature.id === "social") {
      feature.providers.forEach((item) => put(item.id, source[item.id]));
    } else if (feature.id === "messaging") {
      put("sms", source.sms || source.phone);
      put("whatsapp", source.whatsapp);
      put("call", source.phone);
      put("email", source.email);
      put("messenger", source.url);
    }
    return out;
  }

  function normalizeFeature(feature, raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const values = { enabled: source.enabled === true, note: "", providers: emptyProviders(feature) };
    if (feature.note) values.note = clip(source.note, 400);
    const incoming =
      source.providers && typeof source.providers === "object"
        ? source.providers
        : legacyProviderValues(feature, source);
    feature.providers.forEach((item) => {
      const row = incoming[item.id];
      const on = !!(row && (row.on === true || row.enabled === true));
      const max = item.input === "place" ? 500 : 300;
      const value = clip(row && row.value, max);
      values.providers[item.id] = { on: on, value: value };
    });
    const configured = values.enabled || feature.providers.some((item) => values.providers[item.id].on && values.providers[item.id].value);
    if (source.source === "user") values.source = "user";
    else if (source.source === "auto") values.source = "auto";
    else if (configured) values.source = "user";
    else values.source = "";
    return values;
  }

  function readConfig(businessContext) {
    const ctx = businessContext && typeof businessContext === "object" ? businessContext : {};
    const raw = ctx.siteFeatures && typeof ctx.siteFeatures === "object" ? ctx.siteFeatures : {};
    const out = {};
    FEATURES.forEach((feature) => {
      out[feature.id] = normalizeFeature(feature, raw[feature.id]);
    });
    return out;
  }

  function pageUrls(html) {
    const urls = [];
    const re = /(?:href|src)\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
    let match;
    while ((match = re.exec(String(html || "")))) {
      urls.push(match[1].replace(/&amp;/g, "&"));
    }
    return urls;
  }

  function hostOf(href) {
    try {
      return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function ignoredHost(host) {
    return /unsplash|fonts\.|gstatic|googleusercontent|moonrise|js\.stripe|checkout\.stripe|hooks\.stripe|m\.stripe|googletagmanager|google-analytics/.test(host);
  }

  function firstTel(html) {
    const re = /href\s*=\s*["']tel:([^"']+)["']/gi;
    let match;
    while ((match = re.exec(String(html || "")))) {
      const raw = decodeURIComponent(match[1]).trim();
      if (phoneDigits(raw)) return raw;
    }
    return "";
  }

  function firstMailto(html) {
    const re = /href\s*=\s*["']mailto:([^"'?]+)/gi;
    let match;
    while ((match = re.exec(String(html || "")))) {
      const raw = decodeURIComponent(match[1]).trim();
      if (emailOk(raw) && !/example\.com|moonrise|wix\.com|sentry/i.test(raw)) return raw;
    }
    return "";
  }

  function mapQuery(href) {
    try {
      const url = new URL(href);
      const query = url.searchParams.get("q") || url.searchParams.get("query") || "";
      const text = clip(query, 240);
      if (text.length >= 6 && !/^https?:/i.test(text)) return text;
    } catch (_) {
      return "";
    }
    return "";
  }

  function classifyLink(href) {
    const host = hostOf(href);
    if (!host || ignoredHost(host)) return null;
    const path = (() => {
      try {
        return new URL(href).pathname.toLowerCase();
      } catch (_) {
        return "";
      }
    })();
    if (host === "instagram.com") return ["social", "instagram", href];
    if (host === "tiktok.com") return ["social", "tiktok", href];
    if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") return ["social", "youtube", href];
    if (host === "x.com" || host === "twitter.com") return ["social", "x", href];
    if (host === "linkedin.com") return ["social", "linkedin", href];
    if (host === "nextdoor.com") return ["social", "nextdoor", href];
    if (host === "pinterest.com" || host === "pin.it") return ["social", "pinterest", href];
    if (/(^|\.)facebook\.com$/.test(host) || host === "fb.com" || host === "m.me") {
      if (host === "m.me") return ["messaging", "messenger", href];
      if (/review/.test(path)) return ["reviews", "facebook", href];
      return ["social", "facebook", href];
    }
    if (host === "yelp.com") return ["reviews", "yelp", href];
    if (host === "trustpilot.com") return ["reviews", "trustpilot", href];
    if (/maps\.google\.|google\.[a-z.]+$/.test(host) && /\/maps|maps\.google/.test(href)) {
      return ["maps", "google", href];
    }
    if (host === "maps.apple.com") return ["maps", "apple", href];
    if (host === "waze.com") return ["maps", "waze", href];
    if (/(^|\.)mapbox\.com$/.test(host)) return ["maps", "mapbox", href];
    if (/(^|\.)cal\.com$/.test(host)) return ["booking", "cal", href];
    if (/(^|\.)calendly\.com$/.test(host)) return ["booking", "calendly", href];
    if (/squareup\.com$/.test(host) && /appointment|book/.test(path)) return ["booking", "square", href];
    if (/(^|\.)as\.me$/.test(host) || /acuityscheduling\.com$/.test(host)) return ["booking", "acuity", href];
    if (/(^|\.)setmore\.com$/.test(host)) return ["booking", "setmore", href];
    if (host === "buy.stripe.com") return ["payments", "stripe", href];
    if (host === "paypal.com" || host === "paypal.me") return ["payments", "paypal", href];
    if (host === "venmo.com") return ["payments", "venmo", href];
    if (host === "cash.app") return ["payments", "cashapp", href];
    if (host === "square.link") return ["payments", "square", href];
    if (/(^|\.)tally\.so$/.test(host)) return ["quote", "tally", href];
    if (/(^|\.)typeform\.com$/.test(host)) return ["quote", "typeform", href];
    if (/(^|\.)jotform\.com$/.test(host)) return ["quote", "jotform", href];
    if (/(^|\.)formspree\.io$/.test(host)) return ["quote", "formspree", href];
    if (host === "docs.google.com" && path.indexOf("/forms") !== -1) return ["quote", "googleforms", href];
    if (/(^|\.)square\.site$/.test(host)) return ["ordering", "square", href];
    if (/(^|\.)myshopify\.com$/.test(host)) return ["ordering", "shopify", href];
    if (/(^|\.)toasttab\.com$/.test(host)) return ["ordering", "toast", href];
    if (/(^|\.)doordash\.com$/.test(host)) return ["ordering", "doordash", href];
    if (/list-manage\.com$/.test(host) || host === "mailchimp.com") return ["newsletter", "mailchimp", href];
    if (/(^|\.)beehiiv\.com$/.test(host)) return ["newsletter", "beehiiv", href];
    if (/(^|\.)substack\.com$/.test(host)) return ["newsletter", "substack", href];
    if (host === "wa.me" || host === "api.whatsapp.com") {
      const digits = phoneDigits(href);
      return digits ? ["messaging", "whatsapp", "+" + digits] : null;
    }
    if (/(^|\.)t\.me$/.test(host)) return ["messaging", "telegram", href];
    if (/[?&]cid=|\/maps\/place|\/review/.test(href) && /google\.|maps\./.test(host)) {
      return ["reviews", "google", href];
    }
    return null;
  }

  function detectSignals(html, businessContext) {
    const page = stripSiteFeatureBlocks(String(html || ""));
    const ctx = businessContext && typeof businessContext === "object" ? businessContext : {};
    const found = {};
    const put = (featureId, providerId, value) => {
      const text = clip(value, 500);
      if (!text) return;
      if (!found[featureId]) found[featureId] = {};
      if (!found[featureId][providerId]) found[featureId][providerId] = text;
    };

    const phone = phoneDigits(ctx.phone) ? String(ctx.phone).trim() : firstTel(page);
    if (phoneDigits(phone)) {
      put("messaging", "sms", phone);
      put("messaging", "call", phone);
    }
    const email = emailOk(ctx.email) ? String(ctx.email).trim() : firstMailto(page);
    if (emailOk(email)) put("messaging", "email", email);

    const address = clip(ctx.address, 240);
    let mapLink = "";
    pageUrls(page).concat(safeHref(ctx.mapsUrl) ? [safeHref(ctx.mapsUrl)] : []).forEach((href) => {
      const hit = classifyLink(href);
      if (!hit) return;
      if (hit[0] === "maps" && hit[1] === "google") {
        mapLink = mapLink || mapQuery(href) || href;
        if (/[?&]cid=|\/maps\/place/.test(href)) put("reviews", "google", href);
        return;
      }
      put(hit[0], hit[1], hit[2]);
    });
    if (address.length >= 6) put("maps", "google", address);
    else if (mapLink) put("maps", "google", mapLink);

    return found;
  }

  function detectAndSeed(config, details) {
    const current = config && config.booking && config.booking.providers ? config : readConfig(config);
    const found = detectSignals(details && details.html, details && details.businessContext);
    const next = {};
    let changed = false;
    FEATURES.forEach((feature) => {
      const values = current[feature.id];
      const detected = found[feature.id] || {};
      const ids = feature.providers.filter((item) => detected[item.id] && providerValueOk(item, detected[item.id]));
      if (values.source === "user" || !ids.length) {
        next[feature.id] = values;
        return;
      }
      const providers = {};
      feature.providers.forEach((item) => {
        providers[item.id] = { on: values.providers[item.id].on, value: values.providers[item.id].value };
      });
      ids.forEach((item) => {
        const max = item.input === "place" ? 500 : 300;
        const value = clip(detected[item.id], max);
        if (!providers[item.id].on || providers[item.id].value !== value) {
          providers[item.id] = { on: true, value: value };
        }
      });
      const updated = { enabled: true, note: values.note || "", providers: providers, source: "auto" };
      if (JSON.stringify(updated) !== JSON.stringify(values)) changed = true;
      next[feature.id] = updated;
    });
    return { config: next, changed: changed };
  }

  function selectedProviders(feature, values) {
    return feature.providers.filter((item) => {
      const row = values.providers && values.providers[item.id];
      return row && row.on && providerValueOk(item, row.value);
    });
  }

  function hasContent(feature, values) {
    return selectedProviders(feature, values).length > 0;
  }

  function hasActiveServices(config) {
    if (!config) return false;
    return FEATURES.some((feature) => {
      const values = config[feature.id];
      return values && values.enabled && hasContent(feature, values);
    });
  }

  function validateFeature(feature, values) {
    if (!values.enabled) return "";
    const turnedOn = feature.providers.filter((item) => values.providers[item.id] && values.providers[item.id].on);
    if (!turnedOn.length) return feature.emptyMessage;
    for (const item of turnedOn) {
      const value = values.providers[item.id].value;
      if (!providerValueOk(item, value)) {
        if (item.input === "phone") return "Enter a number with at least 7 digits for " + item.label + ".";
        if (item.input === "email") return "Enter a valid email for " + item.label + ".";
        if (item.input === "place") return "Add an address or link for " + item.label + ".";
        return "Enter a valid link for " + item.label + ".";
      }
    }
    return "";
  }

  function isAppLink(href) {
    return /^(tel:|sms:|mailto:)/i.test(String(href || ""));
  }

  function actionLink(href, label, ghost) {
    const external = !isAppLink(href);
    return (
      '<a class="' +
      (ghost ? "mr-ghost" : "mr-solid") +
      '" href="' +
      escapeHtml(href) +
      '"' +
      (external ? ' target="_blank" rel="noopener noreferrer"' : "") +
      ">" +
      escapeHtml(label) +
      "</a>"
    );
  }

  function iframe(title, src, map) {
    return (
      '<div class="' +
      (map ? "mr-map" : "mr-embed") +
      '"><iframe title="' +
      escapeHtml(title) +
      '" src="' +
      escapeHtml(src) +
      '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>'
    );
  }

  function hostIs(href, pattern) {
    try {
      return pattern.test(new URL(href).hostname.replace(/^www\./, ""));
    } catch (_) {
      return false;
    }
  }

  function providerHref(item, value) {
    if (item.kind === "sms") return dialHref(value, "sms");
    if (item.kind === "tel") return dialHref(value, "tel");
    if (item.kind === "whatsapp") {
      const digits = phoneDigits(value);
      return digits ? "https://wa.me/" + digits : "";
    }
    if (item.kind === "email") return emailOk(value) ? "mailto:" + String(value).trim() : "";
    if (item.input === "place") {
      const href = safeHref(value);
      if (href) return href;
      const query = placeText(value);
      if (!query) return "";
      if (item.kind === "google-map") return "https://maps.google.com/?q=" + encodeURIComponent(query);
      if (item.kind === "apple-map") return "https://maps.apple.com/?q=" + encodeURIComponent(query);
      if (item.kind === "waze") return "https://www.waze.com/ul?q=" + encodeURIComponent(query);
      return "";
    }
    return safeHref(value);
  }

  function providerEmbed(item, value) {
    const href = safeHref(value);
    if (item.kind === "cal" && href && hostIs(href, /(^|\.)cal\.com$/)) {
      const url = new URL(href);
      let path = url.pathname.replace(/\/$/, "");
      if (!/\/embed$/.test(path)) path += "/embed";
      return iframe("Book on Cal.com", url.origin + path);
    }
    if (item.kind === "tally" && href && hostIs(href, /(^|\.)tally\.so$/)) {
      const url = new URL(href);
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id) return iframe("Quote form", "https://tally.so/embed/" + encodeURIComponent(id) + "?alignLeft=1&hideTitle=1");
    }
    if (item.kind === "typeform" && href && hostIs(href, /(^|\.)typeform\.com$/)) {
      return iframe("Quote form", href);
    }
    if (item.kind === "jotform" && href && hostIs(href, /(^|\.)jotform\.com$/)) {
      return iframe("Quote form", href);
    }
    if (item.kind === "formspree" && href && hostIs(href, /(^|\.)formspree\.io$/) && /\/f\/[a-z0-9]+/i.test(href)) {
      return (
        '<form class="mr-form" data-moonrise-native="1" action="' +
        escapeHtml(href) +
        '" method="POST">' +
        '<label>Name<input name="name" autocomplete="name" required></label>' +
        '<label>Email<input name="email" type="email" autocomplete="email" required></label>' +
        '<label>Project<textarea name="message" required></textarea></label>' +
        '<button type="submit">Send</button></form>'
      );
    }
    if (item.kind === "google-map") {
      const direct = href && /google\./i.test(href) && /output=embed|\/maps\/embed/.test(href) ? href : "";
      const query = placeText(value);
      const src = direct || (query ? "https://maps.google.com/maps?q=" + encodeURIComponent(query) + "&output=embed" : "");
      return src ? iframe("Google Maps", src, true) : "";
    }
    if (item.kind === "mapbox" && href && hostIs(href, /(^|\.)mapbox\.com$/)) {
      if (/\/(styles|embed)\//i.test(href) || /[?&](embed|access_token)=/i.test(href)) {
        return iframe("Mapbox map", href, true);
      }
      return "";
    }
    if (item.kind === "youtube" && href) {
      let id = "";
      try {
        const url = new URL(href);
        if (url.hostname.replace(/^www\./, "") === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
        else if (/youtube\.com$/.test(url.hostname.replace(/^www\./, ""))) id = url.searchParams.get("v") || "";
      } catch (_) {
        id = "";
      }
      if (/^[a-zA-Z0-9_-]{6,}$/.test(id)) {
        return iframe("YouTube video", "https://www.youtube-nocookie.com/embed/" + id);
      }
    }
    return "";
  }

  function linkLabel(item) {
    if (item.kind === "sms") return "Text";
    if (item.kind === "whatsapp") return "WhatsApp";
    if (item.kind === "tel") return "Call";
    if (item.kind === "email") return "Email";
    if (item.kind === "google-map") return "Open in Google Maps";
    if (item.kind === "apple-map") return "Open in Apple Maps";
    if (item.kind === "waze") return "Open in Waze";
    return item.label;
  }

  function card(title, body, extra) {
    const bodyHtml = body ? "<p>" + escapeHtml(body).replace(/\n/g, "<br>") + "</p>" : "";
    return (
      '<article class="mr-feature"><h2>' +
      escapeHtml(title) +
      "</h2>" +
      bodyHtml +
      (extra || "") +
      "</article>"
    );
  }

  function renderFeature(feature, values) {
    const active = selectedProviders(feature, values);
    if (!active.length) return "";
    const primary = active.find((item) => item.primary) || active[0];
    const embed = active
      .map((item) => {
        if (item !== primary && item.kind !== "formspree") return "";
        return providerEmbed(item, values.providers[item.id].value);
      })
      .join("");
    const links = active
      .map((item, index) => {
        const href = providerHref(item, values.providers[item.id].value);
        if (!href || item.kind === "formspree") return "";
        return actionLink(href, linkLabel(item), index > 0 || !!embed);
      })
      .filter(Boolean)
      .join("");
    return card(feature.siteTitle, values.note, embed + (links ? '<div class="mr-actions">' + links + "</div>" : ""));
  }

  function featureStyles() {
    return (
      "<style>" +
      "#moonrise-site-features{box-sizing:border-box;clear:both;position:relative;margin:0;padding:clamp(2.5rem,6vw,4.5rem) clamp(1rem,4vw,1.5rem);color:var(--ink,inherit);background:transparent;font-family:inherit;line-height:1.5;text-align:start;overflow:visible!important;overflow-wrap:anywhere}" +
      "#moonrise-site-features *,#moonrise-site-features *::before,#moonrise-site-features *::after{box-sizing:border-box}" +
      "#moonrise-site-features .mr-features-inner{max-width:min(1080px,100%);margin:0 auto;display:grid;gap:1rem}" +
      "#moonrise-site-features .mr-feature{margin:0;border:1px solid var(--border,rgba(127,127,127,.35));border-radius:var(--radius-lg,16px);padding:1.2rem 1.3rem;background:var(--surface,transparent);color:inherit;box-shadow:none}" +
      "#moonrise-site-features h2{margin:0 0 .35rem;font-family:inherit;font-size:clamp(1.25rem,2vw,1.6rem);font-weight:680;line-height:1.2;letter-spacing:inherit;color:var(--ink,inherit)}" +
      "#moonrise-site-features p{margin:.35rem 0 0;font-size:1rem;line-height:1.5;color:var(--muted,inherit)}" +
      "#moonrise-site-features .mr-actions{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.95rem}" +
      "#moonrise-site-features a.mr-solid,#moonrise-site-features a.mr-ghost,#moonrise-site-features .mr-form button{display:inline-flex!important;align-items:center;justify-content:center;width:auto!important;max-width:100%;min-height:44px;margin:0;padding:.65rem 1.1rem;border-radius:var(--radius-md,12px);text-decoration:none!important;font-family:inherit;font-size:1rem;font-weight:650;line-height:1.2;cursor:pointer;box-shadow:none}" +
      "#moonrise-site-features a.mr-solid,#moonrise-site-features .mr-form button{background:var(--accent,#111)!important;color:var(--bg,#fff)!important;border:0!important}" +
      "#moonrise-site-features a.mr-ghost{background:transparent!important;color:var(--ink,inherit)!important;border:1px solid var(--border,rgba(127,127,127,.45))!important}" +
      "#moonrise-site-features a:focus-visible,#moonrise-site-features button:focus-visible,#moonrise-site-features input:focus-visible,#moonrise-site-features textarea:focus-visible{outline:2px solid var(--accent,currentColor);outline-offset:2px}" +
      "#moonrise-site-features .mr-map,#moonrise-site-features .mr-embed{margin-top:.85rem;border-radius:var(--radius-md,12px);overflow:hidden;background:var(--surface,transparent)}" +
      "#moonrise-site-features .mr-map{aspect-ratio:16/9}" +
      "#moonrise-site-features .mr-embed{min-height:420px}" +
      "#moonrise-site-features iframe{display:block!important;width:100%!important;max-width:100%!important;border:0!important;background:transparent}" +
      "#moonrise-site-features .mr-map iframe{height:100%!important;min-height:220px!important}" +
      "#moonrise-site-features .mr-embed iframe{height:480px!important;min-height:360px!important}" +
      "#moonrise-site-features .mr-form{display:grid;gap:.65rem;margin-top:.85rem}" +
      "#moonrise-site-features .mr-form label{display:grid;gap:.3rem;margin:0;font-size:.95rem;font-weight:600;color:var(--ink,inherit)}" +
      "#moonrise-site-features .mr-form input,#moonrise-site-features .mr-form textarea{width:100%!important;max-width:100%;min-height:44px;margin:0;padding:.6rem .75rem;border-radius:var(--radius-sm,10px);border:1px solid var(--border,rgba(127,127,127,.45))!important;background:var(--bg,transparent)!important;color:var(--ink,inherit)!important;font:inherit;box-shadow:none}" +
      "#moonrise-site-features .mr-form textarea{min-height:110px;resize:vertical}" +
      "@media (min-width:800px){#moonrise-site-features .mr-features-inner{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}#moonrise-site-features .mr-feature:has(.mr-embed),#moonrise-site-features .mr-feature:has(.mr-map),#moonrise-site-features .mr-feature:has(.mr-form){grid-column:1/-1}}" +
      "@media (max-width:700px){#moonrise-site-features .mr-embed iframe{height:70vh!important;min-height:360px!important}}" +
      "@media (prefers-reduced-motion:reduce){#moonrise-site-features *{transition:none!important;animation:none!important}}" +
      "</style>"
    );
  }

  function renderBlocks(config) {
    const cards = FEATURES.map((feature) => {
      const values = config[feature.id];
      if (!values || !values.enabled || !hasContent(feature, values)) return "";
      return renderFeature(feature, values);
    }).filter(Boolean);
    if (!cards.length) return "";
    return (
      "<!-- moonrise:site-features -->\n" +
      '<section class="mr-features" id="moonrise-site-features" aria-label="Connected services">' +
      featureStyles() +
      '<div class="mr-features-inner">' +
      cards.join("") +
      "</div></section>\n" +
      "<!-- /moonrise:site-features -->"
    );
  }

  function stripSiteFeatureBlocks(html) {
    return String(html || "").replace(BLOCK_RE, "");
  }

  function resolveConfig(config) {
    if (config && config.booking && config.booking.providers) return config;
    if (config && config.siteFeatures) return readConfig(config);
    return config || {};
  }

  function lastMatchIndex(html, re) {
    const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
    const copy = new RegExp(re.source, flags);
    let index = -1;
    let match;
    while ((match = copy.exec(html))) index = match.index;
    return index;
  }

  function primaryHref(config, featureId) {
    const feature = featureById(featureId);
    const values = config && config[featureId];
    if (!feature || !values || !values.enabled) return "";
    const active = selectedProviders(feature, values);
    const primary = active.find((item) => item.primary) || active[0];
    if (!primary) return "";
    return providerHref(primary, values.providers[primary.id].value);
  }

  function isPlaceholderHref(dest) {
    const value = String(dest || "").trim();
    if (!value || value === "#" || value === "/") return true;
    if (/^(javascript:|about:blank)/i.test(value)) return true;
    return value.charAt(0) === "#";
  }

  function wirePlaceholderAnchors(html, href, labelRe) {
    if (!href || !labelRe) return html;
    return html.replace(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi, (full, attrs, inner) => {
      const visible = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (!visible || visible.length > 48 || !labelRe.test(visible)) return full;
      const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])([\s\S]*?)\1/i);
      if (!hrefMatch || !isPlaceholderHref(hrefMatch[2])) return full;
      const quoted = 'href="' + escapeHtml(href) + '"';
      return "<a" + attrs.replace(hrefMatch[0], quoted) + ">" + inner + "</a>";
    });
  }

  function wireConnectedActions(html, config) {
    let out = html;
    [
      ["booking", /\b(book|schedule|appointment)\b/i],
      ["payments", /\b(pay|checkout|payment)\b/i],
      ["quote", /\b(quote|estimate)\b/i],
      ["ordering", /\border\b/i],
    ].forEach(([id, labelRe]) => {
      out = wirePlaceholderAnchors(out, primaryHref(config, id), labelRe);
    });
    ["social", "reviews", "messaging", "maps"].forEach((id) => {
      const feature = featureById(id);
      const values = config[id];
      if (!feature || !values || !values.enabled) return;
      selectedProviders(feature, values).forEach((item) => {
        const href = providerHref(item, values.providers[item.id].value);
        const label = String(item.label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (!href || !label) return;
        out = wirePlaceholderAnchors(out, href, new RegExp("\\b" + label + "\\b", "i"));
      });
    });
    return out;
  }

  function embedHosts(config) {
    const hosts = new Set();
    FEATURES.forEach((feature) => {
      const values = config[feature.id];
      if (!values || !values.enabled) return;
      const active = selectedProviders(feature, values);
      const primary = active.find((item) => item.primary) || active[0];
      active.forEach((item) => {
        if (item !== primary && item.kind !== "formspree") return;
        const value = values.providers[item.id].value;
        if (!providerEmbed(item, value)) return;
        const href = providerHref(item, value);
        if (item.kind === "cal" && href && hostIs(href, /(^|\.)cal\.com$/)) hosts.add("https://cal.com");
        if (item.kind === "tally" && href && hostIs(href, /(^|\.)tally\.so$/)) hosts.add("https://tally.so");
        if (item.kind === "typeform" && href && hostIs(href, /(^|\.)typeform\.com$/)) hosts.add("https://form.typeform.com");
        if (item.kind === "jotform" && href && hostIs(href, /(^|\.)jotform\.com$/)) hosts.add("https://form.jotform.com");
        if (item.kind === "google-map") {
          hosts.add("https://maps.google.com");
          hosts.add("https://www.google.com");
        }
        if (item.kind === "mapbox") hosts.add("https://api.mapbox.com");
        if (item.kind === "youtube") hosts.add("https://www.youtube-nocookie.com");
        if (item.kind === "formspree" && href && hostIs(href, /(^|\.)formspree\.io$/)) hosts.add("https://formspree.io");
      });
    });
    return [...hosts];
  }

  function expandPolicy(policy, hosts) {
    const frameHosts = hosts.filter((host) => host !== "https://formspree.io");
    const directives = String(policy || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const bits = part.split(/\s+/);
        return { name: bits[0].toLowerCase(), sources: bits.slice(1) };
      });
    const ensure = (name, extra) => {
      let row = directives.find((item) => item.name === name);
      if (!row) {
        const fallback = directives.find((item) => item.name === "default-src");
        row = { name: name, sources: fallback ? fallback.sources.slice() : ["'self'"] };
        directives.push(row);
      }
      extra.forEach((host) => {
        if (row.sources.indexOf(host) === -1) row.sources.push(host);
      });
      if (row.sources.some((source) => source.toLowerCase() === "'none'") && row.sources.length > 1) {
        row.sources = row.sources.filter((source) => source.toLowerCase() !== "'none'");
        if (!row.sources.some((source) => source === "'self'" || source === "*")) row.sources.unshift("'self'");
      }
    };
    ensure("style-src", ["'unsafe-inline'"]);
    if (frameHosts.length) ensure("frame-src", frameHosts);
    if (hosts.indexOf("https://formspree.io") !== -1) ensure("form-action", ["https://formspree.io"]);
    return directives.map((item) => [item.name].concat(item.sources).join(" ")).join("; ");
  }

  function patchCsp(html, hosts) {
    if (!/Content-Security-Policy/i.test(html)) return html;
    return html.replace(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, (tag) => {
      const contentMatch = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
      if (!contentMatch) return tag;
      const next = expandPolicy(contentMatch[2], hosts);
      if (next === contentMatch[2]) return tag;
      return tag.replace(contentMatch[0], "content=" + contentMatch[1] + next + contentMatch[1]);
    });
  }

  function insertBlock(base, block) {
    const mainAt = lastMatchIndex(base, /<\/main>/gi);
    if (mainAt > base.length * 0.35) return base.slice(0, mainAt) + block + base.slice(mainAt);
    const footerAt = lastMatchIndex(base, /<footer\b[^>]*>/gi);
    if (footerAt > base.length * 0.35) return base.slice(0, footerAt) + block + base.slice(footerAt);
    if (/<\/body>/i.test(base)) return base.replace(/<\/body>/i, block + "</body>");
    return base + block;
  }

  function applyToHtml(html, config) {
    const resolved = resolveConfig(config);
    let base = stripSiteFeatureBlocks(html);
    const block = renderBlocks(resolved);
    if (!block) return base;
    base = wireConnectedActions(base, resolved);
    base = patchCsp(base, embedHosts(resolved));
    return insertBlock(base, block);
  }

  function formatForPrompt(config) {
    const source = config && config.booking && config.booking.providers ? config : readConfig(config);
    const lines = [];
    FEATURES.forEach((feature) => {
      const values = source[feature.id];
      if (!values || !values.enabled) return;
      const active = selectedProviders(feature, values);
      if (!active.length) return;
      const primary = active.find((item) => item.primary) || active[0];
      const bits = active.map((item) => {
        const href = providerHref(item, values.providers[item.id].value);
        return item.label + (item.primary ? " (primary)" : "") + ": " + (href || values.providers[item.id].value);
      });
      lines.push("- " + feature.title + ": " + bits.join("; "));
      lines.push("  Point the existing " + feature.siteTitle + " control at " + primary.label + ".");
    });
    if (!lines.length) return "";
    return [
      "## Connected services (use these exact destinations)",
      "The creator turned these services on. Point the existing nav, hero, pricing, contact, and footer buttons at the primary URL for that feature.",
      "Keep those as normal links. Do not add a second booking, payment, map, review, or social section, and do not add iframe or embed code.",
      "Publishing inserts one section before the footer. It uses the page :root tokens (--bg, --surface, --ink, --muted, --accent, --border, --radius-md). Leave the footer as a real <footer> element so that section can sit above it.",
      "Do not invent Calendly, Stripe, PayPal, Typeform, or any other tool that is not listed here.",
      "Do not set iframe { height: auto } or overflow: hidden on html, body, or section.",
      lines.join("\n"),
    ].join("\n");
  }

  function editorProvider(feature, item) {
    const id = "lb-feature-" + feature.id + "-provider-" + item.id;
    const badge = item.primary ? '<span class="ms-lb-provider-badge">Primary</span>' : "";
    const fieldLabel =
      item.input === "phone" ? "Number" : item.input === "email" ? "Email" : item.input === "place" ? "Address or link" : "Link";
    const type = item.input === "phone" ? "tel" : item.input === "email" ? "email" : item.input === "url" ? "url" : "text";
    return (
      '<div class="ms-lb-provider"><label class="ms-lb-provider-toggle" for="' +
      id +
      '"><input type="checkbox" id="' +
      id +
      '" data-provider-toggle="' +
      escapeHtml(item.id) +
      '"><span>' +
      escapeHtml(item.label) +
      "</span>" +
      badge +
      '</label><div class="ms-lb-provider-field" data-provider-field="' +
      escapeHtml(item.id) +
      '" hidden><label class="ms-label" for="' +
      id +
      '-value">' +
      escapeHtml(fieldLabel) +
      '</label><input class="ms-input" id="' +
      id +
      '-value" data-provider-value="' +
      escapeHtml(item.id) +
      '" type="' +
      type +
      '" placeholder="' +
      escapeHtml(item.placeholder || "") +
      '" autocomplete="off"></div></div>'
    );
  }

  function editorMarkup() {
    return FEATURES.map((feature) => {
      const intro = feature.hint ? '<p class="ms-muted ms-lb-widget-hint">' + escapeHtml(feature.hint) + "</p>" : "";
      const note = feature.note
        ? '<div class="ms-field ms-lb-widget-field"><label class="ms-label" for="lb-feature-' +
          feature.id +
          '-note">Note</label><input class="ms-input" id="lb-feature-' +
          feature.id +
          '-note" data-feature-field="note" type="text" placeholder="Optional line under the buttons" autocomplete="off"></div>'
        : "";
      return (
        '<div class="ms-lb-widget" id="lb-feature-' +
        feature.id +
        '" data-site-feature="' +
        feature.id +
        '"><div class="ms-lb-widget-head"><div class="ms-lb-widget-icon" aria-hidden="true">' +
        ICONS[feature.id] +
        '</div><div class="ms-lb-widget-copy"><h3>' +
        escapeHtml(feature.title) +
        '</h3><p class="ms-muted" id="lb-feature-' +
        feature.id +
        '-summary">' +
        escapeHtml(feature.summary) +
        '</p></div><label class="ms-lb-widget-toggle" title="Enable ' +
        escapeHtml(feature.title) +
        '"><input type="checkbox" id="lb-feature-' +
        feature.id +
        '-enabled" aria-label="Enable ' +
        escapeHtml(feature.title) +
        '"><span class="ms-lb-widget-toggle-track" aria-hidden="true"></span></label></div><div class="ms-lb-widget-body" id="lb-feature-' +
        feature.id +
        '-body" aria-hidden="true"><div class="ms-lb-widget-body-inner">' +
        intro +
        '<div class="ms-lb-provider-list">' +
        feature.providers.map((item) => editorProvider(feature, item)).join("") +
        "</div>" +
        note +
        '<div class="ms-lb-domain-actions"><button type="button" class="ms-btn ms-lb-widget-save" id="lb-feature-' +
        feature.id +
        '-save">Save &amp; apply</button></div><p class="ms-muted ms-lb-widget-hint" id="lb-feature-' +
        feature.id +
        '-hint"></p></div></div></div>'
      );
    }).join("");
  }

  return {
    FEATURES,
    readConfig,
    detectAndSeed,
    normalizeFeature,
    validateFeature,
    hasContent,
    hasActiveServices,
    formatForPrompt,
    renderBlocks,
    stripSiteFeatureBlocks,
    applyToHtml,
    editorMarkup,
    featureById,
    safeHref,
  };
});
