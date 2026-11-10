/**
 * Full-screen page menu shared by the public Moonrise pages.
 */
(function () {
  var header = document.querySelector(".ms-site-bar");
  var button = document.querySelector(".ms-menu-btn");
  var menu = document.querySelector(".ms-menu-screen");
  var home = document.querySelector(".ms-home-btn");
  if (!header || !button || !menu) return;

  var label = button.querySelector(".ms-menu-label");
  var parkedParent = null;
  var parkedNext = null;

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

  function setOpen(open) {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    header.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("ms-menu-open", open);
    if (label) label.textContent = open ? "Close" : "Menu";
    parkOverlay(open);
    if (open) menu.scrollTop = 0;
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
