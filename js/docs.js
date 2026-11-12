/**
 * Docs shell: flexible full-text search, TOC, hash scroll, scroll-spy.
 */
(function () {
  var root = document.querySelector("[data-docs]");
  if (!root) return;

  var search = root.querySelector("[data-docs-search]");
  var searchForm = root.querySelector("[data-docs-search-form]");
  var searchClear = root.querySelector("[data-docs-search-clear]");
  var searchStatus = root.querySelector("[data-docs-search-status]");
  var searchEmpty = root.querySelector("[data-docs-search-empty]");
  var searchWrap = root.querySelector(".ms-docs-search-wrap");
  var groups = Array.prototype.slice.call(root.querySelectorAll("[data-docs-group]"));
  var links = Array.prototype.slice.call(root.querySelectorAll(".ms-docs-nav a[href^='#']"));
  var mobileToggle = root.querySelector("[data-docs-mobile-toggle]");
  var sidebar = root.querySelector("[data-docs-sidebar]");
  var tocToggle = root.querySelector("[data-docs-toc-toggle]");
  var aside = root.querySelector(".ms-docs-aside");
  var main = root.querySelector(".ms-docs-main") || document.getElementById("main");

  var ALIASES = {
    tos: ["terms", "terms of service"],
    privacy: ["privacy policy", "data", "breach"],
    refund: ["refunds", "cancellation", "cancel"],
    payout: ["cash app", "venmo", "paypal", "zelle", "earnings", "get paid"],
    pay: ["payment", "checkout", "watermark", "stripe", "payout"],
    domain: ["dns", "custom domain", "vercel"],
    finder: ["business finder", "leads", "scan", "maps"],
    breach: ["security", "data breach", "privacy"],
    password: ["passkey", "sign in", "login", "email link"],
    ssn: ["social security", "identity", "id"],
    license: ["licenses", "mit", "credit", "github"],
    credit: ["attribution", "license", "trymoonrise"],
    open: ["open source", "private", "commercial", "download"],
    subprocessors: ["supabase", "vercel", "stripe", "providers"],
  };

  function setTocOpen(open) {
    if (!aside || !tocToggle) return;
    aside.classList.toggle("is-open", open);
    tocToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (tocToggle) {
    tocToggle.addEventListener("click", function () {
      setTocOpen(!aside.classList.contains("is-open"));
    });
  }

  document.addEventListener("click", function (event) {
    if (!aside || !aside.classList.contains("is-open")) return;
    if (aside.contains(event.target)) return;
    setTocOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (search && String(search.value || "").trim()) {
        clearSearch();
        search.focus();
        return;
      }
      setTocOpen(false);
    }
    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      var tag = (event.target && event.target.tagName) || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/i.test(tag) || (event.target && event.target.isContentEditable)) return;
      if (!search) return;
      event.preventDefault();
      search.focus();
      search.select();
    }
  });

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

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/&amp;/g, " and ")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9+#.\s'-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .filter(function (t) {
        return t.length > 0;
      });
  }

  function expandQuery(raw) {
    var base = tokenize(raw);
    var out = [];
    var seen = Object.create(null);
    function add(tok) {
      var t = normalize(tok);
      if (!t || seen[t]) return;
      seen[t] = true;
      out.push(t);
    }
    base.forEach(function (tok) {
      add(tok);
      var aliases = ALIASES[tok];
      if (!aliases) return;
      aliases.forEach(function (alias) {
        tokenize(alias).forEach(add);
      });
    });
    return { tokens: out, phrase: normalize(raw) };
  }

  function wordsOf(hay) {
    return tokenize(hay);
  }

  function tokenMatches(hay, words, token) {
    if (!token) return true;
    if (hay.indexOf(token) !== -1) return true;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w === token || w.indexOf(token) === 0 || token.indexOf(w) === 0) return true;
      if (token.length >= 4 && w.length >= 4 && editDistance(token, w) <= 1) return true;
      if (token.length >= 6 && w.length >= 6 && editDistance(token, w) <= 2) return true;
    }
    return false;
  }

  function editDistance(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 99;
    var prev = [];
    var cur = [];
    var i;
    var j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      var tmp = prev;
      prev = cur;
      cur = tmp;
    }
    return prev[b.length];
  }

  function scoreSection(hay, query) {
    if (!query.tokens.length) return 1;
    var words = wordsOf(hay);
    var score = 0;
    for (var i = 0; i < query.tokens.length; i++) {
      var tok = query.tokens[i];
      if (!tokenMatches(hay, words, tok)) return 0;
      if (hay.indexOf(tok) !== -1) score += 3;
      else score += 1;
    }
    if (query.phrase && query.phrase.length > 2 && hay.indexOf(query.phrase) !== -1) score += 8;
    return score;
  }

  function collectSections() {
    if (!main) return [];
    var nodes = Array.prototype.slice.call(
      main.querySelectorAll(".ms-doc-block[id], .ms-legal-article[id], section[id]")
    );
    var seen = Object.create(null);
    return nodes
      .filter(function (el) {
        if (!el.id || seen[el.id]) return false;
        seen[el.id] = true;
        return true;
      })
      .map(function (el) {
        var titleEl = el.querySelector("h1, h2, .ms-doc-title, .ms-legal-section-head");
        var title = titleEl ? String(titleEl.textContent || "").trim() : el.id;
        var text = normalize(title + " " + String(el.textContent || ""));
        return { el: el, id: el.id, title: title, text: text };
      });
  }

  var sections = collectSections();

  function setStatus(text) {
    if (searchStatus) searchStatus.textContent = text || "";
  }

  function clearSearch() {
    if (search) search.value = "";
    applySearch("");
  }

  function applySearch(raw) {
    var q = String(raw || "").trim();
    var query = expandQuery(q);
    var active = !!q;
    if (searchWrap) searchWrap.classList.toggle("is-active", active);
    if (searchClear) searchClear.hidden = !active;
    root.classList.toggle("is-docs-searching", active);

    var matchedIds = Object.create(null);
    var matchCount = 0;
    var ranked = [];

    sections.forEach(function (sec) {
      var score = scoreSection(sec.text, query);
      var show = !active || score > 0;
      sec.el.hidden = !show;
      sec.el.classList.toggle("is-docs-miss", active && !show);
      sec.el.classList.toggle("is-docs-hit", active && show);
      if (show && active) {
        matchedIds[sec.id] = score;
        matchCount += 1;
        ranked.push({ id: sec.id, score: score, title: sec.title });
      }
    });

    links.forEach(function (a) {
      var id = (a.getAttribute("href") || "").slice(1);
      var labelHay = normalize(a.textContent || "");
      var labelScore = active ? scoreSection(labelHay, query) : 1;
      var sectionScore = active ? matchedIds[id] || 0 : 1;
      var match = !active || sectionScore > 0 || labelScore > 0;
      a.hidden = !match;
      a.classList.toggle("is-filtered-out", !match);
      if (match && active && !matchedIds[id] && labelScore > 0) {
        var secEl = document.getElementById(id);
        if (secEl) {
          secEl.hidden = false;
          secEl.classList.add("is-docs-hit");
          secEl.classList.remove("is-docs-miss");
          matchedIds[id] = labelScore;
          matchCount += 1;
        }
      }
    });

    groups.forEach(function (group) {
      var visible = group.querySelectorAll(".ms-docs-nav a[href^='#']:not([hidden])");
      group.hidden = active && visible.length === 0;
      if (active && visible.length) setGroupOpen(group, true);
      if (!active) group.hidden = false;
    });

    if (searchEmpty) searchEmpty.hidden = !active || matchCount > 0;

    if (!active) {
      setStatus("");
      return;
    }

    ranked.sort(function (a, b) {
      return b.score - a.score || a.title.localeCompare(b.title);
    });
    setStatus(matchCount ? matchCount + (matchCount === 1 ? " section" : " sections") : "No matches");

    if (matchCount === 1 && ranked[0]) {
      var only = document.getElementById(ranked[0].id);
      if (only) {
        var top = only.getBoundingClientRect().top + window.scrollY - (offset - 12);
        if (Math.abs(window.scrollY - top) > 80) {
          window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
      }
    }
  }

  var searchTimer = 0;
  function scheduleSearch() {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      applySearch(search ? search.value : "");
    }, 80);
  }

  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applySearch(search ? search.value : "");
      var firstHit = main && main.querySelector(".ms-doc-block.is-docs-hit[id], .ms-legal-article.is-docs-hit[id], section.is-docs-hit[id]");
      if (firstHit) scrollToHash("#" + firstHit.id, false);
    });
  }

  if (search) {
    search.addEventListener("input", scheduleSearch);
    search.addEventListener("search", function () {
      applySearch(search.value);
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", function () {
      clearSearch();
      if (search) search.focus();
    });
  }

  if (searchWrap) {
    var stick = function () {
      if (!searchWrap) return;
      var hero = root.querySelector(".ms-docs-hero");
      var heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      searchWrap.classList.toggle("is-stuck", heroBottom <= 72);
    };
    window.addEventListener("scroll", stick, { passive: true });
    stick();
  }

  try {
    var params = new URLSearchParams(location.search);
    var qParam = params.get("q");
    if (qParam && search) {
      search.value = qParam;
      applySearch(qParam);
    }
  } catch (e) {}

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
    var current = null;
    spyItems.forEach(function (item) {
      if (item.el.hidden) return;
      var top = item.el.getBoundingClientRect().top + window.scrollY;
      if (top <= line) current = item;
    });
    if (!current) {
      for (var i = 0; i < spyItems.length; i++) {
        if (!spyItems[i].el.hidden) {
          current = spyItems[i];
          break;
        }
      }
    }
    if (!current) return;
    spyItems.forEach(function (item) {
      if (item === current) item.a.setAttribute("aria-current", "true");
      else item.a.removeAttribute("aria-current");
      var group = item.a.closest("[data-docs-group]");
      if (item === current && group && !(search && search.value)) setGroupOpen(group, true);
    });
    var railAside = current.a.closest(".ms-docs-aside");
    var railNav = current.a.closest(".ms-docs-onpage");
    var rail = railNav && railNav.scrollHeight > railNav.clientHeight + 2 ? railNav : railAside;
    if (rail) {
      var railBox = rail.getBoundingClientRect();
      var linkBox = current.a.getBoundingClientRect();
      if (linkBox.top < railBox.top || linkBox.bottom > railBox.bottom) {
        rail.scrollTop += linkBox.top - railBox.top - (railBox.height - linkBox.height) / 2;
      }
    }
  }

  function scrollToHash(hash, replace) {
    var id = String(hash || "")
      .replace(/^#/, "")
      .trim();
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    if (el.hidden) el.hidden = false;
    var navLink = root.querySelector('.ms-docs-nav a[href="#' + id + '"]');
    if (navLink) {
      navLink.hidden = false;
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
      setTocOpen(false);
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
