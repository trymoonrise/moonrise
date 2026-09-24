/**
 * Shared donation leaderboard rendering + fetch.
 */
(function (global) {
  function workerUrl() {
    if (typeof global.resolveWorkerUrl === "function") return global.resolveWorkerUrl();
    return String(global.SITE_CONFIG?.workerUrl || "").replace(/\/$/, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rankClass(rank) {
    if (rank === 1) return " is-gold";
    if (rank === 2) return " is-silver";
    if (rank === 3) return " is-bronze";
    return "";
  }

  function avatarHtml(entry) {
    if (entry?.avatarUrl) {
      return (
        `<img class="ms-donate-lb-avatar" src="${escapeHtml(entry.avatarUrl)}" alt="" width="32" height="32" loading="lazy" decoding="async">`
      );
    }
    return `<span class="ms-donate-lb-avatar is-fallback" aria-hidden="true">${escapeHtml(entry?.initials || "?")}</span>`;
  }

  function formatTotalCents(cents) {
    const value = Math.max(0, Number(cents) || 0);
    const dollars = value / 100;
    if (value % 100 === 0) return "$" + dollars.toFixed(0);
    return "$" + dollars.toFixed(2);
  }

  function computeStats(entries) {
    const list = Array.isArray(entries) ? entries : [];
    let totalCents = 0;
    for (const entry of list) totalCents += Math.max(0, Number(entry.totalCents) || 0);
    return {
      count: list.length,
      totalLabel: formatTotalCents(totalCents),
    };
  }

  function lbAvatarHtml(entry, className, size) {
    const cls = className || "ms-ldb-row-avatar";
    const px = Number(size) || 40;
    if (entry?.avatarUrl) {
      return (
        `<img class="${cls}" src="${escapeHtml(entry.avatarUrl)}" alt="" width="${px}" height="${px}" loading="lazy" decoding="async">`
      );
    }
    return `<span class="${cls} is-fallback" aria-hidden="true">${escapeHtml(entry?.initials || "?")}</span>`;
  }

  function podiumMedal(rank) {
    return "#" + (Number(rank) || "");
  }

  function podiumSlotClass(rank) {
    if (rank === 1) return " is-first";
    if (rank === 2) return " is-second";
    if (rank === 3) return " is-third";
    return "";
  }

  function renderPodiumSlot(entry) {
    const rank = Number(entry.rank) || 0;
    const name = escapeHtml(entry.name || "Supporter");
    const total = escapeHtml(entry.totalLabel || "");
    const message = String(entry.message || "").trim();
    const messageHtml = message
      ? `<p class="ms-ldb-podium-note">“${escapeHtml(message)}”</p>`
      : `<p class="ms-ldb-podium-note is-muted">Supported Moonrise</p>`;

    return (
      `<article class="ms-ldb-podium-slot${podiumSlotClass(rank)}">` +
      `<span class="ms-ldb-podium-medal" aria-hidden="true">${podiumMedal(rank)}</span>` +
      lbAvatarHtml(entry, "ms-ldb-podium-avatar", rank === 1 ? 48 : 44) +
      `<strong class="ms-ldb-podium-name">${name}</strong>` +
      `<span class="ms-ldb-podium-amount">${total}</span>` +
      messageHtml +
      `</article>`
    );
  }

  function renderPodium(podiumEl, entries) {
    if (!podiumEl) return;
    const top = (Array.isArray(entries) ? entries : []).slice(0, 3);
    if (!top.length) {
      podiumEl.hidden = true;
      podiumEl.innerHTML = "";
      return;
    }
    podiumEl.innerHTML = top.map((entry) => renderPodiumSlot(entry)).join("");
    podiumEl.hidden = false;
  }

  function renderRankRow(entry) {
    const rank = Number(entry.rank) || 0;
    const name = escapeHtml(entry.name || "Supporter");
    const total = escapeHtml(entry.totalLabel || "");
    const message = String(entry.message || "").trim();
    const messageHtml = message ? `<p class="ms-ldb-row-note">“${escapeHtml(message)}”</p>` : "";

    return (
      `<li class="ms-ldb-row${rankClass(rank)}">` +
      `<span class="ms-ldb-row-rank" aria-label="Rank ${rank}">${rank}</span>` +
      lbAvatarHtml(entry, "ms-ldb-row-avatar", 40) +
      `<div class="ms-ldb-row-copy">` +
      `<strong class="ms-ldb-row-name">${name}</strong>` +
      messageHtml +
      `</div>` +
      `<span class="ms-ldb-row-amount">${total}</span>` +
      `</li>`
    );
  }

  function renderRankList(listEl, entries, options) {
    if (!listEl) return;
    const opts = options && typeof options === "object" ? options : {};
    const skipTop = Math.max(0, Number(opts.skipTop) || 0);
    const showPlaceholder = opts.showPlaceholder !== false;
    const rest = (Array.isArray(entries) ? entries : []).slice(skipTop);

    if (!rest.length) {
      if (entries?.length && skipTop > 0) {
        listEl.innerHTML =
          '<li class="ms-ldb-empty">More supporters will appear here as the community grows.</li>';
        return;
      }
      if (!entries?.length && showPlaceholder) {
        listEl.innerHTML =
          `<li class="ms-ldb-row ms-ldb-row--placeholder">` +
          `<span class="ms-ldb-row-rank" aria-hidden="true">—</span>` +
          lbAvatarHtml({ avatarUrl: "doc/pfp.png", initials: "?" }, "ms-ldb-row-avatar", 40) +
          `<div class="ms-ldb-row-copy">` +
          `<strong class="ms-ldb-row-name">Your name could be here</strong>` +
          `<p class="ms-ldb-row-note is-muted">Donate any amount and leave a note on the wall.</p>` +
          `</div>` +
          `<span class="ms-ldb-row-amount">—</span>` +
          `</li>`;
        return;
      }
      listEl.innerHTML = '<li class="ms-ldb-empty">Everyone in the top 3 is listed above.</li>';
      return;
    }

    listEl.innerHTML = rest.map((entry) => renderRankRow(entry)).join("");
  }

  function renderFullPageLoading(refs) {
    if (refs?.podiumEl) {
      refs.podiumEl.hidden = false;
      refs.podiumEl.innerHTML =
        `<article class="ms-ldb-podium-slot is-skeleton is-first"></article>` +
        `<article class="ms-ldb-podium-slot is-skeleton is-second"></article>` +
        `<article class="ms-ldb-podium-slot is-skeleton is-third"></article>`;
    }
    if (refs?.podiumEmptyEl) refs.podiumEmptyEl.hidden = true;
    if (refs?.listEl) {
      refs.listEl.innerHTML =
        `<li class="ms-ldb-row is-skeleton" aria-hidden="true"></li>`.repeat(4);
      refs.listEl.setAttribute("aria-busy", "true");
    }
    if (refs?.countEl) refs.countEl.textContent = "—";
    if (refs?.totalEl) refs.totalEl.textContent = "—";
  }

  function renderFullPage(refs, entries, options) {
    const opts = options && typeof options === "object" ? options : {};
    const list = Array.isArray(entries) ? entries : [];
    const stats = computeStats(list);

    if (refs?.countEl) refs.countEl.textContent = String(stats.count);
    if (refs?.totalEl) refs.totalEl.textContent = stats.totalLabel;

    if (!list.length) {
      if (refs?.podiumEl) {
        refs.podiumEl.hidden = true;
        refs.podiumEl.innerHTML = "";
      }
      if (refs?.podiumEmptyEl) refs.podiumEmptyEl.hidden = false;
      renderRankList(refs?.listEl, [], { showPlaceholder: opts.showPlaceholder !== false });
      clearLoading(refs?.listEl);
      return;
    }

    if (refs?.podiumEmptyEl) refs.podiumEmptyEl.hidden = true;
    renderPodium(refs?.podiumEl, list);
    clearLoading(refs?.listEl);
    renderRankList(refs?.listEl, list, {
      skipTop: Math.min(3, list.length),
      showPlaceholder: false,
    });
  }

  function renderEntry(entry) {
    const rank = Number(entry.rank) || 0;
    const name = escapeHtml(entry.name || "Supporter");
    const total = escapeHtml(entry.totalLabel || "");
    const message = String(entry.message || "").trim();
    const messageHtml = message ? `<p class="ms-donate-lb-message">${escapeHtml(message)}</p>` : "";
    const hasMessage = message ? " has-message" : "";

    return (
      `<li class="ms-donate-lb-item${rankClass(rank)}${hasMessage}">` +
      `<span class="ms-donate-lb-rank" aria-label="Rank ${rank}">#${rank}</span>` +
      `<div class="ms-donate-lb-main">` +
      avatarHtml(entry) +
      `<div class="ms-donate-lb-copy">` +
      `<strong class="ms-donate-lb-name">${name}</strong>` +
      messageHtml +
      `</div></div>` +
      `<span class="ms-donate-lb-amount">${total}</span>` +
      `</li>`
    );
  }

  function renderPlaceholder() {
    return (
      `<li class="ms-donate-lb-item ms-donate-lb-item--placeholder has-message">` +
      `<span class="ms-donate-lb-rank" aria-hidden="true">#–</span>` +
      `<div class="ms-donate-lb-main">` +
      `<img class="ms-donate-lb-avatar ms-donate-lb-avatar--placeholder" src="doc/pfp.png" alt="" width="32" height="32" loading="lazy" decoding="async">` +
      `<div class="ms-donate-lb-copy">` +
      `<strong class="ms-donate-lb-name">Your profile here</strong>` +
      `<p class="ms-donate-lb-message is-muted">Be the first supporter — pick an amount and leave a wall note.</p>` +
      `</div></div>` +
      `<span class="ms-donate-lb-amount">—</span>` +
      `</li>`
    );
  }

  function renderSkeleton(count) {
    const total = Math.max(1, Math.min(Number(count) || 5, 10));
    let html = "";
    for (let i = 0; i < total; i += 1) {
      html +=
        `<li class="ms-donate-lb-item is-skeleton" aria-hidden="true">` +
        `<span class="ms-donate-lb-rank"><span class="ms-donate-lb-skeleton-block is-rank"></span></span>` +
        `<div class="ms-donate-lb-main">` +
        `<span class="ms-donate-lb-skeleton-block is-avatar"></span>` +
        `<div class="ms-donate-lb-copy">` +
        `<span class="ms-donate-lb-skeleton-block is-name"></span>` +
        `</div></div>` +
        `<span class="ms-donate-lb-skeleton-block is-amount"></span>` +
        `</li>`;
    }
    return html;
  }

  function renderFacepileAvatar(entry, index) {
    const name = escapeHtml(entry?.name || "Supporter");
    const rank = Number(entry?.rank) || index + 1;
    const z = Math.max(1, 20 - index);
    if (entry?.avatarUrl) {
      return (
        `<span class="ms-donate-facepile-item" role="listitem" style="z-index:${z}" title="${name}">` +
        `<img class="ms-donate-facepile-avatar" src="${escapeHtml(entry.avatarUrl)}" alt="${name}" width="44" height="44" loading="lazy" decoding="async">` +
        `<span class="ms-sr-only">#${rank} ${name}</span>` +
        `</span>`
      );
    }
    return (
      `<span class="ms-donate-facepile-item" role="listitem" style="z-index:${z}" title="${name}">` +
      `<span class="ms-donate-facepile-avatar is-fallback" aria-hidden="true">${escapeHtml(entry?.initials || "?")}</span>` +
      `<span class="ms-sr-only">#${rank} ${name}</span>` +
      `</span>`
    );
  }

  function renderFacepile(listEl, entries, options) {
    if (!listEl) return;
    const opts = options && typeof options === "object" ? options : {};
    const showPlaceholder = opts.showPlaceholder !== false;
    const cap = Math.max(1, Math.min(Number(opts.limit) || 10, 20));
    const list = (Array.isArray(entries) ? entries : []).slice(0, cap);

    listEl.classList.add("ms-donate-facepile");
    listEl.removeAttribute("aria-busy");

    if (!list.length) {
      listEl.innerHTML = showPlaceholder
        ? `<span class="ms-donate-facepile-item is-placeholder" role="listitem" style="z-index:1" title="Be the first supporter">` +
          `<img class="ms-donate-facepile-avatar" src="doc/pfp.png" alt="" width="44" height="44" loading="lazy" decoding="async">` +
          `<span class="ms-sr-only">Be the first supporter</span>` +
          `</span>`
        : `<span class="ms-donate-facepile-empty">No supporters yet</span>`;
      return;
    }

    listEl.innerHTML = list.map((entry, index) => renderFacepileAvatar(entry, index)).join("");
  }

  function renderFacepileLoading(listEl, count) {
    if (!listEl) return;
    const total = Math.max(3, Math.min(Number(count) || 6, 10));
    let html = "";
    for (let i = 0; i < total; i += 1) {
      const z = Math.max(1, 20 - i);
      html +=
        `<span class="ms-donate-facepile-item is-skeleton" role="presentation" style="z-index:${z}" aria-hidden="true">` +
        `<span class="ms-donate-facepile-avatar is-skeleton"></span>` +
        `</span>`;
    }
    listEl.classList.add("ms-donate-facepile");
    listEl.innerHTML = html;
    listEl.setAttribute("aria-busy", "true");
  }

  function renderList(listEl, entries, options) {
    if (!listEl) return;
    if (listEl.classList.contains("ms-donate-facepile") || listEl.id === "donate-leaderboard-list") {
      renderFacepile(listEl, entries, options);
      return;
    }
    const opts = options && typeof options === "object" ? options : {};
    const showPlaceholder = opts.showPlaceholder !== false;

    if (!Array.isArray(entries) || !entries.length) {
      listEl.innerHTML = showPlaceholder
        ? renderPlaceholder()
        : '<li class="ms-donate-lb-empty">No supporters yet.</li>';
      return;
    }

    listEl.innerHTML = entries.map((entry) => renderEntry(entry)).join("");
  }

  function renderLoading(listEl, count) {
    if (!listEl) return;
    if (listEl.classList.contains("ms-donate-facepile") || listEl.id === "donate-leaderboard-list") {
      renderFacepileLoading(listEl, count);
      return;
    }
    listEl.innerHTML = renderSkeleton(count);
    listEl.setAttribute("aria-busy", "true");
  }

  function clearLoading(listEl) {
    listEl?.removeAttribute("aria-busy");
  }

  async function fetchEntries(limit) {
    const base = workerUrl();
    if (!base) throw new Error("Worker URL is not configured.");
    const cap = Math.max(1, Number(limit) || 10);
    const res = await fetch(`${base}/donate/leaderboard?limit=${encodeURIComponent(String(cap))}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(data.entries)) {
      throw new Error(data.error || "Could not load leaderboard");
    }
    return data.entries;
  }

  global.MoonriseDonateLeaderboard = {
    fetchEntries,
    renderList,
    renderLoading,
    clearLoading,
    renderPlaceholder,
    renderFacepile,
    renderFacepileLoading,
    computeStats,
    renderFullPage,
    renderFullPageLoading,
  };
})(window);
