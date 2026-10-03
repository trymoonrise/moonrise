/**
 * Runs synchronously in <head> on protected pages.
 * Hides the page until StudioAuth confirms the session, and redirects immediately
 * when there is no stored session (prevents a flash of private UI).
 * This is a UX gate only - tokens are not cryptographically verified here.
 */
(function () {
  if (!window.__msAppearanceBoot) {
    window.__msAppearanceBoot = 1;
    document.write('<script src="js/appearance.js?v=20261002-appearance5"><\/script>');
  }

  var PUBLIC = {
    "": 1,
    "index.html": 1,
    "login.html": 1,
    "apply.html": 1,
    "orders.html": 1,
    "contact.html": 1,
    "privacy.html": 1,
    "terms.html": 1,
    "refund.html": 1,
    "report.html": 1,
    "download.html": 1,
    "404.html": 1,
  };

  var file = location.pathname.split("/").pop() || "index.html";

  // Channel hop storage cleared - navigation is static (no enter hide/ease).
  try {
    sessionStorage.removeItem("ms_channel_hop");
  } catch (e) {}

  if (PUBLIC[file]) {
    var releasePublic = function () {
      if (window.__msReleaseBoot) window.__msReleaseBoot();
    };
    if (document.readyState === "complete") releasePublic();
    else window.addEventListener("load", releasePublic);
    return;
  }

  document.documentElement.classList.add("ms-auth-gating");
  document.documentElement.classList.add("ms-hold");

  var preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://erfaxgmnzdropviormpj.supabase.co";
  document.head.appendChild(preconnect);

  var cdn = document.createElement("link");
  cdn.rel = "preconnect";
  cdn.href = "https://cdn.jsdelivr.net";
  cdn.crossOrigin = "anonymous";
  document.head.appendChild(cdn);

  ["js/config.js?v=20261003-avatar", "js/app.js?v=20261003-avatar"].forEach(function (href) {
    var preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "script";
    preload.href = href;
    document.head.appendChild(preload);
  });

  var style = document.createElement("style");
  style.textContent = "html.ms-hold body{visibility:hidden!important}";
  document.head.appendChild(style);

  function redirectToLogin() {
    // A prerender that sends itself to login is what the next channel shows.
    if (document.prerendering) return;
    var next = encodeURIComponent(file + location.search + location.hash);
    location.replace("login.html?next=" + next);
  }

  try {
    localStorage.removeItem("moonrise-studio-auth");
    sessionStorage.removeItem("moonrise-studio-auth");
  } catch (e) {}

  function hasSessionCookie() {
    return /(?:^|;\s*)ms_on=1(?:;|$)/.test(document.cookie || "");
  }

  if (!hasSessionCookie()) {
    redirectToLogin();
    return;
  }

  window.__msReleaseAuthGate = function () {
    document.documentElement.classList.remove("ms-auth-gating");
    document.documentElement.classList.add("ms-auth-ready");
  };

  setTimeout(function () {
    if (document.documentElement.classList.contains("ms-auth-gating")) redirectToLogin();
  }, 12000);

  mountTabBarEarly();
  warmChannels();
})();

function warmChannels() {
  if (!document.head || document.getElementById("ms-channel-speculation")) return;
  // Prefetch only. Prerender runs the auth gate and can swap the next channel for the login page.
  // Admin Console is not warmed for everyone.
  var pages = ["dashboard.html", "builder.html", "leads.html", "clients.html", "settings.html", "projects.html", "help.html"];
  if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")) {
    var rules = document.createElement("script");
    rules.id = "ms-channel-speculation";
    rules.type = "speculationrules";
    rules.textContent = JSON.stringify({
      prefetch: [
        {
          urls: pages,
          eagerness: "conservative",
        },
      ],
    });
    document.head.appendChild(rules);
    return;
  }
  var here = (location.pathname.split("/").pop() || "").split("?")[0];
  function prefetch() {
    pages.forEach(function (href) {
      if (href === here) return;
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "document";
      link.href = href;
      document.head.appendChild(link);
    });
  }
  if (window.requestIdleCallback) requestIdleCallback(prefetch, { timeout: 800 });
  else setTimeout(prefetch, 250);
}

function mountTabBarEarly() {
  var stem = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/i, "") || "index";
  var pages = { dashboard: 1, builder: 1, clients: 1, settings: 1 };
  if (!pages[stem]) return;

  var icons = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="m20.91 11.73-4.24-4.24"/><path d="m14.5 7.5 3.5-3.5a2.12 2.12 0 0 1 3 3L17.5 10.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  };
  var items = [
    ["dashboard", "dashboard.html", "Dashboard", "Dashboard", icons.grid],
    ["builder", "builder.html", "Builder", "Builder", icons.hammer],
    ["leads", "leads.html", "Finder", "Business Finder", icons.search],
    ["clients", "clients.html", "Clients", "My Clients", icons.users],
    ["settings", "settings.html", "Settings", "Settings", icons.gear],
  ];

  function paint() {
    if (!document.body || document.getElementById("ms-tabbar")) return;
    var html = '<span class="ms-tab-pill" aria-hidden="true"></span>';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var active = stem === item[0];
      html +=
        '<a class="ms-tab' +
        (active ? " is-active" : "") +
        '" href="' +
        item[1] +
        '" data-tab="' +
        item[0] +
        '" aria-label="' +
        item[3] +
        '"' +
        (active ? ' aria-current="page"' : "") +
        '><span class="ms-tab-ico" aria-hidden="true">' +
        item[4] +
        '</span><span class="ms-tab-label">' +
        item[2] +
        "</span></a>";
    }
    var nav = document.createElement("nav");
    nav.id = "ms-tabbar";
    nav.className = "ms-tabbar";
    nav.setAttribute("aria-label", "Main pages");
    nav.dataset.mounted = "1";
    nav.innerHTML = html;
    document.body.appendChild(nav);
  }

  if (document.body) paint();
  else {
    var obs = new MutationObserver(function () {
      if (!document.body) return;
      obs.disconnect();
      paint();
    });
    obs.observe(document.documentElement, { childList: true });
    document.addEventListener("DOMContentLoaded", function () {
      obs.disconnect();
      paint();
    });
  }
}
