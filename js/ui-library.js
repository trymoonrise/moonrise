(function () {
  "use strict";

  const reduceMotion = (() => {
    try {
      return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    } catch (_) {
      return false;
    }
  })();

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  /* —— TOC active state —— */
  function bindToc() {
    const links = $all(".dt-toc a");
    const sections = links
      .map((a) => document.getElementById((a.getAttribute("href") || "").slice(1)))
      .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const map = new Map(sections.map((s, i) => [s, links[i]]));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((l) => l.classList.remove("is-active"));
          map.get(en.target)?.classList.add("is-active");
        });
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0.01 }
    );
    sections.forEach((s) => io.observe(s));
  }

  /* —— Toast —— */
  function showToast(message) {
    const host = $("#dt-toasts");
    if (!host) return;
    // Replace instead of stacking so the page does not jump / scroll-chase live regions.
    host.replaceChildren();
    const el = document.createElement("div");
    el.className = "dt-toast";
    el.textContent = message;
    host.appendChild(el);
    window.clearTimeout(host._dtToastTimer);
    host._dtToastTimer = window.setTimeout(() => {
      el.remove();
    }, 2200);
  }

  /* —— Progress —— */
  let progressRaf = 0;
  function runProgress() {
    const fill = $(".dt-stage[data-demo='progress'] .dt-progress-fill");
    const pct = $(".dt-stage[data-demo='progress'] .dt-progress-pct");
    if (!fill || !pct) return;
    if (progressRaf) window.cancelAnimationFrame(progressRaf);
    const duration = reduceMotion ? 700 : 4200;
    const start = performance.now();
    const from = 0;
    const to = 100;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    // Extra slowdown near the end: remap time so late progress stretches.
    const remap = (t) => {
      if (t < 0.72) return t * 0.88;
      const u = (t - 0.72) / 0.28;
      return 0.72 * 0.88 + (1 - 0.72 * 0.88) * easeOutCubic(u);
    };
    const frame = (now) => {
      const raw = Math.min(1, (now - start) / duration);
      const n = from + (to - from) * remap(raw);
      const shown = Math.min(100, Math.round(n));
      fill.style.width = n.toFixed(2) + "%";
      pct.textContent = shown + "%";
      if (raw < 1) {
        progressRaf = window.requestAnimationFrame(frame);
      } else {
        fill.style.width = "100%";
        pct.textContent = "100%";
        progressRaf = 0;
      }
    };
    fill.style.width = "0%";
    pct.textContent = "0%";
    progressRaf = window.requestAnimationFrame(frame);
  }

  /* —— Button loader morph —— */
  function runButtonLoader(target) {
    const buttons = target
      ? [target]
      : $all("[data-btn-loader], [data-btn-loader-static]");
    buttons.forEach((btn) => {
      if (!btn || btn.classList.contains("is-loading")) return;
      window.clearTimeout(btn._dtMorphTimer);
      btn.classList.remove("is-done");
      btn.classList.add("is-loading");
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn._dtMorphTimer = window.setTimeout(() => {
        btn.classList.remove("is-loading");
        btn.classList.add("is-done");
        btn.removeAttribute("aria-busy");
        btn._dtMorphTimer = window.setTimeout(() => {
          btn.classList.remove("is-done");
          btn.disabled = false;
        }, reduceMotion ? 700 : 1600);
      }, reduceMotion ? 500 : 1600);
    });
  }

  /* —— Fullscreen boot —— */
  function runFullscreen() {
    const stage = $('.dt-stage[data-demo="fullscreen"]');
    if (!stage) return;
    stage.classList.remove("is-on");
    void stage.offsetWidth;
    stage.classList.add("is-on");
    window.setTimeout(() => stage.classList.remove("is-on"), reduceMotion ? 800 : 3800);
  }

  function pulseStage(demo, ms) {
    const stage = $('.dt-stage[data-demo="' + demo + '"]');
    if (!stage) return;
    stage.classList.add("is-on");
    stage.querySelector(".dt-pulse-row")?.classList.add("is-on");
    stage.querySelectorAll(".dt-skel").forEach((el) => el.classList.add("is-on"));
    if (ms) {
      window.clearTimeout(stage._dtOff);
      stage._dtOff = window.setTimeout(() => {
        stage.classList.remove("is-on");
        stage.querySelector(".dt-pulse-row")?.classList.remove("is-on");
        if (demo === "shimmer-pulse") {
          stage.querySelectorAll(".dt-skel").forEach((el) => el.classList.remove("is-on"));
        }
      }, ms);
    }
  }

  function togglePulse() {
    const stage = $('.dt-stage[data-demo="pulse"]');
    if (!stage) return;
    const on = !stage.classList.contains("is-on");
    stage.classList.toggle("is-on", on);
    stage.querySelector(".dt-pulse-row")?.classList.toggle("is-on", on);
  }

  function openDangerConfirm() {
    const flow = $("[data-danger-flow]");
    const panel = $("[data-danger-confirm]", flow);
    const trigger = $("[data-danger-trigger]", flow);
    if (!panel) return;
    panel.hidden = false;
    if (trigger) trigger.hidden = true;
  }

  function closeDangerConfirm() {
    const flow = $("[data-danger-flow]");
    const panel = $("[data-danger-confirm]", flow);
    const trigger = $("[data-danger-trigger]", flow);
    if (!panel) return;
    panel.hidden = true;
    if (trigger) trigger.hidden = false;
  }

  function flashHover(sel) {
    const el = $(sel);
    if (!el) return;
    el.classList.add("is-demo-hover");
    window.setTimeout(() => el.classList.remove("is-demo-hover"), reduceMotion ? 400 : 900);
  }

  /* —— Pull to refresh —— */
  function refreshPtr() {
    const indicator = $(".dt-ptr-indicator");
    const list = $("#dt-ptr-list");
    if (!indicator || !list) return;
    indicator.classList.add("is-on");
    window.setTimeout(() => {
      const names = ["Harbor Bakery", "Cedar Clinic", "Summit Auto", "Bloom Salon", "Northside Cafe"];
      list.innerHTML = names
        .slice(0, 3)
        .sort(() => Math.random() - 0.5)
        .map((n) => '<div class="dt-list-row">' + n + "</div>")
        .join("");
      indicator.classList.remove("is-on");
    }, reduceMotion ? 350 : 900);
  }

  function bindPtrDrag() {
    const phone = $("#dt-ptr-phone");
    const indicator = $(".dt-ptr-indicator");
    if (!phone || !indicator) return;
    let startY = 0;
    let dragging = false;
    phone.addEventListener("pointerdown", (e) => {
      if (phone.scrollTop > 0) return;
      dragging = true;
      startY = e.clientY;
      phone.setPointerCapture?.(e.pointerId);
    });
    phone.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      if (dy > 8) indicator.style.height = Math.min(48, dy * 0.45) + "px";
    });
    phone.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      const dy = e.clientY - startY;
      indicator.style.height = "";
      if (dy > 56) refreshPtr();
    });
  }

  /* —— Infinite scroll —— */
  function makeFeedItem(i) {
    const el = document.createElement("div");
    el.className = "dt-list-row";
    el.innerHTML = "<strong>Lead " + i + "</strong><span>Generated demo row</span>";
    return el;
  }

  function setupInfinite(viewportId, feedId, sentinelId, startCount) {
    const viewport = document.getElementById(viewportId);
    const feed = document.getElementById(feedId);
    const sentinel = document.getElementById(sentinelId);
    if (!viewport || !feed || !sentinel) return { reset() {} };
    let n = 0;
    let loading = false;
    function append(count) {
      for (let i = 0; i < count; i++) {
        n += 1;
        feed.appendChild(makeFeedItem(n));
      }
    }
    append(startCount || 4);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || loading) return;
        if (n >= 24) return;
        loading = true;
        sentinel.classList.add("is-on");
        window.setTimeout(() => {
          append(3);
          sentinel.classList.remove("is-on");
          loading = false;
        }, reduceMotion ? 200 : 700);
      },
      { root: viewport, threshold: 0.1 }
    );
    io.observe(sentinel);
    return {
      reset() {
        n = 0;
        feed.innerHTML = "";
        append(startCount || 4);
      },
    };
  }

  const infiniteMain = setupInfinite("dt-infinite-viewport", "dt-infinite-feed", "dt-infinite-sentinel", 5);
  const infiniteCook = setupInfinite("dt-cook-scroll", "dt-cook-feed", "dt-cook-sentinel", 4);

  /* —— Motion helpers —— */
  function replayRise() {
    const panel = $("#dt-rise-panel");
    if (!panel) return;
    panel.classList.remove("is-in");
    void panel.offsetWidth;
    panel.classList.add("is-in");
  }
  function replayStagger() {
    const stage = $('.dt-stage[data-demo="stagger"]');
    if (!stage) return;
    stage.classList.remove("is-on");
    void stage.offsetWidth;
    stage.classList.add("is-on");
  }
  function playSuccess() {
    const el = $("#dt-success");
    if (!el) return;
    el.classList.remove("is-on");
    void el.offsetWidth;
    el.classList.add("is-on");
  }
  function shakeField() {
    const field = $("#dt-shake-field");
    if (!field) return;
    field.classList.remove("is-shaking");
    void field.offsetWidth;
    field.classList.add("is-shaking");
  }

  /* —— Stepper —— */
  function step(delta) {
    const items = $all("[data-stepper] li");
    if (!items.length) return;
    let idx = items.findIndex((li) => li.classList.contains("is-current"));
    if (idx < 0) idx = 0;
    idx = Math.max(0, Math.min(items.length - 1, idx + delta));
    items.forEach((li, i) => {
      li.classList.toggle("is-current", i === idx);
      li.classList.toggle("is-done", i < idx);
    });
  }

  /* —— Cookbook search —— */
  function runCookSearch() {
    const out = $("#dt-cook-search-out");
    if (!out) return;
    out.classList.add("is-loading");
    out.innerHTML =
      '<div class="dt-skel-row"><span class="dt-skel dt-skel-circle"></span><span class="dt-skel dt-skel-line"></span></div><span class="dt-skel dt-skel-line"></span><span class="dt-skel dt-skel-line dt-skel-short"></span>';
    window.setTimeout(() => {
      out.classList.remove("is-loading");
      out.innerHTML =
        '<div class="dt-list-row"><strong>River Dental</strong><span>Austin · Match</span></div><div class="dt-list-row"><strong>Cedar Dental</strong><span>Denver · Match</span></div>';
    }, reduceMotion ? 350 : 1100);
  }

  function runCookSubmit() {
    const btn = $("[data-cook-submit]");
    if (!btn || btn.classList.contains("is-loading")) return;
    const label = btn.dataset.label || btn.textContent.trim() || "Submit order";
    btn.dataset.label = label;
    btn.classList.add("is-loading");
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.innerHTML = '<span class="dt-spinner dt-spinner-sm dt-spinner-on-dark is-on"></span>';
    window.setTimeout(() => {
      btn.classList.remove("is-loading");
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.textContent = label;
      showToast("Order submitted");
    }, reduceMotion ? 400 : 1300);
  }

  function runDemo(kind, playBtn) {
    if (playBtn) {
      playBtn.classList.add("is-playing");
      window.setTimeout(() => playBtn.classList.remove("is-playing"), 700);
    }
    if (kind === "spinner") {
      const stage = $('.dt-stage[data-demo="spinner"]');
      stage?.classList.add("is-on");
      window.clearTimeout(stage?._dtOff);
      if (stage) stage._dtOff = window.setTimeout(() => stage.classList.remove("is-on"), reduceMotion ? 900 : 2400);
    } else if (kind === "skeleton") {
      pulseStage("skeleton", reduceMotion ? 900 : 2400);
    } else if (kind === "progress") runProgress();
    else if (kind === "pulse") togglePulse();
    else if (kind === "button-loader") runButtonLoader();
    else if (kind === "fullscreen") runFullscreen();
    else if (kind === "ptr") refreshPtr();
    else if (kind === "infinite-reset") infiniteMain.reset();
    else if (kind === "rise") replayRise();
    else if (kind === "stagger") replayStagger();
    else if (kind === "success") playSuccess();
    else if (kind === "shake") shakeField();
    else if (kind === "shimmer-pulse") pulseStage("shimmer-pulse", reduceMotion ? 900 : 2600);
    else if (kind === "primary-expand") flashHover("[data-primary-demo]");
    else if (kind === "secondary-hover") {
      flashHover("[data-ghost-demo]");
      window.setTimeout(() => flashHover("[data-secondary-demo]"), 350);
    } else if (kind === "danger") openDangerConfirm();
    else if (kind === "icon-pop") {
      $all("[data-icon-demo]").forEach((btn, i) => {
        window.setTimeout(() => {
          btn.classList.remove("is-pop");
          void btn.offsetWidth;
          btn.classList.add("is-pop");
        }, i * 180);
      });
    } else if (kind === "step-next") step(1);
    else if (kind === "step-back") step(-1);
    else if (kind === "cook-search") runCookSearch();
    else if (kind === "cook-submit") runCookSubmit();
    else if (kind === "cook-scroll-reset") infiniteCook.reset();
  }

  /* —— Play buttons + stage taps —— */
  function bindPlay() {
    document.addEventListener("click", (e) => {
      const play = e.target.closest("[data-play]");
      if (play) {
        e.preventDefault();
        runDemo(play.getAttribute("data-play"), play);
        return;
      }

      const cookSubmit = e.target.closest("[data-cook-submit]");
      if (cookSubmit) {
        runCookSubmit();
        return;
      }

      const morphBtn = e.target.closest("[data-btn-loader], [data-btn-loader-static]");
      if (morphBtn) {
        runButtonLoader(morphBtn);
        return;
      }

      const icon = e.target.closest("[data-icon-demo]");
      if (icon) {
        icon.classList.remove("is-pop");
        void icon.offsetWidth;
        icon.classList.add("is-pop");
        return;
      }

      const dangerTrigger = e.target.closest("[data-danger-trigger]");
      if (dangerTrigger) {
        openDangerConfirm();
        return;
      }
      if (e.target.closest("[data-danger-cancel]")) {
        closeDangerConfirm();
        return;
      }
      if (e.target.closest("[data-danger-yes]")) {
        closeDangerConfirm();
        showToast("Project deleted");
        return;
      }

      const stage = e.target.closest("[data-stage-tap]");
      if (stage && !e.target.closest("button, a, input, select, textarea")) {
        runDemo(stage.getAttribute("data-stage-tap"));
      }
    });
  }

  function syncPill(track) {
    if (!track) return;
    const thumb = track.querySelector(".dt-pill-thumb");
    const active = track.querySelector("button.is-active, .is-selected.is-active, button[aria-current='page']") ||
      track.querySelector("button.is-active");
    if (!thumb || !active) return;
    const tr = track.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    const x = ar.left - tr.left;
    const y = ar.top - tr.top;
    thumb.style.width = ar.width + "px";
    thumb.style.height = ar.height + "px";
    thumb.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }

  function syncUnderline(track) {
    if (!track) return;
    const line = track.querySelector(".dt-tabs-underline");
    const active = track.querySelector("button.is-active");
    if (!line || !active) return;
    const tr = track.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    line.style.width = ar.width + "px";
    line.style.transform = "translate3d(" + (ar.left - tr.left) + "px,0,0)";
  }

  function syncAllPills() {
    $all("[data-pill-track]").forEach(syncPill);
    $all("[data-underline-track]").forEach(syncUnderline);
  }

  /* —— Generic interactive controls —— */
  function bindControls() {
    $("[data-pass-toggle]")?.addEventListener("click", () => {
      const input = $("#dt-pass");
      const btn = $("[data-pass-toggle]");
      if (!input || !btn) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
    });

    $all("[data-switch]").forEach((sw) => {
      sw.addEventListener("click", () => {
        const on = sw.getAttribute("aria-checked") !== "true";
        sw.setAttribute("aria-checked", on ? "true" : "false");
        const label = sw.parentElement?.querySelector("[data-switch-label]");
        if (label) label.textContent = on ? "On" : "Off";
      });
    });

    $all("[data-seg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const track = btn.closest("[data-pill-track]") || btn.parentElement;
        $all("[data-seg]", track).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        syncPill(track);
      });
    });

    $all(".dt-btn-group").forEach((group) => {
      group.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || btn.classList.contains("dt-pill-thumb")) return;
        $all("button", group).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        syncPill(group);
      });
    });

    $all("[data-choice-cards]").forEach((wrap) => {
      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".dt-choice-card");
        if (!btn) return;
        $all(".dt-choice-card", wrap).forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
    });

    $all("[data-chips]").forEach((wrap) => {
      wrap.addEventListener("click", (e) => {
        const chip = e.target.closest(".dt-chip");
        if (!chip) return;
        chip.classList.toggle("is-selected");
      });
    });

    $all("[data-quiz]").forEach((quiz) => {
      quiz.addEventListener("click", (e) => {
        const opt = e.target.closest("[data-quiz-opt]");
        if (!opt || quiz.dataset.locked) return;
        quiz.dataset.locked = "1";
        const ok = opt.getAttribute("data-correct") === "1";
        opt.classList.add(ok ? "is-correct" : "is-wrong");
        if (!ok) {
          const right = $('[data-correct="1"]', quiz);
          right?.classList.add("is-correct");
        }
        const fb = $("[data-quiz-feedback]", quiz);
        if (fb) {
          fb.hidden = false;
          fb.textContent = ok
            ? "Correct — use a spinner when shape is unknown."
            : "Not quite — spinner fits unknown layout best.";
        }
      });
    });

    $all("[data-stars]").forEach((wrap) => {
      const stars = $all(".dt-star", wrap);
      stars.forEach((star, i) => {
        star.addEventListener("click", () => {
          stars.forEach((s, j) => s.classList.toggle("is-on", j <= i));
        });
      });
    });

    $("[data-like]")?.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "♥" : "♡";
    });

    $all("[data-tabs]").forEach((tabs) => {
      const panel = tabs.parentElement?.querySelector("[data-tabs-panel]");
      tabs.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        $all("button", tabs).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        syncUnderline(tabs);
        if (panel) {
          panel.textContent = btn.textContent.trim() + " content";
          panel.style.animation = "none";
          void panel.offsetWidth;
          panel.style.animation = "";
        }
      });
    });

    $all("[data-pager]").forEach((pager) => {
      const pages = $all(".dt-page-btn:not([data-pager-prev]):not([data-pager-next])", pager);
      function setActive(i) {
        pages.forEach((p, idx) => p.classList.toggle("is-active", idx === i));
      }
      pages.forEach((p, i) => p.addEventListener("click", () => setActive(i)));
      $("[data-pager-prev]", pager)?.addEventListener("click", () => {
        const i = Math.max(0, pages.findIndex((p) => p.classList.contains("is-active")) - 1);
        setActive(i);
      });
      $("[data-pager-next]", pager)?.addEventListener("click", () => {
        const i = Math.min(pages.length - 1, pages.findIndex((p) => p.classList.contains("is-active")) + 1);
        setActive(i);
      });
    });

    $all(".dt-dock").forEach((dock) => {
      dock.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        $all("button", dock).forEach((b) => {
          b.classList.remove("is-active");
          b.removeAttribute("aria-current");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-current", "page");
        syncPill(dock);
      });
    });

    $all("[data-accordion]").forEach((acc) => {
      acc.addEventListener("click", (e) => {
        const trigger = e.target.closest(".dt-acc-trigger");
        if (!trigger) return;
        const item = trigger.closest(".dt-acc-item");
        const open = !item.classList.contains("is-open");
        $all(".dt-acc-item", acc).forEach((it) => {
          it.classList.remove("is-open");
          it.querySelector(".dt-acc-trigger")?.setAttribute("aria-expanded", "false");
        });
        if (open) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });

    $all("[data-carousel]").forEach((carousel) => {
      const track = $(".dt-carousel-track", carousel);
      const dotsWrap = carousel.parentElement?.querySelector("[data-carousel-dots]");
      const slides = $all(".dt-carousel-slide", carousel);
      const dots = dotsWrap ? $all("button", dotsWrap) : [];
      let i = 0;
      const go = (n) => {
        i = ((n % slides.length) + slides.length) % slides.length;
        if (track) track.style.transform = "translate3d(" + -i * 100 + "%,0,0)";
        dots.forEach((d, di) => d.classList.toggle("is-active", di === i));
      };
      dots.forEach((d, di) => d.addEventListener("click", () => go(di)));
      window.setInterval(() => go(i + 1), reduceMotion ? 4000 : 3200);
      go(0);
    });

    const countdown = $("[data-countdown]");
    if (countdown) {
      let sec = 45;
      window.setInterval(() => {
        sec = sec <= 0 ? 45 : sec - 1;
        const m = String(Math.floor(sec / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");
        countdown.textContent = m + ":" + s;
      }, 1000);
    }

    $all("[data-bars] .dt-bar-row").forEach((row) => {
      row.classList.add("is-on");
    });

    $("[data-copy]")?.addEventListener("click", async () => {
      const input = $("#dt-copy-input");
      try {
        await navigator.clipboard?.writeText(input?.value || "");
        showToast("Copied link");
      } catch (_) {
        showToast("Copy ready");
      }
    });

    $("[data-copy-craft]")?.addEventListener("click", async () => {
      const prompt = $("#dt-craft-prompt");
      const text = String(prompt?.value || "").trim();
      if (!text) {
        showToast("Prompt missing");
        return;
      }
      try {
        await navigator.clipboard?.writeText(text);
        showToast("Special prompt copied");
      } catch (_) {
        try {
          prompt.focus();
          prompt.select();
          document.execCommand("copy");
          showToast("Special prompt copied");
        } catch (_) {
          showToast("Copy ready");
        }
      }
    });

    $all("[data-confirm]").forEach((box) => {
      const q = $("[data-confirm-q]", box);
      $("[data-confirm-yes]", box)?.addEventListener("click", () => {
        if (q) q.textContent = "Deleted. Undo available for 5s.";
        showToast("Project deleted");
      });
      $("[data-confirm-no]", box)?.addEventListener("click", () => {
        if (q) q.textContent = "Delete this project?";
      });
    });

    const slider = $("[data-slider]");
    const sliderVal = $("[data-slider-val]");
    slider?.addEventListener("input", () => {
      if (sliderVal) sliderVal.textContent = "$" + slider.value;
    });

    $all("[data-qty]").forEach((wrap) => {
      const val = $("[data-qty-val]", wrap);
      let n = 1;
      $("[data-qty-dec]", wrap)?.addEventListener("click", () => {
        n = Math.max(0, n - 1);
        if (val) val.textContent = String(n);
      });
      $("[data-qty-inc]", wrap)?.addEventListener("click", () => {
        n += 1;
        if (val) val.textContent = String(n);
      });
    });

    $all("[data-date]").forEach((wrap) => {
      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".dt-date-grid button");
        if (!btn) return;
        $all(".dt-date-grid button", wrap).forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
      });
    });

    $all("[data-drop]").forEach((zone) => {
      const input = $("[data-drop-input]", zone);
      zone.addEventListener("click", () => input?.click());
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("is-over");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("is-over");
        showToast("File ready (demo)");
      });
      input?.addEventListener("change", () => {
        if (input.files?.length) showToast(input.files[0].name);
      });
    });

    $all("[data-tags]").forEach((wrap) => {
      const input = $("[data-tag-input]", wrap);
      function addTag(text) {
        const t = text.trim();
        if (!t) return;
        const span = document.createElement("span");
        span.className = "dt-tag";
        span.innerHTML =
          t + ' <button type="button" aria-label="Remove ' + t + '">×</button>';
        wrap.insertBefore(span, input);
      }
      input?.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        addTag(input.value);
        input.value = "";
      });
      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".dt-tag button");
        if (btn) btn.parentElement?.remove();
      });
    });

    $("[data-toast]")?.addEventListener("click", () => showToast("Changes saved"));
    $("[data-cook-submit]")?.addEventListener("click", runCookSubmit);
  }

  /* —— Dropdowns / overlays —— */
  function closeDropdowns(except) {
    $all("[data-dropdown]").forEach((dd) => {
      if (dd === except) return;
      const menu = $(".dt-dropdown-menu", dd);
      const trigger = $("[aria-expanded]", dd);
      if (menu) menu.hidden = true;
      trigger?.setAttribute("aria-expanded", "false");
    });
  }

  function bindDropdowns() {
    $all("[data-dropdown]").forEach((dd) => {
      const trigger = $("[aria-expanded]", dd);
      const menu = $(".dt-dropdown-menu", dd);
      if (!trigger || !menu) return;
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = menu.hidden;
        closeDropdowns(dd);
        menu.hidden = !open;
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.addEventListener("click", (e) => {
        const item = e.target.closest("[role='option'], [role='menuitem']");
        if (!item) return;
        const label = $("[data-dropdown-label]", dd);
        if (label) label.textContent = item.textContent.trim();
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", () => closeDropdowns());
  }

  function openOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    const focusable = el.querySelector("button, [href], input, select, textarea");
    focusable?.focus?.();
  }
  function closeOverlays() {
    ["dt-modal", "dt-sheet"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }

  function bindOverlays() {
    $("[data-open-modal]")?.addEventListener("click", () => openOverlay("dt-modal"));
    $("[data-open-sheet]")?.addEventListener("click", () => openOverlay("dt-sheet"));
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-overlay]")) closeOverlays();
      if (e.target.classList?.contains("dt-overlay")) closeOverlays();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeOverlays();
        closeDropdowns();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindToc();
    bindPlay();
    bindControls();
    bindDropdowns();
    bindOverlays();
    bindPtrDrag();
    requestAnimationFrame(() => {
      syncAllPills();
      window.addEventListener("resize", syncAllPills);
    });
  });
})();
