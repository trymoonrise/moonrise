/**
 * Shared slide-to-complete control (Business Finder + testslider).
 * Immediate gesture lock + delta tracking. List refreshes must not rebuild DOM mid-drag.
 */
(function (global) {
  const COMPLETE_RATIO = 0.94;
  const RELEASE_COMMIT_RATIO = 0.82;
  const END_TOLERANCE_PX = 4;
  const RETURN_MS = 280;
  const COMPLETE_MS = 280;
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

  function emitIdle() {
    try {
      global.document.dispatchEvent(new CustomEvent("ms:lf-slide-idle"));
    } catch (_) {
      /* ignore */
    }
  }

  function resetSlide(slide, animated) {
    if (!slide) return;
    const m = metrics(slide);
    if (!m) {
      clearInline(slide);
      emitIdle();
      return;
    }
    slide.classList.remove("is-dragging", "is-completing");
    delete slide.dataset.msLfSlideDragging;
    if (animated) {
      slide.classList.add("is-returning");
      setX(slide, 0, m);
      global.setTimeout(function () {
        slide.classList.remove("is-returning");
        clearInline(slide);
        emitIdle();
      }, RETURN_MS);
      return;
    }
    slide.classList.remove("is-returning");
    clearInline(slide);
    emitIdle();
  }

  function completeSlide(slide, onComplete) {
    if (!slide || slide.classList.contains("is-completing")) return;
    const m = metrics(slide);
    if (!m || m.max <= 0) return;
    slide.classList.remove("is-dragging", "is-returning");
    delete slide.dataset.msLfSlideDragging;
    slide.classList.add("is-completing");
    setX(slide, m.max, m, { fillToEnd: true });
    global.setTimeout(function () {
      slide.classList.remove("is-completing");
      if (typeof onComplete === "function") onComplete(slide);
      emitIdle();
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

    const m = metrics(slide);
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
    const onThumb = !!e.target.closest?.(".ms-lf-slide-thumb");
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
    let finished = false;
    let moved = Math.abs(current) > 1;
    let raf = 0;
    let latestX = startX;
    const pointerId = e.pointerId ?? 1;
    const usePointer = e.pointerId != null;

    // Lock the gesture immediately so parent scroll / list refresh cannot steal it.
    try {
      e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
    } catch (_) {
      /* ignore */
    }

    slide.dataset.msLfSlideDragging = "1";
    slide.classList.add("is-dragging");
    global.document.body.classList.add("ms-lf-slide-dragging");
    setX(slide, current, gestureMetrics);

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

    function clientX(ev) {
      if (ev && ev.clientX != null) return ev.clientX;
      const touch = ev?.changedTouches?.[0] || ev?.touches?.[0];
      return touch ? touch.clientX : latestX;
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
        try {
          if (track.hasPointerCapture?.(pointerId)) track.releasePointerCapture(pointerId);
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

    function finish(forceComplete) {
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

    function applyFrame() {
      raf = 0;
      if (finished) return;
      const next = originLeft + (latestX - pointerOriginX);
      current = setX(slide, next, gestureMetrics, { drag: true });
      if (Math.abs(latestX - pointerOriginX) >= 3) moved = true;
      if (moved && completes(current, max, COMPLETE_RATIO)) {
        finish(true);
      }
    }

    function onMove(ev) {
      if (finished) return;
      if (usePointer && ev.pointerId != null && ev.pointerId !== pointerId) return;
      try {
        ev.preventDefault();
      } catch (_) {
        /* ignore */
      }
      latestX = clientX(ev);
      if (!raf) raf = global.requestAnimationFrame(applyFrame);
    }

    function onRelease(ev) {
      if (usePointer && ev?.pointerId != null && ev.pointerId !== pointerId) return;
      latestX = clientX(ev || {});
      current = setX(slide, originLeft + (latestX - pointerOriginX), gestureMetrics, { drag: true });
      if (Math.abs(latestX - pointerOriginX) >= 3) moved = true;
      finish(false);
    }

    function onCancel(ev) {
      if (usePointer && ev?.pointerId != null && ev.pointerId !== pointerId) return;
      // Browser stole the gesture (scroll/refresh). Keep progress: complete if far enough,
      // otherwise soft-hold then return — never hard-clear mid-slide without animation.
      latestX = clientX(ev || {});
      current = setX(slide, originLeft + (latestX - pointerOriginX), gestureMetrics, { drag: true });
      if (Math.abs(latestX - pointerOriginX) >= 3) moved = true;
      finish(false);
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
      const started = beginDrag(e, slide, hooks);
      if (started) {
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch (_) {
          /* ignore */
        }
      }
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
      if (slide.dataset.msLfSlideDragging === "1") return;
      if (
        slide.classList.contains("is-dragging") ||
        slide.classList.contains("is-completing") ||
        slide.classList.contains("is-returning")
      ) {
        return;
      }
      const m = metrics(slide);
      if (m && m.max > 0) setX(slide, 0, m);
    });
  }

  function isGestureActive() {
    return (
      global.document.body.classList.contains("ms-lf-slide-dragging") ||
      !!global.document.querySelector(".ms-lf-slide[data-ms-lf-slide-dragging='1']")
    );
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
    isGestureActive,
  };
})(window);
