/**
 * Motion helpers - button press + smooth expand/collapse + page reveals.
 */
(function (global) {
  const PRESS_CLASS = "is-pressed";
  const PRESS_MS = 420;
  const EXPAND_MS = 440;
  const PANEL_MS = 440;
  const PANEL_EXIT_MS = 280;
  const SELECTOR = [
    ".ms-btn:not(.ms-btn-secondary):not(.ms-btn-danger):not([disabled])",
    "a.ms-btn:not(.ms-btn-secondary):not(.ms-btn-danger)",
    ".ms-home-cta-primary",
    ".lf-action-builder:not(.is-disabled):not([disabled])",
    ".lf-advanced-dialog-actions .ms-btn:not(.ms-btn-secondary)",
    ".ms-lb-send:not([disabled])",
    "#btn-checkout:not([disabled])",
    ".ms-fin-next:not([disabled])",
    ".ms-fin-save:not([disabled])",
    ".ms-lf-find:not([disabled])",
    ".ms-lf-map-scan:not([disabled])",
    ".ms-lf-map-all:not([disabled])",
    ".ms-onboard-next:not([disabled])",
    ".ms-onboard-actions .ms-btn:not([disabled])",
  ].join(",");

  function prefersReducedMotion() {
    return (
      document.documentElement.getAttribute("data-reduce-motion") === "1" ||
      global.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function playPress(el) {
    if (!el || prefersReducedMotion()) return;
    if (el.getAttribute("aria-disabled") === "true" || el.disabled) return;
    el.classList.remove(PRESS_CLASS);
    void el.offsetWidth;
    el.classList.add(PRESS_CLASS);
    global.clearTimeout(el._msPressTimer);
    el._msPressTimer = global.setTimeout(function () {
      el.classList.remove(PRESS_CLASS);
    }, PRESS_MS);
  }

  function onPointer(e) {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    const btn = e.target?.closest?.(SELECTOR);
    if (!btn) return;
    playPress(btn);
    if (e.type === "pointerdown" && e.pointerType !== "keyboard") {
      global.requestAnimationFrame(function () {
        if (document.activeElement === btn) btn.blur();
      });
    }
  }

  function shouldDelayNav(btn, e) {
    if (!btn || btn.tagName !== "A") return false;
    if (prefersReducedMotion()) return false;
    if (e.defaultPrevented || e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (btn.target && btn.target !== "_self") return false;
    if (btn.hasAttribute("download")) return false;
    const href = btn.getAttribute("href");
    if (!href || href.charAt(0) === "#") return false;
    try {
      const url = new URL(btn.href, global.location.href);
      if (url.origin !== global.location.origin) return false;
      if (
        url.pathname === global.location.pathname &&
        url.search === global.location.search &&
        url.hash
      ) {
        return false;
      }
    } catch (_) {
      return false;
    }
    return true;
  }

  function onClick(e) {
    const btn = e.target?.closest?.(SELECTOR);
    if (!shouldDelayNav(btn, e)) return;
    e.preventDefault();
    if (!btn.classList.contains(PRESS_CLASS)) playPress(btn);
    const href = btn.href;
    global.clearTimeout(btn._msNavTimer);
    btn._msNavTimer = global.setTimeout(function () {
      global.location.assign(href);
    }, 220);
  }

  function waitMs(ms) {
    return new Promise(function (resolve) {
      global.setTimeout(resolve, ms);
    });
  }

  function nextFrame() {
    return new Promise(function (resolve) {
      global.requestAnimationFrame(function () {
        resolve();
      });
    });
  }

  function waitForTransition(el, fallbackMs) {
    if (!el || prefersReducedMotion()) return waitMs(0);
    return new Promise(function (resolve) {
      let done = false;
      const finish = function () {
        if (done) return;
        done = true;
        el.removeEventListener("transitionend", onEnd);
        global.clearTimeout(timer);
        resolve();
      };
      const onEnd = function (event) {
        if (event.target !== el) return;
        if (event.propertyName === "opacity" || event.propertyName === "transform") {
          finish();
        }
      };
      const timer = global.setTimeout(finish, fallbackMs);
      el.addEventListener("transitionend", onEnd);
    });
  }

  function revealPanel(el) {
    if (!el) return Promise.resolve();
    if (prefersReducedMotion()) {
      el.classList.add("is-visible");
      return Promise.resolve();
    }
    el.classList.remove("is-visible");
    void el.offsetWidth;
    return nextFrame().then(function () {
      return nextFrame().then(function () {
        el.classList.add("is-visible");
        return waitForTransition(el, PANEL_MS);
      });
    });
  }

  function ensureExpandInner(el) {
    if (!el) return null;
    if (el.classList.contains("ms-expand-inner")) return el;
    let inner = el.querySelector(":scope > .ms-expand-inner");
    if (inner) return inner;
    inner = document.createElement("div");
    inner.className = "ms-expand-inner";
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
    return inner;
  }

  /**
   * Smoothly open/close an element using grid 0fr → 1fr.
   * opts.instant skips animation (initial hydrate).
   */
  function setOpen(el, open, opts) {
    if (!el) return Promise.resolve();
    const wantOpen = !!open;
    const instant = !!(opts && opts.instant) || prefersReducedMotion();

    el.classList.add("ms-expand");
    ensureExpandInner(el);
    el.setAttribute("aria-hidden", wantOpen ? "false" : "true");

    if (instant) {
      el.hidden = !wantOpen;
      el.classList.toggle("is-open", wantOpen);
      return Promise.resolve();
    }

    if (wantOpen) {
      el.hidden = false;
      void el.offsetHeight;
      el.classList.add("is-open");
      return waitMs(EXPAND_MS);
    }

    el.classList.remove("is-open");
    return waitMs(EXPAND_MS).then(function () {
      if (!el.classList.contains("is-open")) el.hidden = true;
    });
  }

  function showPanel(el) {
    if (!el) return Promise.resolve();
    if (prefersReducedMotion()) {
      el.hidden = false;
      el.classList.add("is-active", "is-visible");
      return Promise.resolve();
    }
    el.hidden = false;
    el.classList.add("ms-panel-anim", "is-active");
    el.classList.remove("is-exiting");
    return revealPanel(el);
  }

  function hidePanel(el) {
    if (!el) return Promise.resolve();
    if (prefersReducedMotion()) {
      el.hidden = true;
      el.classList.remove("is-active", "is-visible", "is-exiting", "ms-panel-anim");
      return Promise.resolve();
    }
    el.classList.add("ms-panel-anim", "is-exiting");
    if (!el.classList.contains("is-visible") && !el.hidden) {
      el.classList.add("is-visible");
      void el.offsetWidth;
    }
    el.classList.remove("is-visible");
    return waitForTransition(el, PANEL_EXIT_MS).then(function () {
      if (!el.classList.contains("is-visible")) {
        el.hidden = true;
        el.classList.remove("is-active", "is-exiting", "ms-panel-anim");
      }
    });
  }

  function bootFaq() {
    document.querySelectorAll(".ms-home-faq details").forEach(function (details) {
      let body = details.querySelector(".ms-faq-body");
      if (!body) {
        body = document.createElement("div");
        body.className = "ms-faq-body";
        Array.from(details.childNodes).forEach(function (node) {
          if (node.nodeType === 1 && node.tagName === "SUMMARY") return;
          body.appendChild(node);
        });
        details.appendChild(body);
      }

      body.classList.add("ms-expand");
      ensureExpandInner(body);
      if (details.open) {
        body.hidden = false;
        body.classList.add("is-open");
      } else {
        body.hidden = true;
        body.classList.remove("is-open");
      }

      const summary = details.querySelector("summary");
      if (!summary || summary.dataset.msFaqBound === "1") return;
      summary.dataset.msFaqBound = "1";

      summary.addEventListener("click", function (e) {
        e.preventDefault();
        const next = !details.open;
        if (next) {
          details.open = true;
          setOpen(body, true);
        } else {
          setOpen(body, false).then(function () {
            details.open = false;
          });
        }
      });
    });
  }

  const PAGE_MOTION_SKIP = new Set(["editor", "builder", "home", "onboarding", "login"]);
  const PAGE_MOTION_NO_SHELL = new Set([
    "login",
    "orders",
    "contact",
    "terms",
    "privacy",
    "pricing",
    "apply",
  ]);
  const PAGE_MOTION_SELECTORS = [
    "#page-body > .ms-page-head",
    "#page-body > .ms-ldb-head",
    "#page-body > .ms-ldb-top",
    "#page-body > .ms-ldb-wall",
    "#page-body > .ms-lf-search",
    "#page-body > .ms-lf-popular",
    "#page-body > .ms-help-toc",
    "#page-body > .ms-help-vcard",
    "#page-body > .ms-help-contact-actions",
    "#page-body > .ms-store-mvp-note",
    "#page-body > .ms-settings-stack > .ms-card",
    "#page-body > .ms-dash-stack > .ms-card",
    "#page-body > .ms-dash-stack > .ms-dash-posts",
    "#page-body .ms-help-guide > .ms-card",
    "#page-body .ms-donate-channel > .ms-donate-card",
    "#page-body .ms-donate-channel > .ms-donate-wall",
    "#page-body .ms-store-grid > .ms-store-product",
    "#page-body > .ms-card",
    "#page-body > section:not(.ms-motion-skip)",
    "#page-body > .ms-pricing-content",
    "#page-body > .ms-course-video",
    ".ms-auth-card",
    ".ms-orders-head",
    ".ms-orders-toolbar",
    ".ms-orders-main > section",
    ".ms-contact-head",
    ".ms-contact-main > section",
    ".ms-legal-hero",
    ".ms-legal-wrap > .ms-card",
    ".ms-legal-wrap > section",
  ];

  const CHANNEL_HOP_KEY = "ms_channel_hop";
  const CHANNEL_LEAVE_MS = 280;

  let pageMotionStarted = false;
  let channelLeaveBound = false;

  function pageMotionShouldSkip() {
    const body = document.body;
    if (!body) return true;
    if (body.classList.contains("ms-onboard-page")) return true;
    const page = body.dataset.page || "";
    if (PAGE_MOTION_SKIP.has(page)) return true;
    return prefersReducedMotion();
  }

  function readChannelHop() {
    try {
      const raw = sessionStorage.getItem(CHANNEL_HOP_KEY);
      if (!raw) return null;
      const hop = JSON.parse(raw);
      if (!hop || !hop.t || Date.now() - hop.t > 8000) {
        sessionStorage.removeItem(CHANNEL_HOP_KEY);
        return null;
      }
      return hop;
    } catch (_) {
      return null;
    }
  }

  function consumeChannelHop() {
    const hop = readChannelHop();
    try {
      sessionStorage.removeItem(CHANNEL_HOP_KEY);
    } catch (_) {
      /* ignore */
    }
    return hop;
  }

  function writeChannelHop(dir, from, to) {
    try {
      sessionStorage.setItem(
        CHANNEL_HOP_KEY,
        JSON.stringify({
          dir: dir >= 0 ? 1 : -1,
          from: from || "",
          to: to || "",
          t: Date.now(),
        })
      );
    } catch (_) {
      /* ignore */
    }
  }

  function channelNavLinks() {
    return Array.from(
      document.querySelectorAll(".ms-sidebar .ms-nav a.ms-nav-link[href]:not(.is-soon)")
    );
  }

  function channelDirForLink(link) {
    const links = channelNavLinks();
    const toIdx = links.indexOf(link);
    const fromIdx = links.findIndex(function (el) {
      return el.classList.contains("is-active");
    });
    if (toIdx < 0 || fromIdx < 0) return 1;
    return toIdx >= fromIdx ? 1 : -1;
  }

  function isChannelNavClick(link, e) {
    if (!link || link.tagName !== "A") return false;
    if (link.classList.contains("is-soon") || link.classList.contains("is-active")) return false;
    if (link.hasAttribute("data-external-redirect")) return false;
    if (prefersReducedMotion()) return false;
    if (e.defaultPrevented || e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    const href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#") return false;
    try {
      const url = new URL(link.href, global.location.href);
      if (url.origin !== global.location.origin) return false;
      if (
        url.pathname === global.location.pathname &&
        url.search === global.location.search
      ) {
        return false;
      }
    } catch (_) {
      return false;
    }
    return true;
  }

  function leaveToChannel(link) {
    if (!link || document.body.classList.contains("ms-channel-leaving")) return;
    const dir = channelDirForLink(link);
    document.documentElement.style.setProperty("--ms-channel-dir", String(dir));
    writeChannelHop(dir, document.body?.dataset?.page || "", link.getAttribute("data-nav") || "");

    document.querySelectorAll(".ms-sidebar .ms-nav-link.is-active").forEach(function (el) {
      el.classList.remove("is-active");
      el.removeAttribute("aria-current");
    });
    link.classList.add("is-active");
    link.setAttribute("aria-current", "page");
    global.StudioShell?.syncNavPillForLink?.(link, { animate: true });

    document.body.classList.remove("ms-nav-open");
    document.body.classList.add("ms-channel-leaving");

    global.setTimeout(function () {
      global.location.assign(link.href);
    }, CHANNEL_LEAVE_MS);
  }

  function bindChannelNav() {
    if (channelLeaveBound) return;
    channelLeaveBound = true;
    document.addEventListener(
      "click",
      function (e) {
        const link = e.target?.closest?.("a.ms-nav-link[href]");
        if (!link || !link.closest(".ms-sidebar")) return;
        if (!isChannelNavClick(link, e)) return;
        e.preventDefault();
        leaveToChannel(link);
      },
      true
    );
  }

  function finishPageMotion() {
    document.body.classList.add("ms-page-motion-ready");
    document.documentElement.classList.add("ms-channel-entered");
    document.querySelectorAll(".ms-motion-item").forEach(function (el) {
      el.style.removeProperty("will-change");
    });
    const sidebar = document.getElementById("ms-sidebar");
    if (sidebar) sidebar.style.removeProperty("will-change");
    const pageBody = document.getElementById("page-body");
    if (pageBody) {
      global.setTimeout(function () {
        pageBody.style.removeProperty("will-change");
      }, 700);
    }
  }

  function isMotionCandidate(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.classList.contains("ms-motion-skip")) return false;
    if (el.classList.contains("ms-lf-skeleton")) return false;
    if (el.closest("[hidden]")) return false;
    if (el.closest(".ms-lf-results, .ms-lf-slide, dialog")) return false;
    return true;
  }

  function markPageMotionItems() {
    const seen = new Set();
    const items = [];

    PAGE_MOTION_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!isMotionCandidate(el) || seen.has(el)) return;
        seen.add(el);
        items.push(el);
      });
    });

    items.forEach(function (el, index) {
      el.style.setProperty("--ms-motion-i", String(index));
      el.classList.add("ms-motion-item");
    });

    return items;
  }

  function playChannelHopEnter() {
    if (pageMotionStarted) return;
    pageMotionStarted = true;
    consumeChannelHop();
    document.documentElement.classList.add("ms-channel-hop");
    void document.body.offsetWidth;
    nextFrame()
      .then(nextFrame)
      .then(function () {
        finishPageMotion();
      });
    global.setTimeout(function () {
      if (!document.body.classList.contains("ms-page-motion-ready")) {
        finishPageMotion();
      }
    }, 900);
  }

  function playPageMotion() {
    const hopping =
      document.documentElement.classList.contains("ms-channel-hop") || !!readChannelHop();

    if (hopping) {
      playChannelHopEnter();
      return;
    }

    if (pageMotionShouldSkip()) {
      finishPageMotion();
      return;
    }
    if (pageMotionStarted) return;
    pageMotionStarted = true;

    const items = markPageMotionItems();
    const sidebar = document.getElementById("ms-sidebar");
    if (sidebar) sidebar.classList.add("ms-motion-sidebar");

    if (!items.length && !sidebar) {
      finishPageMotion();
      return;
    }

    void document.body.offsetWidth;
    nextFrame()
      .then(nextFrame)
      .then(function () {
        finishPageMotion();
      });

    global.setTimeout(function () {
      if (!document.body.classList.contains("ms-page-motion-ready")) {
        finishPageMotion();
      }
    }, 1200);
  }

  function schedulePageMotion() {
    const hopping =
      document.documentElement.classList.contains("ms-channel-hop") || !!readChannelHop();

    if (!hopping && pageMotionShouldSkip()) {
      finishPageMotion();
      return;
    }

    const page = document.body?.dataset?.page || "";
    const usesShell = document.getElementById("shell") && !PAGE_MOTION_NO_SHELL.has(page);

    function tryPlay() {
      if (usesShell && !document.getElementById("ms-sidebar")) return;
      playPageMotion();
    }

    if (usesShell) {
      document.addEventListener("ms:shell-ready", tryPlay, { once: true });
      global.setTimeout(tryPlay, 1200);
      return;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", playPageMotion, { once: true });
    } else {
      playPageMotion();
    }
  }

  function boot() {
    if (!document.body || document.body.dataset.msMotion === "1") return;
    document.body.dataset.msMotion = "1";
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onPointer, true);
    document.addEventListener("click", onClick, true);
    bootFaq();
    bindChannelNav();
    schedulePageMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.StudioMotion = {
    press: playPress,
    setOpen: setOpen,
    showPanel: showPanel,
    hidePanel: hidePanel,
    revealPanel: revealPanel,
    waitForTransition: waitForTransition,
    prefersReducedMotion: prefersReducedMotion,
    playPageMotion: playPageMotion,
    leaveToChannel: leaveToChannel,
  };
})(window);
