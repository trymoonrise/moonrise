/**
 * Settings → Status: authenticated service board (logo, wavelength, ping).
 * Secrets and private API URLs stay on the server (/studio/status).
 */
(function () {
  const LOGOS = {
    moonrise: "assets/MoonriseLogo.png",
    stripe: "assets/Stripe.png",
  };

  const ICONS = {
    auth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    builder:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="m14.5 7.5 3.5-3.5a2.12 2.12 0 0 1 3 3L17.5 10.5"/></svg>',
    data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  };

  let busy = false;
  let lastReport = null;

  function workerBase() {
    return (
      (typeof window.resolveWorkerUrl === "function" && window.resolveWorkerUrl()) ||
      window.SITE_CONFIG?.workerUrl ||
      ""
    ).replace(/\/$/, "");
  }

  function apiUrl(path) {
    const base = workerBase();
    const route = String(path || "").startsWith("/") ? path : "/" + String(path || "");
    try {
      if (base && typeof location !== "undefined" && base === String(location.origin || "").replace(/\/$/, "")) {
        return route;
      }
    } catch (_) {
      /* keep absolute */
    }
    return base + route;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusLabel(status) {
    if (status === "ok") return "Operational";
    if (status === "degraded") return "Degraded";
    return "Down";
  }

  function overallLabel(overall) {
    if (overall === "ok") return "All clear";
    if (overall === "degraded") return "Degraded";
    return "Issues";
  }

  function waveSvg(status) {
    const tone = status === "ok" ? "ok" : status === "degraded" ? "warn" : "bad";
    return (
      '<span class="ms-status-wave is-' +
      tone +
      '" aria-hidden="true">' +
      '<svg viewBox="0 0 64 24" preserveAspectRatio="none">' +
      '<path class="ms-status-wave-path" d="M0 12 Q8 2 16 12 T32 12 T48 12 T64 12"/>' +
      '<path class="ms-status-wave-path ms-status-wave-path--delay" d="M0 12 Q8 22 16 12 T32 12 T48 12 T64 12"/>' +
      "</svg></span>"
    );
  }

  function logoHtml(service) {
    const key = String(service.logo || service.id || "");
    if (LOGOS[key]) {
      return (
        '<img class="ms-status-logo" src="' +
        escapeHtml(LOGOS[key]) +
        '" alt="" width="28" height="28" loading="lazy" decoding="async">'
      );
    }
    const icon = ICONS[key] || ICONS.data;
    return '<span class="ms-status-logo ms-status-logo--icon" aria-hidden="true">' + icon + "</span>";
  }

  function formatPing(ms) {
    const n = Number(ms);
    if (!Number.isFinite(n) || n <= 0) return "—";
    if (n < 1000) return Math.round(n) + " ms";
    return (n / 1000).toFixed(1) + " s";
  }

  function detailRows(service) {
    const rows = Array.isArray(service.details) ? service.details : [];
    const safe = rows
      .filter((row) => row && row.label && row.value)
      .slice(0, 8)
      .map(
        (row) =>
          '<div class="ms-status-detail-row"><span>' +
          escapeHtml(row.label) +
          "</span><strong>" +
          escapeHtml(row.value) +
          "</strong></div>"
      )
      .join("");
    return (
      safe +
      '<div class="ms-status-detail-row"><span>Ping</span><strong>' +
      escapeHtml(formatPing(service.pingMs)) +
      "</strong></div>" +
      '<div class="ms-status-detail-row"><span>Status</span><strong>' +
      escapeHtml(statusLabel(service.status)) +
      "</strong></div>"
    );
  }

  function renderList(report) {
    const list = document.getElementById("set-status-list");
    const overall = document.getElementById("set-status-overall");
    if (!list) return;
    const services = Array.isArray(report?.services) ? report.services : [];
    if (overall) {
      overall.textContent = overallLabel(report?.overall || "down");
      overall.dataset.state = report?.overall || "down";
    }
    if (!services.length) {
      list.innerHTML = '<p class="ms-set-quiet">No status data yet.</p>';
      return;
    }
    list.innerHTML = services
      .map((service, index) => {
        const id = String(service.id || "svc-" + index).replace(/[^a-z0-9_-]/gi, "");
        const panelId = "set-status-panel-" + id;
        return (
          '<div class="ms-status-item" role="listitem" data-status="' +
          escapeHtml(service.status || "down") +
          '">' +
          '<button type="button" class="ms-set-row ms-status-row" id="set-status-toggle-' +
          id +
          '" aria-expanded="false" aria-controls="' +
          panelId +
          '">' +
          logoHtml(service) +
          '<span class="ms-status-copy">' +
          '<span class="ms-set-row-label">' +
          escapeHtml(service.name || "Service") +
          "</span>" +
          '<span class="ms-status-summary">' +
          escapeHtml(service.summary || statusLabel(service.status)) +
          "</span></span>" +
          waveSvg(service.status) +
          '<span class="ms-status-ping">' +
          escapeHtml(formatPing(service.pingMs)) +
          "</span>" +
          '<span class="ms-set-chevron" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
          "</span></button>" +
          '<div class="ms-set-panel ms-status-panel" id="' +
          panelId +
          '" hidden>' +
          '<div class="ms-status-detail">' +
          detailRows(service) +
          "</div></div></div>"
        );
      })
      .join("");

    list.querySelectorAll(".ms-status-row").forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.addEventListener("click", () => {
        const open = panel.classList.contains("is-open") && !panel.hidden;
        list.querySelectorAll(".ms-status-panel.is-open").forEach((other) => {
          if (other === panel) return;
          other.classList.remove("is-open", "is-expanded");
          other.hidden = true;
          other.setAttribute("aria-hidden", "true");
          const otherBtn = list.querySelector('[aria-controls="' + other.id + '"]');
          otherBtn?.setAttribute("aria-expanded", "false");
          otherBtn?.closest(".ms-status-item")?.classList.remove("is-open");
        });
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        btn.closest(".ms-status-item")?.classList.toggle("is-open", !open);
        if (open) {
          panel.classList.remove("is-open", "is-expanded");
          panel.hidden = true;
          panel.setAttribute("aria-hidden", "true");
        } else {
          panel.hidden = false;
          panel.classList.add("is-open", "is-expanded");
          panel.setAttribute("aria-hidden", "false");
        }
      });
    });
  }

  function setError(msg) {
    const el = document.getElementById("set-status-error");
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
  }

  async function loadStatus() {
    if (busy) return;
    const refresh = document.getElementById("set-status-refresh");
    const overall = document.getElementById("set-status-overall");
    busy = true;
    refresh?.classList.add("is-busy");
    setError("");
    if (overall && !lastReport) overall.textContent = "Checking…";
    try {
      const session = await window.StudioAuth?.getSession?.();
      if (!session?.access_token) throw new Error("Sign in required");
      const res = await fetch(apiUrl("/studio/status"), {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + session.access_token,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load status");
      lastReport = data;
      renderList(data);
    } catch (err) {
      setError(String(err?.message || err || "Could not load status"));
      if (overall) overall.textContent = "Unavailable";
      if (!lastReport) {
        const list = document.getElementById("set-status-list");
        if (list) list.innerHTML = "";
      }
    } finally {
      busy = false;
      refresh?.classList.remove("is-busy");
    }
  }

  function boot() {
    if (!document.getElementById("settings-status")) return;
    document.getElementById("set-status-refresh")?.addEventListener("click", () => {
      void loadStatus();
    });
    const start = () => void loadStatus();
    if (document.body?.dataset?.msAuthFired === "1") start();
    else document.addEventListener("ms:auth-ready", start, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
