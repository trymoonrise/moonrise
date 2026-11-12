/**
 * Full-screen page menu shared by the public Moonrise pages.
 * The footer line is the latest commit on trymoonrise/moonrise.
 */
(function () {
  function formatRepoAgo(iso) {
    var then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return "";
    var sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
    function unit(n, one, many) {
      return n + " " + (n === 1 ? one : many);
    }
    if (sec < 60) return unit(sec, "second", "seconds");
    var min = Math.floor(sec / 60);
    if (min < 60) return unit(min, "minute", "minutes");
    var hr = Math.floor(min / 60);
    if (hr < 24) return unit(hr, "hour", "hours");
    var day = Math.floor(hr / 24);
    if (day < 7) return unit(day, "day", "days");
    var week = Math.floor(day / 7);
    if (week < 5) return unit(week, "week", "weeks");
    var month = Math.floor(day / 30);
    if (month < 12) return unit(Math.max(1, month), "month", "months");
    return unit(Math.max(1, Math.floor(day / 365)), "year", "years");
  }

  function ensureRepoStyle() {
    if (document.getElementById("ms-repo-updated-style")) return;
    var style = document.createElement("style");
    style.id = "ms-repo-updated-style";
    style.textContent = [
      ".ms-repo-updated{margin:0.85rem 0 0;color:#6e6e73;font-size:0.78rem;font-weight:500;line-height:1.4;letter-spacing:-0.01em;text-decoration:none}",
      ".ms-repo-updated:hover,.ms-repo-updated:focus-visible{color:#1d1d1f;text-decoration:underline}",
      ".ms-repo-updated[hidden]{display:none!important}",
      ".ms-legal-foot .ms-repo-updated{flex-basis:100%;margin:0.35rem 0 0;text-align:center}",
      "body>.ms-repo-updated.is-page-foot{margin:0;padding:1.5rem 1.25rem calc(1.35rem + env(safe-area-inset-bottom));text-align:center}",
      "body.ms-docs-page>.ms-repo-updated.is-page-foot{padding-bottom:calc(5.5rem + env(safe-area-inset-bottom))}",
    ].join("");
    document.head.appendChild(style);
  }

  var REPO_URL = "https://github.com/trymoonrise/moonrise";

  function asRepoLink(el) {
    if (el && el.tagName === "A") {
      el.href = REPO_URL;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
      return el;
    }
    var link = document.createElement("a");
    link.className = (el && el.className) || "ms-repo-updated";
    link.setAttribute("data-repo-updated", "");
    link.href = REPO_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.hidden = el ? el.hidden : true;
    link.textContent = (el && el.textContent) || "Last updated";
    if (el && el.classList.contains("is-page-foot")) link.classList.add("is-page-foot");
    if (el && el.parentNode) el.parentNode.replaceChild(link, el);
    return link;
  }

  function ensureRepoUpdated() {
    var existing = document.querySelector("[data-repo-updated]");
    if (existing) return asRepoLink(existing);
    var el = document.createElement("a");
    el.className = "ms-repo-updated";
    el.setAttribute("data-repo-updated", "");
    el.href = REPO_URL;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.hidden = true;
    el.textContent = "Last updated";
    var slot =
      document.querySelector(".ms-home-site-footer .ms-wrap") ||
      document.querySelector(".ms-orders-foot") ||
      document.querySelector(".ms-legal-foot") ||
      document.querySelector(".dt-foot");
    if (slot) {
      slot.appendChild(el);
      return el;
    }
    el.classList.add("is-page-foot");
    document.body.appendChild(el);
    return el;
  }

  function paintRepoUpdated(iso) {
    var el = ensureRepoUpdated();
    var ago = formatRepoAgo(iso);
    if (!ago) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = "Last updated " + ago + " ago";
    el.dataset.committedAt = iso;
    el.title = "Open trymoonrise/moonrise on GitHub";
  }

  function readRepoCommitAt() {
    return fetch("/studio-last-commit", { cache: "no-store", credentials: "omit" })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (data && data.committedAt) return String(data.committedAt);
        return fetch("https://api.github.com/repos/trymoonrise/moonrise/commits?sha=main&per_page=1", {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store",
        }).then(function (res) {
          return res.ok ? res.json() : null;
        });
      })
      .then(function (value) {
        if (typeof value === "string") return value;
        var rows = Array.isArray(value) ? value : [];
        var iso = rows[0] && rows[0].commit && (rows[0].commit.committer || rows[0].commit.author);
        if (iso && iso.date) return String(iso.date);
        return fetch("assets/last-commit.json?v=" + Date.now(), { cache: "no-store" }).then(function (res) {
          return res.ok ? res.json() : null;
        });
      })
      .then(function (value) {
        if (typeof value === "string") return value;
        return value && value.committedAt ? String(value.committedAt) : "";
      })
      .catch(function () {
        return "";
      });
  }

  function bootRepoUpdated() {
    ensureRepoStyle();
    ensureRepoUpdated();
    var iso = "";
    function paint() {
      if (iso) paintRepoUpdated(iso);
    }
    function pull() {
      readRepoCommitAt().then(function (next) {
        if (!next) return;
        iso = next;
        paint();
      });
    }
    pull();
    window.setInterval(paint, 1000);
    window.setInterval(pull, 60000);
  }

  bootRepoUpdated();

  var header = document.querySelector(".ms-site-bar");
  var button = document.querySelector(".ms-menu-btn");
  var menu = document.querySelector(".ms-menu-screen");
  var home = document.querySelector(".ms-home-btn");
  if (!header || !button || !menu) return;

  var label = button.querySelector(".ms-menu-label");
  var parkedParent = null;
  var parkedNext = null;
  var openFrame = 0;
  var closeTimer = 0;

  function currentPath() {
    return String(location.pathname || "/").toLowerCase();
  }

  function markCurrent() {
    var path = currentPath();
    menu.querySelectorAll("a").forEach(function (link) {
      var href = String(link.getAttribute("href") || "").toLowerCase().split("#")[0].split("?")[0];
      var slug = href.replace(/^\//, "").replace(/\.html$/, "");
      var onHome = path === "/" || /\/index\.html?$/.test(path);
      var current = slug === "" ? onHome : path === "/" + slug || path.endsWith("/" + slug) || path.endsWith("/" + slug + ".html");
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  // Sticky / transformed ancestors trap position:fixed and clip the overlay.
  // Park the bar on body while open so the menu covers the viewport.
  function parkOverlay(open) {
    if (open) {
      if (header.parentElement === document.body) return;
      parkedParent = header.parentElement;
      parkedNext = header.nextSibling;
      document.body.appendChild(header);
      return;
    }
    if (!parkedParent) return;
    if (parkedNext && parkedNext.parentNode === parkedParent) {
      parkedParent.insertBefore(header, parkedNext);
    } else {
      parkedParent.appendChild(header);
    }
    parkedParent = null;
    parkedNext = null;
  }

  function clearOpenFrame() {
    if (!openFrame) return;
    window.cancelAnimationFrame(openFrame);
    openFrame = 0;
  }

  function setOpen(open) {
    clearOpenFrame();
    window.clearTimeout(closeTimer);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (label) label.textContent = open ? "Close" : "Menu";

    if (open) {
      // Move first while closed, then flip is-open so fade/stagger still runs.
      parkOverlay(true);
      header.classList.remove("is-open");
      document.documentElement.classList.remove("ms-menu-open");
      void menu.offsetWidth;
      openFrame = window.requestAnimationFrame(function () {
        openFrame = window.requestAnimationFrame(function () {
          openFrame = 0;
          header.classList.add("is-open");
          document.documentElement.classList.add("ms-menu-open");
          menu.scrollTop = 0;
        });
      });
      return;
    }

    header.classList.remove("is-open");
    document.documentElement.classList.remove("ms-menu-open");
    var finished = false;
    function unpark() {
      if (finished) return;
      finished = true;
      menu.removeEventListener("transitionend", onEnd);
      parkOverlay(false);
    }
    function onEnd(event) {
      if (event.target !== menu) return;
      unpark();
    }
    menu.addEventListener("transitionend", onEnd);
    closeTimer = window.setTimeout(unpark, 420);
  }

  markCurrent();

  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  if (home) {
    home.addEventListener("click", function (event) {
      var path = currentPath();
      var onHome = path === "/" || /\/index\.html?$/.test(path);
      if (!onHome) return;
      event.preventDefault();
      setOpen(false);
      var reduce = false;
      try {
        reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch (e) {}
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });
})();
