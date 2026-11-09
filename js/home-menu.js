/**
 * Full-screen stacking menu for the public home page.
 * Home button and Menu / Close live above the overlay, same pattern as a compact site menu.
 */
(function () {
  var header = document.querySelector(".ms-site-bar");
  var button = document.querySelector(".ms-menu-btn");
  var menu = document.querySelector(".ms-menu-screen");
  var home = document.querySelector(".ms-home-btn");
  if (!header || !button || !menu) return;

  var label = button.querySelector(".ms-menu-label");

  function setOpen(open) {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    header.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("ms-menu-open", open);
    if (open) header.classList.remove("is-hidden");
    if (label) label.textContent = open ? "Close" : "Menu";
  }

  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  if (home) {
    home.addEventListener("click", function (event) {
      var path = location.pathname || "/";
      var onHome = path === "/" || /\/index\.html?$/i.test(path);
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

  var lastY = window.scrollY || 0;
  var frame = 0;

  function onScroll() {
    var y = window.scrollY || 0;
    var delta = y - lastY;
    if (header.classList.contains("is-open") || y < 24) {
      header.classList.remove("is-hidden");
    } else if (delta > 8) {
      header.classList.add("is-hidden");
    } else if (delta < -8) {
      header.classList.remove("is-hidden");
    }
    header.classList.toggle("is-scrolled", y > 12);
    lastY = y;
  }

  window.addEventListener("scroll", function () {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      onScroll();
    });
  }, { passive: true });

  onScroll();
})();
