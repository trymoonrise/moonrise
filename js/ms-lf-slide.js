/**
 * Shared slide-to-complete control (Business Finder + testslider).
 * Delta-based drag (immune to sheet scroll), axis lock, compositor fill.
 */
(function (global) {
  /** Commit while dragging only when essentially at the end. */
  const COMPLETE_RATIO = 0.96;
  /** On release, commit if the thumb was dragged far enough. */
  const RELEASE_COMMIT_RATIO = 0.9;
  const END_TOLERANCE_PX = 3;
  const ARM_PX = 7;
  const RETURN_MS = 320;
  const COMPLETE_MS = 320;
  const FALLBACK_THUMB = 44;
  const FALLBACK_PAD = 4;

  function slidePad(track) {
    if (!track) return FALLBACK_PAD;
    const style = global.getComputedStyle(track);
    const pad = Number.parseFloat(style.paddingLeft);
    return Number.isFinite(pad) && pad >= 0 ? pad : FALLBACK_PAD;
  }

  function thumbSize(slide, thumb) {
    if (thumb) {
      const rect = thumb.getBoundingClientRect();
      const size = Math.max(rect.width || 0, rect.height || 0, thumb.offsetWidth || 0);
      if (size > 8) return size;
    }
    if (slide) {
      const raw = global.getComputedStyle(slide).getPropertyValue("--ms-lf-slide-thumb");
      const fromVar = Number.parseFloat(raw);
      if (Number.isFinite(fromVar) && fromVar > 8) return fromVar;
    }
    return FALLBACK_THUMB;
  }

  function trackInnerWidth(track) {
    if (!track) return 0;
    const viaClient = track.clientWidth || 0;
    if (viaClient > 0) return viaClient;
    const rect = track.getBoundingClientRect();
    const style = global.getComputedStyle(track);
    const borderL = Number.parseFloat(style.borderLeftWidth) || 0;
    const borderR = Number.parseFloat(style.borderRightWidth) || 0;
    return Math.max(0, (rect.width || 0) - borderL - borderR);
  }

  function metrics(slide) {
    const track = slide?.querySelector(".ms-lf-slide-track");
    const thumb = slide?.querySelector(".ms-lf-slide-thumb");
    if (!track || !thumb) return null;

    const pad = slidePad(track);
    const thumbW = thumbSize(slide, thumb);
    const trackW = trackInnerWidth(track);
    const travel = trackW - pad * 2 - thumbW;
    const max = Math.max(0, Math.round(travel * 100) / 100);
    return { track, thumb, pad, thumbW, trackW, max };
  }

  function readX(slide) {
    const raw = slide?.style?.getPropertyValue("--ms-lf-slide-x");
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function fillRatioFor(x, m, fillToEnd) {
    if (!m || !(m.trackW > 0)) return fillToEnd ? 1 : 0;
    if (fillToEnd) return 1;
    const px = m.pad + Math.max(0, x) + m.thumbW;
    return Math.max(0, Math.min(1, px / m.trackW));
  }

  function setX(slide, x, m, opts) {
    if (!slide || !m) return 0;
    const max = Math.max(0, m.max);
    const clamped = Math.max(0, Math.min(max, x));
    const fillToEnd = !!(opts && opts.fillToEnd);
    const ratio = fillRatioFor(clamped, m, fillToEnd);

    slide.style.setProperty("--ms-lf-slide-x", clamped + "px");
    slide.style.setProperty("--ms-lf-slide-fill-ratio", String(ratio));
    if (!opts || !opts.drag) {
      slide.style.setProperty("--ms-lf-slide-max", max + "px");
      slide.style.setProperty("--ms-lf-slide-thumb", m.thumbW + "px");
      // Legacy fill px for any older CSS still reading it.
      const fillPx = fillToEnd ? m.trackW : Math.min(m.trackW, m.pad + clamped + m.thumbW);
      slide.style.setProperty("--ms-lf-slide-fill", fillPx + "px");
    }
    return clamped;
  }

  function clearInline(slide) {
    if (!slide) return;
    slide.style.removeProperty("--ms-lf-slide-x");
    slide.style.removeProperty("--ms-lf-slide-max");
    slide.style.removeProperty("--ms-lf-slide-fill");
    slide.style.removeProperty("--ms-lf-slide-fill-ratio");
    slide.style.removeProperty("--ms-lf-slide-thumb");
  }

  function completes(current, max, ratio) {
    if (!(max > 0)) return false;
    const need = Number.isFinite(ratio) ? ratio : COMPLETE_RATIO;
    return current >= max * need || current >= max - END_TOLERANCE_PX;
  }

  function resetSlide(slide, animated) {
    if (!slide) return;
    const m = metrics(slide);
    if (!m) {
      clearInline(slide);
      return;
    }
    slide.classList.remove("is-dragging", "is-completing");
    if (animated) {
      slide.classList.add("is-returning");
      setX(slide, 0, m);
      global.setTimeout(function () {
        slide.classList.remove("is-returning");
        clearInline(slide);
      }, RETURN_MS);
      return;
    }
    slide.classList.remove("is-returning");
    clearInline(slide);
  }

  function completeSlide(slide, onComplete) {
    if (!slide || slide.classList.contains("is-completing")) return;
    const m = metrics(slide);
    if (!m || m.max <= 0) return;
    slide.classList.remove("is-dragging", "is-returning");
    slide.classList.add("is-completing");
    setX(slide, m.max, m, { fillToEnd: true });
    global.setTimeout(function () {
      slide.classList.remove("is-completing");
      if (typeof onComplete === "function") onComplete(slide);
    }, COMPLETE_MS);
  }

  function beginDrag(e, slide, hooks) {
    hooks = hooks || {};
    if (e.button != null && e.button !== 0) return false;
    if (typeof hooks.canInteract === "function" && !hooks.canInteract(slide, e)) return false;
    if (
      slide.classList.contains("is-completing") ||
      slide.classList.contains("is-returning") ||
      slide.classList.contains("is-done")
    ) {
      return false;
    }
    if (slide.dataset.msLfSlideDragging === "1") return false;

    let m = metrics(slide);
    if (!m || m.max <= 2) {
      m = metrics(slide);
    }
    if (!m || m.max <= 2) return false;

    const gestureMetrics = {
      track: m.track,
      thumb: m.thumb,
      pad: m.pad,
      thumbW: m.thumbW,
      trackW: m.trackW,
      max: m.max,
    };
    const max = gestureMetrics.max;
    const { track, thumb } = gestureMetrics;

    const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const onThumb = !!e.target.closest?.(".ms-lf-slide-thumb");
    // Delta tracking from a fixed origin — immune to sheet/list scroll mid-drag.
    let originLeft = readX(slide);
    if (!onThumb) {
      const rect = track.getBoundingClientRect();
      const style = global.getComputedStyle(track);
      const borderL = Number.parseFloat(style.borderLeftWidth) || 0;
      const raw =
        startX - rect.left - borderL - gestureMetrics.pad - gestureMetrics.thumbW / 2;
      originLeft = Math.max(0, Math.min(max, raw));
    }
    const pointerOriginX = startX;
    let current = Math.max(0, Math.min(max, originLeft));
    let armed = false;
    let finished = false;
    let moved = false;
    let raf = 0;
    let latestX = startX;
    const pointerId = e.pointerId ?? 1;
    const usePointer = e.pointerId != null;

    // Seed CSS vars without claiming the gesture yet (allows vertical scroll to win).
    setX(slide, current, gestureMetrics);

    function clientXY(ev) {
      if (ev.clientX != null || ev.clientY != null) {
        return {
          x: ev.clientX != null ? ev.clientX : startX,
          y: ev.clientY != null ? ev.clientY : startY,
        };
      }
      const touch = ev.changedTouches?.[0] || ev.touches?.[0];
      return {
        x: touch ? touch.clientX : startX,
        y: touch ? touch.clientY : startY,
      };
    }

    function teardownListeners() {
      if (usePointer) {
        global.removeEventListener("pointermove", onMove, true);
        global.removeEventListener("pointerup", onRelease, true);
        global.removeEventListener("pointercancel", onCancel, true);
        try {
          if (thumb.hasPointerCapture?.(pointerId)) thumb.releasePointerCapture(pointerId);
        } catch (_) {
          /* ignore */
        }
      } else {
        global.removeEventListener("mousemove", onMove, true);
        global.removeEventListener("mouseup", onRelease, true);
        global.removeEventListener("touchmove", onMove, true);
        global.removeEventListener("touchend", onRelease, true);
        global.removeEventListener("touchcancel", onCancel, true);
      }
    }

    function finish(forceComplete, softAbort) {
      if (finished) return;
      finished = true;
      if (raf) {
        global.cancelAnimationFrame(raf);
        raf = 0;
      }
      delete slide.dataset.msLfSlideDragging;
      global.document.body.classList.remove("ms-lf-slide-dragging");
      teardownListeners();
      slide.classList.remove("is-dragging");

      if (softAbort || !armed) {
        // Never really took the gesture — leave the thumb where CSS defaults it.
        clearInline(slide);
        return;
      }

      current = setX(slide, current, gestureMetrics);
      const shouldComplete =
        forceComplete === true ||
        (moved && completes(current, max, COMPLETE_RATIO)) ||
        (moved && completes(current, max, RELEASE_COMMIT_RATIO));

      if (shouldComplete) {
        completeSlide(slide, hooks.onComplete);
      } else {
        resetSlide(slide, true);
      }
    }

    function arm(ev) {
      if (armed || finished) return true;
      const { x, y } = clientXY(ev);
      const dx = x - startX;
      const dy = y - startY;
      if (Math.abs(dx) < ARM_PX && Math.abs(dy) < ARM_PX) return false;

      // Vertical intent → abort and let the sheet/list scroll.
      if (Math.abs(dy) > Math.abs(dx) * 1.1) {
        finish(false, true);
        return false;
      }

      armed = true;
      slide.dataset.msLfSlideDragging = "1";
      slide.classList.add("is-dragging");
      global.document.body.classList.add("ms-lf-slide-dragging");
      if (usePointer) {
        try {
          thumb.setPointerCapture(pointerId);
        } catch (_) {
          try {
            track.setPointerCapture(pointerId);
          } catch (_) {
            /* ignore */
          }
        }
      }
      try {
        ev.preventDefault();
      } catch (_) {
        /* ignore */
      }
      return true;
    }

    function applyFrame() {
      raf = 0;
      if (finished || !armed) return;
      const next = originLeft + (latestX - pointerOriginX);
      current = setX(slide, next, gestureMetrics, { drag: true });
      if (Math.abs(latestX - pointerOriginX) >= ARM_PX) moved = true;
      if (moved && completes(current, max, COMPLETE_RATIO)) {
        finish(true, false);
      }
    }

    function onMove(ev) {
      if (finished) return;
      if (usePointer && ev.pointerId != null && ev.pointerId !== pointerId) return;
      const { x } = clientXY(ev);
      latestX = x;

      if (!armed) {
        if (!arm(ev)) return;
      } else {
        try {
          ev.preventDefault();
        } catch (_) {
          /* ignore */
        }
      }

      if (!raf) raf = global.requestAnimationFrame(applyFrame);
    }

    function onRelease(ev) {
      if (usePointer && ev?.pointerId != null && ev.pointerId !== pointerId) return;
      if (armed) {
        const { x } = clientXY(ev || {});
        latestX = x;
        current = setX(slide, originLeft + (latestX - pointerOriginX), gestureMetrics, { drag: true });
        if (Math.abs(latestX - pointerOriginX) >= ARM_PX) moved = true;
      }
      finish(false, false);
    }

    function onCancel(ev) {
      if (usePointer && ev?.pointerId != null && ev.pointerId !== pointerId) return;
      // Treat cancel like release so a near-complete slide still commits.
      onRelease(ev);
    }

    if (usePointer) {
      global.addEventListener("pointermove", onMove, true);
      global.addEventListener("pointerup", onRelease, true);
      global.addEventListener("pointercancel", onCancel, true);
    } else if (e.type === "touchstart") {
      global.addEventListener("touchmove", onMove, { capture: true, passive: false });
      global.addEventListener("touchend", onRelease, true);
      global.addEventListener("touchcancel", onCancel, true);
    } else {
      global.addEventListener("mousemove", onMove, true);
      global.addEventListener("mouseup", onRelease, true);
    }

    return true;
  }

  function bindTrack(track, hooks) {
    if (!track || track.dataset.msLfSlideBound === "1") return;
    track.dataset.msLfSlideBound = "1";

    function onStart(e) {
      const slide = track.closest(".ms-lf-slide");
      if (!slide) return;
      beginDrag(e, slide, hooks);
    }

    track.addEventListener("pointerdown", onStart, true);
    track.addEventListener(
      "touchstart",
      function (e) {
        if (typeof global.PointerEvent === "function") return;
        onStart(e);
      },
      { capture: true, passive: false }
    );
    track.addEventListener(
      "mousedown",
      function (e) {
        if (typeof global.PointerEvent === "function") return;
        onStart(e);
      },
      true
    );
  }

  function bindContainer(container, hooks) {
    if (!container || container.dataset.msLfSlideBound === "1") return;
    container.dataset.msLfSlideBound = "1";

    function onStart(e) {
      const track = e.target.closest(".ms-lf-slide-track");
      if (!track) return;
      const slide = track.closest(".ms-lf-slide");
      if (!slide) return;
      beginDrag(e, slide, hooks);
    }

    container.addEventListener("pointerdown", onStart, true);
    container.addEventListener(
      "touchstart",
      function (e) {
        if (typeof global.PointerEvent === "function") return;
        onStart(e);
      },
      { capture: true, passive: false }
    );
    container.addEventListener(
      "mousedown",
      function (e) {
        if (typeof global.PointerEvent === "function") return;
        onStart(e);
      },
      true
    );
  }

  function prime(root) {
    root?.querySelectorAll(".ms-lf-slide").forEach(function (slide) {
      if (slide.classList.contains("is-done")) return;
      const m = metrics(slide);
      if (m && m.max > 0) setX(slide, 0, m);
    });
  }

  global.MsLfSlide = {
    COMPLETE_RATIO,
    RELEASE_COMMIT_RATIO,
    END_TOLERANCE_PX,
    RETURN_MS,
    COMPLETE_MS,
    metrics,
    readX,
    setX,
    clearInline,
    completes,
    resetSlide,
    completeSlide,
    beginDrag,
    bindTrack,
    bindContainer,
    prime,
  };
})(window);
