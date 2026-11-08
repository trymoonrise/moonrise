/**
 * Studio appearance: dark mode, theme color, text size.
 * Loaded from auth-gate-head.js before the rest of the page paints.
 */
(function () {
  if (window.MoonriseAppearance) return;

  var KEY = "ms_appearance";
  var PRESETS = [
    { id: "ink", name: "Black & white", color: "#232427" },
    { id: "slate", name: "Slate", color: "#64748b" },
    { id: "indigo", name: "Indigo", color: "#6366f1" },
    { id: "violet", name: "Violet", color: "#8b5cf6" },
    { id: "ocean", name: "Ocean", color: "#3b82f6" },
    { id: "sky", name: "Sky", color: "#0ea5e9" },
    { id: "teal", name: "Teal", color: "#14b8a6" },
    { id: "forest", name: "Forest", color: "#10b981" },
    { id: "lime", name: "Lime", color: "#84cc16" },
    { id: "gold", name: "Gold", color: "#eab308" },
    { id: "sunset", name: "Sunset", color: "#f97316" },
    { id: "coral", name: "Coral", color: "#f43f5e" },
    { id: "rose", name: "Rose", color: "#ec4899" },
    { id: "crimson", name: "Crimson", color: "#ef4444" },
  ];
  var TEXT = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    xlarge: "Extra large",
  };
  var DEFAULTS = { mode: "light", color: "#232427", text: "small" };
  var INK_COLORS = { "#232427": 1, "#1d1d1f": 1, "#000000": 1 };

  function clamp(n) {
    return Math.max(0, Math.min(255, Math.round(n)));
  }

  function normalizeHex(value) {
    var raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";
    if (raw[0] !== "#") raw = "#" + raw;
    if (/^#[0-9a-f]{3}$/.test(raw)) {
      raw = "#" + raw[1] + raw[1] + raw[2] + raw[2] + raw[3] + raw[3];
    }
    return /^#[0-9a-f]{6}$/.test(raw) ? raw : "";
  }

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  function rgbToHex(c) {
    function part(n) {
      return clamp(n).toString(16).padStart(2, "0");
    }
    return "#" + part(c.r) + part(c.g) + part(c.b);
  }

  function mix(a, b, t) {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    };
  }

  function isLight(rgb) {
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.72;
  }

  function presetFor(color) {
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].color === color) return PRESETS[i];
    }
    return null;
  }

  function isInkColor(color) {
    return !!INK_COLORS[String(color || "").toLowerCase()];
  }

  function read() {
    var stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (_) {
      stored = null;
    }
    var mode = stored && stored.mode === "dark" ? "dark" : "light";
    var text = stored && TEXT[stored.text] ? stored.text : DEFAULTS.text;
    var color = normalizeHex(stored && stored.color) || DEFAULTS.color;
    if (color === "#1d1d1f" || color === "#000000") color = DEFAULTS.color;
    return { mode: mode, color: color, text: text };
  }

  function write(prefs) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          mode: prefs.mode === "dark" ? "dark" : "light",
          color: normalizeHex(prefs.color) || DEFAULTS.color,
          text: TEXT[prefs.text] ? prefs.text : DEFAULTS.text,
        })
      );
    } catch (_) {
      /* private mode / blocked storage */
    }
  }

  function isDefault(prefs) {
    return (
      prefs.mode === DEFAULTS.mode &&
      prefs.color === DEFAULTS.color &&
      prefs.text === DEFAULTS.text
    );
  }

  function chromeColor() {
    return document.documentElement.getAttribute("data-ms-mode") === "dark" ? "#111111" : "#fafafa";
  }

  function paintChrome() {
    var theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) {
      theme = document.createElement("meta");
      theme.name = "theme-color";
      document.head.appendChild(theme);
    }
    theme.content = chromeColor();
  }

  function apply(prefs) {
    var root = document.documentElement;
    var mode = prefs.mode === "dark" ? "dark" : "light";
    var text = TEXT[prefs.text] ? prefs.text : DEFAULTS.text;
    var color = normalizeHex(prefs.color) || DEFAULTS.color;
    if (color === "#1d1d1f" || color === "#000000") color = DEFAULTS.color;
    var rgb = hexToRgb(color);
    var ink = isInkColor(color);
    var bright = ink
      ? "#232427"
      : rgbToHex(mix(rgb, { r: 255, g: 255, b: 255 }, 0.28));
    var strong = ink ? "#000000" : rgbToHex(mix(rgb, { r: 0, g: 0, b: 0 }, 0.2));
    var soft = ink
      ? mode === "dark"
        ? "#2c2c2e"
        : "#f3f3f3"
      : rgbToHex(
          mix(
            rgb,
            mode === "dark" ? { r: 17, g: 17, b: 17 } : { r: 255, g: 255, b: 255 },
            mode === "dark" ? 0.82 : 0.88
          )
        );

    var tone = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 < 0.4 ? "dark" : "light";
    var select = ink
      ? mode === "dark"
        ? "#3a3a3c"
        : "#d8d8d8"
      : rgbToHex(
          mix(
            rgb,
            mode === "dark" ? { r: 17, g: 17, b: 17 } : { r: 255, g: 255, b: 255 },
            mode === "dark" ? 0.55 : 0.42
          )
        );
    var selectSoft = ink
      ? soft
      : rgbToHex(
          mix(
            rgb,
            mode === "dark" ? { r: 17, g: 17, b: 17 } : { r: 255, g: 255, b: 255 },
            mode === "dark" ? 0.72 : 0.78
          )
        );
    var link = ink ? "#1a1a1a" : strong;

    root.setAttribute("data-ms-mode", mode);
    root.setAttribute("data-ms-text", text);
    root.setAttribute("data-ms-accent-tone", tone);
    root.setAttribute("data-ms-motion", "1");
    if (ink) root.setAttribute("data-ms-ink", "1");
    else root.removeAttribute("data-ms-ink");
    root.removeAttribute("data-ms-mono");

    if (mode === "light") {
      root.style.setProperty("--ms-bg", "#fafafa");
      root.style.setProperty("--ms-surface", "#ffffff");
      root.style.setProperty("--ms-surface-alt", "#f3f3f3");
      root.style.setProperty("--ms-surface-prompt", "#eeeeee");
      root.style.setProperty("--ms-line", "#e5e5e5");
      root.style.setProperty("--ms-dashed", "#c8c8c8");
      root.style.setProperty("--ms-track-off", "#d4d4d4");
      root.style.setProperty("--ms-segment", "#efefef");
      root.style.setProperty("--ms-muted", "#6b6b6b");
      root.style.setProperty("--ms-ink", "#1a1a1a");
    } else {
      root.style.setProperty("--ms-bg", "#111111");
      root.style.setProperty("--ms-surface", "#1a1a1a");
      root.style.setProperty("--ms-surface-alt", "#222222");
      root.style.setProperty("--ms-surface-prompt", "#2a2a2a");
      root.style.setProperty("--ms-line", "#333333");
      root.style.setProperty("--ms-dashed", "#3a3a3a");
      root.style.setProperty("--ms-track-off", "#3a3a3c");
      root.style.setProperty("--ms-segment", "#2a2a2a");
      root.style.setProperty("--ms-muted", "#a3a3a3");
      root.style.setProperty("--ms-ink", "#f5f5f5");
    }

    root.style.setProperty("--ms-accent", color);
    root.style.setProperty("--ms-accent-bright", bright);
    root.style.setProperty("--ms-accent-strong", strong);
    root.style.setProperty("--ms-accent-soft", soft);
    root.style.setProperty("--ms-accent-rgb", rgb.r + ", " + rgb.g + ", " + rgb.b);
    root.style.setProperty("--ms-select", select);
    root.style.setProperty("--ms-select-soft", selectSoft);
    root.style.setProperty("--ms-link", link);
    root.style.setProperty("--ms-brand", color);
    root.style.setProperty("--ms-banner", soft);
    root.style.setProperty("--ms-banner-ink", ink ? (mode === "dark" ? "#f5f5f5" : "#1a1a1a") : strong);
    root.style.setProperty("--ms-skeleton", mode === "dark" ? "#3a3a3c" : "#c4c4c4");
    root.style.setProperty("--ms-danger", "#e03a1a");
    root.style.colorScheme = mode === "dark" ? "dark" : "light";

    var crit = document.getElementById("ms-appearance-critical");
    if (mode === "dark") {
      if (!crit) {
        crit = document.createElement("style");
        crit.id = "ms-appearance-critical";
        document.head.appendChild(crit);
      }
      crit.textContent =
        "html[data-ms-mode=dark],html[data-ms-mode=dark] body{background:#111111;color:#f5f5f5}";
    } else if (crit) {
      crit.remove();
    }
    paintChrome();
    return { mode: mode, color: color, text: text, rgb: rgb };
  }

  function ensureCss() {
    var CACHE = "20261108-status";
    var studio = document.querySelector('link[href*="studio.css"]');
    var link = document.getElementById("ms-appearance-css");
    if (!link) {
      link = document.createElement("link");
      link.id = "ms-appearance-css";
      link.rel = "stylesheet";
    }
    var appearanceHref = "css/appearance.css?v=" + CACHE;
    if (link.href.indexOf(appearanceHref) === -1) link.href = appearanceHref;
    var ui = document.getElementById("ms-studio-ui-css") || document.querySelector('link[href*="studio-ui.css"]');
    if (!ui) {
      ui = document.createElement("link");
      ui.id = "ms-studio-ui-css";
      ui.rel = "stylesheet";
    } else {
      ui.id = "ms-studio-ui-css";
    }
    var uiHref = "css/studio-ui.css?v=" + CACHE;
    if (ui.href.indexOf(uiHref) === -1) ui.href = uiHref;
    var mono = document.getElementById("ms-studio-mono-css") || document.querySelector('link[href*="studio-mono.css"]');
    if (!mono) {
      mono = document.createElement("link");
      mono.id = "ms-studio-mono-css";
      mono.rel = "stylesheet";
    } else {
      mono.id = "ms-studio-mono-css";
    }
    var monoHref = "css/studio-mono.css?v=" + CACHE;
    if (mono.href.indexOf(monoHref) === -1) mono.href = monoHref;
    var minimal = document.getElementById("ms-studio-minimal-css") || document.querySelector('link[href*="studio-minimal.css"]');
    if (!minimal) {
      minimal = document.createElement("link");
      minimal.id = "ms-studio-minimal-css";
      minimal.rel = "stylesheet";
    } else {
      minimal.id = "ms-studio-minimal-css";
    }
    var minimalHref = "css/studio-minimal.css?v=" + CACHE;
    if (minimal.href.indexOf(minimalHref) === -1) minimal.href = minimalHref;
    var font = document.getElementById("ms-studio-font");
    if (!font) {
      font = document.createElement("link");
      font.id = "ms-studio-font";
      font.rel = "stylesheet";
      font.href = "css/fonts.css?v=20261028-selfhost";
    }
    if (!font.parentNode) document.head.appendChild(font);
    if (studio && studio.parentNode) {
      if (link.parentNode !== studio.parentNode || studio.nextElementSibling !== link) {
        studio.insertAdjacentElement("afterend", link);
      }
    } else if (!link.parentNode) {
      document.head.appendChild(link);
    }
    var tail = [ui, mono];
    [
      "link[href*='cream-ink.css']",
      "link[href*='cream-motion.css']",
      "link[href*='public-pages.css']",
    ].forEach(function (sel) {
      var sheet = document.querySelector(sel);
      if (sheet) tail.push(sheet);
    });
    tail.push(minimal);
    var kids = document.head.children;
    var start = kids.length - tail.length;
    var placed = start >= 0;
    for (var i = 0; placed && i < tail.length; i++) {
      if (kids[start + i] !== tail[i]) placed = false;
    }
    if (!placed) {
      for (var j = 0; j < tail.length; j++) document.head.appendChild(tail[j]);
    }
  }

  function watchCss() {
    ensureCss();
    var obs = new MutationObserver(function () {
      ensureCss();
    });
    if (document.head) obs.observe(document.head, { childList: true });
    document.addEventListener("DOMContentLoaded", function () {
      ensureCss();
      obs.disconnect();
    });
  }

  var current = apply(read());
  watchCss();

  function themeName(color) {
    var preset = presetFor(color);
    return preset ? preset.name : "Custom";
  }

  function syncControls() {
    var dark = document.getElementById("set-dark-mode");
    var name = document.getElementById("set-theme-name");
    var textName = document.getElementById("set-text-name");
    var custom = document.getElementById("set-theme-custom");
    var customWrap = document.getElementById("set-theme-custom-wrap");
    var hex = document.getElementById("set-theme-hex");
    var reset = document.getElementById("set-appearance-reset");
    var preset = presetFor(current.color);

    if (dark) dark.checked = current.mode === "dark";
    if (name) name.textContent = themeName(current.color);
    if (textName) textName.textContent = TEXT[current.text] || TEXT.medium;
    var swatchPreview = document.getElementById("set-theme-swatch-preview");
    if (swatchPreview) swatchPreview.style.background = current.color;
    if (custom) custom.value = current.color;
    if (customWrap) {
      customWrap.style.setProperty("--swatch", current.color);
      customWrap.classList.toggle("is-selected", !preset);
      customWrap.classList.toggle("is-light", !preset && isLight(current.rgb));
    }
    if (hex && document.activeElement !== hex) hex.value = current.color;
    if (reset) {
      reset.hidden = false;
      reset.removeAttribute("hidden");
      reset.disabled = false;
      reset.setAttribute("aria-disabled", isDefault(current) ? "true" : "false");
      reset.classList.toggle("is-default", isDefault(current));
    }

    document.querySelectorAll(".ms-appearance-swatch[data-color]").forEach(function (btn) {
      var on = btn.getAttribute("data-color") === current.color;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    document.querySelectorAll(".ms-appearance-sizes [data-text]").forEach(function (btn) {
      var on = btn.getAttribute("data-text") === current.text;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  function commit(next) {
    current = apply({
      mode: next.mode != null ? next.mode : current.mode,
      color: next.color != null ? next.color : current.color,
      text: next.text != null ? next.text : current.text,
    });
    write(current);
    syncControls();
    document.dispatchEvent(new CustomEvent("ms:appearance-changed", { detail: current }));
  }

  function resetToDefault() {
    commit({ mode: DEFAULTS.mode, color: DEFAULTS.color, text: DEFAULTS.text });
    try {
      if (window.StudioToast && typeof window.StudioToast.success === "function") {
        window.StudioToast.success("Appearance reset to black and white");
      }
    } catch (_) {
      /* toast optional */
    }
    return current;
  }

  var bound = false;
  function bindSettings() {
    var root = document.getElementById("settings-appearance");
    if (!root) return false;
    if (bound || root.dataset.bound === "1") {
      syncControls();
      return true;
    }
    bound = true;
    root.dataset.bound = "1";
    syncControls();

    document.getElementById("set-dark-mode")?.addEventListener("change", function (e) {
      commit({ mode: e.target.checked ? "dark" : "light" });
    });

    document.querySelectorAll(".ms-appearance-swatch[data-color]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        commit({ color: btn.getAttribute("data-color") });
      });
    });

    document.getElementById("set-theme-custom")?.addEventListener("input", function (e) {
      var color = normalizeHex(e.target.value);
      if (color) commit({ color: color });
    });

    var hex = document.getElementById("set-theme-hex");
    function applyHex() {
      var color = normalizeHex(hex.value);
      if (!color) {
        hex.value = current.color;
        return;
      }
      commit({ color: color });
    }
    hex?.addEventListener("change", applyHex);
    hex?.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyHex();
      }
    });

    document.querySelectorAll(".ms-appearance-sizes [data-text]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        commit({ text: btn.getAttribute("data-text") });
      });
    });

    var resetBtn = document.getElementById("set-appearance-reset");
    if (resetBtn && resetBtn.dataset.bound !== "1") {
      resetBtn.dataset.bound = "1";
      resetBtn.hidden = false;
      resetBtn.removeAttribute("hidden");
      resetBtn.addEventListener("click", function (e) {
        e.preventDefault();
        resetToDefault();
      });
    }
    return true;
  }

  window.MoonriseAppearance = {
    read: read,
    apply: apply,
    chromeColor: chromeColor,
    bindSettings: bindSettings,
    resetToDefault: resetToDefault,
    defaults: DEFAULTS,
    presets: PRESETS,
  };

  function scheduleBind() {
    if (bindSettings()) return;
    document.addEventListener("DOMContentLoaded", bindSettings, { once: true });
    window.addEventListener("load", bindSettings, { once: true });
  }
  scheduleBind();

  window.addEventListener("load", paintChrome);
  setTimeout(paintChrome, 0);
  setTimeout(paintChrome, 500);
})();
