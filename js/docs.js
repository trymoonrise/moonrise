/**
 * Docs shell: search, collapsible groups, hash scroll, scroll-spy.
 */
(function () {
  var root = document.querySelector("[data-docs]");
  if (!root) return;

  var search = root.querySelector("[data-docs-search]");
  var groups = Array.prototype.slice.call(root.querySelectorAll("[data-docs-group]"));
  var links = Array.prototype.slice.call(root.querySelectorAll(".ms-docs-nav a[href^='#']"));
  var mobileToggle = root.querySelector("[data-docs-mobile-toggle]");
  var sidebar = root.querySelector("[data-docs-sidebar]");
  var offset = 96;

  function setGroupOpen(group, open) {
    group.classList.toggle("is-open", open);
    var btn = group.querySelector("[data-docs-group-toggle]");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  groups.forEach(function (group) {
    var btn = group.querySelector("[data-docs-group-toggle]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      setGroupOpen(group, !group.classList.contains("is-open"));
    });
  });

  function filterNav(query) {
    var q = String(query || "")
      .trim()
      .toLowerCase();
    links.forEach(function (a) {
      var label = String(a.textContent || "")
        .trim()
        .toLowerCase();
      var match = !q || label.indexOf(q) !== -1;
      a.hidden = !match;
      a.classList.toggle("is-filtered-out", !match);
    });
    groups.forEach(function (group) {
      var visible = group.querySelectorAll(".ms-docs-nav a[href^='#']:not([hidden])");
      group.hidden = q && visible.length === 0;
      if (q && visible.length) setGroupOpen(group, true);
      if (!q) group.hidden = false;
    });
  }

  if (search) {
    search.addEventListener("input", function () {
      filterNav(search.value);
    });
  }

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", function () {
      var open = !sidebar.classList.contains("is-mobile-open");
      sidebar.classList.toggle("is-mobile-open", open);
      mobileToggle.setAttribute("aria-expanded", open ? "true" : "false");
      mobileToggle.textContent = open ? "Hide contents" : "Contents";
    });
  }

  var spyItems = links
    .map(function (a) {
      var id = (a.getAttribute("href") || "").slice(1);
      return { a: a, el: id ? document.getElementById(id) : null };
    })
    .filter(function (item) {
      return item.el;
    });

  function markCurrent() {
    if (!spyItems.length) return;
    var line = window.scrollY + offset;
    var current = spyItems[0];
    spyItems.forEach(function (item) {
      var top = item.el.getBoundingClientRect().top + window.scrollY;
      if (top <= line) current = item;
    });
    spyItems.forEach(function (item) {
      if (item === current) item.a.setAttribute("aria-current", "true");
      else item.a.removeAttribute("aria-current");
      var group = item.a.closest("[data-docs-group]");
      if (item === current && group && !search?.value) setGroupOpen(group, true);
    });
  }

  function scrollToHash(hash, replace) {
    var id = String(hash || "")
      .replace(/^#/, "")
      .trim();
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    var navLink = root.querySelector('.ms-docs-nav a[href="#' + id + '"]');
    if (navLink) {
      var g = navLink.closest("[data-docs-group]");
      if (g) setGroupOpen(g, true);
    }
    var top = el.getBoundingClientRect().top + window.scrollY - (offset - 12);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    if (replace) history.replaceState(null, "", "#" + id);
    else if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    markCurrent();
  }

  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      e.preventDefault();
      scrollToHash(href, false);
      if (sidebar && sidebar.classList.contains("is-mobile-open") && mobileToggle) {
        sidebar.classList.remove("is-mobile-open");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileToggle.textContent = "Contents";
      }
    });
  });

  window.addEventListener(
    "scroll",
    function () {
      markCurrent();
    },
    { passive: true }
  );

  window.addEventListener("hashchange", function () {
    scrollToHash(location.hash, true);
  });

  // Open all groups by default on first paint for discoverability, then spy can focus.
  groups.forEach(function (group) {
    setGroupOpen(group, true);
  });

  if (location.hash) {
    requestAnimationFrame(function () {
      scrollToHash(location.hash, true);
    });
  } else {
    markCurrent();
  }
})();
