/**
 * Runs synchronously in <head> on protected pages.
 * Hides the page until StudioAuth confirms the session, and redirects immediately
 * when there is no stored session (prevents a flash of private UI).
 * This is a UX gate only - tokens are not cryptographically verified here.
 */
(function () {
  // Installed home-screen apps drop into Safari/Chrome chrome on a normal link
  // navigation. Stay in this web app for same-origin pages.
  try {
    var standalone =
      window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    if (standalone && !window.__msStandaloneNav) {
      window.__msStandaloneNav = 1;
      document.addEventListener(
        "click",
        function (event) {
          var link = event.target && event.target.closest && event.target.closest("a[href]");
          if (!link) return;
          if (event.defaultPrevented || event.button !== 0) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          if (link.target && link.target !== "_self") return;
          if (link.hasAttribute("download")) return;
          var url;
          try {
            url = new URL(link.getAttribute("href"), location.href);
          } catch (err) {
            return;
          }
          if (url.origin !== location.origin) return;
          if (url.pathname === location.pathname && url.hash === location.hash) return;
          event.preventDefault();
          location.assign(url.pathname + url.search + url.hash);
        },
        false
      );
    }
  } catch (err) {}

  if (!window.__msAppearanceBoot) {
    window.__msAppearanceBoot = 1;
    document.write('<script src="js/appearance.js?v=20261108-skel-nav"><\/script>');
  }

  var PUBLIC = {
    "": 1,
    "/": 1,
    index: 1,
    login: 1,
    orders: 1,
    contact: 1,
    privacy: 1,
    terms: 1,
    refund: 1,
    legal: 1,
    report: 1,
    download: 1,
    "404": 1,
    "ui-library": 1,
    guide: 1,
    help: 1,
    pricing: 1,
    donate: 1,
    leaderboard: 1,
    "hosting-billing": 1,
    "creator-contact": 1,
  };

  var file = (location.pathname.split("/").pop() || "").replace(/\.html$/i, "");
  if (!file || file === "index") file = "/";

  // Channel hop storage cleared - navigation is static (no enter hide/ease).
  try {
    sessionStorage.removeItem("ms_channel_hop");
  } catch (e) {}

  if (PUBLIC[file]) {
    var releasePublic = function () {
      if (window.__msReleaseBoot) window.__msReleaseBoot();
    };
    // Release as soon as the DOM is ready — do not wait for window.load/fonts.
    if (document.readyState === "interactive" || document.readyState === "complete") {
      releasePublic();
    } else {
      document.addEventListener("DOMContentLoaded", releasePublic, { once: true });
    }
    return;
  }

  var tabHop = false;
  try {
    tabHop =
      !!sessionStorage.getItem("ms_tab_switch") ||
      sessionStorage.getItem("ms_studio_booted") === "1" ||
      !!window.__msTabHop;
  } catch (e) {}

  document.documentElement.classList.add("ms-auth-gating");
  // After the first studio paint, keep chrome visible and skip the moonrise boot.
  // Cold first load still holds until the shell paints.
  if (!tabHop) {
    document.documentElement.classList.add("ms-hold");
    window.__msStudioBoot = 1;
  } else {
    window.__msTabHop = 1;
    window.__msStudioBoot = 0;
    document.documentElement.classList.add("ms-boot-done");
    window.__msBootReleased = 1;
  }

  var preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://erfaxgmnzdropviormpj.supabase.co";
  document.head.appendChild(preconnect);

  var cdn = document.createElement("link");
  cdn.rel = "preconnect";
  cdn.href = "https://cdn.jsdelivr.net";
  cdn.crossOrigin = "anonymous";
  document.head.appendChild(cdn);

  // Keep these query strings in sync with the <script defer> tags on studio pages,
  // or the browser warns that a preload was unused.
  ["js/config.js?v=20261108-no-lf", "js/auth.js?v=20261108-clean-urls", "js/app.js?v=20261108-clean-urls"].forEach(function (href) {
    var preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "script";
    preload.href = href;
    document.head.appendChild(preload);
  });

  if (!tabHop) {
    var style = document.createElement("style");
    style.textContent = "html.ms-hold body{visibility:hidden!important}";
    document.head.appendChild(style);
  }

  function redirectToLogin() {
    // A prerender that sends itself to login is what the next channel shows.
    if (document.prerendering) return;
    if (window.__msAuthRedirecting) return;
    window.__msAuthRedirecting = true;
    try {
      sessionStorage.removeItem("ms_studio_booted");
      sessionStorage.removeItem("ms_tab_switch");
    } catch (e) {}
    var next = encodeURIComponent(file + location.search + location.hash);
    location.replace("login?next=" + next);
  }

  try {
    localStorage.removeItem("moonrise-studio-auth");
    sessionStorage.removeItem("moonrise-studio-auth");
  } catch (e) {}

  function looksSignedIn() {
    try {
      if (sessionStorage.getItem("ms_session_hint") === "1") return true;
    } catch (e) {}
    return /(?:^|;\s*)ms_on=1(?:;|$)/.test(document.cookie || "");
  }

  // No saved sign-in: go to login before the page paints.
  // A saved sign-in stays on this channel under the loader until auth.js confirms it.
  if (!looksSignedIn()) {
    redirectToLogin();
    return;
  }

  window.__msReleaseAuthGate = function () {
    document.documentElement.classList.remove("ms-auth-gating");
    document.documentElement.classList.add("ms-auth-ready");
    // Do not release the moonrise bar here — wait until paintApp marks the shell.
  };

  // Absolute escape: shell must paint or we leave this hold screen.
  // Onboarding has no sidebar shell — soft-release instead of bouncing to 404.
  setTimeout(function () {
    if (window.__msAuthRedirecting) return;
    if (document.body && document.body.dataset.msShellPainted === "1" && !document.getElementById("ms-boot")) return;
    if (file === "onboarding") {
      try {
        if (document.body) document.body.dataset.msShellPainted = "1";
        document.documentElement.classList.remove("ms-boot");
        document.documentElement.classList.remove("ms-hold");
        document.documentElement.classList.remove("ms-auth-gating");
        document.documentElement.classList.add("ms-boot-done");
        window.__msStudioBoot = 0;
        window.__msBootReleased = 1;
        document.getElementById("ms-boot")?.remove();
        if (typeof window.__msReleaseBoot === "function") window.__msReleaseBoot();
      } catch (e) {}
      return;
    }
    window.__msAuthRedirecting = true;
    try {
      document.documentElement.classList.remove("ms-boot");
      document.documentElement.classList.remove("ms-hold");
      document.documentElement.classList.remove("ms-auth-gating");
      document.getElementById("ms-boot")?.remove();
    } catch (e) {}
    location.replace("404");
  }, 5000);

  mountTabBarEarly();
})();

function mountTabBarEarly() {
  var stem = (location.pathname.split("/").pop() || "/").replace(/\.html$/i, "") || "index";
  var pages = {
    dashboard: 1,
    builder: 1,
    clients: 1,
    settings: 1,
    course: 1,
    donate: 1,
    leaderboard: 1,
    "admin-console": 1,
    projects: 1,
    pricing: 1,
    calendar: 1,
  };
  var activeTabs = { dashboard: 1, builder: 1, clients: 1, settings: 1 };
  if (!pages[stem]) return;

  var icons = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="m20.91 11.73-4.24-4.24"/><path d="m14.5 7.5 3.5-3.5a2.12 2.12 0 0 1 3 3L17.5 10.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="7" x2="19" y2="7"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="17" x2="19" y2="17"/></svg>',
  };
  var items = [
    ["dashboard", "dashboard", "Dashboard", "Dashboard", icons.grid],
    ["builder", "builder", "Builder", "Builder", icons.hammer],
    ["leads", "leads", "Finder", "Business Finder", icons.search],
    ["clients", "clients", "Clients", "My Clients", icons.users],
    ["settings", "settings", "Settings", "Settings", icons.gear],
  ];

  function paint() {
    if (!document.body) return;
    if (!document.getElementById("ms-menu-toggle")) {
      var menu = document.createElement("button");
      menu.type = "button";
      menu.id = "ms-menu-toggle";
      menu.className = "ms-menu-toggle";
      menu.setAttribute("aria-label", "Open menu");
      menu.setAttribute("aria-expanded", "false");
      menu.innerHTML = icons.menu;
      document.body.appendChild(menu);
    }
    if (document.getElementById("ms-tabbar")) return;
    var html = '<span class="ms-tab-pill" aria-hidden="true"></span>';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var active = !!activeTabs[stem] && stem === item[0];
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
    nav.dataset.page = stem;
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
