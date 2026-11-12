(function () {
  var root = document.body;
  if (!root || root.getAttribute("data-page") !== "home") return;

  (function workspaceSim() {
    var sim = root.querySelector("[data-workspace-sim]");
    if (!sim) return;
    var nameOut = sim.querySelector("[data-sim-name]");
    var lineOut = sim.querySelector("[data-sim-line]");
    var domainOut = sim.querySelector("[data-sim-domain]");
    var hoursOut = sim.querySelector('[data-piece="hours"]');
    var codeOut = sim.querySelector("[data-sim-code]");
    var urlOut = sim.querySelector("[data-sim-url]");
    var publishBtn = sim.querySelector("[data-sim-publish]");
    var providerValue = sim.querySelector("[data-provider-value]");
    var providerLabel = sim.querySelector("[data-sim-provider-label]");
    var providerMenu = sim.querySelector("[data-provider-menu]");
    var providerTrigger = sim.querySelector("[data-provider-trigger]");
    function field(name) {
      return sim.querySelector('[data-sim-input="' + name + '"]');
    }

    function syncPreview() {
      var name = (field("name") && field("name").value.trim()) || "Business";
      var line = field("line") ? field("line").value.trim() : "";
      var hours = field("hours") ? field("hours").value.trim() : "";
      var domain = field("domain") ? field("domain").value.trim() : "";
      var email = field("email") ? field("email").value.trim() : "";
      if (nameOut) nameOut.textContent = name;
      if (lineOut) lineOut.textContent = line;
      if (hoursOut && hours) hoursOut.textContent = hours;
      if (domainOut && domain) domainOut.textContent = domain;
      if (urlOut) urlOut.textContent = name.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".moonrise.site";
      if (!codeOut) return;
      var lines = ["<h1>" + name + "</h1>", "<p>" + line + "</p>"];
      var contactOn = sim.querySelector('[data-toggle="contact"]');
      if (!contactOn || contactOn.getAttribute("aria-checked") === "true") {
        lines.push("<button>Send a message</button>");
        if (email) lines.push("<!-- " + email + " -->");
      }
      var hoursOn = sim.querySelector('[data-toggle="hours"]');
      if (hoursOn && hoursOn.getAttribute("aria-checked") === "true" && hours) lines.push("<span>" + hours + "</span>");
      var domainOn = sim.querySelector('[data-toggle="domain"]');
      if (domainOn && domainOn.getAttribute("aria-checked") === "true" && domain) lines.push("<span>" + domain + "</span>");
      codeOut.textContent = lines.join("\n");
    }

    function showPage(name) {
      sim.setAttribute("data-ws-page", name);
      sim.querySelectorAll("[data-ws-tab]").forEach(function (tab) {
        var on = tab.getAttribute("data-ws-tab") === name;
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
      sim.querySelectorAll("[data-ws-panel]").forEach(function (panel) {
        var on = panel.getAttribute("data-ws-panel") === name;
        panel.hidden = !on;
        panel.classList.toggle("is-on", on);
      });
      if (name === "finder") {
        var phone = root.querySelector("[data-finder]");
        if (phone && typeof phone.resizeMap === "function") phone.resizeMap();
      }
    }

    sim.showPage = showPage;

    sim.querySelectorAll("[data-ws-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        showPage(tab.getAttribute("data-ws-tab"));
      });
    });
    var back = sim.querySelector("[data-ws-back]");
    if (back) back.addEventListener("click", function () { showPage("finder"); });

    sim.querySelectorAll("[data-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        sim.querySelectorAll("[data-mode]").forEach(function (el) {
          var on = el === btn;
          el.classList.toggle("is-on", on);
          el.setAttribute("aria-pressed", on ? "true" : "false");
        });
        sim.querySelectorAll("[data-view]").forEach(function (view) {
          view.hidden = view.getAttribute("data-view") !== mode;
        });
      });
    });

    function setWidgetOpen(widget, open) {
      if (!widget) return;
      var body = widget.querySelector(".ms-ewidget-body");
      var btn = widget.querySelector("[data-disclose]");
      var title = (widget.querySelector(".ms-ewidget-copy strong") || {}).textContent || "section";
      if (open) {
        sim.querySelectorAll("[data-widget]").forEach(function (el) {
          if (el === widget) return;
          setWidgetOpen(el, false);
        });
      }
      widget.classList.toggle("is-expanded", !!open);
      if (body) body.hidden = !open;
      if (btn) {
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", (open ? "Hide " : "Show ") + title.trim() + " details");
      }
    }

    sim.querySelectorAll("[data-widget]").forEach(function (widget) {
      var head = widget.querySelector(".ms-ewidget-head");
      if (!head || head.getAttribute("data-disclose-bound") === "1") return;
      head.setAttribute("data-disclose-bound", "1");
      head.addEventListener("click", function (event) {
        if (event.target.closest("[data-toggle], .ms-eswitch")) return;
        setWidgetOpen(widget, !widget.classList.contains("is-expanded"));
      });
    });

    sim.querySelectorAll("[data-emode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-emode");
        var group = btn.closest("[role='group']") || btn.parentElement;
        group.querySelectorAll("[data-emode]").forEach(function (el) {
          var on = el === btn;
          el.classList.toggle("is-on", on);
          el.setAttribute("aria-pressed", on ? "true" : "false");
        });
        sim.querySelectorAll("[data-field]").forEach(function (el) {
          if (!group.contains(el) && el.closest("[data-widget]") !== btn.closest("[data-widget]")) return;
          el.hidden = el.getAttribute("data-field") !== mode;
        });
      });
    });

    sim.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("aria-checked") !== "true";
        btn.setAttribute("aria-checked", on ? "true" : "false");
        var key = btn.getAttribute("data-toggle");
        var piece = sim.querySelector('[data-piece="' + key + '"]');
        if (piece) piece.classList.toggle("is-off", !on);
        var widget = btn.closest("[data-widget]");
        if (widget) widget.classList.toggle("is-on", on);
        syncPreview();
      });
    });

    sim.querySelectorAll("[data-sim-input]").forEach(function (input) {
      input.addEventListener("input", syncPreview);
    });

    if (providerTrigger && providerMenu) {
      providerTrigger.addEventListener("click", function () {
        var open = providerMenu.hidden;
        providerMenu.hidden = !open;
        providerTrigger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      providerMenu.querySelectorAll("[data-provider]").forEach(function (option) {
        option.addEventListener("click", function () {
          var name = option.getAttribute("data-provider") || "";
          if (providerValue) providerValue.textContent = name;
          if (providerLabel) providerLabel.textContent = name;
          providerMenu.hidden = true;
          providerTrigger.setAttribute("aria-expanded", "false");
        });
      });
    }

    if (publishBtn) {
      publishBtn.addEventListener("click", function () {
        var live = !sim.classList.contains("is-published");
        sim.classList.toggle("is-published", live);
        publishBtn.textContent = live ? "Published" : "Publish";
        if (urlOut) urlOut.hidden = !live;
      });
    }

    var cta = sim.querySelector(".ms-sim-cta");
    if (cta) {
      cta.addEventListener("click", function () {
        cta.classList.add("is-sent");
        window.setTimeout(function () {
          cta.classList.remove("is-sent");
        }, 900);
      });
    }

    sim.loadPlace = function (btn) {
      if (!btn) return;
      var name = btn.getAttribute("data-sim-place-name") || "";
      var line = btn.getAttribute("data-sim-place-line") || "";
      var domain = name.toLowerCase().replace(/[^a-z0-9]+/g, "") + ".com";
      var email = "owner@" + domain;
      if (field("name") && name) field("name").value = name;
      if (field("line")) field("line").value = line;
      if (field("domain")) field("domain").value = domain;
      if (field("email")) field("email").value = email;
      if (nameOut && name) nameOut.textContent = name;
      if (lineOut) lineOut.textContent = line;
      if (domainOut) domainOut.textContent = domain;
      syncPreview();
    };

    document.addEventListener("click", function (event) {
      if (providerMenu && providerTrigger && !providerTrigger.contains(event.target) && !providerMenu.contains(event.target)) {
        providerMenu.hidden = true;
        providerTrigger.setAttribute("aria-expanded", "false");
      }
    });

    syncPreview();
  })();

  var phone = root.querySelector("[data-finder]");
  if (phone) {
    var mapEl = phone.querySelector("[data-finder-map]");
    var query = phone.querySelector("[data-finder-query]");
    var countEl = phone.querySelector("[data-finder-count]");
    var pill = phone.querySelector("[data-finder-pill]");
    var filterBtn = phone.querySelector("[data-finder-filter]");
    var filterMenu = phone.querySelector("[data-finder-filter-menu]");
    var places = Array.prototype.slice.call(phone.querySelectorAll("[data-place]"));
    var markers = [];
    var map = null;
    var started = false;
    var website = "without";

    function hardenMapExpr(expr) {
      var numeric = {
        "+": 1, "-": 1, "*": 1, "/": 1, "%": 1, "^": 1,
        ">": 1, "<": 1, ">=": 1, "<=": 1,
        step: 1, interpolate: 1, "interpolate-hcl": 1, "interpolate-lab": 1
      };
      if (!expr || !expr.length) return expr;
      if (typeof expr[0] !== "string") return expr.map(hardenMapExpr);
      var hardened = expr.map(function (part, i) { return i === 0 ? part : hardenMapExpr(part); });
      function asNumber(part) {
        if (part && part[0] === "get") return ["coalesce", part, 0];
        if (part && part[0] === "to-number") return ["coalesce", part, 0];
        return part;
      }
      if (numeric[hardened[0]]) {
        return hardened.map(function (part, i) { return i === 0 ? part : asNumber(part); });
      }
      if ((hardened[0] === "==" || hardened[0] === "!=") && hardened.length === 3) {
        var aNum = typeof hardened[1] === "number";
        var bNum = typeof hardened[2] === "number";
        if (!aNum && !bNum) return hardened;
        return [hardened[0], bNum ? asNumber(hardened[1]) : hardened[1], aNum ? asNumber(hardened[2]) : hardened[2]];
      }
      return hardened;
    }

    function hardenStyle(style) {
      if (!style || !style.layers) return style;
      var next = Object.assign({}, style);
      next.layers = style.layers.map(function (layer) {
        if (!layer) return layer;
        var copy = Object.assign({}, layer);
        if (copy.filter) copy.filter = hardenMapExpr(copy.filter);
        ["paint", "layout"].forEach(function (key) {
          if (!copy[key]) return;
          var bag = Object.assign({}, copy[key]);
          Object.keys(bag).forEach(function (name) {
            if (bag[name] && bag[name].length) bag[name] = hardenMapExpr(bag[name]);
          });
          copy[key] = bag;
        });
        return copy;
      });
      return next;
    }

    function selectPlace(id, move) {
      var picked = null;
      places.forEach(function (btn) {
        var on = btn.getAttribute("data-place") === id;
        btn.classList.toggle("is-on", on);
        if (on) picked = btn;
      });
      markers.forEach(function (item) {
        item.pin.classList.toggle("is-on", item.id === id);
        if (move && item.id === id && map) {
          map.easeTo({
            center: [item.lng, item.lat],
            zoom: Math.max(map.getZoom(), 14.4),
            duration: 450
          });
        }
      });
      var sim = root.querySelector("[data-workspace-sim]");
      if (sim && typeof sim.loadPlace === "function" && picked) sim.loadPlace(picked);
    }

    function applyFilter() {
      var q = query ? query.value.trim().toLowerCase() : "";
      var shown = 0;
      places.forEach(function (btn) {
        var site = btn.getAttribute("data-website") || "without";
        var show = (!q || btn.textContent.toLowerCase().indexOf(q) !== -1) && (website === "all" || website === site);
        btn.parentElement.classList.toggle("is-hidden", !show);
        if (show) shown += 1;
        markers.forEach(function (item) {
          if (item.id === btn.getAttribute("data-place")) item.pin.style.display = show ? "" : "none";
        });
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? " Business" : " Businesses");
    }

    function fitVisiblePlaces(duration) {
      if (!map || !markers.length || !window.maplibregl) return;
      var bounds = new window.maplibregl.LngLatBounds();
      markers.forEach(function (item) {
        if (item.pin.style.display === "none") return;
        bounds.extend([item.lng, item.lat]);
      });
      if (bounds.isEmpty()) return;
      map.fitBounds(bounds, {
        padding: { top: 88, bottom: 260, left: 48, right: 48 },
        maxZoom: 14.2,
        duration: duration == null ? 450 : duration
      });
    }

    phone.resizeMap = function () {
      if (!map) return;
      window.requestAnimationFrame(function () {
        map.resize();
        window.requestAnimationFrame(function () {
          map.resize();
          fitVisiblePlaces(0);
        });
      });
    };

    places.forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectPlace(btn.getAttribute("data-place"), true);
      });
    });
    if (query) {
      query.addEventListener("input", applyFilter);
      query.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && pill) {
          pill.classList.remove("is-search");
          query.blur();
        }
      });
    }
    var searchBtn = phone.querySelector("[data-finder-search]");
    if (searchBtn && pill && query) {
      searchBtn.addEventListener("click", function () {
        pill.classList.add("is-search");
        query.focus();
      });
    }
    if (filterBtn && filterMenu) {
      filterBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        var open = filterMenu.hidden;
        filterMenu.hidden = !open;
        filterBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      filterMenu.querySelectorAll("[data-website-filter]").forEach(function (option) {
        option.addEventListener("click", function () {
          website = option.getAttribute("data-website-filter") || "all";
          filterMenu.querySelectorAll("[data-website-filter]").forEach(function (el) {
            var on = el === option;
            el.classList.toggle("is-on", on);
            el.setAttribute("aria-pressed", on ? "true" : "false");
          });
          filterMenu.hidden = true;
          filterBtn.setAttribute("aria-expanded", "false");
          applyFilter();
        });
      });
    }
    var locateBtn = phone.querySelector("[data-finder-locate]");
    if (locateBtn) {
      locateBtn.addEventListener("click", function () {
        fitVisiblePlaces(450);
      });
    }

    function runScan(btn, label) {
      if (!btn || btn.classList.contains("is-loading")) return;
      var prev = btn.textContent;
      btn.classList.add("is-loading");
      btn.disabled = true;
      if (label) btn.textContent = label;
      markers.forEach(function (item) {
        item.pin.style.opacity = "0.35";
      });
      window.setTimeout(function () {
        markers.forEach(function (item) {
          item.pin.style.opacity = "";
        });
        applyFilter();
        fitVisiblePlaces(450);
        var first = places.find(function (el) {
          return !el.parentElement.classList.contains("is-hidden");
        });
        if (first) selectPlace(first.getAttribute("data-place"), false);
        btn.classList.remove("is-loading");
        btn.disabled = false;
        btn.textContent = prev;
      }, 900);
    }

    var scanBtn = phone.querySelector("[data-finder-scan]");
    if (scanBtn) {
      scanBtn.addEventListener("click", function () {
        runScan(scanBtn, "Scanning…");
      });
    }
    var allBtn = phone.querySelector("[data-finder-all]");
    if (allBtn) {
      allBtn.addEventListener("click", function () {
        website = "all";
        if (filterMenu) {
          filterMenu.querySelectorAll("[data-website-filter]").forEach(function (el) {
            var on = el.getAttribute("data-website-filter") === "all";
            el.classList.toggle("is-on", on);
            el.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }
        applyFilter();
        runScan(allBtn, "All");
      });
    }
    document.addEventListener("click", function (event) {
      if (!filterMenu || !filterBtn) return;
      if (filterBtn.contains(event.target) || filterMenu.contains(event.target)) return;
      filterMenu.hidden = true;
      filterBtn.setAttribute("aria-expanded", "false");
    });
    applyFilter();

    function startMap() {
      if (started || !mapEl || !window.maplibregl) return;
      started = true;
      map = new window.maplibregl.Map({
        container: mapEl,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [-71.4125, 41.8265],
        zoom: 13.6,
        attributionControl: false,
        cooperativeGestures: true,
        transformStyle: function (_previous, next) { return hardenStyle(next); }
      });
      map.scrollZoom.disable();
      map.on("load", function () {
        places.forEach(function (btn) {
          var pin = document.createElement("button");
          pin.type = "button";
          pin.className = "ms-demo-pin";
          pin.setAttribute("aria-label", btn.querySelector("strong").textContent);
          var item = {
            id: btn.getAttribute("data-place"),
            lng: Number(btn.getAttribute("data-lng")),
            lat: Number(btn.getAttribute("data-lat")),
            pin: pin
          };
          pin.addEventListener("click", function () { selectPlace(item.id, true); });
          new window.maplibregl.Marker({ element: pin, anchor: "bottom" })
            .setLngLat([item.lng, item.lat])
            .addTo(map);
          markers.push(item);
        });
        selectPlace("cafe", false);
        applyFilter();
        var bounds = new window.maplibregl.LngLatBounds();
        markers.forEach(function (item) { bounds.extend([item.lng, item.lat]); });
        map.fitBounds(bounds, { padding: { top: 88, bottom: 260, left: 64, right: 64 }, maxZoom: 14.2, duration: 0 });
        map.resize();
      });
    }

    function loadMap() {
      if (window.maplibregl) {
        startMap();
        return;
      }
      if (!document.querySelector("link[data-demo-map]")) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.2/dist/maplibre-gl.css";
        link.setAttribute("data-demo-map", "1");
        document.head.appendChild(link);
      }
      var existing = document.querySelector("script[data-demo-map]");
      if (existing) {
        existing.addEventListener("load", startMap);
        return;
      }
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.2/dist/maplibre-gl.js";
      script.defer = true;
      script.setAttribute("data-demo-map", "1");
      script.addEventListener("load", startMap);
      document.body.appendChild(script);
    }

    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          seen.disconnect();
          loadMap();
        });
      }, { rootMargin: "240px" });
      seen.observe(phone);
    } else {
      loadMap();
    }
  }

  var acc = root.querySelector("[data-accordion]");
  if (acc) {
    acc.addEventListener("click", function (event) {
      var trigger = event.target.closest(".dt-acc-trigger");
      if (!trigger || !acc.contains(trigger)) return;
      var item = trigger.closest(".dt-acc-item");
      var wasOpen = item.classList.contains("is-open");
      acc.querySelectorAll(".dt-acc-item").forEach(function (el) {
        el.classList.remove("is-open");
        var button = el.querySelector(".dt-acc-trigger");
        if (button) button.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  }

  var rises = root.querySelectorAll(".ms-rise");
  function reveal() {
    var edge = window.innerHeight * 0.9;
    rises.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      if (el.getBoundingClientRect().top < edge) el.classList.add("is-in");
    });
  }
  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
  window.addEventListener("resize", reveal);

  (function howFindDemo() {
    var finds = Array.prototype.slice.call(root.querySelectorAll("[data-how-find]"));
    if (!finds.length) return;
    var words = ["barbershop", "plumber", "cafe", "clinic", "gym", "dentist"];
    var reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    finds.forEach(function (find) {
      var pins = Array.prototype.slice.call(find.querySelectorAll("[data-how-pin]"));
      var typeEl = find.querySelector("[data-how-type]");
      var pinIndex = Math.max(0, pins.findIndex(function (pin) { return pin.classList.contains("is-hot"); }));
      var wordIndex = 0;
      var charIndex = 0;
      var deleting = false;
      var holdUntil = 0;
      var started = false;
      var card = find.closest(".ms-how-card") || find;

      function pickPin(next) {
        if (pins.length < 2) return;
        pinIndex = ((next % pins.length) + pins.length) % pins.length;
        pins.forEach(function (pin, n) {
          pin.classList.toggle("is-hot", n === pinIndex);
        });
      }

      function tickType(now) {
        if (!typeEl || reduce) return;
        if (now < holdUntil) {
          window.setTimeout(function () { tickType(performance.now()); }, holdUntil - now);
          return;
        }
        var word = words[wordIndex];
        if (!deleting) {
          charIndex += 1;
          typeEl.textContent = word.slice(0, charIndex);
          if (charIndex >= word.length) {
            deleting = true;
            holdUntil = now + 1100;
            pickPin(pinIndex + 1);
            window.setTimeout(function () { tickType(performance.now()); }, 1100);
            return;
          }
          window.setTimeout(function () { tickType(performance.now()); }, 78);
          return;
        }
        charIndex -= 1;
        typeEl.textContent = word.slice(0, Math.max(0, charIndex));
        if (charIndex <= 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          holdUntil = now + 280;
          window.setTimeout(function () { tickType(performance.now()); }, 280);
          return;
        }
        window.setTimeout(function () { tickType(performance.now()); }, 42);
      }

      function start() {
        if (started) return;
        started = true;
        if (reduce) {
          if (typeEl) typeEl.textContent = words[0];
          pickPin(pinIndex);
          return;
        }
        if (typeEl) typeEl.textContent = "";
        charIndex = 0;
        deleting = false;
        tickType(performance.now());
      }

      function maybeStart() {
        if (card.classList.contains("is-in") || card.getBoundingClientRect().top < window.innerHeight * 0.9) {
          start();
        }
      }

      maybeStart();
      window.addEventListener("scroll", maybeStart, { passive: true });
    });
  })();

  (function howBuildDemo() {
    var builds = Array.prototype.slice.call(root.querySelectorAll("[data-how-build]"));
    if (!builds.length) return;
    var steps = [
      {
        prompt: "Reading the business",
        path: "brief.json",
        added: 12,
        removed: 0,
        lines: [
          { n: 1, text: '{ "name": "Northside Cafe" }' },
          { n: 2, text: '{ "city": "Providence" }' },
          { n: 3, text: '{ "need": "website" }' }
        ]
      },
      {
        prompt: "Writing index.html",
        path: "index.html",
        added: 48,
        removed: 0,
        lines: [
          { n: 1, text: "<h1>Northside Cafe</h1>" },
          { n: 2, text: "<p>Coffee on the north side.</p>" },
          { n: 3, text: "<button>Send a message</button>" },
          { n: 4, text: "<span>Open daily 7a–4p</span>" },
          { n: 5, text: "<span>northsidecafe.com</span>" }
        ]
      },
      {
        prompt: "Writing css/site.css",
        path: "css/site.css",
        added: 36,
        removed: 2,
        lines: [
          { n: 8, text: "body { background: #f5f5f7; }" },
          { n: 14, text: ".hero { padding: 4rem 1.5rem; }" },
          { n: 22, text: "h1 { letter-spacing: -0.04em; }" }
        ]
      },
      {
        prompt: "Writing js/site.js",
        path: "js/site.js",
        added: 18,
        removed: 0,
        lines: [
          { n: 1, text: "const form = document.querySelector('form');" },
          { n: 4, text: "form?.addEventListener('submit', send);" },
          { n: 9, text: "export function boot() {}" }
        ]
      },
      {
        prompt: "Publishing the preview",
        path: "preview.html",
        added: 9,
        removed: 1,
        lines: [
          { n: 1, text: "<!-- live preview ready -->" },
          { n: 2, text: '<meta name="ms-preview" content="1">' },
          { n: 3, text: "<title>Northside Cafe</title>" }
        ]
      }
    ];
    var reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    var lineMs = reduce ? 420 : 110;
    var fileGap = reduce ? 520 : 160;

    builds.forEach(function (build) {
      var filesEl = build.querySelector("[data-how-files]");
      var card = build.closest(".ms-how-card") || build;
      var fileIndex = 0;
      var shown = 0;
      var started = false;
      var timer = null;

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function render(step, count) {
        if (!filesEl || !step) return;
        var lines = step.lines || [];
        var start = Math.max(0, count - 3);
        var visible = lines.slice(start, count);
        var html = visible
          .map(function (line, i) {
            var fresh = start + i === count - 1;
            return (
              '<div class="ms-how-term-line is-add' +
              (fresh ? " is-fresh" : "") +
              '">' +
              '<span class="ms-how-term-n">' +
              escapeHtml(line.n || start + i + 1) +
              "</span>" +
              '<span class="ms-how-term-op">+</span>' +
              '<span class="ms-how-term-text">' +
              escapeHtml(line.text) +
              "</span>" +
              "</div>"
            );
          })
          .join("");
        filesEl.innerHTML =
          '<p class="ms-how-term-cmd">' +
          escapeHtml(step.prompt) +
          "</p>" +
          '<div class="ms-how-term-file">' +
          '<div class="ms-how-term-file-head">' +
          '<span class="ms-how-term-path">' +
          escapeHtml(step.path) +
          "</span>" +
          '<span class="ms-how-term-stat">' +
          '<span class="ms-how-term-add">+' +
          count +
          "</span>" +
          '<span class="ms-how-term-del">\u2212' +
          (count >= lines.length ? step.removed || 0 : 0) +
          "</span>" +
          "</span>" +
          "</div>" +
          '<div class="ms-how-term-lines">' +
          html +
          "</div>" +
          "</div>";
      }

      function step() {
        var current = steps[fileIndex];
        var total = (current && current.lines && current.lines.length) || 0;
        if (!current || shown >= total) {
          fileIndex = (fileIndex + 1) % steps.length;
          shown = 0;
          timer = window.setTimeout(step, fileGap);
          return;
        }
        shown += 1;
        render(current, shown);
        timer = window.setTimeout(step, lineMs);
      }

      function start() {
        if (started) return;
        started = true;
        step();
      }

      function maybeStart() {
        if (card.classList.contains("is-in") || card.getBoundingClientRect().top < window.innerHeight * 0.9) {
          start();
        }
      }

      maybeStart();
      window.addEventListener("scroll", maybeStart, { passive: true });
    });
  })();

  (function howSaleDemo() {
    var sales = Array.prototype.slice.call(root.querySelectorAll("[data-how-sale]"));
    if (!sales.length) return;
    var target = 2430;
    var goal = 4000;
    var reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    function money(n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    }

    sales.forEach(function (sale) {
      var earnEl = sale.querySelector("[data-how-earn]");
      var goalLabel = sale.querySelector("[data-how-goal-label]");
      var fill = sale.querySelector("[data-how-goal-fill]");
      var card = sale.closest(".ms-how-card") || sale;
      var started = false;

      function setProgress(value) {
        var pct = Math.max(0, Math.min(100, (value / goal) * 100));
        if (earnEl) earnEl.textContent = money(value);
        if (goalLabel) goalLabel.textContent = money(value) + " / " + money(goal);
        if (fill) fill.style.width = pct + "%";
      }

      function play() {
        if (started) return;
        started = true;
        sale.classList.add("is-live");
        if (reduce) {
          setProgress(target);
          return;
        }
        var start = null;
        var duration = 1400;
        function tick(ts) {
          if (start == null) start = ts;
          var t = Math.min(1, (ts - start) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          setProgress(target * eased);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }

      function maybePlay() {
        if (card.classList.contains("is-in") || card.getBoundingClientRect().top < window.innerHeight * 0.9) {
          play();
        }
      }

      maybePlay();
      window.addEventListener("scroll", maybePlay, { passive: true });
    });
  })();

  function whenReady(fn) {
    if (root.classList.contains("is-home-ready")) {
      fn();
      return;
    }
    var observer = new MutationObserver(function () {
      if (!root.classList.contains("is-home-ready")) return;
      observer.disconnect();
      fn();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  whenReady(function () {
    var hero = root.querySelector(".ms-home-hero");
    if (hero) hero.classList.add("is-revealed");
  });
})();
