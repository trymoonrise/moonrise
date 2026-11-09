(function () {
  "use strict";
  const LX = window.LX;
  const card = LX.card.bind(LX);
  const ico = LX.ico;

  const COPIES = {
    announcements: { kicker: "Example", title: "Studio hours change Friday", body: "New sites publish at 9:00. Links you already sent stay the same.", action: "Read note", visual: "announce", note: "Posted today" },
    cta: { kicker: "Example", title: "Publish the Harbor site", body: "One live link, with the hours and the phone on the first screen.", action: "Publish", visual: "cta", note: "Takes a moment" },
    clients: { kicker: "Example marks", title: "Studios on Moonrise", body: "Placeholder names for the pattern. Not a client list.", action: "See layout", visual: "clients", note: "Example" },
    comparisons: { kicker: "Example", title: "Hours, before and after", body: "The same shop, with the week written out.", action: "Compare", visual: "compare", note: "Friday" },
    faqs: { kicker: "Example", title: "Questions from the studio", body: "Short answers under the thing they ask about.", action: "Open", visual: "faq", note: "2 open" },
    features: { kicker: "Example", title: "What the site holds", body: "Publish, leads, and the studio editor. Nothing extra.", action: "Look", visual: "features", note: "Three" },
    footers: { kicker: "Example", title: "Close the page", body: "Name, guide, and the legal links in one quiet row.", action: "Privacy", visual: "footer", note: "moonrise." },
    galleries: { kicker: "Example", title: "Work from the shop", body: "Four frames, one larger. Real photos would sit here.", action: "Open", visual: "gallery", note: "4 frames" },
    heroes: { kicker: "Harbor Coffee", title: "Coffee on Pike, open at 7", body: "Address, hours, and a way to call. The photo is the shop, not a blob.", action: "Call", visual: "hero", note: "First screen" },
    pricing: { kicker: "Example", title: "One plan for the site", body: "A single price, a short list, and one button.", action: "Choose", visual: "price", note: "$48" },
    stats: { kicker: "Example", title: "This week on the site", body: "Visits and leads, with the comparison written out.", action: "View", visual: "stats", note: "Example figures" },
    team: { kicker: "Example", title: "People at Harbor", body: "Names and roles. Portraits would replace the initials.", action: "Directory", visual: "team", note: "3 people" },
    testimonials: { kicker: "Example", title: "A note from the owner", body: "One quote, one name, one shop. Marked as an example.", action: "Read", visual: "quote", note: "Harbor" },
    text: { kicker: "Example", title: "About the shop", body: "A short paragraph in the shop’s own words.", action: "Continue", visual: "text", note: "Reading" }
  };

  function addLayouts(id, adopt) {
    const n = 10 - (adopt ? adopt.length : 0);
    LX.spec(id, adopt, LX.layoutCards(id, COPIES[id], n));
  }

  addLayouts("announcements");
  addLayouts("cta");
  addLayouts("clients");
  addLayouts("comparisons");
  addLayouts("faqs");
  addLayouts("features");
  addLayouts("footers");
  addLayouts("galleries");
  addLayouts("heroes");
  addLayouts("pricing");
  addLayouts("stats", ["surfaces-metrics"]);
  addLayouts("team");
  addLayouts("testimonials");
  addLayouts("text", ["surfaces-header", "type-display", "type-meta"]);

  function ascii(art) {
    return '<pre class="lx-ascii">' + art + "</pre>";
  }

  LX.spec("ascii", [], [
    card("ascii-word", "Wordmark", ascii(" __  __ \n|  \\/  |  moonrise\n| |\\/| |\n|_|  |_|")),
    card("ascii-moon", "Moon", ascii("   _\n .' '.\n(  ·  )\n '._.'")),
    card("ascii-rule", "Divider", ascii("· · · · · · · · · ·")),
    card("ascii-loader", "Loader frames", ascii("◐  loading\n◓  loading\n◑  loading"), { play: "lx-live" }),
    card("ascii-face", "Portrait", ascii("  ____\n /    \\\n|  o o |\n \\ -- /")),
    card("ascii-frame", "Frame", ascii("+----------+\n|  Harbor  |\n+----------+")),
    card("ascii-bars", "Bars", ascii("Mon ████\nTue ██████\nWed ███")),
    card("ascii-clock", "Clock", ascii("  12\n9  ·  3\n  6")),
    card("ascii-badge", "Badge", ascii("[ LIVE ]")),
    card("ascii-run", "Marquee", LX.marquee(["NORTHLINE", "HARBOR", "CEDAR", "FIELD"], ""), { play: "lx-live", stage: "lx-clip" })
  ]);

  function bg(name, cls) {
    return card("backgrounds-" + name.toLowerCase().replace(/\s/g, "-"), name, '<div class="lx-bg ' + cls + '"></div>');
  }
  LX.spec("backgrounds", [], [
    bg("Flat", "flat"), bg("Grid", "grid"), bg("Dots", "dots"), bg("Grain", "grain lx-shade-grain"),
    bg("Diagonals", "diag"), bg("Vignette", "vignette"), bg("Inverse", "inverse"),
    bg("Split", "split"), bg("Rings", "ring"), bg("Paper", "paper")
  ]);

  LX.spec("borders", [], [
    card("borders-hair", "Hairline", '<div class="lx-edge hair"></div>'),
    card("borders-dash", "Dashed", '<div class="lx-edge dash"></div>'),
    card("borders-double", "Double", '<div class="lx-edge double"></div>'),
    card("borders-ticks", "Corner ticks", '<div class="lx-edge ticks"></div>'),
    card("borders-draw", "Draw on", '<div class="lx-edge draw"></div>', { play: "lx-live" }),
    card("borders-focus", "Focus", '<div class="lx-edge focus"></div>'),
    card("borders-inset", "Inset", '<div class="lx-edge inset"></div>'),
    card("borders-rule", "Section rule", '<div class="lx-edge rule"></div>'),
    card("borders-ticket", "Ticket", '<div class="lx-edge ticket"></div>'),
    card("borders-fade", "Grey to ink", '<div class="lx-edge fade"></div>')
  ]);

  function dock(title, html, extra) {
    return card("docks-" + title.toLowerCase().replace(/\s/g, "-"), title, html, extra);
  }
  LX.spec("docks", ["nav-dock"], [
    dock("Icons", '<div class="lx-dock">' + ["search", "file", "image", "user"].map(function (n) { return "<button type=\"button\">" + ico(n, "sm") + "</button>"; }).join("") + "</div>"),
    dock("Labeled", '<div class="lx-dock">' + ["Sites", "Leads", "Guide"].map(function (n, i) { return '<button type="button" class="' + (i === 0 ? "is-on" : "") + '" data-lx-opt>' + n + "</button>"; }).join("") + "</div>"),
    dock("Vertical", '<div class="lx-dock vert"><button type="button" class="is-on">' + ico("search", "sm") + '</button><button type="button">' + ico("file", "sm") + "</button><button type=\"button\">" + ico("user", "sm") + "</button></div>"),
    dock("Badge", '<div class="lx-dock"><button type="button" class="is-on">' + ico("file", "sm") + '</button><button type="button">' + ico("alert", "sm") + '</button><span class="lx-badge go">3</span></div>'),
    dock("Inverse", '<div class="lx-dock" style="background:#161616;border-color:#2a2a2a">' + ["search", "calendar", "user"].map(function (n) { return '<button type="button" style="background:#2a2a2a;color:#fff">' + ico(n, "sm") + "</button>"; }).join("") + "</div>", { stage: "lx-on-dark" }),
    dock("Lift", '<div class="lx-dock"><button type="button">' + ico("image", "sm") + '</button><button type="button" class="is-on">' + ico("plus", "sm") + "</button><button type=\"button\">" + ico("pin", "sm") + "</button></div>"),
    dock("Split", '<div class="lx-dock"><button type="button">' + ico("chevron", "sm") + '</button><i style="width:1px;background:#e4e4e7"></i><button type="button" class="is-on">' + ico("check", "sm") + "</button></div>"),
    dock("Compact", '<div class="lx-dock" style="padding:4px;border-radius:10px"><button type="button" style="width:26px;height:26px">' + ico("search", "sm") + "</button><button type=\"button\" style=\"width:26px;height:26px\">" + ico("plus", "sm") + "</button></div>"),
    dock("With caption", '<div style="display:grid;justify-items:center;gap:6px"><div class="lx-dock"><button type="button" class="is-on">' + ico("file", "sm") + "</button></div><p class=\"lx-meta\">Sites</p></div>")
  ]);

  const GRADS = [["White to stage", "a"], ["Stage to ink", "b"], ["Ink from top", "c"], ["Ink from bottom", "d"], ["Radial ink", "e"], ["Diagonal grey", "f"], ["Soft grey", "g"], ["Left to right", "h"], ["Masked surface", "mask"], ["Four steps", "stripe"]];
  LX.spec("gradients", [], GRADS.map(function (row) {
    return card("gradients-" + row[1], row[0], '<div class="lx-grad ' + row[1] + '"></div>');
  }));

  LX.spec("hooks", ["motion-rise", "motion-press", "motion-stagger"], [
    card("hooks-line", "Underline", '<p class="lx-hook"><span class="lx-underline">Open at 7</span></p>', { play: "lx-live" }),
    card("hooks-count", "Count", '<p class="lx-hook"><span data-count="128">0</span> visits</p>', { play: "lx-count" }),
    card("hooks-strike", "Strike", '<p class="lx-hook"><s style="color:#8a8a8a">Closed</s> Open</p>'),
    card("hooks-swap", "Swap word", '<p class="lx-hook lx-swap"><span>Publish the site</span><span>Share the link</span></p>', { play: "lx-live" }),
    card("hooks-caret", "Caret", '<p class="lx-hook lx-caret">Harbor Coffee</p>', { play: "lx-live" }),
    card("hooks-indent", "Indent", '<p class="lx-hook" style="padding-left:16px;border-left:2px solid #111">Pike Street</p>'),
    card("hooks-inverse", "Inverse", '<p class="lx-hook">moonrise.</p>', { stage: "lx-on-dark" })
  ]);

  LX.spec("images", ["surfaces-image"], [
    card("images-frame", "Frame", '<div class="lx-ph tall"></div><p class="lx-meta">Pike Street · example</p>'),
    card("images-caption", "Caption", '<div class="lx-ph sm"></div><p class="lx-p">The counter, morning.</p>'),
    card("images-round", "Rounded", '<div class="lx-ph sm" style="border-radius:18px"></div>'),
    card("images-duo", "Duo", '<div class="lx-cols"><div class="lx-ph sm"></div><div class="lx-ph sm"></div></div>', { wide: true }),
    card("images-bleed", "Full width", '<div class="lx-ph" style="height:8rem;border-radius:0;margin:-1.35rem -1.15rem"></div>', { wide: true }),
    card("images-credit", "Credit", '<div class="lx-ph sm"></div><p class="lx-meta">Photo · example</p>'),
    card("images-fallback", "Fallback", '<div class="lx-empty"><span class="lx-avatar">?</span><p class="lx-p">Image unavailable</p></div>'),
    card("images-crop", "Crop", '<span class="lx-avatar lg">HK</span>'),
    card("images-zoom", "Selected", '<div class="lx-ph sm" style="box-shadow:0 0 0 2px var(--dt-action)"></div>')
  ]);

  function mapCard(id, title, inner, extra) {
    return card(id, title, '<div class="lx-map">' + inner + "</div>", extra);
  }
  LX.spec("maps", [], [
    mapCard("maps-list", "Pin list", '<div class="lx-region" style="inset:12px 46% 12px 10px"></div><div class="lx-pin" style="left:28%;top:40%"></div><div class="lx-pin-card" style="right:8px;top:16px"><strong>Harbor</strong><br>Pike Street</div>'),
    mapCard("maps-card", "Pin card", '<div class="lx-region" style="inset:20px"></div><div class="lx-pin hot" style="left:50%;top:48%"></div>'),
    mapCard("maps-route", "Route", '<svg viewBox="0 0 200 80" width="100%" height="100%"><path d="M20 60 C 60 10, 120 10, 180 40" fill="none" stroke="#111" stroke-width="1.5"/><circle cx="20" cy="60" r="3" fill="#111"/><circle cx="180" cy="40" r="3" fill="#1f6fed"/></svg>'),
    mapCard("maps-regions", "Regions", '<div class="lx-region" style="left:8%;top:18%;width:34%;height:55%"></div><div class="lx-region" style="left:46%;top:12%;width:40%;height:40%"></div><div class="lx-region" style="left:48%;top:56%;width:28%;height:28%"></div>'),
    mapCard("maps-address", "Address", '<div class="lx-region" style="inset:16px 40% 16px 12px"></div><div class="lx-pin-card" style="right:10px;bottom:16px">412 Pike<br>Open 7–3</div>'),
    mapCard("maps-cluster", "Clusters", '<div class="lx-pin" style="left:30%;top:40%"></div><div class="lx-pin" style="left:34%;top:46%"></div><div class="lx-pin" style="left:70%;top:30%"></div>'),
    mapCard("maps-inverse", "Inverse", '<div class="lx-region" style="inset:18px;background:#222;border-color:#444"></div><div class="lx-pin" style="left:42%;top:50%;background:#fff"></div>', { stage: "lx-on-dark" }),
    mapCard("maps-selected", "Selected pin", '<div class="lx-region" style="inset:16px"></div><div class="lx-pin hot" style="left:62%;top:38%"></div>'),
    mapCard("maps-empty", "Empty", '<div class="lx-region" style="inset:16px"></div><p class="lx-pin-card" style="left:50%;top:50%;transform:translate(-50%,-50%)">No pins yet</p>'),
    mapCard("maps-caption", "Caption", '<div class="lx-region" style="inset:10px 10px 28px"></div><p class="lx-meta" style="position:absolute;left:12px;bottom:6px">Example map · not a live service</p>')
  ]);

  LX.spec("marquees", [], [
    card("marquees-words", "Words", LX.marquee(["Publish", "Leads", "Studio", "Guide"], ""), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-marks", "Monograms", LX.marquee(["NL", "HB", "CD", "FD"], ""), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-pills", "Pills", LX.marquee(['<span class="lx-badge">Sites</span>', '<span class="lx-badge">Leads</span>', '<span class="lx-badge">Hours</span>'], ""), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-figs", "Figures", LX.marquee(["128 visits", "14 leads", "3 sites"], ""), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-pause", "Pause on hover", LX.marquee(["Harbor", "Northline", "Cedar"], "is-pause"), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-reverse", "Reverse", LX.marquee(["One", "Two", "Three", "Four"], "is-reverse"), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-fade", "Edge fade", LX.marquee(["Pike", "Union", "Pine", "Seneca"], "is-fade"), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-slow", "Slow", LX.marquee(["moonrise.", "moonrise.", "moonrise."], "is-slow"), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-dots", "Dot separators", LX.marquee(["Sites ·", "Leads ·", "Hours ·"], ""), { play: "lx-live", stage: "lx-clip" }),
    card("marquees-vert", "Vertical", LX.marquee(["Publish", "Share", "Edit"], "is-vert"), { play: "lx-live", stage: "lx-clip" })
  ]);

  LX.spec("nav-menus", ["nav-crumbs"], [
    card("nav-menus-top", "Top bar", '<div class="lx-foot" style="border:0;padding:0"><strong>moonrise.</strong><span class="lx-tab is-on" data-lx-opt>Sites</span><span class="lx-tab" data-lx-opt>Leads</span></div>', { wide: true }),
    card("nav-menus-icons", "With icons", '<div class="lx-actions">' + ["search", "file", "user"].map(function (n, i) { return '<button type="button" class="lx-btn lx-btn-ghost' + (i === 0 ? " is-focus" : "") + '">' + ico(n, "sm") + "</button>"; }).join("") + "</div>"),
    card("nav-menus-active", "Active", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>Studio</button><button type="button" class="lx-tab" data-lx-opt>Guide</button><button type="button" class="lx-tab" data-lx-opt>Sites</button></div>'),
    card("nav-menus-compact", "Compact", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>Home</button><button type="button" class="lx-tab" data-lx-opt>Guide</button></div>'),
    card("nav-menus-inverse", "Inverse", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>Sites</button><button type="button" class="lx-tab" data-lx-opt>Leads</button></div>', { stage: "lx-on-dark" }),
    card("nav-menus-word", "Wordmark", '<div class="lx-row"><strong>Harbor</strong><span class="lx-meta">Pike Street</span></div>'),
    card("nav-menus-cta", "With action", '<div class="lx-row"><span>Sites</span>' + LX.btn("Publish") + "</div>"),
    card("nav-menus-mobile", "Mobile row", '<div class="lx-tabs" style="justify-content:space-between"><button type="button" class="lx-tab is-on" data-lx-opt>Sites</button><button type="button" class="lx-tab" data-lx-opt>Leads</button><button type="button" class="lx-tab" data-lx-opt>You</button></div>', { wide: true }),
    card("nav-menus-search", "With search", '<div class="lx-compose"><input class="lx-input" placeholder="Search" aria-label="Search">' + LX.btn("Go", "compact") + "</div>")
  ]);

  function scroller(title, cls, inner) {
    return card("scroll-" + title.toLowerCase().replace(/\s/g, "-"), title, '<div class="lx-scroll ' + cls + '">' + inner + "</div>");
  }
  const lines = "<p>Monday 7–3</p><p>Tuesday 7–3</p><p>Wednesday 7–3</p><p>Thursday 7–3</p><p>Friday 7–5</p><p>Saturday 8–2</p><p>Sunday closed</p>";
  LX.spec("scroll-areas", [], [
    scroller("Fade edge", "fade", lines),
    scroller("Sticky label", "", '<p class="lx-kicker" style="position:sticky;top:0;background:#fff">Hours</p>' + lines),
    scroller("Horizontal", "x", "Pike · Union · Pine · Seneca · Spring · Madison · Marion"),
    scroller("Thin bar", "thin", lines),
    scroller("Shadow", "", lines),
    scroller("Snap", "snap", '<div class="lx-cell">Site</div><div class="lx-cell">Leads</div><div class="lx-cell">Hours</div>'),
    scroller("Log", "thin", '<p class="lx-mono">09:00 publish</p><p class="lx-mono">09:02 lead</p><p class="lx-mono">09:10 edit</p><p class="lx-mono">09:40 call</p>'),
    scroller("Thread", "", '<p class="lx-bubble">Hours?</p><p class="lx-bubble is-you">Open at 7.</p><p class="lx-bubble">Thanks.</p>'),
    scroller("Notes", "thin", "<p>Change the hero line.</p><p>Add Friday hours.</p><p>Check the phone link.</p><p>Publish.</p>"),
    scroller("Hint", "fade", '<p class="lx-meta">Scroll for the rest of the week</p>' + lines)
  ]);

  const SHADES = [["Grain", "lx-shade lx-shade-grain"], ["Scan", "lx-shade lx-shade-scan"], ["Dither", "lx-shade lx-shade-dither"], ["Crosshatch", "lx-shade lx-shade-hatch"], ["Drift", "lx-shade lx-shade-drift"], ["Line", "lx-shade lx-shade-line"], ["Paper", "lx-shade lx-shade-paper"], ["Wash", "lx-shade lx-shade-wash"], ["Still noise", "lx-shade lx-shade-grain"], ["Inverse noise", "lx-shade lx-shade-ink lx-shade-grain"]];
  LX.spec("shaders", ["motion-shimmer-pulse"], SHADES.slice(0, 9).map(function (row, i) {
    const play = row[0] === "Drift" || row[0] === "Line" ? "lx-live" : "";
    return card("shaders-" + i, row[0], '<div class="' + row[1] + '"></div>', { play: play, stage: row[0] === "Inverse noise" ? "lx-on-dark" : "" });
  }));

  function stepRow(extra) {
    const items = [
      ["1", "Site", "is-done"],
      ["2", "Hours", "is-current"],
      ["3", "Publish", ""]
    ];
    return '<div class="lx-steps ' + (extra || "") + '">' + items.map(function (it) {
      return '<div class="lx-step ' + it[2] + '"><i>' + (it[2] === "is-done" ? "✓" : it[0]) + "</i><span>" + it[1] + "</span></div>";
    }).join("") + "</div>";
  }
  LX.spec("steppers", ["nav-stepper"], [
    card("steppers-horiz", "Horizontal", stepRow("")),
    card("steppers-vert", "Vertical", stepRow("vert")),
    card("steppers-num", "Numbered", stepRow("")),
    card("steppers-dots", "Dots", '<div class="lx-steps"><i class="lx-dot"></i><i class="lx-dot mute"></i><i class="lx-dot mute"></i></div>'),
    card("steppers-labels", "Labels", stepRow("")),
    card("steppers-current", "Current", '<div class="lx-steps"><div class="lx-step is-current"><i>2</i><span>Hours</span></div></div>'),
    card("steppers-done", "Complete", '<div class="lx-step is-done"><i>✓</i><span>Published</span></div>'),
    card("steppers-error", "Error", '<div class="lx-step is-bad"><i>!</i><span>Phone missing</span></div>'),
    card("steppers-click", "Clickable", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>Site</button><button type="button" class="lx-tab" data-lx-opt>Hours</button><button type="button" class="lx-tab" data-lx-opt>Publish</button></div>')
  ]);

  LX.spec("timelines", ["data-timeline"], [
    card("timelines-day", "Day", '<div class="lx-time"><div><span>7:00</span><span><i></i>Open</span></div><div><span>12:00</span><span><i></i>Rush</span></div><div><span>15:00</span><span><i></i>Close</span></div></div>'),
    card("timelines-week", "Week", '<div class="lx-time"><div><span>Mon</span><span>Published</span></div><div><span>Wed</span><span>Lead</span></div><div><span>Fri</span><span>Edit</span></div></div>'),
    card("timelines-alt", "Split", '<div class="lx-cols"><div><p class="lx-kicker">Past</p><p class="lx-p">Draft</p></div><div class="is-pick"><p class="lx-kicker">Now</p><p class="lx-p">Live</p></div></div>'),
    card("timelines-compact", "Compact", '<p class="lx-mono">09:00 · publish</p><p class="lx-mono">09:14 · lead</p>'),
    card("timelines-inverse", "Inverse", '<div class="lx-time"><div><span>Now</span><span>Live link</span></div></div>', { stage: "lx-on-dark" }),
    card("timelines-dot", "Status", '<div class="lx-row"><span><i class="lx-dot ok"></i> Published</span><span class="lx-meta">Today</span></div>'),
    card("timelines-note", "Note", '<div class="lx-row"><span>Hours edited</span><span class="lx-meta">Fri</span></div>'),
    card("timelines-empty", "Empty", '<div class="lx-empty"><p class="lx-h">No events</p><p class="lx-p">Publish to start a timeline.</p></div>'),
    card("timelines-play", "Reveal", '<div class="lx-reveal"><div class="lx-rise"><div class="lx-time"><div><span>1</span><span>Write</span></div><div><span>2</span><span>Publish</span></div></div></div></div>', { play: "lx-live" })
  ]);

  LX.spec("videos", ["media-scrub"], [
    card("videos-poster", "Poster", '<div class="lx-video"><span>Harbor</span></div>'),
    card("videos-play", "Play", '<div class="lx-video">' + LX.btn("Play", "ghost") + "</div>"),
    card("videos-controls", "Controls", '<div class="lx-video"><div class="bar"><span></span></div></div>'),
    card("videos-mute", "Quiet", '<div class="lx-video"><span class="lx-meta" style="color:#fff">Sound off</span><div class="bar"><span></span></div></div>'),
    card("videos-caption", "Caption", '<div class="lx-video"><span class="lx-badge on-dark">Open at 7</span></div>'),
    card("videos-wide", "16:9", '<div class="lx-video" style="height:9rem"></div>', { wide: true }),
    card("videos-tall", "9:16", '<div class="lx-video" style="height:12rem;max-width:7rem;margin:0 auto"></div>'),
    card("videos-list", "Playlist", '<div class="lx-row"><span>Counter</span><span class="lx-meta">0:12</span></div><div class="lx-row"><span>Street</span><span class="lx-meta">0:08</span></div>'),
    card("videos-ended", "Ended", '<div class="lx-video"><p class="lx-p" style="color:#ddd">Ended</p>' + LX.btn("Replay", "ghost") + "</div>")
  ]);
})();
