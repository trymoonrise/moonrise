(function () {
  "use strict";

  const INDEX = [
    { g: "sections", id: "announcements", t: "Announcements" },
    { g: "sections", id: "borders", t: "Borders" },
    { g: "sections", id: "cta", t: "Calls to action" },
    { g: "sections", id: "clients", t: "Clients" },
    { g: "sections", id: "comparisons", t: "Comparisons" },
    { g: "sections", id: "docks", t: "Docks" },
    { g: "sections", id: "faqs", t: "FAQs" },
    { g: "sections", id: "features", t: "Features" },
    { g: "sections", id: "footers", t: "Footers" },
    { g: "sections", id: "galleries", t: "Galleries" },
    { g: "sections", id: "gradients", t: "Gradients" },
    { g: "sections", id: "heroes", t: "Heroes" },
    { g: "sections", id: "hooks", t: "Hooks", alias: "motion" },
    { g: "sections", id: "images", t: "Images" },
    { g: "sections", id: "maps", t: "Maps" },
    { g: "sections", id: "marquees", t: "Marquees" },
    { g: "sections", id: "nav-menus", t: "Navigation menus", alias: "navigation" },
    { g: "sections", id: "pricing", t: "Pricing" },
    { g: "sections", id: "scroll-areas", t: "Scroll areas" },
    { g: "sections", id: "scroll-effects", t: "Scroll effects" },
    { g: "sections", id: "shaders", t: "Shaders" },
    { g: "sections", id: "stats", t: "Stats" },
    { g: "sections", id: "steppers", t: "Steppers" },
    { g: "sections", id: "team", t: "Team" },
    { g: "sections", id: "testimonials", t: "Testimonials" },
    { g: "sections", id: "text", t: "Text", alias: "typography" },
    { g: "sections", id: "timelines", t: "Timelines" },
    { g: "sections", id: "videos", t: "Videos" },

    { g: "components", id: "accordions", t: "Accordions", alias: "accordion" },
    { g: "components", id: "ai-chats", t: "AI chats", alias: "status" },
    { g: "components", id: "alerts", t: "Alerts", alias: "feedback" },
    { g: "components", id: "avatars", t: "Avatars" },
    { g: "components", id: "badges", t: "Badges" },
    { g: "components", id: "buttons", t: "Buttons" },
    { g: "components", id: "calendars", t: "Calendars" },
    { g: "components", id: "cards", t: "Cards" },
    { g: "components", id: "carousels", t: "Carousels", alias: "media" },
    { g: "components", id: "charts", t: "Charts", alias: "data" },
    { g: "components", id: "checkboxes", t: "Checkboxes" },
    { g: "components", id: "cursors", t: "Cursors" },
    { g: "components", id: "dashboards", t: "Dashboards" },
    { g: "components", id: "date-pickers", t: "Date pickers" },
    { g: "components", id: "dialogs", t: "Dialogs", alias: "system" },
    { g: "components", id: "dropdowns", t: "Dropdowns" },
    { g: "components", id: "empty-states", t: "Empty states" },
    { g: "components", id: "file-trees", t: "File trees" },
    { g: "components", id: "file-uploads", t: "File uploads" },
    { g: "components", id: "forms", t: "Forms" },
    { g: "components", id: "globes", t: "Globes" },
    { g: "components", id: "bento", t: "Bento" },
    { g: "components", id: "icons", t: "Icons" },
    { g: "components", id: "inputs", t: "Inputs", alias: "advanced" },
    { g: "components", id: "links", t: "Links" },
    { g: "components", id: "lists", t: "Lists", alias: "surfaces" },
    { g: "components", id: "menus", t: "Menus" },
    { g: "components", id: "notifications", t: "Notifications" },
    { g: "components", id: "numbers", t: "Numbers" },
    { g: "components", id: "onboarding", t: "Onboarding" },
    { g: "components", id: "pagination", t: "Pagination" },
    { g: "components", id: "popovers", t: "Popovers" },
    { g: "components", id: "profiles", t: "Profiles" },
    { g: "components", id: "progress", t: "Progress" },
    { g: "components", id: "radio-groups", t: "Radio groups", alias: "choice" },
    { g: "components", id: "search-bars", t: "Search bars" },
    { g: "components", id: "selects", t: "Selects" },
    { g: "components", id: "sidebars", t: "Sidebars" },
    { g: "components", id: "sign-in", t: "Sign in" },
    { g: "components", id: "sign-up", t: "Sign up" },
    { g: "components", id: "sliders", t: "Sliders" },
    { g: "components", id: "spinner-loaders", t: "Spinner loaders", alias: "loaders" },
    { g: "components", id: "tables", t: "Tables" },
    { g: "components", id: "tabs", t: "Tabs" },
    { g: "components", id: "tags", t: "Tags" },
    { g: "components", id: "text-areas", t: "Text areas" },
    { g: "components", id: "toasts", t: "Toasts" },
    { g: "components", id: "toggles", t: "Toggles" },
    { g: "components", id: "tooltips", t: "Tooltips" },

    { g: "screens", id: "authentication", t: "Authentication" },
    { g: "screens", id: "onboarding-flows", t: "Onboarding flows" },
    { g: "screens", id: "nav-systems", t: "Navigation systems" },
    { g: "screens", id: "data-tables", t: "Data tables" },
    { g: "screens", id: "data-viz", t: "Data visualization" },
    { g: "screens", id: "file-management", t: "File management" },
    { g: "screens", id: "search-interfaces", t: "Search interfaces" },
    { g: "screens", id: "profile-screens", t: "Profile screens" },
    { g: "screens", id: "settings", t: "Settings" },
    { g: "screens", id: "notification-center", t: "Notification center" },
    { g: "screens", id: "form-systems", t: "Form systems" },
    { g: "screens", id: "loading-states", t: "Loading states" },
    { g: "screens", t: "Dashboards", link: "dashboards" },
    { g: "screens", t: "Empty states", link: "empty-states" },
    { g: "screens", t: "Dialogs", link: "dialogs" },

    { g: "terms", id: "motion-terms", t: "Motion", blurb: "How movement should feel." },
    { g: "terms", id: "type-terms", t: "Type", blurb: "How letters sit on the page." },
    { g: "terms", id: "layout-terms", t: "Layout", blurb: "How space, edges, and color hold a screen." },
    { g: "terms", id: "interaction-terms", t: "Interaction", blurb: "How a control answers a person." },
    { g: "terms", id: "looks-terms", t: "Looks to leave out", blurb: "Fashions that make a product look generated." }
  ];

  const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  const ready = new Set();

  function tocHtml() {
    const groups = [
      ["sections", "Sections"],
      ["components", "Components"],
      ["screens", "Screens"],
      ["terms", "Terms"]
    ];
    const toggle =
      '<button type="button" class="dt-toc-btn ms-float-toc-btn" data-toc-toggle aria-expanded="false" aria-controls="dt-toc-panel">' +
      "Table of contents</button>";
    const pin = '<div class="dt-toc-pin"><a href="#craft">Special Prompt</a><a href="#cookbook">Cookbook</a></div>';
    const switcher = '<div class="dt-toc-switch" role="tablist" aria-label="Catalog groups">' +
      '<button type="button" class="is-on" data-toc-group="sections" aria-selected="true">Sections</button>' +
      '<button type="button" data-toc-group="components" aria-selected="false">Components</button>' +
      '<button type="button" data-toc-group="screens" aria-selected="false">Screens</button>' +
      '<button type="button" data-toc-group="terms" aria-selected="false">Terms</button></div>';
    const body = groups.map(function (group, index) {
      const links = INDEX.filter(function (item) { return item.g === group[0]; }).map(function (item) {
        return '<a href="#' + (item.link || item.id) + '">' + item.t + "</a>";
      }).join("");
      return '<div class="dt-toc-group' + (index === 0 ? " is-shown" : "") + '" data-group="' + group[0] + '"><p class="dt-toc-label">' + group[1] + "</p>" + links + "</div>";
    }).join("");
    return toggle + '<div class="dt-toc-panel" id="dt-toc-panel">' + pin + switcher + '<div class="dt-toc-scroll">' + body + "</div></div>";
  }

  function shellsHtml() {
    return INDEX.filter(function (item) { return item.id; }).map(function (item) {
      const alias = item.alias ? '<span id="' + item.alias + '" class="dt-alias"></span>' : "";
      const dict = item.g === "terms" ? ' data-lx-dict="1"' : "";
      const blurb = item.blurb ? '<p>' + item.blurb + "</p>" : "";
      return '<section class="dt-section" id="' + item.id + '" data-lx-cat="' + item.id + '"' + dict + '>' + alias +
        '<header class="dt-section-head"><h2>' + item.t + "</h2>" + blurb + '</header><div class="dt-grid"></div></section>';
    }).join("");
  }

  function cardHtml(item) {
    const play = item.play
      ? '<button type="button" class="dt-play-ico" data-play="' + item.play + '" aria-label="Play ' + item.title + ' demo">' + PLAY + "</button>"
      : "";
    const attrs = item.play ? ' data-demo="' + item.play + '" data-stage-tap="' + item.play + '"' : "";
    const stage = ["dt-stage", "lx-stretch", item.stage].filter(Boolean).join(" ");
    return '<article class="dt-card' + (item.wide ? " dt-card-wide" : "") + '" id="' + item.id + '">' +
      '<div class="dt-card-top"><div class="dt-card-head"><h3>' + item.title + "</h3>" + play + "</div></div>" +
      '<div class="' + stage + '"' + attrs + ">" + item.html + "</div></article>";
  }

  function mountSection(section) {
    if (!section || ready.has(section.id)) return;
    const spec = window.LX.specs[section.id];
    const grid = section.querySelector(".dt-grid");
    if (!grid) return;
    ready.add(section.id);
    ((spec && spec.adopt) || []).forEach(function (id) {
      const node = document.getElementById(id);
      if (node && node.classList.contains("dt-card")) grid.appendChild(node);
    });
    const cap = section.dataset.lxDict ? 48 : 10;
    ((spec && spec.cards) || []).forEach(function (item) {
      if (grid.querySelectorAll(".dt-card").length >= cap) return;
      if (document.getElementById(item.id)) return;
      grid.insertAdjacentHTML("beforeend", cardHtml(item));
    });
    if (window.dtMountDownloads) window.dtMountDownloads(section);
    syncAcc(section);
    section.querySelectorAll(".lx-dock").forEach(armDock);
    section.querySelectorAll("[data-lx-compare]").forEach(armCompare);
    section.querySelectorAll(".lx-float").forEach(armFloat);
    section.querySelectorAll("[data-lx-scene]").forEach(armScrollScene);
  }

  const sceneReduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function sceneProgress(scene) {
    const max = scene.scrollHeight - scene.clientHeight;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, scene.scrollTop / max));
  }

  function measureScrubSpan(row) {
    if (!row || !row.parentElement) return 0;
    return Math.max(0, row.scrollWidth - row.parentElement.clientWidth);
  }

  function armScrollScene(scene) {
    if (!scene || scene._lxSceneBound) return;
    scene._lxSceneBound = true;
    const kind = scene.getAttribute("data-lx-scene") || "";
    const scrubHost = scene.querySelector("[data-lx-scrub]");
    const scrubRow = scene.querySelector("[data-lx-scrub-row]");
    const shrink = scene.querySelector("[data-lx-shrink]");
    const paraLayers = scene.querySelectorAll("[data-lx-para]");
    const railSteps = scene.querySelectorAll("[data-lx-rail-step]");
    const railPanels = scene.querySelectorAll("[data-lx-rail-panel]");

    function apply() {
      const p = sceneProgress(scene);
      scene.style.setProperty("--lx-p", String(p));
      scene.classList.toggle("is-scrolled", scene.scrollTop > 12);

      if (scrubRow && !sceneReduce) {
        const span = measureScrubSpan(scrubRow);
        scene.style.setProperty("--lx-scrub-span", span + "px");
        scrubRow.style.transform = "translate3d(" + (-p * span) + "px,0,0)";
      }

      if (shrink && !sceneReduce) {
        shrink.style.setProperty("--lx-p", String(p));
      }

      if (paraLayers.length && !sceneReduce) {
        paraLayers.forEach(function (layer) {
          const rate = Number(layer.getAttribute("data-lx-para") || "0.5");
          layer.style.setProperty("--lx-para", String(rate));
          layer.style.setProperty("--lx-p", String(p));
        });
      }

      if (railSteps.length && railPanels.length) {
        let current = 0;
        const top = scene.getBoundingClientRect().top + scene.clientHeight * 0.35;
        railPanels.forEach(function (panel, index) {
          if (panel.getBoundingClientRect().top <= top) current = index;
        });
        railSteps.forEach(function (step, index) {
          step.classList.toggle("is-on", index === current);
        });
      }
    }

    if (scrubHost && scrubRow) {
      scrubHost.style.height = sceneReduce ? "auto" : "240%";
    }

    scene.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    apply();
  }

  function accPanel(btn) {
    const next = btn.nextElementSibling;
    if (next && next.classList.contains("lx-p")) return next;
    const row = btn.parentElement;
    const after = row && row.nextElementSibling;
    if (after && after.classList.contains("lx-p")) return after;
    return null;
  }

  function syncAcc(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-lx-acc]").forEach(function (btn) {
      const panel = accPanel(btn);
      if (panel) panel.hidden = !btn.classList.contains("is-open");
    });
  }

  const dockList = [];
  const dockReduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function dockButtons(dock) {
    return Array.prototype.filter.call(dock.children, function (node) {
      return node.tagName === "BUTTON";
    });
  }

  function placeDockThumb(dock, instant) {
    const thumb = dock.querySelector(":scope > .lx-dock-thumb");
    const active = dock.querySelector(":scope > button.is-on");
    if (!thumb || !active) return;
    if (instant) thumb.style.transition = "none";
    thumb.style.width = active.offsetWidth + "px";
    thumb.style.height = active.offsetHeight + "px";
    thumb.style.transform = "translate3d(" + active.offsetLeft + "px," + active.offsetTop + "px,0)";
    if (instant) {
      void thumb.offsetWidth;
      thumb.style.transition = "";
    }
  }

  function popDockIcon(button) {
    const icon = button.querySelector(".lx-ico");
    if (!icon) return;
    icon.classList.remove("is-pop");
    void icon.offsetWidth;
    icon.classList.add("is-pop");
  }

  const floatList = [];

  function placeFloatThumb(dock, instant) {
    const thumb = dock.querySelector(":scope > .lx-float-thumb");
    const active = dock.querySelector(":scope > button.is-on");
    if (!thumb || !active) return;
    if (instant) thumb.style.transition = "none";
    const dot = dock.classList.contains("is-inbox");
    const w = dot ? 4 : active.offsetWidth;
    const h = dot ? 4 : active.offsetHeight;
    const x = active.offsetLeft + (dot ? (active.offsetWidth - w) / 2 : 0);
    const y = active.offsetTop + (dot ? active.offsetHeight - 8 : 0);
    thumb.style.width = w + "px";
    thumb.style.height = h + "px";
    thumb.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    if (instant) {
      void thumb.offsetWidth;
      thumb.style.transition = "";
    }
  }

  function armFloat(dock) {
    if (!dock || dock.dataset.lxFloat) return;
    dock.dataset.lxFloat = "1";
    if (!dock.querySelector(":scope > button.is-on")) {
      const first = dock.querySelector(":scope > button");
      if (first) first.classList.add("is-on");
    }
    if (dock.classList.contains("is-orbs")) return;
    const thumb = document.createElement("span");
    thumb.className = "lx-float-thumb";
    thumb.setAttribute("aria-hidden", "true");
    dock.insertBefore(thumb, dock.firstChild);
    floatList.push(dock);
    placeFloatThumb(dock, true);
    window.requestAnimationFrame(function () { placeFloatThumb(dock, true); });
  }

  function armCompare(root) {
    if (!root || root.dataset.lxCompare) return;
    root.dataset.lxCompare = "1";
    const knob = root.querySelector(".lx-compare-knob");
    function place(clientX) {
      const rect = root.getBoundingClientRect();
      const raw = ((clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const pct = Math.min(97, Math.max(3, raw));
      root.style.setProperty("--lx-pos", pct.toFixed(2) + "%");
      if (knob) knob.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
    root.addEventListener("pointerdown", function (event) {
      if (event.button != null && event.button !== 0) return;
      root.classList.add("is-drag");
      try { root.setPointerCapture(event.pointerId); } catch (err) { /* pointer already released */ }
      place(event.clientX);
    });
    root.addEventListener("pointermove", function (event) {
      if (!root.classList.contains("is-drag")) return;
      place(event.clientX);
    });
    function end() { root.classList.remove("is-drag"); }
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", end);
    if (!knob) return;
    knob.addEventListener("keydown", function (event) {
      const current = parseFloat(knob.getAttribute("aria-valuenow") || "50");
      let next = current;
      if (event.key === "ArrowLeft") next = current - 4;
      else if (event.key === "ArrowRight") next = current + 4;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = 100;
      else return;
      event.preventDefault();
      next = Math.min(97, Math.max(3, next));
      root.style.setProperty("--lx-pos", next + "%");
      knob.setAttribute("aria-valuenow", String(Math.round(next)));
    });
  }

  function armDock(dock) {
    if (!dock || dock.dataset.lxArmed) return;
    dock.dataset.lxArmed = "1";
    dock.classList.add("is-armed");
    const buttons = dockButtons(dock);
    if (!dock.querySelector(":scope > button.is-on") && buttons[0]) buttons[0].classList.add("is-on");
    dock.addEventListener("pointerenter", function () { dock._lxHover = true; });
    dock.addEventListener("pointerleave", function () { dock._lxHover = false; });
    dockList.push(dock);
    placeDockThumb(dock, true);
  }

  function stepDock(dock) {
    const buttons = dockButtons(dock);
    if (buttons.length < 2) return;
    let index = 0;
    for (let i = 0; i < buttons.length; i += 1) {
      if (buttons[i].classList.contains("is-on")) index = i;
    }
    const next = buttons[(index + 1) % buttons.length];
    selectIn(dock, next, "button");
    popDockIcon(next);
  }

  function startDockLoop() {
    if (startDockLoop.started || dockReduce) return;
    startDockLoop.started = true;
    const tick = function () {
      dockList.forEach(function (dock) {
        if (!dock.isConnected || dock._lxHover) return;
        if (performance.now() < (dock._lxUntil || 0)) return;
        stepDock(dock);
      });
      window.setTimeout(tick, 1500);
    };
    window.setTimeout(tick, 700);
    window.addEventListener("resize", function () {
      dockList.forEach(function (dock) { placeDockThumb(dock, true); });
    });
  }

  function selectIn(parent, chosen, selector) {
    parent.querySelectorAll(selector).forEach(function (node) {
      if (node.parentElement !== parent) return;
      node.classList.toggle("is-on", node === chosen);
    });
    const dock = parent.classList && parent.classList.contains("lx-dock")
      ? parent
      : (parent.closest ? parent.closest(".lx-dock") : null);
    if (dock) placeDockThumb(dock, false);
    const float = parent.classList && parent.classList.contains("lx-float") ? parent : null;
    if (float) placeFloatThumb(float, false);
  }

  function sectionFor(id) {
    if (!id) return null;
    const direct = document.getElementById(id);
    if (direct) {
      if (direct.dataset && direct.dataset.lxCat) return direct;
      const host = direct.closest ? direct.closest("[data-lx-cat]") : null;
      if (host) return host;
    }
    const specs = window.LX.specs;
    const keys = Object.keys(specs);
    for (let i = 0; i < keys.length; i += 1) {
      const adopt = specs[keys[i]].adopt || [];
      if (adopt.indexOf(id) !== -1) return document.getElementById(keys[i]);
    }
    return null;
  }

  function showGroup(name) {
    document.querySelectorAll("[data-toc-group]").forEach(function (button) {
      const on = button.getAttribute("data-toc-group") === name;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".dt-toc-group").forEach(function (group) {
      group.classList.toggle("is-shown", group.getAttribute("data-group") === name);
    });
  }

  function openHash() {
    const id = (location.hash || "").replace(/^#/, "");
    if (!id) return;
    const all = Array.prototype.slice.call(document.querySelectorAll("[data-lx-cat]"));
    const target = sectionFor(id);
    for (let i = 0; i < all.length; i += 1) {
      mountSection(all[i]);
      if (all[i] === target) break;
    }
    const el = document.getElementById(id);
    if (el && el.scrollIntoView) el.scrollIntoView();
  }

  function install() {
    const toc = document.getElementById("dt-toc");
    const root = document.getElementById("lx-root");
    if (!toc || !root || !window.LX) return;
    if (!toc.querySelector("a")) toc.innerHTML = tocHtml();
    if (!root.querySelector("[data-lx-cat]")) root.innerHTML = shellsHtml();

    const tocToggle = toc.querySelector("[data-toc-toggle]");
    function setTocOpen(open) {
      if (!tocToggle) return;
      toc.classList.toggle("is-open", open);
      tocToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    if (tocToggle) {
      tocToggle.addEventListener("click", function () {
        setTocOpen(!toc.classList.contains("is-open"));
      });
    }

    document.addEventListener("click", function (event) {
      if (!toc.classList.contains("is-open")) return;
      if (toc.contains(event.target)) return;
      setTocOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setTocOpen(false);
    });

    toc.addEventListener("click", function (event) {
      const button = event.target.closest("[data-toc-group]");
      if (button) {
        showGroup(button.getAttribute("data-toc-group"));
        return;
      }
      const link = event.target.closest("a[href^='#']");
      if (!link) return;
      const id = link.getAttribute("href").slice(1);
      const section = document.getElementById(id);
      if (section && section.dataset.lxCat) mountSection(section);
      else {
        const host = sectionFor(id);
        if (host) mountSection(host);
      }
      setTocOpen(false);
    });

    document.addEventListener("click", function (event) {
      const player = event.target.closest("[data-lx-player]");
      if (player) {
        const video = player.querySelector("video");
        if (video) {
          if (video.paused) {
            const play = video.play();
            if (play && play.catch) play.catch(function () {});
            player.classList.add("is-on");
            player.setAttribute("aria-label", "Pause video");
          } else {
            video.pause();
            player.classList.remove("is-on");
            player.setAttribute("aria-label", "Play video");
          }
        }
        return;
      }
      const dismiss = event.target.closest("[data-lx-dismiss]");
      if (dismiss) {
        const note = dismiss.closest(".lx-ann, .lx-note, .lx-alert, .lx-toast, .lx-badge, .lx-pop");
        if (note) note.remove();
      }
      const opt = event.target.closest("[data-lx-opt]");
      if (opt && opt.parentElement && !opt.disabled) selectIn(opt.parentElement, opt, "[data-lx-opt]");
      const dockBtn = event.target.closest(".lx-dock button");
      if (dockBtn) {
        const dock = dockBtn.closest(".lx-dock");
        if (dock) {
          dock._lxUntil = performance.now() + 2600;
          popDockIcon(dockBtn);
        }
      }
      const bare = event.target.closest(".lx-cal-grid button, .lx-dock button, .lx-side button, .lx-top button, .lx-pages button, .lx-tree button");
      if (bare && !bare.disabled && !bare.hasAttribute("data-lx-opt") && !bare.hasAttribute("data-lx-folder") && !bare.hasAttribute("data-lx-toggle") && !bare.hasAttribute("data-lx-check") && !bare.hasAttribute("data-lx-acc")) {
        selectIn(bare.parentElement, bare, "button");
      }
      const folder = event.target.closest("[data-lx-folder]");
      if (folder) {
        const sub = folder.nextElementSibling;
        const open = folder.getAttribute("aria-expanded") !== "true";
        folder.setAttribute("aria-expanded", open ? "true" : "false");
        if (sub) sub.hidden = !open;
      }
      const acc = event.target.closest("[data-lx-acc]");
      if (acc) {
        acc.classList.toggle("is-open");
        const panel = accPanel(acc);
        if (panel) panel.hidden = !acc.classList.contains("is-open");
      }
      const act = event.target.closest("[data-lx-act]");
      if (act && !act.disabled) {
        act.textContent = act.getAttribute("data-lx-act");
        act.disabled = true;
      }
      const add = event.target.closest("[data-lx-add]");
      if (add) {
        const compose = add.closest(".lx-compose");
        const input = compose && compose.querySelector("input");
        const text = input && input.value.trim();
        if (text) {
          const badge = document.createElement("span");
          badge.className = "lx-badge";
          badge.textContent = text;
          compose.parentElement.insertBefore(badge, compose);
          input.value = "";
        }
      }
      const toggle = event.target.closest("[data-lx-toggle]");
      if (toggle && !toggle.disabled) {
        toggle.classList.toggle("is-on");
        toggle.setAttribute("aria-pressed", toggle.classList.contains("is-on") ? "true" : "false");
      }
      const check = event.target.closest("[data-lx-check]");
      if (check && !check.disabled) check.classList.toggle("is-on");
    });

    document.addEventListener("input", function (event) {
      const slider = event.target.closest && event.target.closest("input.lx-slider");
      if (!slider) return;
      const stage = slider.closest(".dt-stage");
      const mono = stage && stage.querySelector(".lx-mono");
      if (mono && !mono.hasAttribute("data-count")) mono.textContent = slider.value;
    });

    const queue = Array.prototype.slice.call(document.querySelectorAll("[data-lx-cat]"));
    function drain() {
      let n = 0;
      while (n < 4 && queue.length) {
        mountSection(queue.shift());
        n += 1;
      }
      if (!queue.length) return;
      const schedule = window.requestIdleCallback || function (fn) { window.setTimeout(fn, 16); };
      schedule(drain, { timeout: 80 });
    }
    queue.forEach(function (section) {
      const box = section.getBoundingClientRect();
      if (box.top < window.innerHeight + 240) mountSection(section);
    });
    openHash();
    drain();
    startDockLoop();
    window.addEventListener("resize", function () {
      floatList.forEach(function (dock) { placeFloatThumb(dock, true); });
    });
    window.addEventListener("hashchange", openHash);
  }

  install();
})();
