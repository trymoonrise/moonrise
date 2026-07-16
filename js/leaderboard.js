/**
 * Full donation leaderboard page.
 */
(function () {
  const LB = window.MoonriseDonateLeaderboard;
  if (!LB) return;

  function refs() {
    return {
      listEl: document.getElementById("leaderboard-full-list"),
      countEl: document.getElementById("leaderboard-stat-count"),
      labelEl: document.getElementById("leaderboard-stat-label"),
      totalEl: document.getElementById("leaderboard-stat-total"),
    };
  }

  function setError(msg) {
    const el = document.getElementById("leaderboard-error");
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
  }

  async function boot() {
    try {
      await window.StudioAuth?.requireAuth?.();
    } catch (_) {
      location.href = "login.html?next=leaderboard.html";
      return;
    }

    const ui = refs();
    LB.renderFullPageLoading(ui);
    setError("");

    try {
      const entries = await LB.fetchEntries(100);
      LB.renderFullPage(ui, entries);
    } catch (e) {
      LB.clearLoading(ui.listEl);
      if (ui.listEl) {
        ui.listEl.innerHTML =
          '<li class="ms-ldb-empty">Leaderboard unavailable right now. Try again in a moment.</li>';
      }
      if (ui.countEl) ui.countEl.textContent = "-";
      if (ui.totalEl) ui.totalEl.textContent = "-";
      setError(e.message || "Could not load leaderboard");
    }
  }

  if (document.body.dataset.msAuthFired === "1") boot();
  else document.addEventListener("ms:auth-ready", boot, { once: true });
})();
