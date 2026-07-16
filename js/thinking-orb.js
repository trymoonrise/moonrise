/**
 * Vanilla scanning orb for the Business Finder scan buttons.
 * A dotted globe with a meridian that sweeps across it. Light dots,
 * tuned for the blue scan button at the inline (20px) size.
 */
(function () {
  const SIZE = 20;
  const SPEED = 2.665;
  const LAT_RINGS = 6;
  const LON_DENSITY = 14;
  const R_BASE = 1.05;
  const R_DEPTH = 2.975;
  const R_BOOST = 1.75;
  const RS = Math.pow(SIZE / 300, 0.6);
  const DIM = 0.96;
  const SCAN_MUL = 4.335;
  const INK_FAR = 0.04;
  const INK_SPAN = 0.04;
  const R_MIN = 0.3;
  const SPIN = 0.5;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvases = new Set();
  let raf = 0;

  function angleDelta(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }

  function project(yaw, tilt, x, y, z, cx, cy, scale) {
    const st = Math.sin(tilt);
    const ct = Math.cos(tilt);
    const sy = Math.sin(yaw);
    const cyw = Math.cos(yaw);
    const x1 = x * cyw + z * sy;
    const z1 = -x * sy + z * cyw;
    const y1 = y * ct - z1 * st;
    const z2 = y * st + z1 * ct;
    return [cx + x1 * scale, cy - y1 * scale, z2];
  }

  function draw(ctx, t) {
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const radius = SIZE / 2 * 0.82;
    const tilt = 0.4 + 0.06 * Math.sin(t * 0.35);
    const yaw = t * SPIN;
    const scan = t * (SPIN + (1.7 - SPIN) * SCAN_MUL);
    const dots = [];

    for (let li = 0; li <= LAT_RINGS; li++) {
      const lat = -Math.PI / 2 + (li / LAT_RINGS) * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * LON_DENSITY));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = (lj / lonCount) * Math.PI * 2;
        const point = project(
          yaw,
          tilt,
          cosLat * Math.cos(lon),
          sinLat,
          cosLat * Math.sin(lon),
          cx,
          cy,
          radius
        );
        const z = point[2];
        const depth = (z + 1) / 2;
        const sweep = angleDelta(lon + yaw, scan);
        const boost = Math.exp(-(sweep * sweep) / 0.18) * Math.max(0, z);
        const lit = Math.min(1, boost);
        const alpha = Math.min(1, DIM + (1 - DIM) * lit);
        if (alpha < 0.02) continue;
        dots.push({
          x: point[0],
          y: point[1],
          z: z,
          r: Math.max(0.7, (R_BASE + R_DEPTH * depth + R_BOOST * boost) * RS * 1.65),
          white: Math.max(0, INK_FAR - INK_SPAN * depth - lit * 0.2),
          a: alpha,
        });
      }
    }

    dots.sort(function (a, b) {
      return a.z - b.z;
    });

    ctx.setTransform(ctx._dpr, 0, 0, ctx._dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const w = Math.min(1, Math.max(0, dot.white));
      const g = Math.round((1 - w) * 255);
      ctx.fillStyle = "rgba(" + g + "," + g + "," + g + "," + dot.a + ")";
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick(now) {
    const t = reduced ? 0.8 : (now / 1000) * SPEED;
    canvases.forEach(function (canvas) {
      if (!canvas.isConnected) {
        canvases.delete(canvas);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx._dpr = canvas._dpr;
      draw(ctx, t);
    });
    raf = canvases.size && !reduced ? window.requestAnimationFrame(tick) : 0;
  }

  function mount(canvas) {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas._dpr = dpr;
    canvas.width = Math.round(SIZE * dpr);
    canvas.height = Math.round(SIZE * dpr);
    canvases.add(canvas);
    if (reduced) {
      tick(0);
      return;
    }
    if (!raf && !document.hidden) raf = window.requestAnimationFrame(tick);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    if (canvases.size && !raf && !reduced) raf = window.requestAnimationFrame(tick);
  });

  window.MoonriseThinkingOrb = { mount: mount };
})();
