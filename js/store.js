/**
 * Store - priced products only. Donations and MVP+ do not unlock these items.
 */
(function () {
  function bindBuys() {
    document.querySelectorAll("button.ms-store-buy[data-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const name = btn.getAttribute("data-product") || "this product";
        window.StudioToast?.info?.("Coming soon - " + name);
      });
    });
  }

  function boot() {
    bindBuys();
  }

  if (document.body.dataset.msAuthFired === "1") boot();
  else document.addEventListener("ms:auth-ready", boot, { once: true });
})();
