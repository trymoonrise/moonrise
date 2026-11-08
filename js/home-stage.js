/**
 * Clickable product walkthrough on the public home page.
 */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".ms-seg [role='tab']"));
  var panels = {
    find: document.getElementById("stage-find"),
    build: document.getElementById("stage-build"),
    earn: document.getElementById("stage-earn")
  };
  if (!tabs.length || !panels.find) return;

  var shops = {
    "Northside Cafe": { host: "northsidecafe.com", link: "northside.moonrise.site" },
    "Harbor Dental": { host: "harbordental.com", link: "harbor.moonrise.site" },
    "Elm Street Gym": { host: "elmstreetgym.com", link: "elm.moonrise.site" }
  };
  var shop = "Northside Cafe";
  var sent = false;

  function show(name) {
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("aria-controls") === "stage-" + name;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    Object.keys(panels).forEach(function (key) {
      if (panels[key]) panels[key].hidden = key !== name;
    });
  }

  function paintShop() {
    var info = shops[shop];
    var name = document.getElementById("preview-name");
    var host = document.getElementById("preview-host");
    var link = document.getElementById("earn-link");
    var note = document.getElementById("pick-note");
    if (name) name.textContent = shop;
    if (host && info) host.textContent = info.host;
    if (link && info) link.textContent = info.link;
    if (note) note.textContent = shop + " is ready to build.";
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var id = tab.getAttribute("aria-controls") || "";
      show(id.replace("stage-", ""));
    });
  });

  document.querySelectorAll(".ms-next").forEach(function (button) {
    button.addEventListener("click", function () {
      show(button.getAttribute("data-next"));
    });
  });

  document.querySelectorAll(".ms-picks button").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".ms-picks button").forEach(function (other) {
        other.setAttribute("aria-pressed", "false");
      });
      button.setAttribute("aria-pressed", "true");
      shop = button.childNodes[0].textContent.trim();
      sent = false;
      var send = document.getElementById("ms-send");
      var payout = document.getElementById("ms-payout");
      var earnNote = document.getElementById("earn-note");
      if (send) {
        send.textContent = "Send";
        send.setAttribute("aria-pressed", "false");
      }
      if (payout) payout.hidden = true;
      if (earnNote) earnNote.textContent = "Nothing is sent yet.";
      paintShop();
    });
  });

  document.querySelectorAll(".ms-toggles button").forEach(function (button) {
    button.addEventListener("click", function () {
      var on = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(on));
      var block = document.querySelector('.ms-blocks [data-block="' + button.getAttribute("data-toggle") + '"]');
      if (block) block.classList.toggle("is-off", !on);
    });
  });

  var send = document.getElementById("ms-send");
  if (send) {
    send.addEventListener("click", function () {
      if (sent) return;
      sent = true;
      send.textContent = "Sent";
      send.setAttribute("aria-pressed", "true");
      var payout = document.getElementById("ms-payout");
      var earnNote = document.getElementById("earn-note");
      if (payout) payout.hidden = false;
      if (earnNote) earnNote.textContent = shop + " can unlock from that link. You keep 90%.";
    });
  }
})();
