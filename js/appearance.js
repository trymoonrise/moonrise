/**
 * Studio appearance: dark mode + text size.
 * Studio is locked to black / white / grey — no color accents.
 * Loaded from auth-gate-head.js before the rest of the page paints.
 */
(function () {
  if (window.MoonriseAppearance) return;

  var KEY = "ms_appearance";
  var TEXT = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    xlarge: "Extra large",
  };
  var INK = "#232427";
  var DEFAULTS = { mode: "light", color: INK, text: "small" };
  var PRESETS = [{ id: "ink", name: "Black & white", color: INK }];

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

  function read() {
    var stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (_) {
      stored = null;
    }
    var mode = stored && stored.mode === "dark" ? "dark" : "light";
    var text = stored && TEXT[stored.text] ? stored.text : DEFAULTS.text;
    /* Always ink — migrate any saved violet/ocean/custom accent away. */
    return { mode: mode, color: INK, text: text };
  }

  function write(prefs) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          mode: prefs.mode === "dark" ? "dark" : "light",
          color: INK,
          text: TEXT[prefs.text] ? prefs.text : DEFAULTS.text,
        })
      );
    } catch (_) {
      /* private mode / blocked storage */
    }
  }

  function isDefault(prefs) {
    return prefs.mode === DEFAULTS.mode && prefs.text === DEFAULTS.text;
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
    var color = INK;
    var rgb = hexToRgb(color);

    root.setAttribute("data-ms-mode", mode);
    root.setAttribute("data-ms-text", text);
    root.setAttribute("data-ms-accent-tone", "dark");
    root.setAttribute("data-ms-mono", "1");

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
      root.style.setProperty("--ms-accent-soft", "#f3f3f3");
      root.style.setProperty("--ms-select", "#d8d8d8");
      root.style.setProperty("--ms-select-soft", "#eeeeee");
      root.style.setProperty("--ms-banner", "#e8e8e8");
      root.style.setProperty("--ms-banner-ink", "#1a1a1a");
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
      root.style.setProperty("--ms-accent-soft", "#2c2c2e");
      root.style.setProperty("--ms-select", "#3a3a3c");
      root.style.setProperty("--ms-select-soft", "#2c2c2e");
      root.style.setProperty("--ms-banner", "#2c2c2e");
      root.style.setProperty("--ms-banner-ink", "#f5f5f5");
    }

    root.style.setProperty("--ms-accent", color);
    root.style.setProperty("--ms-accent-bright", color);
    root.style.setProperty("--ms-accent-strong", mode === "dark" ? "#ffffff" : "#000000");
    root.style.setProperty("--ms-accent-rgb", rgb.r + ", " + rgb.g + ", " + rgb.b);
    root.style.setProperty("--ms-link", color);
    root.style.setProperty("--ms-brand", color);
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
    var studio = document.querySelector('link[href*="studio.css"]');
    var link = document.getElementById("ms-appearance-css");
    if (!link) {
      link = document.createElement("link");
      link.id = "ms-appearance-css";
      link.rel = "stylesheet";
      link.href = "css/appearance.css?v=20261106-mono";
    }
    var ui = document.getElementById("ms-studio-ui-css");
    if (!ui) {
      ui = document.createElement("link");
      ui.id = "ms-studio-ui-css";
      ui.rel = "stylesheet";
      ui.href = "css/studio-ui.css?v=20261106-mono";
    }
    var mono = document.getElementById("ms-studio-mono-css");
    if (!mono) {
      mono = document.createElement("link");
      mono.id = "ms-studio-mono-css";
      mono.rel = "stylesheet";
      mono.href = "css/studio-mono.css?v=20261106-mono";
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
    /* Stable suffix: appearance → studio-ui → mono → cream / public */
    var tail = [ui, mono];
    [
      "link[href*='cream-ink.css']",
      "link[href*='cream-motion.css']",
      "link[href*='public-pages.css']",
    ].forEach(function (sel) {
      var sheet = document.querySelector(sel);
      if (sheet) tail.push(sheet);
    });
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
  write(current);
  watchCss();

  function syncControls() {
    var dark = document.getElementById("set-dark-mode");
    var textName = document.getElementById("set-text-name");
    var reset = document.getElementById("set-appearance-reset");

    if (dark) dark.checked = current.mode === "dark";
    if (textName) textName.textContent = TEXT[current.text] || TEXT.medium;
    if (reset) {
      reset.hidden = false;
      reset.removeAttribute("hidden");
      reset.disabled = false;
      reset.setAttribute("aria-disabled", isDefault(current) ? "true" : "false");
      reset.classList.toggle("is-default", isDefault(current));
    }

    document.querySelectorAll(".ms-appearance-sizes [data-text]").forEach(function (btn) {
      var on = btn.getAttribute("data-text") === current.text;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  function commit(next) {
    current = apply({
      mode: next.mode != null ? next.mode : current.mode,
      color: INK,
      text: next.text != null ? next.text : current.text,
    });
    write(current);
    syncControls();
    document.dispatchEvent(new CustomEvent("ms:appearance-changed", { detail: current }));
  }

  function resetToDefault() {
    commit({ mode: DEFAULTS.mode, color: INK, text: DEFAULTS.text });
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
