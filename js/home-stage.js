(function () {
  var root = document.body;
  if (!root || root.getAttribute("data-page") !== "home") return;

  root.querySelectorAll("[data-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", on ? "true" : "false");
      var piece = root.querySelector('[data-piece="' + btn.getAttribute("data-toggle") + '"]');
      if (piece) piece.classList.toggle("is-off", !on);
    });
  });

  var send = root.querySelector("[data-send]");
  if (send) {
    send.addEventListener("click", function () {
      send.textContent = "Sent";
      send.disabled = true;
      var status = root.querySelector("[data-pay-status]");
      if (status) status.textContent = "Link sent";
    });
  }

  var acc = root.querySelector("[data-accordion]");
  if (acc) {
    acc.addEventListener("click", function (event) {
      var trigger = event.target.closest(".dt-acc-trigger");
      if (!trigger || !acc.contains(trigger)) return;
      var item = trigger.closest(".dt-acc-item");
      var wasOpen = item.classList.contains("is-open");
      acc.querySelectorAll(".dt-acc-item").forEach(function (el) {
        el.classList.remove("is-open");
        var button = el.querySelector(".dt-acc-trigger");
        if (button) button.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  }

  var rises = root.querySelectorAll(".ms-rise");
  function reveal() {
    var edge = window.innerHeight + 24;
    rises.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      if (el.getBoundingClientRect().top < edge) el.classList.add("is-in");
    });
  }
  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
})();
