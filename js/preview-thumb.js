/**
 * Static site thumbnails for Dashboard / Projects / Builder recent.
 * Sandboxed iframes intentionally omit allow-scripts; strip every executable
 * node so Chromium does not flood the console with blocked-execution warnings.
 */
(function (global) {
  function scrubElement(el) {
    if (!el || !el.attributes) return;
    const remove = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      const name = String(attr.name || "");
      const value = String(attr.value || "");
      if (/^on/i.test(name)) {
        remove.push(name);
        continue;
      }
      if (/^(href|src|xlink:href|action|formaction|poster|data)$/i.test(name)) {
        if (/^\s*javascript:/i.test(value) || /^\s*vbscript:/i.test(value)) {
          remove.push(name);
        }
      }
      if (/^srcdoc$/i.test(name)) remove.push(name);
    }
    remove.forEach((n) => el.removeAttribute(n));
  }

  function sanitizeThumbHtml(html) {
    const raw = String(html || "");
    if (!raw.trim()) return "";
    try {
      const doc = new DOMParser().parseFromString(raw, "text/html");
      const kill = doc.querySelectorAll(
        "script, iframe, object, embed, applet, frame, frameset, base, template, noscript, meta, " +
          "link[rel='preload'], link[rel='modulepreload'], link[rel='import'], link[as='script'], " +
          "link[rel='prefetch'], link[rel='prerender']"
      );
      kill.forEach((node) => node.remove());
      // Stylesheets stay so thumbs still paint; drop any other link that could fetch scripts.
      doc.querySelectorAll("link").forEach((link) => {
        const rel = String(link.getAttribute("rel") || "").toLowerCase();
        const as = String(link.getAttribute("as") || "").toLowerCase();
        if (rel.includes("stylesheet") || rel === "icon" || rel.includes("apple-touch")) return;
        if (as === "script" || as === "worker" || !rel) link.remove();
      });
      doc.querySelectorAll("*").forEach(scrubElement);
      // Drop autoplay so thumbs stay quiet.
      doc.querySelectorAll("audio, video").forEach((media) => {
        media.removeAttribute("autoplay");
        media.removeAttribute("src");
        media.querySelectorAll("source, track").forEach((s) => s.remove());
      });
      const htmlEl = doc.documentElement;
      if (!htmlEl) return "";
      return "<!DOCTYPE html>\n" + htmlEl.outerHTML;
    } catch (_) {
      // Fallback: aggressive string strip if DOMParser fails.
      return raw
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<script\b[^>]*\/?>/gi, "")
        .replace(/<\/script>/gi, "")
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
        .replace(/<\/?(?:object|embed|applet|link|meta|base|template|noscript)\b[^>]*>/gi, "")
        .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/\sautoplay\b/gi, "");
    }
  }

  function mountThumbFrames(selector, htmlById) {
    const map = htmlById && typeof htmlById === "object" ? htmlById : {};
    document.querySelectorAll(selector).forEach((frame) => {
      const id = frame.getAttribute("data-preview-id");
      const html = map[id];
      if (!html) return;
      try {
        frame.removeAttribute("src");
        frame.srcdoc = sanitizeThumbHtml(html);
      } catch (_) {
        /* ignore malformed preview */
      }
    });
  }

  global.MsPreviewThumb = {
    sanitize: sanitizeThumbHtml,
    mount: mountThumbFrames,
  };
})(typeof window !== "undefined" ? window : globalThis);
