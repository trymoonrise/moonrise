/**
 * Studio appearance: dark mode, theme color, text size.
 * Loaded from auth-gate-head.js before the rest of the page paints.
 */
(function () {
  if (window.MoonriseAppearance) return;

  var KEY = "ms_appearance";
  var PRESETS = [
    { id: "ink", name: "Black & white", color: "#232427" },
    { id: "violet", name: "Violet", color: "#8b5cf6" },
    { id: "ocean", name: "Ocean", color: "#3b82f6" },
    { id: "rose", name: "Rose", color: "#ec4899" },
    { id: "forest", name: "Forest", color: "#10b981" },
    { id: "sunset", name: "Sunset", color: "#f97316" },
  ];
  var TEXT = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    xlarge: "Extra large",
  };
  /* Default: light cream UI with black ink accents. Users can change this in Settings → Appearance. */
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
    return prefs.mode === DEFAULTS.mode && prefs.color === DEFAULTS.color && prefs.text === DEFAULTS.text;
  }

  function chromeColor() {
    return document.documentElement.getAttribute("data-ms-mode") === "dark" ? "#0e1320" : "#fcfbef";
  }

  function isInkColor(color) {
    return !!INK_COLORS[String(color || "").toLowerCase()];
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
    var bright = ink ? "#232427" : color === "#3b82f6" ? "#60a5fa" : rgbToHex(mix(rgb, { r: 255, g: 255, b: 255 }, 0.28));
    var strong = ink ? "#000000" : color === "#3b82f6" ? "#2563eb" : rgbToHex(mix(rgb, { r: 0, g: 0, b: 0 }, 0.2));
    var soft = ink
      ? mode === "dark"
        ? "#2c2c2e"
        : "#f5f4e8"
      : rgbToHex(
          mix(rgb, mode === "dark" ? { r: 18, g: 24, b: 38 } : { r: 252, g: 251, b: 239 }, mode === "dark" ? 0.82 : 0.88)
        );

    var tone = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 < 0.4 ? "dark" : "light";
    var select = ink
      ? mode === "dark"
        ? "#3a3a3c"
        : "#ddddd3"
      : rgbToHex(mix(rgb, mode === "dark" ? { r: 18, g: 24, b: 38 } : { r: 252, g: 251, b: 239 }, mode === "dark" ? 0.55 : 0.42));
    var selectSoft = ink ? soft : rgbToHex(mix(rgb, mode === "dark" ? { r: 18, g: 24, b: 38 } : { r: 252, g: 251, b: 239 }, mode === "dark" ? 0.72 : 0.78));
    var link = ink ? "#232427" : strong;
    root.setAttribute("data-ms-mode", mode);
    root.setAttribute("data-ms-text", text);
    root.setAttribute("data-ms-accent-tone", tone);
    root.style.setProperty("--ms-accent", color);
    root.style.setProperty("--ms-accent-bright", bright);
    root.style.setProperty("--ms-accent-strong", strong);
    root.style.setProperty("--ms-accent-soft", soft);
    root.style.setProperty("--ms-accent-rgb", rgb.r + ", " + rgb.g + ", " + rgb.b);
    root.style.setProperty("--ms-select", select);
    root.style.setProperty("--ms-select-soft", selectSoft);
    root.style.setProperty("--ms-link", link);
    root.style.setProperty("--ms-banner", soft);
    root.style.setProperty("--ms-banner-ink", ink ? "#232427" : strong);
    root.style.colorScheme = mode === "dark" ? "dark" : "light";
    var crit = document.getElementById("ms-appearance-critical");
    if (mode === "dark") {
      if (!crit) {
        crit = document.createElement("style");
        crit.id = "ms-appearance-critical";
        document.head.appendChild(crit);
      }
      crit.textContent = "html[data-ms-mode=dark],html[data-ms-mode=dark] body{background:#0e1320;color:#e8eef8}";
    } else if (crit) {
      crit.remove();
    }
    paintChrome();
    return { mode: mode, color: color, text: text, rgb: rgb };
  }

  function ensureCss() {
    var studio = document.querySelector('link[href*="studio.css"]');
    var link = document.getElementById("ms-appearance-css");
    if (!link) {
      link = document.createElement("link");
      link.id = "ms-appearance-css";
      link.rel = "stylesheet";
      link.href = "css/appearance.css?v=20261028-bw-reset";
    }
    var ui = document.getElementById("ms-studio-ui-css");
    if (!ui) {
      ui = document.createElement("link");
      ui.id = "ms-studio-ui-css";
      ui.rel = "stylesheet";
      ui.href = "css/studio-ui.css?v=20261028-bw-default";
    }
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
    if (document.head.lastElementChild !== ui) document.head.appendChild(ui);
    /* Keep cream / public layers after appearance + studio-ui for surface tokens. */
    ["link[href*='cream-ink.css']", "link[href*='cream-motion.css']", "link[href*='public-pages.css']"].forEach(function (sel) {
      var sheet = document.querySelector(sel);
      if (sheet && sheet.parentNode && document.head.lastElementChild !== sheet) {
        document.head.appendChild(sheet);
      }
    });
  }

  function watchCss() {
    ensureCss();
    var obs = new MutationObserver(function () {
      ensureCss();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
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
    if (custom) custom.value = current.color;
    if (customWrap) {
      customWrap.style.setProperty("--swatch", current.color);
      customWrap.classList.toggle("is-selected", !preset);
      customWrap.classList.toggle("is-light", !preset && isLight(current.rgb));
    }
    if (hex && document.activeElement !== hex) hex.value = current.color;
    if (reset) {
      /* Always available; dim when already at defaults. */
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
