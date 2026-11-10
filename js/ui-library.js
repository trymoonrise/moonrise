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
  function showTocGroup(name) {
    if (!name) return;
    $all("[data-toc-group]").forEach((button) => {
      const on = button.getAttribute("data-toc-group") === name;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-selected", on ? "true" : "false");
    });
    $all(".dt-toc-group").forEach((group) => {
      group.classList.toggle("is-shown", group.getAttribute("data-group") === name);
    });
  }

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
          const link = map.get(en.target);
          if (!link) return;
          links.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
          const jump = $(".dt-toc-jump select");
          const id = (link.getAttribute("href") || "").slice(1);
          if (jump && /^[a-z0-9-]+$/i.test(id) && jump.querySelector('option[value="' + id + '"]')) {
            jump.value = id;
          }
          const group = link.closest(".dt-toc-group");
          if (group) showTocGroup(group.getAttribute("data-group"));
          const bar = link.parentElement;
          if (bar && bar.scrollWidth > bar.clientWidth) {
            const left = link.offsetLeft - (bar.clientWidth - link.offsetWidth) / 2;
            bar.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? "auto" : "smooth" });
          }
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
    const label = $("[data-step-label]");
    const name = items[idx]?.querySelector(".dt-step-name");
    if (label && name) label.textContent = name.textContent.trim();
  }

  function runBars() {
    const rows = $all("[data-bars] .dt-bar-row");
    rows.forEach((row) => row.classList.remove("is-on"));
    void document.body.offsetWidth;
    rows.forEach((row, i) => {
      window.setTimeout(() => row.classList.add("is-on"), reduceMotion ? 0 : i * 120);
    });
  }

  function runTimeline() {
    const stage = $('.dt-stage[data-demo="timeline"]');
    if (!stage) return;
    stage.classList.remove("is-on");
    void stage.offsetWidth;
    stage.classList.add("is-on");
    window.clearTimeout(stage._dtOff);
    stage._dtOff = window.setTimeout(() => stage.classList.remove("is-on"), reduceMotion ? 400 : 1600);
  }

  function runSkeletonCompare() {
    const pane = $("[data-compare-pane]");
    if (!pane) return;
    window.clearTimeout(pane._dtA);
    window.clearTimeout(pane._dtB);
    pane.classList.remove("is-ready");
    pane.classList.add("is-on");
    pane._dtA = window.setTimeout(() => pane.classList.add("is-ready"), reduceMotion ? 160 : 900);
    pane._dtB = window.setTimeout(() => {
      pane.classList.remove("is-ready", "is-on");
    }, reduceMotion ? 700 : 2200);
  }

  function runMetrics() {
    const stage = $('.dt-stage[data-demo="metrics"]');
    if (!stage) return;
    stage.classList.remove("is-on");
    void stage.offsetWidth;
    stage.classList.add("is-on");
    $all("[data-metric]", stage).forEach((el) => {
      const to = Number(el.getAttribute("data-metric")) || 0;
      const money = el.getAttribute("data-metric-format") === "money";
      const write = (n) => {
        el.textContent = money ? "$" + n.toFixed(1) + "k" : String(Math.round(n));
      };
      if (reduceMotion) {
        write(to);
        return;
      }
      const t0 = performance.now();
      const frame = (now) => {
        const p = Math.min(1, (now - t0) / 800);
        const eased = 1 - Math.pow(1 - p, 3);
        write(to * eased);
        if (p < 1) window.requestAnimationFrame(frame);
      };
      window.requestAnimationFrame(frame);
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

  function lxStage(playBtn, kind, origin) {
    if (playBtn) {
      const stage = playBtn.closest(".dt-card")?.querySelector(".dt-stage");
      if (stage) return stage;
    }
    if (origin) return origin.classList.contains("dt-stage") ? origin : origin.querySelector(".dt-stage");
    return document.querySelector('.dt-stage[data-demo="' + kind + '"]');
  }

  function runLxLive(playBtn, kind, origin) {
    const stage = lxStage(playBtn, kind, origin);
    if (!stage) return;
    stage.classList.remove("is-live");
    void stage.offsetWidth;
    stage.classList.add("is-live");
    const slider = stage.querySelector("input.lx-slider, input[type='range']");
    if (slider && !reduceMotion) {
      const from = Number(slider.value) || 0;
      const to = Math.min(100, from + 45);
      const t0 = performance.now();
      function frame(now) {
        const p = Math.min(1, (now - t0) / 700);
        slider.value = String(Math.round(from + (to - from) * p));
        const mono = stage.querySelector(".lx-mono");
        if (mono && !mono.hasAttribute("data-count")) mono.textContent = slider.value;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    window.clearTimeout(stage._lxOff);
    stage._lxOff = window.setTimeout(() => stage.classList.remove("is-live"), reduceMotion ? 280 : 2600);
  }

  function runLxCount(playBtn, origin) {
    const stage = lxStage(playBtn, "lx-count", origin);
    const el = stage && stage.querySelector("[data-count]");
    if (!el) return;
    const to = Number(el.getAttribute("data-count")) || 0;
    if (reduceMotion) {
      el.textContent = String(to);
      return;
    }
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function runDemo(kind, playBtn, origin) {
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
    else if (kind === "button-loader") {
      const btn = $("#loaders-button [data-btn-loader]");
      if (btn) runButtonLoader(btn);
    } else if (kind === "loading-state") {
      const btn = $("#buttons-loading [data-btn-loader-static]");
      if (btn) runButtonLoader(btn);
    }
    else if (kind === "bars") runBars();
    else if (kind === "timeline") runTimeline();
    else if (kind === "skeleton-compare") runSkeletonCompare();
    else if (kind === "metrics") runMetrics();
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
    else if (kind === "lx-count") runLxCount(playBtn, origin);
    else if (kind && String(kind).indexOf("lx-") === 0) runLxLive(playBtn, kind, origin);
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
      if (stage && !e.target.closest("button, a, input, select, textarea, [data-lx-opt], [data-lx-acc]")) {
        runDemo(stage.getAttribute("data-stage-tap"), null, stage);
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
      const wrap = input?.closest(".dt-pass-wrap");
      if (!input || !btn || !wrap) return;
      const show = input.type === "password";
      const eye = $(".dt-eye", btn);
      const eyeOff = $(".dt-eye-off", btn);
      wrap.classList.remove("is-revealing", "is-hiding");
      void wrap.offsetWidth;
      if (show) {
        input.type = "text";
        wrap.classList.add("is-revealing");
        btn.setAttribute("aria-label", "Hide password");
        btn.setAttribute("aria-pressed", "true");
        if (eye) eye.hidden = true;
        if (eyeOff) eyeOff.hidden = false;
      } else {
        wrap.classList.add("is-hiding");
        btn.setAttribute("aria-label", "Show password");
        btn.setAttribute("aria-pressed", "false");
        if (eye) eye.hidden = false;
        if (eyeOff) eyeOff.hidden = true;
        window.setTimeout(() => {
          input.type = "password";
          wrap.classList.remove("is-hiding");
        }, reduceMotion ? 0 : 420);
      }
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
      btn.classList.remove("is-pop");
      void btn.offsetWidth;
      btn.classList.add("is-pop");
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
      dock.classList.add("is-armed");
      dock.addEventListener("pointerenter", () => { dock._dtHover = true; });
      dock.addEventListener("pointerleave", () => { dock._dtHover = false; });
      dock.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn || btn.classList.contains("dt-pill-thumb")) return;
        $all("button", dock).forEach((b) => {
          b.classList.remove("is-active");
          b.removeAttribute("aria-current");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-current", "page");
        dock._dtUntil = performance.now() + 2600;
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
      let timer = 0;
      const duration = reduceMotion ? 4000 : 3200;
      const go = (n) => {
        i = ((n % slides.length) + slides.length) % slides.length;
        if (track) track.style.transform = "translate3d(" + -i * 100 + "%,0,0)";
        slides.forEach((slide, si) => {
          slide.classList.toggle("is-in", si === i);
          if (si === i) {
            slide.style.animation = "none";
            void slide.offsetWidth;
            slide.style.animation = "";
          }
        });
        dots.forEach((d, di) => {
          d.classList.toggle("is-active", di === i);
          const bar = d.querySelector("span");
          if (!bar) return;
          bar.style.animation = "none";
          void bar.offsetWidth;
          bar.style.animation = "";
        });
        window.clearTimeout(timer);
        timer = window.setTimeout(() => go(i + 1), duration);
      };
      dots.forEach((d, di) => d.addEventListener("click", () => go(di)));
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

    runBars();

    $all("[data-kbd-key]").forEach((key) => {
      key.addEventListener("click", () => {
        key.classList.add("is-down");
        window.setTimeout(() => key.classList.remove("is-down"), 140);
      });
    });
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        $all("[data-kbd-key]").forEach((key) => {
          key.classList.add("is-down");
          window.setTimeout(() => key.classList.remove("is-down"), 140);
        });
      }
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

    const craftToggle = $(".dt-craft-toggle");
    const craftPanel = $("#dt-craft-panel");
    const craftCard = craftToggle?.closest(".dt-craft-card");
    craftToggle?.addEventListener("click", () => {
      if (!craftPanel || !craftCard) return;
      const open = craftToggle.getAttribute("aria-expanded") !== "true";
      craftToggle.setAttribute("aria-expanded", open ? "true" : "false");
      craftCard.classList.toggle("is-open", open);
      craftPanel.setAttribute("aria-hidden", open ? "false" : "true");
      craftPanel.inert = !open;
    });

    $("[data-copy-craft]")?.addEventListener("click", () => {
      const btn = $("[data-copy-craft]");
      const field = $("#dt-craft-prompt");
      const ready = String(field?.value || "").trim();
      if (ready && copyWithTextarea(ready)) {
        showToast("Prompt copied");
        return;
      }
      if (btn) btn.setAttribute("aria-busy", "true");
      ensureCraftPrompt()
        .then((text) => {
          if (!text) {
            showToast("Prompt missing");
            return;
          }
          if (field) field.value = text;
          return copyText(text, field).then(() => showToast("Prompt copied"));
        })
        .catch(() => {
          if (field && String(field.value || "").trim()) {
            field.focus();
            field.select();
            showToast("Prompt selected");
            return;
          }
          showToast("Prompt missing");
        })
        .finally(() => btn?.removeAttribute("aria-busy"));
    });

    $("[data-download-craft]")?.addEventListener("click", async (event) => {
      event.preventDefault();
      const link = event.currentTarget;
      if (link) link.setAttribute("aria-busy", "true");
      try {
        const text = await ensureCraftPrompt();
        if (!text) throw new Error("missing");
        saveTextFile(text, "moonrise-special-prompt.md", "text/markdown");
        showToast("Prompt downloaded");
      } catch (_) {
        showToast("Download failed");
      } finally {
        link?.removeAttribute("aria-busy");
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
        $all(".dt-date-grid button", wrap).forEach((b) => b.classList.remove("is-selected", "is-pop"));
        btn.classList.add("is-selected");
        void btn.offsetWidth;
        btn.classList.add("is-pop");
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
  function setDropdownOpen(menu, trigger, open) {
    if (!menu || !trigger) return;
    if (open) {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => menu.classList.add("is-open"));
      });
      return;
    }
    trigger.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    if (menu.hidden) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      if (menu.classList.contains("is-open")) return;
      menu.hidden = true;
    };
    if (reduce) {
      finish();
      return;
    }
    window.setTimeout(finish, 170);
  }

  function closeDropdowns(except) {
    $all("[data-dropdown]").forEach((dd) => {
      if (dd === except) return;
      setDropdownOpen($(".dt-dropdown-menu", dd), $("[aria-expanded]", dd), false);
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
        setDropdownOpen(menu, trigger, open);
      });
      menu.addEventListener("click", (e) => {
        const item = e.target.closest("[role='option'], [role='menuitem']");
        if (!item) return;
        const label = $("[data-dropdown-label]", dd);
        if (label) label.textContent = item.textContent.trim();
        setDropdownOpen(menu, trigger, false);
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

  const PROMPT_FILE = "assets/moonrise-special-prompt.md";
  const DOWNLOAD_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v10"/><path d="M8 11l4 4 4-4"/><path d="M5 19h14"/></svg>';
  const PATTERN_EXTRAS = {
    "menus-modal": "dt-modal",
    "menus-sheet": "dt-sheet",
  };
  let craftPromptPromise = null;

  function saveTextFile(text, filename, type) {
    const blob = new Blob([text], { type: type + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function copyWithTextarea(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  async function copyText(text, field) {
    const legacy = copyWithTextarea(text);
    try {
      if (navigator.clipboard?.writeText) {
        await Promise.race([
          navigator.clipboard.writeText(text),
          new Promise((_, reject) => window.setTimeout(() => reject(new Error("timeout")), 500)),
        ]);
        return;
      }
    } catch (_) {
      if (legacy) return;
    }
    if (legacy) return;
    if (field) {
      field.focus();
      field.select();
    }
    throw new Error("copy");
  }

  async function loadCraftPromptText() {
    const url = new URL(PROMPT_FILE, window.location.href);
    url.searchParams.set("dl", String(Date.now()));
    const res = await fetch(url.href, { cache: "no-store" });
    if (!res.ok) throw new Error("prompt");
    const text = String(await res.text()).replace(/^\uFEFF/, "").replace(/\s+$/, "") + "\n";
    const field = $("#dt-craft-prompt");
    if (field) field.value = text;
    return text;
  }

  function formatRepoAgo(iso) {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return "";
    const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
    const unit = (n, one, many) => n + " " + (n === 1 ? one : many);
    if (sec < 60) return unit(sec, "second", "seconds");
    const min = Math.floor(sec / 60);
    if (min < 60) return unit(min, "minute", "minutes");
    const hr = Math.floor(min / 60);
    if (hr < 24) return unit(hr, "hour", "hours");
    const day = Math.floor(hr / 24);
    if (day < 7) return unit(day, "day", "days");
    const week = Math.floor(day / 7);
    if (week < 5) return unit(week, "week", "weeks");
    const month = Math.floor(day / 30);
    if (month < 12) return unit(Math.max(1, month), "month", "months");
    return unit(Math.max(1, Math.floor(day / 365)), "year", "years");
  }

  function paintRepoUpdated(iso) {
    const el = $("[data-repo-updated]");
    if (!el) return;
    const ago = formatRepoAgo(iso);
    if (!ago) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = "Last updated " + ago + " ago";
    el.dataset.committedAt = iso;
    el.title = "GitHub · trymoonrise/moonrise";
  }

  async function readRepoCommitAt() {
    try {
      const live = await fetch("/studio-last-commit", { cache: "no-store", credentials: "omit" });
      if (live.ok) {
        const data = await live.json();
        if (data && data.committedAt) return String(data.committedAt);
      }
    } catch (_) {
      /* static preview has no worker */
    }
    try {
      const api = await fetch(
        "https://api.github.com/repos/trymoonrise/moonrise/commits?sha=main&per_page=1",
        { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" }
      );
      if (api.ok) {
        const rows = await api.json();
        const iso = rows?.[0]?.commit?.committer?.date || rows?.[0]?.commit?.author?.date || "";
        if (iso) return String(iso);
      }
    } catch (_) {
      /* rate limit or private */
    }
    try {
      const local = await fetch("assets/last-commit.json?v=" + Date.now(), { cache: "no-store" });
      if (local.ok) {
        const data = await local.json();
        if (data && data.committedAt) return String(data.committedAt);
      }
    } catch (_) {
      /* ignore */
    }
    return "";
  }

  function bootRepoUpdated() {
    const el = $("[data-repo-updated]");
    if (!el) return;
    let iso = "";
    const paint = () => {
      if (iso) paintRepoUpdated(iso);
    };
    const pull = () => {
      readRepoCommitAt().then((next) => {
        if (!next) return;
        iso = next;
        paint();
      });
    };
    pull();
    window.setInterval(paint, 1000);
    window.setInterval(pull, 60000);
  }

  function loadCraftUpdated() {
    const el = $("[data-craft-updated]");
    if (!el) return;
    fetch("https://api.github.com/repos/trymoonrise/moonrise-special-prompt", {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("repo"))))
      .then((repo) => {
        const raw = repo && (repo.pushed_at || repo.updated_at);
        const when = raw ? new Date(raw) : null;
        if (!when || Number.isNaN(when.getTime())) return;
        const hours = Math.max(1, Math.floor((Date.now() - when.getTime()) / 3600000));
        const unit = hours === 1 ? "Hour" : "Hours";
        el.textContent = "Last updated: " + hours + " " + unit + " ago";
        el.hidden = false;
      })
      .catch(() => {
        el.hidden = true;
      });
  }

  function ensureCraftPrompt() {
    if (!craftPromptPromise) {
      craftPromptPromise = loadCraftPromptText().catch((err) => {
        craftPromptPromise = null;
        throw err;
      });
    }
    return craftPromptPromise;
  }

  async function fetchTextFresh(relativePath) {
    const url = new URL(relativePath, window.location.href);
    url.searchParams.set("dl", String(Date.now()));
    const res = await fetch(url.href, { cache: "no-store" });
    if (!res.ok) throw new Error(relativePath);
    return res.text();
  }

  function patternFile(opts) {
    const title = String(opts.title || "Pattern").replace(/--/g, "—");
    const id = String(opts.id || "pattern").replace(/--/g, "—");
    const css = String(opts.css || "").replace(/<\/style/gi, "<\\/style");
    return [
      "<!DOCTYPE html>",
      '<html lang="en">',
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      "<title>" + title.replace(/</g, "") + " — Moonrise UI Library</title>",
      "<style>",
      css,
      "body.dt-ref-page{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px 16px;box-sizing:border-box}",
      ".dt-ref{width:min(28rem,100%)}",
      ".dt-ref .dt-overlay{position:relative;inset:auto;margin-top:16px;min-height:16rem;border-radius:14px}",
      ".dt-ref .dt-overlay[hidden]{display:grid!important}",
      "</style>",
      "</head>",
      '<body data-page="ui-library" class="dt-page dt-ref-page">',
      "<!--",
      "  Moonrise UI Library — " + title,
      "  Generated from the live card. This is the current markup and css/ui-library.css.",
      "  Change colors and labels only. Do not redraw the control.",
      "  Rules: https://trymoonrise.com/assets/moonrise-special-prompt.md",
      "  Same raw file, with every other type: https://github.com/trymoonrise/moonrise-special-prompt",
      "  Source: https://trymoonrise.com/ui-library#" + id,
      "-->",
      '<div class="dt-ref">',
      opts.stageHtml,
      opts.extraHtml || "",
      "</div>",
      "</body>",
      "</html>",
      "",
    ].join("\n");
  }

  async function downloadPattern(card, btn) {
    const id = card.id || "pattern";
    const title = card.querySelector("h3")?.textContent?.trim() || "Pattern";
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    try {
      const stage = card.querySelector(".dt-stage");
      if (!stage) throw new Error("stage");
      const stageClone = stage.cloneNode(true);
      stageClone.querySelectorAll(".lx-dock.is-armed, .dt-dock.is-armed").forEach((dock) => {
        dock.classList.remove("is-armed");
        dock.querySelectorAll(".lx-dock-thumb, .dt-pill-thumb").forEach((thumb) => thumb.removeAttribute("style"));
      });
      const stageHtml = stageClone.outerHTML;
      let extraHtml = "";
      const extraId = PATTERN_EXTRAS[id];
      if (extraId) {
        const node = document.getElementById(extraId);
        if (node) {
          const clone = node.cloneNode(true);
          clone.removeAttribute("hidden");
          extraHtml = clone.outerHTML;
        }
      }
      let css = await fetchTextFresh("css/ui-library.css");
      try {
        css += "\n" + await fetchTextFresh("css/ui-library-lab.css");
      } catch (_) { /* older cards still download without the lab sheet */ }
      const file = patternFile({ id, title, stageHtml, extraHtml, css });
      saveTextFile(file, "moonrise-ui-" + id + ".html", "text/html");
      showToast("Downloaded " + title);
    } catch (_) {
      showToast("Download failed");
    } finally {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
    }
  }

  function mountPatternDownloads(root) {
    const scope = root && root.querySelectorAll ? root : document;
    $all(".dt-card", scope).forEach((card) => {
      if (card.classList.contains("dt-craft-card")) return;
      if (!$(".dt-stage", card) || card.querySelector("[data-download-ui]")) return;
      const title = card.querySelector("h3")?.textContent?.trim() || "Pattern";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dt-download-ico";
      btn.setAttribute("data-download-ui", "");
      btn.setAttribute("aria-label", "Download " + title);
      btn.innerHTML = DOWNLOAD_SVG;
      const head = $(".dt-card-head", card);
      const top = $(".dt-card-top", card);
      if (head) {
        let tools = $(".dt-card-tools", head);
        if (!tools) {
          tools = document.createElement("div");
          tools.className = "dt-card-tools";
          const play = $(".dt-play-ico", head);
          if (play) tools.appendChild(play);
          head.appendChild(tools);
        }
        tools.insertBefore(btn, tools.firstChild);
      } else if (top) {
        top.appendChild(btn);
      } else {
        return;
      }
      btn.addEventListener("click", () => downloadPattern(card, btn));
    });
  }

  window.dtMountDownloads = mountPatternDownloads;

  document.addEventListener("DOMContentLoaded", () => {
    ensureCraftPrompt().catch(() => {
      const field = $("#dt-craft-prompt");
      if (field) field.placeholder = "Prompt file unavailable";
    });
    loadCraftUpdated();
    bootRepoUpdated();
    mountPatternDownloads();
    bindToc();
    bindPlay();
    bindControls();
    bindDropdowns();
    bindOverlays();
    bindPtrDrag();
    requestAnimationFrame(() => {
      syncAllPills();
      window.addEventListener("resize", syncAllPills);
      if (!reduceMotion) {
        const stepFloatingDocks = () => {
          $all(".dt-dock").forEach((dock) => {
            if (dock._dtHover || performance.now() < (dock._dtUntil || 0)) return;
            const buttons = $all("button", dock).filter((b) => !b.classList.contains("dt-pill-thumb"));
            if (buttons.length < 2) return;
            const index = Math.max(0, buttons.findIndex((b) => b.classList.contains("is-active")));
            const next = buttons[(index + 1) % buttons.length];
            buttons.forEach((b) => {
              b.classList.remove("is-active");
              b.removeAttribute("aria-current");
            });
            next.classList.add("is-active");
            next.setAttribute("aria-current", "page");
            syncPill(dock);
          });
          window.setTimeout(stepFloatingDocks, 1500);
        };
        window.setTimeout(stepFloatingDocks, 700);
      }
    });
  });
})();
