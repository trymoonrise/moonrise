/**
 * Shared favicon, SEO, social preview, and structured data for Moonrise Studio.
 * Values come from js/config.js (SITE_CONFIG).
 */
(function () {
  const cfg = window.SITE_CONFIG || {};
  const siteUrl = String(cfg.siteUrl || "https://trymoonrise.com").replace(/\/$/, "");
  const siteName = String(cfg.siteName || cfg.companyName || "Moonrise Studio").trim();
  const logoPath = String(cfg.brandLogoUrl || "assets/MoonriseLogo.png").trim();
  const embedPath = String(cfg.embedImageUrl || "assets/embed.png").trim();
  const locale = String(cfg.locale || "en_US").trim();
  const supportEmail = String(cfg.supportEmail || "trymoonrise@gmail.com").trim();
  const supportPhone = String(cfg.supportPhoneTel || "+14013000957").trim();

  const PUBLIC_PAGES = {
    "": 1,
    "/": 1,
    "login": 1,
    "orders": 1,
    "contact": 1,
    "privacy": 1,
    "terms": 1,
    "download": 1,
    "docs": 1,
    "legal": 1,
    "refund": 1,
    "report": 1,
    "ui-library": 1,
    "guides": 1,
  };

  function absoluteUrl(pathOrUrl) {
    const raw = String(pathOrUrl || "").trim();
    if (!raw) return siteUrl + "/";
    if (/^https?:\/\//i.test(raw)) return raw.split("#")[0];
    if (raw.startsWith("//")) return (location.protocol || "https:") + raw;
    const base = siteUrl.replace(/\/$/, "");
    const path = raw.startsWith("/") ? raw : "/" + raw.replace(/^\.\//, "");
    return base + path;
  }

  function currentPath() {
    if (typeof location === "undefined") return "/";
    const path = String(location.pathname || "/").replace(/\/+$/, "") || "/";
    return path;
  }

  function currentFile() {
    if (typeof location === "undefined") return "/";
    return location.pathname.split("/").pop() || "/";
  }

  function canonicalUrl() {
    if (typeof location === "undefined") return siteUrl + "/";
    const path = currentPath();
    if (path === "/" || path === "") return siteUrl + "/";
    return siteUrl + path.replace(/\.html$/i, "");
  }

  function isPublicPage() {
    const path = currentPath();
    if (path === "/" || path === "") return true;
    if (/^\/guides(\/|$)/i.test(path)) return true;
    const file = currentFile().replace(/\.html$/i, "");
    return !!PUBLIC_PAGES[file];
  }

  const pageTitle = String(document.title || siteName).trim();
  const pageDesc =
    document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ||
    String(cfg.siteDescription || "").trim() ||
    "Moonrise is an AI-powered platform that lets you create professional websites with 1 click for local business owners, creators, and more.";

  const logoUrl = absoluteUrl(logoPath);
  const embedUrl = absoluteUrl(embedPath);
  const canonical = canonicalUrl();
  const page = document.body?.dataset?.page || "";
  const keywords = String(cfg.seoKeywords || "").trim();

  function upsertLink(rel, href, extra) {
    if (!href) return;
    const title = extra && extra.title != null ? String(extra.title) : "";
    let el = null;
    if (rel === "alternate" && title) {
      el = document.querySelector('link[rel="alternate"][title="' + title.replace(/"/g, '\\"') + '"]');
    } else {
      el = document.querySelector('link[rel="' + rel + '"]');
    }
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value != null) el.setAttribute(key, value);
      });
    }
  }

  function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function injectJsonLd(id, data) {
    if (!data) return;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  upsertLink("icon", logoUrl, { type: "image/png" });
  upsertLink("shortcut icon", logoUrl, { type: "image/png" });
  upsertLink("apple-touch-icon", logoUrl);
  upsertLink("canonical", canonical);
  upsertLink("manifest", "manifest.json");
  if (isPublicPage()) {
    upsertLink("alternate", siteUrl + "/llms.txt", {
      type: "text/plain",
      title: "Facts for answer engines",
    });
  }

  const robotDirectives = isPublicPage()
    ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    : "noindex, nofollow";

  upsertMeta("name", "description", pageDesc);
  if (keywords) upsertMeta("name", "keywords", keywords);
  upsertMeta("name", "author", siteName);
  upsertMeta("name", "robots", robotDirectives);
  upsertMeta("name", "googlebot", robotDirectives);
  upsertMeta("name", "theme-color", "#fbfbfd");
  upsertMeta("name", "apple-mobile-web-app-title", "Moonrise");
  upsertMeta("name", "application-name", siteName);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", siteName);
  upsertMeta("property", "og:title", pageTitle);
  upsertMeta("property", "og:description", pageDesc);
  const ogWidth = String(cfg.ogImageWidth || "1200");
  const ogHeight = String(cfg.ogImageHeight || "630");
  upsertMeta("property", "og:image", embedUrl);
  upsertMeta("property", "og:image:alt", siteName);
  upsertMeta("property", "og:image:width", ogWidth);
  upsertMeta("property", "og:image:height", ogHeight);
  upsertMeta("property", "og:image:type", "image/png");
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:locale", locale);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", pageTitle);
  upsertMeta("name", "twitter:description", pageDesc);
  upsertMeta("name", "twitter:image", embedUrl);
  upsertMeta("name", "twitter:image:alt", siteName);
  if (cfg.twitterSite) upsertMeta("name", "twitter:site", String(cfg.twitterSite));

  if (isPublicPage()) {
    upsertLink("sitemap", siteUrl + "/sitemap.xml", { type: "application/xml", title: "Sitemap" });
    upsertLink("alternate", siteUrl + "/llms-full.txt", {
      type: "text/plain",
      title: "Extended facts for answer engines",
    });
  }

  const sameAs = [cfg.discordUrl, cfg.githubUrl, cfg.twitterUrl]
    .map(function (url) {
      const value = String(url || "").trim();
      if (!/^https?:\/\//i.test(value)) return "";
      if (/t\.me\/c\//i.test(value)) return "";
      return value;
    })
    .filter(Boolean);
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": siteUrl + "/#organization",
    name: siteName,
    url: siteUrl + "/",
    logo: { "@type": "ImageObject", url: logoUrl },
    email: supportEmail,
    telephone: supportPhone,
    description: String(cfg.siteDescription || pageDesc).trim(),
    sameAs: sameAs.length ? sameAs : undefined,
    areaServed: "US",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: supportEmail,
      telephone: supportPhone,
      url: siteUrl + "/contact",
      availableLanguage: "English",
    },
  };

  const pageType =
    page === "contact"
      ? "ContactPage"
      : page === "guides" || /^\/guides(\/|$)/i.test(currentPath())
        ? "Article"
        : "WebPage";
  const webPage = {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": canonical + "#webpage",
    url: canonical,
    name: pageTitle,
    description: pageDesc,
    isPartOf: { "@id": siteUrl + "/#website" },
    about: { "@id": siteUrl + "/#organization" },
    inLanguage: "en-US",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".ms-doc-lead", ".ms-guide-answer", "main"],
    },
  };

  const isHome = page === "home" || currentFile() === "/" || currentFile() === "";
  const graph = [organization, webPage];

  if (isPublicPage()) {
    const crumbs = [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl + "/" },
    ];
    const path = currentPath();
    if (/^\/guides(\/|$)/i.test(path)) {
      crumbs.push({
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: siteUrl + "/guides",
      });
      if (path !== "/guides") {
        const crumbName = pageTitle.replace(/\s+[-–]\s+Moonrise.*$/i, "").trim() || pageTitle;
        crumbs.push({ "@type": "ListItem", position: 3, name: crumbName, item: canonical });
      }
    } else if (!isHome) {
      const crumbName = pageTitle.replace(/\s+[-–]\s+Moonrise.*$/i, "").trim() || pageTitle;
      crumbs.push({ "@type": "ListItem", position: 2, name: crumbName, item: canonical });
    }
    graph.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": canonical + "#breadcrumbs",
      itemListElement: crumbs,
    });
    graph.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": siteUrl + "/#website",
      url: siteUrl + "/",
      name: siteName,
      description: String(cfg.siteDescription || pageDesc).trim(),
      publisher: { "@id": siteUrl + "/#organization" },
      inLanguage: "en-US",
    });
  }

  if (isHome || page === "download") {
    graph.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": siteUrl + "/#software",
      name: siteName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to build and preview websites. Clients pay when they unlock the live site.",
      },
      description:
        "Website builder for creators who sell sites to local businesses. Find leads, build a preview, and earn when clients go live.",
      url: siteUrl + "/",
      image: embedUrl,
      installUrl: siteUrl + "/download",
      publisher: { "@id": siteUrl + "/#organization" },
    });
  }

  if (isHome) {
    const faqItems = Array.isArray(cfg.seoFaq) ? cfg.seoFaq : [];
    if (faqItems.length) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": siteUrl + "/#faq",
        mainEntity: faqItems.map(function (item) {
          return {
            "@type": "Question",
            name: String(item.q || item.question || "").trim(),
            acceptedAnswer: {
              "@type": "Answer",
              text: String(item.a || item.answer || "").trim(),
            },
          };
        }),
      });
    }
  }

  if (page === "docs") {
    graph.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "@id": siteUrl + "/docs#howto",
      name: "How Moonrise works",
      description:
        "Find a local business, build a site, publish a watermarked preview, and get paid when the owner goes live.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Find",
          text: "Open Business Finder or paste a Maps link in Builder. Prefer active, under-served businesses.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Generate",
          text: "Slide to generate in Finder, or fill details in Builder. Wait until the preview appears. Generation is free for creators.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Polish and price",
          text: "Open the project in Editor. Fix copy and media. Set Website Price before you publish.",
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Publish and share",
          text: "Publish the watermarked live site and send the owner that URL.",
        },
        {
          "@type": "HowToStep",
          position: 5,
          name: "Get paid",
          text: "When they pay on the watermark, Moonrise removes it, redeploys a clean site, and credits your share.",
        },
      ],
    });
  }

  injectJsonLd("ms-jsonld-graph", { "@context": "https://schema.org", "@graph": graph });
})();
