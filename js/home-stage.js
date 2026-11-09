(function () {
  var root = document.body;
  if (!root || root.getAttribute("data-page") !== "home") return;

  root.querySelectorAll("[data-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", on ? "true" : "false");
      var piece = root.querySelector('[data-piece="' + btn.getAttribute("data-toggle") + '"]');
      if (piece) piece.classList.toggle("is-off", !on);
    });
  });

  var send = root.querySelector("[data-send]");
  if (send) {
    send.addEventListener("click", function () {
      send.textContent = "Sent";
      send.disabled = true;
      var status = root.querySelector("[data-pay-status]");
      if (status) status.textContent = "Link sent";
    });
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
    var edge = window.innerHeight + 24;
    rises.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      if (el.getBoundingClientRect().top < edge) el.classList.add("is-in");
    });
  }
  reveal();
  window.addEventListener("scroll", reveal, { passive: true });

  var moonPlayed = false;
  function playMoon() {
    if (moonPlayed) return;
    var hero = root.querySelector(".ms-home-hero");
    var moon = hero && hero.querySelector(".ms-moon");
    var title = hero && hero.querySelector("h1");
    if (!hero || !moon || !title) return;
    moonPlayed = true;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var travelSize = moon.offsetWidth || 150;
    var restScale = 0.58;

    function restBox() {
      var heroBox = hero.getBoundingClientRect();
      var titleBox = title.getBoundingClientRect();
      var rest = travelSize * restScale;
      var x = titleBox.left - heroBox.left - rest - 16;
      var y = titleBox.top - heroBox.top + titleBox.height * 0.16;
      if (x < 8) {
        x = Math.max(10, titleBox.left - heroBox.left);
        y = titleBox.top - heroBox.top - rest - 10;
      }
      return { x: x, y: Math.max(4, y), rest: rest };
    }

    function shift(x, y, scale) {
      return "translate3d(" + x + "px, " + y + "px, 0) scale(" + scale + ")";
    }

    function settle() {
      var box = restBox();
      moon.getAnimations().forEach(function (anim) { anim.cancel(); });
      moon.classList.add("is-settled");
      moon.style.width = box.rest + "px";
      moon.style.left = box.x + "px";
      moon.style.top = box.y + "px";
      moon.style.transform = "none";
      moon.style.opacity = "1";
      hero.classList.add("is-revealed");
    }

    if (reduce) {
      settle();
      return;
    }

    var titleBox = title.getBoundingClientRect();
    var riseScale = 0.9;
    var coverScale = 1.5;
    var startX = (window.innerWidth - travelSize * riseScale) / 2;
    var startY = window.innerHeight + 12;
    var coverX = titleBox.left + titleBox.width / 2 - (travelSize * coverScale) / 2;
    var coverY = titleBox.top + titleBox.height / 2 - (travelSize * coverScale) / 2;
    var rest = travelSize * restScale;
    var endX = titleBox.left - rest - 16;
    var endY = titleBox.top + titleBox.height * 0.12;
    if (endX < 8) {
      endX = Math.max(10, titleBox.left);
      endY = titleBox.top - rest - 10;
    }

    moon.style.opacity = "1";
    var rise = moon.animate([
      { transform: shift(startX, startY, riseScale) },
      { transform: shift(coverX, coverY, coverScale) }
    ], {
      duration: 1550,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards"
    });

    rise.onfinish = function () {
      hero.classList.add("is-revealed");
      var glide = moon.animate([
        { transform: shift(coverX, coverY, coverScale) },
        { transform: shift(endX, endY, restScale) }
      ], {
        duration: 1250,
        easing: "cubic-bezier(0.45, 0.02, 0.18, 1)",
        fill: "forwards"
      });
      glide.onfinish = settle;
    };

    window.setTimeout(function () {
      if (!hero.classList.contains("is-revealed")) hero.classList.add("is-revealed");
    }, 3200);

    window.addEventListener("resize", function () {
      if (!moon.classList.contains("is-settled")) return;
      var next = restBox();
      moon.style.width = next.rest + "px";
      moon.style.left = next.x + "px";
      moon.style.top = next.y + "px";
    });
  }

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
    requestAnimationFrame(function () { playMoon(); });
  });
})();
