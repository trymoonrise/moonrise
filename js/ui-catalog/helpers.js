(function () {
  "use strict";

  const PATHS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16.5 16.5L21 21"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7.2"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    user: '<circle cx="12" cy="8" r="3.2"/><path d="M5.2 19.2c1.3-3 3.6-4.4 6.8-4.4s5.5 1.4 6.8 4.4"/>',
    file: '<path d="M7 3.5h7l5 5V20.5H7z"/><path d="M14 3.5V9h5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3.5v3M16 3.5v3M4 10h16"/>',
    pin: '<path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="1.5"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="9" r="1.2"/><path d="M7.5 16l3-3 2.2 2.2L16.5 11 20 15"/>',
    alert: '<path d="M12 4l8.5 15h-17z"/><path d="M12 10v4M12 16.6v.4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.2 11c.5.4.8 1 .8 1.6V17h5v-1.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z"/>',
    home: '<path d="M4 11.2 12 4.5l8 6.7V20H4z"/><path d="M10 20v-6h4v6"/>',
    box: '<path d="M12 3.5 20 8v8l-8 4.5L4 16V8z"/><path d="M12 12.2 20 8M12 12.2 4 8M12 12.2V20.5"/>',
    gems: '<path d="M8 6.5 10 8.5 8 10.5 6 8.5zM16 6.5 18 8.5 16 10.5 14 8.5zM8 13.5 10 15.5 8 17.5 6 15.5zM16 13.5 18 15.5 16 17.5 14 15.5z"/>',
    pulse: '<path d="M3 12h4l2.2-5 3.2 10 2.2-5H21"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    spark: '<path d="M12 3.2 13.6 9 19.2 10.5 13.6 12 12 17.8 10.4 12 4.8 10.5 10.4 9z"/>',
    toggle: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><circle cx="16.2" cy="12" r="3"/>',
    dash: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>',
    pencil: '<path d="M13.2 5.2 18.8 10.8 8 21.5H2.8V16z"/><path d="m11.8 6.6 4.6 4.6"/>',
    export: '<path d="M9 8H5.5A1.5 1.5 0 0 0 4 9.5v9A1.5 1.5 0 0 0 5.5 20h9a1.5 1.5 0 0 0 1.5-1.5V15"/><path d="M12 12 20 4M14.5 4H20v5.5"/>',
    list: '<path d="M5 7h14M5 12h14M5 17h10"/>',
    crop: '<path d="M8 4H5.2A1.2 1.2 0 0 0 4 5.2V8M16 4h2.8A1.2 1.2 0 0 1 20 5.2V8M8 20H5.2A1.2 1.2 0 0 1 4 18.8V16M16 20h2.8a1.2 1.2 0 0 0 1.2-1.2V16"/>',
    nodes: '<circle cx="6.2" cy="12" r="2.1"/><circle cx="16.2" cy="7" r="2.1"/><circle cx="16.2" cy="17" r="2.1"/><path d="m8.1 11.1 6.2-3M8.1 12.9l6.2 3"/>',
    funnel: '<path d="M4 5h16l-6.2 7.2V19l-3.6 1.6v-8.4z"/>',
    folder: '<path d="M3.5 7.2h5.6l1.8 2H20.5V19a1.4 1.4 0 0 1-1.4 1.4H4.9A1.4 1.4 0 0 1 3.5 19z"/>',
    music: '<path d="M9 17.6V6.2L18 4.2v9.2"/><circle cx="7.2" cy="17.6" r="2.1"/><circle cx="16.2" cy="15.4" r="2.1"/>',
    gear: '<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    sun: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.4v2M12 18.6v2M3.4 12h2M18.6 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8 5.8 18.2"/>',
    moon: '<path d="M15.8 14.8A6.4 6.4 0 0 1 9.4 5.6 6.3 6.3 0 1 0 15.8 14.8z"/>',
    bell: '<path d="M6 16.4h12l-1.2-1.8V10a4.8 4.8 0 0 0-9.6 0v4.6z"/><path d="M10 16.6a2 2 0 0 0 4 0"/>',
    trash: '<path d="M5 7.2h14M9.2 7.1V5h5.6v2.1M7.2 7.2l.8 12.2h8l.8-12.2"/>'
  };

  function ico(name, cls) {
    return '<svg class="lx-ico' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || PATHS.plus) + "</svg>";
  }

  function btn(label, state) {
    const cls = ["lx-btn"];
    if (state === "ghost") cls.push("lx-btn-ghost");
    if (state === "danger") cls.push("lx-btn-danger");
    if (state === "focus") cls.push("is-focus");
    if (state === "hover") cls.push("is-hover");
    if (state === "loading") cls.push("is-loading");
    if (state === "disabled") cls.push("is-disabled");
    if (state === "compact") cls.push("is-compact");
    const dis = state === "disabled" ? " disabled" : "";
    const inner = state === "loading" ? '<i class="lx-spin"></i>' : label;
    return '<button type="button" class="' + cls.join(" ") + '"' + dis + ">" + inner + "</button>";
  }

  function field(label, state, value, hint) {
    const cls = ["lx-field"];
    if (state === "focus") cls.push("is-focus");
    if (state === "hover") cls.push("is-hover");
    if (state === "danger" || state === "error") cls.push("is-danger");
    if (state === "ghost") cls.push("is-ghost");
    if (state === "disabled") cls.push("is-disabled");
    if (state === "compact") cls.push("is-compact");
    const dis = state === "disabled" ? " disabled" : "";
    const val = value ? ' value="' + value + '"' : "";
    const spin = state === "loading" ? '<i class="lx-spin is-on" style="position:absolute;right:10px"></i>' : "";
    const note = hint ? '<p class="lx-hint' + (state === "error" || state === "danger" ? " is-danger" : "") + '">' + hint + "</p>" : "";
    return '<label class="' + cls.join(" ") + '"><span>' + label + '</span><span class="lx-input-wrap"><input' + dis + val + ' placeholder="Studio name" aria-label="' + label + '">' + spin + "</span>" + note + "</label>";
  }

  function area(label, state) {
    const cls = ["lx-field"];
    if (state === "focus") cls.push("is-focus");
    if (state === "error" || state === "danger") cls.push("is-danger");
    if (state === "ghost") cls.push("is-ghost");
    if (state === "hover") cls.push("is-hover");
    if (state === "disabled") cls.push("is-disabled");
    if (state === "compact") cls.push("is-compact");
    const dis = state === "disabled" ? " disabled" : "";
    const val = state === "filled" || state === "error" || state === "danger" ? "Open Friday at 7." : "";
    const spin = state === "loading" ? '<i class="lx-spin is-on"></i>' : "";
    return '<label class="' + cls.join(" ") + '"><span>' + label + '</span><span class="lx-input-wrap"><textarea' + dis + ' aria-label="' + label + '">' + val + "</textarea>" + spin + "</span></label>";
  }

  function visual(kind) {
    switch (kind) {
      case "faq":
        return '<div class="lx-faq is-cards is-mini" data-lx-faq="one"><div class="lx-faq-item is-open"><button type="button" class="lx-faq-q" aria-expanded="true">How do I publish?<span class="lx-faq-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button><div class="lx-faq-panel"><div>Open the site and choose Publish.</div></div></div><div class="lx-faq-item"><button type="button" class="lx-faq-q" aria-expanded="false">Can I edit later?<span class="lx-faq-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button><div class="lx-faq-panel"><div>Yes. Publish again when the hours change.</div></div></div></div>';
      case "features":
        return '<div class="lx-feat-mini"><article>' + ico("pulse", "sm") + "<strong>Publish</strong><em>One live link</em></article><article>" + ico("pin", "sm") + "<strong>Finder</strong><em>Map leads</em></article><article>" + ico("spark", "sm") + "<strong>Studio</strong><em>Edit in place</em></article></div>";
      case "footer":
        return '<footer class="lx-site-foot is-mini"><strong>moonrise.</strong><nav><a href="docs">Docs</a><a href="docs#privacy">Privacy</a><a href="docs#terms">Terms</a></nav></footer>';
      case "gallery":
        return '<div class="lx-gal is-mini">' +
          '<figure><img src="assets/library/hero-coast.jpg" alt=""></figure>' +
          '<figure><img src="assets/library/hero-coffee.jpg" alt=""></figure>' +
          '<figure><img src="assets/library/cta-counter.jpg" alt=""></figure>' +
          '<figure><img src="assets/library/hero-wind.jpg" alt=""></figure>' +
          "</div>";
      case "price":
        return '<div class="lx-price"><span>$48</span><em>per month</em>' + btn("Choose") + "</div>";
      case "stats":
        return '<div class="lx-figs"><div><strong>128</strong><span>visits</span></div><div><strong>14</strong><span>leads</span></div></div>';
      case "team":
        return '<div class="lx-people">' +
          '<span class="lx-avatar"><img src="assets/library/client-nora.jpg" alt=""></span>' +
          '<span class="lx-avatar"><img src="assets/library/client-miles.jpg" alt=""></span>' +
          '<span class="lx-avatar"><img src="assets/library/client-ada.jpg" alt=""></span>' +
          "</div>";
      case "quote":
        return '<figure class="lx-quote-card is-mini"><span class="lx-avatar"><img src="assets/library/client-nora.jpg" alt=""></span><blockquote>The new site lists our hours and the phone rings more.</blockquote><cite>Nora · Harbor Coffee</cite></figure>';
      default:
        return '<p class="lx-prose">Harbor Coffee roasts on Pike Street and opens at 7. The site lists the address, the hours, and a way to call.</p>';
    }
  }

  function copyBlock(c, hideKicker) {
    return '<div class="lx-copy">' +
      (hideKicker ? "" : '<p class="lx-kicker">' + c.kicker + "</p>") +
      '<h4 class="lx-h">' + c.title + "</h4>" +
      '<p class="lx-p">' + c.body + "</p>" +
      (c.action ? btn(c.action) : "") +
      "</div>";
  }

  function layoutHtml(key, c) {
    const vis = visual(c.visual);
    const text = copyBlock(c, key === "rail");
    if (key === "split") return '<div class="lx-split">' + text + vis + "</div>";
    if (key === "reverse") return '<div class="lx-split is-reverse">' + vis + text + "</div>";
    if (key === "stack") return '<div class="lx-stack">' + text + vis + "</div>";
    if (key === "band") return '<div class="lx-band">' + text + vis + "</div>";
    if (key === "narrow") return '<div class="lx-narrow">' + text + "</div>";
    if (key === "rail") return '<div class="lx-rail"><p class="lx-kicker">' + c.kicker + '</p><div class="lx-rail-main">' + text + vis + "</div></div>";
    if (key === "bento") return '<div class="lx-bento"><div class="lx-bento-main">' + text + '</div><div class="lx-bento-side">' + vis + '</div><div class="lx-bento-foot"><span>' + (c.note || "Example") + "</span></div></div>";
    if (key === "strip") return '<div class="lx-strip"><strong>' + c.title + "</strong><span>" + c.body + "</span>" + btn(c.action || "Open") + "</div>";
    if (key === "inverse") return text;
    return '<div class="lx-reveal"><div class="lx-rise">' + text + vis + "</div></div>";
  }

  const LAYOUTS = [
    ["split", "Text left", true, ""],
    ["reverse", "Text right", true, ""],
    ["stack", "Stack", false, ""],
    ["bento", "Bento", true, ""],
    ["rail", "Meta rail", true, ""],
    ["inverse", "Inverse", true, "lx-on-dark"],
    ["reveal", "Reveal", true, ""],
    ["band", "Band", true, ""],
    ["narrow", "Narrow", false, ""],
    ["strip", "Strip", true, ""]
  ];

  function layoutCards(id, copy, count) {
    return LAYOUTS.slice(0, count).map(function (row) {
      return {
        id: id + "-" + row[0],
        title: row[1],
        wide: row[2],
        stage: row[3],
        play: row[0] === "reveal" ? "lx-live" : "",
        html: layoutHtml(row[0], copy)
      };
    });
  }

  function card(id, title, html, extra) {
    const o = extra || {};
    return {
      id: id,
      title: title,
      html: html,
      wide: !!o.wide,
      play: o.play || "",
      stage: o.stage || ""
    };
  }

  const STATE_ORDER = ["focus", "error", "loading", "disabled", "ghost", "danger", "filled", "hover", "compact", "rest"];
  const STATE_TITLE = {
    focus: "Focus",
    error: "Hint",
    loading: "Loading",
    disabled: "Disabled",
    ghost: "Ghost",
    danger: "Danger",
    filled: "Filled",
    hover: "Hover",
    compact: "Compact",
    rest: "Rest"
  };

  function states(prefix, render, count) {
    return STATE_ORDER.slice(0, count).map(function (key) {
      return card(prefix + "-" + key, STATE_TITLE[key], render(key), {
        play: key === "loading" ? "lx-live" : ""
      });
    });
  }

  function globe(o) {
    o = o || {};
    return '<svg class="lx-globe' + (o.spin ? " is-spin" : "") + '" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="46" fill="none" stroke="currentColor"/>' +
      '<ellipse cx="60" cy="60" rx="46" ry="16" fill="none" stroke="currentColor"/>' +
      '<ellipse cx="60" cy="60" rx="20" ry="46" fill="none" stroke="currentColor"/>' +
      '<path d="M14 60h92" fill="none" stroke="currentColor"/>' +
      (o.dots ? '<g fill="currentColor"><circle cx="40" cy="48" r="1.7"/><circle cx="78" cy="70" r="1.7"/><circle cx="62" cy="36" r="1.7"/></g>' : "") +
      (o.pin ? '<circle cx="78" cy="42" r="3.2" fill="#1f6fed"/>' : "") +
      (o.arc ? '<path d="M38 72q22-36 50-8" fill="none" stroke="#1f6fed" stroke-width="1.6"/>' : "") +
      "</svg>";
  }

  function marquee(items, cls) {
    const row = items.map(function (item) { return "<span>" + item + "</span>"; }).join("");
    return '<div class="lx-marquee ' + (cls || "") + '"><div class="lx-marquee-track">' + row + row + "</div></div>";
  }

  function app(items, active, main, top) {
    const side = items.map(function (name) {
      return '<button type="button" class="' + (name === active ? "is-on" : "") + '" data-lx-opt>' + name + "</button>";
    }).join("");
    if (top) return '<div class="lx-app is-top"><div class="lx-top">' + side + '</div><div class="lx-main">' + main + "</div></div>";
    return '<div class="lx-app"><div class="lx-side">' + side + '</div><div class="lx-main">' + main + "</div></div>";
  }

  function panel(html, cls) {
    return '<div class="lx-panel' + (cls ? " " + cls : "") + '">' + html + "</div>";
  }

  function month(sel, today, disabled) {
    const heads = "S M T W T F S".split(" ").map(function (d) { return "<span>" + d + "</span>"; }).join("");
    let cells = "";
    for (let day = 1; day <= 30; day += 1) {
      const on = sel === day ? " is-on" : "";
      const tod = today === day ? " is-today" : "";
      const off = disabled && disabled.indexOf(day) !== -1;
      cells += '<button type="button" class="' + on + tod + '"' + (off ? " disabled" : "") + ">" + day + "</button>";
    }
    return '<div class="lx-cal"><p class="lx-kicker">November 2026</p><div class="lx-cal-head">' + heads + '</div><div class="lx-cal-grid">' + cells + "</div></div>";
  }

  window.LX = {
    specs: {},
    spec: function (id, adopt, cards) {
      this.specs[id] = { adopt: adopt || [], cards: cards || [] };
    },
    ico: ico,
    btn: btn,
    field: field,
    area: area,
    layoutCards: layoutCards,
    card: card,
    states: states,
    globe: globe,
    marquee: marquee,
    app: app,
    panel: panel,
    month: month
  };
})();
