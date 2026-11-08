/**
 * Settings → Services button: expand to services, tap a service for details.
 * Secrets stay on the server (/studio/status).
 */
(function () {
  const LOGOS = {
    moonrise: "assets/MoonriseLogo.png",
    stripe: "assets/Stripe.png",
    supabase: "assets/Supabase.svg",
    data: "assets/Supabase.svg",
    openrouter: "assets/OpenRouter.svg",
    builder: "assets/OpenRouter.svg",
    vercel: "assets/Vercel.svg",
    github: "assets/GitHub.svg",
    resend: "assets/Resend.svg",
  };

  const MONO_LOGOS = {
    vercel: true,
    github: true,
    resend: true,
  };

  const ICONS = {
    auth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    dns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></svg>',
    leadfinder:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    push: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
    fleet:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/></svg>',
  };

  const FEEDBACK = {
    ok: {
      short: "Running smoothly",
      explain: "Green waves mean this service is healthy and responding normally.",
    },
    degraded: {
      short: "Warning",
      explain: "Yellow waves mean something needs attention, but Studio can still work.",
    },
    down: {
      short: "Error",
      explain: "Red waves mean this service is down or unreachable right now.",
    },
  };

  /** Plain-language context for each Services row — no secrets, product meaning only. */
  const SERVICE_CONTEXT = {
    app: {
      about: "The public Moonrise website creators and clients open in the browser.",
      usedFor: "Marketing pages, login entry, and the Studio shell at trymoonrise.com.",
    },
    worker: {
      about: "Moonrise’s Studio API — the backend that powers signed-in Studio actions.",
      usedFor: "Generate sites, publish, checkout webhooks, Business Finder proxy, and this status board.",
    },
    dns: {
      about: "Domain name resolution for trymoonrise.com, plus whether email sending is configured.",
      usedFor: "Making sure the Moonrise domain resolves and transactional email can be turned on.",
    },
    supabase: {
      about: "Cloud auth and database for Moonrise accounts and Studio data.",
      usedFor: "Sign-in, sessions, profiles, projects, leads, payments records, and saved settings.",
    },
    stripe: {
      about: "Payment processor for Moonrise checkout and billing.",
      usedFor: "Go-live payments, hosting subscriptions, credits, and related payouts paths.",
    },
    ai: {
      about: "OpenRouter connects Moonrise Builder to AI models for site generation.",
      usedFor: "Writing and assembling business website HTML from prompts and presets.",
    },
    email: {
      about: "Resend sends Moonrise transactional email.",
      usedFor: "Receipts, notices, and other automated mail Studio or checkout triggers.",
    },
    deploy: {
      about: "Vercel hosts Studio and deploys published client websites.",
      usedFor: "Keeping trymoonrise.com online and shipping each creator’s live site URL.",
    },
    github: {
      about: "The Moonrise source repository on GitHub.",
      usedFor: "Product source of truth, website presets, and ship/release history.",
    },
    leadfinder: {
      about: "Cloud search service behind Business Finder.",
      usedFor: "Scanning maps and finding local businesses you can claim as leads.",
    },
    push: {
      about: "Browser push notifications (Web Push / VAPID).",
      usedFor: "Optional alerts in the installed Moonrise app or browser — not required for core Studio.",
    },
    fleet: {
      about: "Moonrise’s count of creator sites that are published with a live URL.",
      usedFor: "Seeing how many client websites are live across the product — not a third-party vendor.",
    },
  };

  let busy = false;
  let lastReport = null;
  let loadedOnce = false;

  function prefersReduceMotion() {
    try {
      return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    } catch (_) {
      return false;
    }
  }

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

  function toneFor(status) {
    if (status === "ok") return "ok";
    if (status === "degraded") return "warn";
    return "bad";
  }

  function feedbackFor(status) {
    return FEEDBACK[status] || FEEDBACK.down;
  }

  function overallLabel(overall) {
    if (overall === "ok") return "All clear";
    if (overall === "degraded") return "Warning";
    return "Error";
  }

  function overallLegend(overall) {
    const tip = " Tap a service for what it is, what it’s for, and a copyable status code.";
    if (overall === "ok") {
      return "Green waves mean everything is running smoothly." + tip;
    }
    if (overall === "degraded") {
      return "Yellow waves mean a warning — something needs attention, but Studio can still work." + tip;
    }
    return "Red waves mean an error — one or more services are down." + tip;
  }

  function waveSvg(status) {
    return (
      '<span class="ms-status-wave is-' +
      toneFor(status) +
      '" aria-hidden="true">' +
      '<svg viewBox="0 0 64 24" preserveAspectRatio="none">' +
      '<path class="ms-status-wave-path" d="M0 12 Q8 2 16 12 T32 12 T48 12 T64 12"/>' +
      '<path class="ms-status-wave-path ms-status-wave-path--delay" d="M0 12 Q8 22 16 12 T32 12 T48 12 T64 12"/>' +
      "</svg></span>"
    );
  }

  function setOverallWave(status) {
    const wave = document.getElementById("set-status-wave");
    if (!wave) return;
    wave.classList.remove("is-ok", "is-warn", "is-bad");
    wave.classList.add("is-" + toneFor(status));
  }

  function serviceName(service) {
    const id = String(service?.id || "");
    const logo = String(service?.logo || "");
    const name = String(service?.name || "");
    if (id === "builder" || id === "ai" || logo === "builder" || logo === "openrouter" || /builder ai/i.test(name)) {
      return "OpenRouter";
    }
    if (id === "data" || id === "supabase" || logo === "data" || logo === "supabase" || /^data$/i.test(name)) {
      return "Supabase";
    }
    return name || "Service";
  }

  function serviceSummary(service) {
    return String(service?.summary || "")
      .replace(/builder ai/gi, "OpenRouter")
      .replace(/data store/gi, "Supabase");
  }

  function serviceContext(service) {
    const id = String(service?.id || "").toLowerCase();
    const logo = String(service?.logo || "").toLowerCase();
    return (
      SERVICE_CONTEXT[id] ||
      SERVICE_CONTEXT[logo] ||
      (id === "builder" || logo === "openrouter" ? SERVICE_CONTEXT.ai : null) ||
      (id === "data" ? SERVICE_CONTEXT.supabase : null) || {
        about: "A Moonrise dependency checked by Settings → Services.",
        usedFor: "Keeps Studio features working when this check stays healthy.",
      }
    );
  }

  function logoHtml(service) {
    const key = String(service.logo || service.id || "");
    if (LOGOS[key]) {
      return (
        '<img class="ms-status-logo' +
        (MONO_LOGOS[key] ? " is-mono" : "") +
        '" src="' +
        escapeHtml(LOGOS[key]) +
        '" alt="" width="28" height="28" loading="lazy" decoding="async">'
      );
    }
    const icon = ICONS[key] || ICONS.fleet;
    return '<span class="ms-status-logo ms-status-logo--icon" aria-hidden="true">' + icon + "</span>";
  }

  function formatPing(ms) {
    const n = Number(ms);
    if (!Number.isFinite(n) || n <= 0) return "—";
    if (n < 1000) return Math.round(n) + " ms";
    return (n / 1000).toFixed(1) + " s";
  }

  function ensurePanelInner(panel) {
    if (!panel || panel.querySelector(":scope > .ms-set-panel-inner")) return;
    const inner = document.createElement("div");
    inner.className = "ms-set-panel-inner";
    while (panel.firstChild) inner.appendChild(panel.firstChild);
    panel.appendChild(inner);
  }

  function setPanelOpen(toggle, panel, open) {
    if (!toggle || !panel) return;
    ensurePanelInner(panel);
    const next = !!open;
    const item = toggle.closest(".ms-status-item") || toggle;
    toggle.setAttribute("aria-expanded", next ? "true" : "false");
    item.classList.toggle("is-open", next);
    panel.setAttribute("aria-hidden", next ? "false" : "true");

    if (panel._msCloseTimer) {
      window.clearTimeout(panel._msCloseTimer);
      panel._msCloseTimer = 0;
    }

    if (next) {
      panel.hidden = false;
      panel.classList.add("is-open");
      if (prefersReduceMotion()) {
        panel.classList.add("is-expanded");
        return;
      }
      panel.classList.remove("is-expanded");
      void panel.offsetHeight;
      requestAnimationFrame(() => {
        panel.classList.add("is-expanded");
      });
      return;
    }

    panel.classList.remove("is-expanded");
    if (prefersReduceMotion()) {
      panel.classList.remove("is-open");
      panel.hidden = true;
      return;
    }
    panel._msCloseTimer = window.setTimeout(() => {
      panel.classList.remove("is-open");
      panel.hidden = true;
      panel._msCloseTimer = 0;
    }, 280);
  }

  function serviceCode(service) {
    const existing = String(service?.code || "").trim();
    if (existing) return existing;
    const id = String(service?.id || "service")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "SERVICE";
    const state =
      service?.status === "ok" ? "OK" : service?.status === "degraded" ? "WARN" : "ERR";
    return "MR-" + id + "-" + state;
  }

  /** Secret-free paste for coding agents. Only status labels already shown in UI. */
  function issueText(service, report) {
    const fb = feedbackFor(service.status);
    const ctx = serviceContext(service);
    const rows = Array.isArray(service.details) ? service.details : [];
    const detailLines = rows
      .filter((row) => row && row.label && row.value)
      .slice(0, 8)
      .map((row) => "- " + String(row.label) + ": " + String(row.value));
    const lines = [
      "Moonrise Services issue",
      "Code: " + serviceCode(service),
      "Service: " + serviceName(service),
      "About: " + ctx.about,
      "Used for: " + ctx.usedFor,
      "Status: " + fb.short,
      "Summary: " + serviceSummary(service),
      "Ping: " + formatPing(service.pingMs),
    ];
    if (report?.overall) {
      lines.push(
        "Overall: " +
          overallLabel(report.overall) +
          (report.code ? " (" + String(report.code) + ")" : "")
      );
    }
    if (report?.checkedAt) lines.push("Checked: " + String(report.checkedAt));
    if (detailLines.length) {
      lines.push("Details:");
      lines.push(...detailLines);
    }
    lines.push("Note: no secrets — status labels only.");
    return lines.join("\n");
  }

  function overallIssueText(report) {
    const services = Array.isArray(report?.services) ? report.services : [];
    const focus = services.filter((s) => s && s.status !== "ok");
    const list = focus.length ? focus : services;
    const lines = [
      "Moonrise Services report",
      "Code: " + String(report?.code || serviceCode({ id: "overall", status: report?.overall })),
      "Overall: " + overallLabel(report?.overall || "down"),
      "Checked: " + String(report?.checkedAt || ""),
      "",
    ];
    list.forEach((service) => {
      lines.push(
        serviceCode(service) +
          " · " +
          serviceName(service) +
          " · " +
          feedbackFor(service.status).short +
          " · " +
          serviceSummary(service)
      );
    });
    lines.push("");
    lines.push("Note: no secrets — status labels only.");
    return lines.join("\n");
  }

  async function copyIssue(text, btn) {
    const value = String(text || "").trim();
    if (!value) return;
    const label = btn?.querySelector(".ms-status-copy-label");
    const reset = () => {
      if (label) label.textContent = "Copy";
      btn?.classList.remove("is-copied");
    };
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      if (label) label.textContent = "Copied";
      btn?.classList.add("is-copied");
      window.setTimeout(reset, 1600);
    } catch (_) {
      if (label) label.textContent = "Copy failed";
      window.setTimeout(reset, 1600);
    }
  }

  function detailRows(service) {
    const fb = feedbackFor(service.status);
    const ctx = serviceContext(service);
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
      '<div class="ms-status-context">' +
      '<p class="ms-status-context-about"><span>What it is</span>' +
      escapeHtml(ctx.about) +
      "</p>" +
      '<p class="ms-status-context-for"><span>What it’s for</span>' +
      escapeHtml(ctx.usedFor) +
      "</p></div>" +
      '<p class="ms-status-feedback is-' +
      toneFor(service.status) +
      '">' +
      escapeHtml(fb.explain) +
      "</p>" +
      '<div class="ms-status-detail-row"><span>Code</span><strong class="ms-status-code">' +
      escapeHtml(serviceCode(service)) +
      "</strong></div>" +
      safe +
      '<div class="ms-status-detail-row"><span>Indication</span><strong>' +
      escapeHtml(fb.short) +
      "</strong></div>" +
      '<div class="ms-status-detail-row"><span>Ping</span><strong>' +
      escapeHtml(formatPing(service.pingMs)) +
      "</strong></div>" +
      '<button type="button" class="ms-status-copy-btn" data-status-copy="service">' +
      '<span class="ms-status-copy-label">Copy</span>' +
      "</button>"
    );
  }

  function renderList(report) {
    const list = document.getElementById("set-status-list");
    const overall = document.getElementById("set-status-overall");
    const legend = document.getElementById("set-status-legend");
    if (!list) return;
    const services = Array.isArray(report?.services) ? report.services : [];
    const state = report?.overall || "down";
    if (overall) {
      overall.textContent = overallLabel(state);
      overall.dataset.state = state;
    }
    setOverallWave(state);
    if (legend) {
      legend.innerHTML =
        '<span class="ms-status-legend-text">' +
        escapeHtml(overallLegend(state)) +
        "</span>" +
        '<button type="button" class="ms-status-copy-btn ms-status-copy-btn--inline" data-status-copy="report">' +
        '<span class="ms-status-copy-label">Copy</span></button>';
    }

    if (!services.length) {
      list.innerHTML = '<p class="ms-set-quiet">No status data yet.</p>';
      return;
    }

    list.innerHTML = services
      .map((service, index) => {
        const id = String(service.id || "svc-" + index).replace(/[^a-z0-9_-]/gi, "");
        const panelId = "set-status-panel-" + id;
        const fb = feedbackFor(service.status);
        return (
          '<div class="ms-status-item" role="listitem" data-status="' +
          escapeHtml(service.status || "down") +
          '" data-service-id="' +
          escapeHtml(id) +
          '">' +
          '<button type="button" class="ms-set-row ms-status-row" id="set-status-toggle-' +
          id +
          '" aria-expanded="false" aria-controls="' +
          panelId +
          '">' +
          logoHtml(service) +
          '<span class="ms-status-copy">' +
          '<span class="ms-set-row-label">' +
          escapeHtml(serviceName(service)) +
          "</span>" +
          '<span class="ms-status-summary">' +
          escapeHtml(fb.short) +
          " · " +
          escapeHtml(serviceSummary(service)) +
          "</span>" +
          '<span class="ms-status-blurb">' +
          escapeHtml(serviceContext(service).usedFor) +
          "</span></span>" +
          waveSvg(service.status) +
          '<span class="ms-status-ping">' +
          escapeHtml(formatPing(service.pingMs)) +
          "</span>" +
          '<span class="ms-set-chevron" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
          "</span></button>" +
          '<div class="ms-set-panel ms-status-detail-panel" id="' +
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
      ensurePanelInner(panel);
      panel.hidden = true;
      panel.classList.remove("is-open", "is-expanded");
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = panel.classList.contains("is-open") && !panel.hidden;
        list.querySelectorAll(".ms-status-detail-panel.is-open").forEach((other) => {
          if (other === panel) return;
          const otherBtn = list.querySelector('[aria-controls="' + other.id + '"]');
          setPanelOpen(otherBtn, other, false);
        });
        setPanelOpen(btn, panel, !open);
      });
    });

    const panelRoot = document.getElementById("set-status-panel");
    panelRoot?.querySelectorAll("[data-status-copy]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const kind = btn.getAttribute("data-status-copy");
        if (kind === "report") {
          void copyIssue(overallIssueText(report), btn);
          return;
        }
        const item = btn.closest(".ms-status-item");
        const sid = item?.getAttribute("data-service-id") || "";
        const service =
          services.find((s) => String(s.id || "").replace(/[^a-z0-9_-]/gi, "") === sid) ||
          null;
        if (!service) return;
        void copyIssue(issueText(service, report), btn);
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
    const overall = document.getElementById("set-status-overall");
    const toggle = document.getElementById("set-status-toggle");
    busy = true;
    toggle?.classList.add("is-loading");
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
      loadedOnce = true;
      renderList(data);
    } catch (err) {
      const errMsg = String(err?.message || err || "Could not load status");
      setError(errMsg);
      if (overall) {
        overall.textContent = "Error";
        overall.dataset.state = "down";
      }
      setOverallWave("down");
      if (lastReport) {
        renderList(lastReport);
      } else {
        const list = document.getElementById("set-status-list");
        if (list) list.innerHTML = "";
        const legend = document.getElementById("set-status-legend");
        if (legend) {
          legend.innerHTML =
            '<span class="ms-status-legend-text">' +
            escapeHtml(overallLegend("down")) +
            "</span>" +
            '<button type="button" class="ms-status-copy-btn ms-status-copy-btn--inline" data-status-copy="load-error">' +
            '<span class="ms-status-copy-label">Copy</span></button>';
          const btn = legend.querySelector("[data-status-copy]");
          btn?.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            void copyIssue(
              [
                "Moonrise Services issue",
                "Code: MR-STATUS-LOAD-ERR",
                "Status: Error",
                "Summary: " + errMsg,
                "Note: no secrets — status labels only.",
              ].join("\n"),
              btn
            );
          });
        }
      }
    } finally {
      busy = false;
      toggle?.classList.remove("is-loading");
    }
  }

  function boot() {
    const toggle = document.getElementById("set-status-toggle");
    const panel = document.getElementById("set-status-panel");
    if (!toggle || !panel) return;

    // Prefetch quietly after auth so the row already shows overall state.
    const prefetch = () => void loadStatus();
    if (document.body?.dataset?.msAuthFired === "1") prefetch();
    else document.addEventListener("ms:auth-ready", prefetch, { once: true });

    // Refresh whenever the Services panel opens.
    toggle.addEventListener("click", () => {
      window.setTimeout(() => {
        const open = panel.classList.contains("is-open") && !panel.hidden;
        if (open) void loadStatus();
      }, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
