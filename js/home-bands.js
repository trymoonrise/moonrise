/**
 * Home bands: FAQ accordion + About scroll-read words.
 */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".ms-faq-q").forEach((button) => {
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
    });
  });

  const about = document.querySelector("#about");
  const aboutLine = about?.querySelector("[data-about-line]");
  if (!aboutLine) return;

  if (reduce) {
    aboutLine.querySelectorAll(".ms-about-word").forEach((span) => {
      span.style.setProperty("--read", "1");
    });
    return;
  }

  const source = aboutLine.getAttribute("data-about-text") || aboutLine.textContent || "";
  const words = source.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;

  const frag = document.createDocumentFragment();
  words.forEach((word, index) => {
    if (index) frag.append(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "ms-about-word";
    span.textContent = word;
    frag.append(span);
  });
  aboutLine.replaceChildren(frag);

  const spans = [...aboutLine.querySelectorAll(".ms-about-word")];
  let aboutFrame = 0;

  const paintAbout = () => {
    aboutFrame = 0;
    const view = window.innerHeight || 1;
    const top = aboutLine.getBoundingClientRect().top;
    const progress = Math.min(1, Math.max(0, (view * 0.52 - top) / (view * 0.34)));
    const edge = 2.4;
    spans.forEach((span, index) => {
      const read = Math.min(1, Math.max(0, (progress * (spans.length + edge) - index) / edge));
      span.style.setProperty("--read", read.toFixed(3));
    });
  };

  const queueAbout = () => {
    if (!aboutFrame) aboutFrame = requestAnimationFrame(paintAbout);
  };

  window.addEventListener("scroll", queueAbout, { passive: true });
  window.addEventListener("resize", queueAbout);
  paintAbout();
})();
