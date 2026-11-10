(function () {
  var root = document.body;
  if (!root || root.getAttribute("data-page") !== "home") return;

  root.querySelectorAll("[data-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", on ? "true" : "false");
      var key = btn.getAttribute("data-toggle");
      var piece = root.querySelector('[data-piece="' + key + '"]');
      if (piece) piece.classList.toggle("is-off", !on);
      var widget = btn.closest("[data-widget]");
      if (widget) widget.classList.toggle("is-on", on);
    });
  });

  root.querySelectorAll("[data-mode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.getAttribute("data-mode");
      var group = btn.parentElement;
      if (group) {
        group.querySelectorAll("[data-mode]").forEach(function (el) {
          var active = el === btn;
          el.classList.toggle("is-active", active);
          el.setAttribute("aria-pressed", active ? "true" : "false");
        });
      }
      var stage = root.querySelector("[data-editor-stage]");
      if (!stage) return;
      stage.querySelectorAll("[data-view]").forEach(function (view) {
        view.hidden = view.getAttribute("data-view") !== mode;
      });
    });
  });

  var phone = root.querySelector("[data-finder]");
  if (phone) {
    var mapEl = phone.querySelector("[data-finder-map]");
    var query = phone.querySelector("[data-finder-query]");
    var places = Array.prototype.slice.call(phone.querySelectorAll("[data-place]"));
    var markers = [];
    var map = null;
    var started = false;

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
      places.forEach(function (btn) {
        btn.classList.toggle("is-on", btn.getAttribute("data-place") === id);
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
    }

    function applyFilter() {
      var q = query ? query.value.trim().toLowerCase() : "";
      places.forEach(function (btn) {
        var show = !q || btn.textContent.toLowerCase().indexOf(q) !== -1;
        btn.parentElement.classList.toggle("is-hidden", !show);
        markers.forEach(function (item) {
          if (item.id === btn.getAttribute("data-place")) item.pin.style.display = show ? "" : "none";
        });
      });
    }

    places.forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectPlace(btn.getAttribute("data-place"), true);
      });
    });
    if (query) query.addEventListener("input", applyFilter);

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
      map.addControl(new window.maplibregl.AttributionControl({ compact: true }), "bottom-left");
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
        map.fitBounds(bounds, { padding: { top: 88, bottom: 188, left: 64, right: 64 }, maxZoom: 14.2, duration: 0 });
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

  (function incomeDemo() {
    var panel = root.querySelector("[data-income]");
    if (!panel) return;
    var totalEl = panel.querySelector("[data-income-total]");
    var goalLabel = panel.querySelector("[data-income-goal-label]");
    var track = panel.querySelector("[data-income-track]");
    var fill = panel.querySelector("[data-income-fill]");
    var target = 1215;
    var goal = 2000;
    var started = false;
    var reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}

    function money(n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    }

    function setProgress(value) {
      var pct = Math.max(0, Math.min(100, (value / goal) * 100));
      if (totalEl) totalEl.textContent = money(value);
      if (goalLabel) goalLabel.textContent = money(value) + " / " + money(goal);
      if (fill) fill.style.width = pct + "%";
      if (track) track.setAttribute("aria-valuenow", String(Math.round(value)));
    }

    function play() {
      if (started) return;
      started = true;
      panel.classList.add("is-live");
      if (reduce) {
        setProgress(target);
        return;
      }
      var start = null;
      var duration = 1300;
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
      if (panel.classList.contains("is-in") || panel.getBoundingClientRect().top < window.innerHeight * 0.86) {
        play();
      }
    }

    maybePlay();
    window.addEventListener(
      "scroll",
      function () {
        maybePlay();
      },
      { passive: true }
    );
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
