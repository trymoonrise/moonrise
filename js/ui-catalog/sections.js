(function () {
  "use strict";
  const LX = window.LX;
  const card = LX.card.bind(LX);
  const ico = LX.ico;

  const COPIES = {
    faqs: { kicker: "Example", title: "Questions from the studio", body: "Short answers under the thing they ask about.", action: "Open", visual: "faq", note: "2 open" },
    features: { kicker: "Example", title: "What the site holds", body: "Publish, leads, and the studio editor. Nothing extra.", action: "Look", visual: "features", note: "Three" },
    footers: { kicker: "Example", title: "Close the page", body: "Name, guide, and the legal links in one quiet row.", action: "Privacy", visual: "footer", note: "moonrise." },
    galleries: { kicker: "Example", title: "Work from the shop", body: "Four frames, one larger. Real photos would sit here.", action: "Open", visual: "gallery", note: "4 frames" },
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

  function ann(id, title, html) {
    return card("announcements-" + id, title, html, { wide: true, stage: "lx-ann-stage" });
  }

  LX.spec("announcements", [], [
    ann("error", "Status pill", '<a class="lx-ann lx-ann-pill is-error" href="#announcements"><span class="lx-ann-chip">Error</span><span>Something went wrong</span><span class="lx-ann-go" aria-hidden="true">→</span></a>'),
    ann("note", "Feature note", '<div class="lx-ann lx-ann-note"><span class="lx-ann-ico">' + ico("bulb") + '</span><div class="lx-ann-copy"><strong>New: Lead notes</strong><p>A short note now sits on each lead, next to the phone number.</p><a class="lx-ann-link" href="#announcements">Explore features</a></div><button type="button" class="lx-ann-x" data-lx-dismiss aria-label="Dismiss">' + ico("close", "sm") + "</button></div>"),
    ann("line", "Sentence", '<p class="lx-ann lx-ann-pill is-line"><span>Friday hours move to 9:00.</span><a class="lx-ann-link" href="#announcements">Read more →</a></p>'),
    ann("warn", "Warning bar", '<div class="lx-ann lx-ann-bar is-warn"><span class="lx-ann-ico">' + ico("alert") + '</span><div class="lx-ann-copy"><strong>Scheduled downtime</strong><p>The studio is offline Sunday from 2:00–4:00.</p></div><button type="button" class="lx-ann-x" data-lx-dismiss aria-label="Dismiss">' + ico("close", "sm") + "</button></div>"),
    ann("offer", "Offer pill", '<p class="lx-ann lx-ann-pill is-offer"><span class="lx-ann-chip">Early access</span><span>The first month of a new site is included.</span></p>'),
    ann("update", "Action card", '<div class="lx-ann lx-ann-bar is-update"><span class="lx-ann-ico">' + ico("info") + '</span><div class="lx-ann-copy"><strong>Update available</strong><p>A new studio build is ready. Refresh to pick it up.</p></div><button type="button" class="lx-ann-btn">Refresh</button></div>'),
    ann("split", "Split links", '<p class="lx-ann lx-ann-pill is-split"><a class="lx-ann-link" href="#announcements">We\u2019re hiring</a><span class="lx-ann-rule" aria-hidden="true"></span><a class="lx-ann-more" href="#announcements">See open roles ›</a></p>'),
    ann("quiet", "Quiet pill", '<a class="lx-ann lx-ann-pill is-quiet" href="#announcements">New feature added <span aria-hidden="true">↗</span></a>')
  ]);

  const SHOT_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

  function shot(id, title, o) {
    const still = o.poster ? '<img class="lx-shot-still" src="' + o.poster + '" alt="">' : "";
    const media = o.video
      ? still + '<video class="lx-shot-media" autoplay muted loop playsinline src="' + o.video + '"></video>'
      : '<img class="lx-shot-media" src="' + o.image + '" alt="">';
    const kicker = o.kicker ? '<p class="lx-shot-kicker">' + o.kicker + "</p>" : "";
    const body = o.body ? "<p>" + o.body + "</p>" : "";
    return card(id, title,
      '<article class="lx-shot ' + o.layout + '">' + media +
        '<div class="lx-shot-veil" aria-hidden="true"></div>' +
        '<div class="lx-shot-copy">' + kicker + "<h3>" + o.heading + "</h3>" + body + (o.actions || "") + "</div></article>",
      { wide: true, stage: o.stage || "lx-media-stage" });
  }

  function shotActions(html) {
    return '<div class="lx-shot-actions">' + html + "</div>";
  }

  function shotLime(label, round) {
    if (round) return '<button type="button" class="lx-lime is-round" aria-label="' + label + '">' + SHOT_ARROW + "</button>";
    return '<button type="button" class="lx-lime">' + label + "</button>";
  }

  LX.spec("cta", [], [
    shot("cta-band", "Photo band", {
      layout: "is-center",
      stage: "lx-media-stage is-short",
      image: "assets/library/hero-coast.jpg",
      heading: "Publish the Harbor site",
      body: "One live link, with the hours and the phone on the first screen.",
      actions: shotActions(shotLime("Publish"))
    }),
    shot("cta-split", "Split photo", {
      layout: "is-split",
      stage: "lx-media-stage is-short",
      image: "assets/library/cta-counter.jpg",
      kicker: "Harbor Coffee",
      heading: "The shop is the picture",
      body: "Hours and a phone number sit beside the counter, with one next step.",
      actions: shotActions(shotLime("Publish"))
    }),
    shot("cta-duo", "Two actions", {
      layout: "is-center",
      stage: "lx-media-stage is-short",
      image: "assets/library/hero-wind.jpg",
      heading: "Start a project",
      body: "A clean-energy site, with the first step written on the photo.",
      actions: shotActions(shotLime("Start a project") + '<button type="button" class="lx-lime is-ghost">View guide</button>')
    }),
    shot("cta-strip", "Photo strip", {
      layout: "is-strip",
      stage: "lx-media-stage is-short",
      image: "assets/library/hero-coffee.jpg",
      heading: "Coffee on Pike is ready to publish.",
      actions: shotActions(shotLime("Publish"))
    })
  ]);

  function face(src) {
    return '<img src="' + src + '" alt="">';
  }

  function logo(file) {
    return "assets/library/logos/" + file + ".svg";
  }

  function mark(file, name) {
    return '<span class="lx-mark"><img src="' + logo(file) + '" alt="' + name + '"></span>';
  }

  function word(file, name) {
    return '<div><span class="lx-word"><img src="' + logo(file) + '" alt=""><span>' + name + "</span></span></div>";
  }

  function named(file, name) {
    return '<li><img src="' + logo(file) + '" alt=""><span>' + name + "</span></li>";
  }

  LX.spec("clients", [], [
    card("clients-faces", "Portrait row",
      '<section class="lx-clients lx-clients-faces"><h3>Happy<span>Clients</span></h3><div class="lx-faces">' +
        face("assets/library/client-miles.jpg") +
        face("assets/library/client-leo.jpg") +
        face("assets/library/client-ada.jpg") +
        face("assets/library/client-nora.jpg") +
      "</div></section>",
      { wide: true, stage: "lx-client-stage is-plain" }),
    card("clients-card", "Logo card",
      '<article class="lx-clients lx-clients-card"><h3>Trusted by Businesses Worldwide</h3><p>Founders, developers, and business leaders across the globe chose us for their digital asset operations.</p><hr><div class="lx-mark-row">' +
        mark("shopify", "Shopify") +
        mark("blender", "Blender") +
        mark("figma", "Figma") +
        mark("spotify", "Spotify") +
        mark("notion", "Notion") +
      "</div></article>",
      { wide: true, stage: "lx-client-stage" }),
    card("clients-grid", "Plus grid",
      '<section class="lx-clients lx-clients-grid"><p>Companies we collaborate with.</p><div class="lx-plus-grid">' +
        word("nvidia", "NVIDIA") +
        word("supabase", "Supabase") +
        word("github", "GitHub") +
        word("openai", "OpenAI") +
        word("turso", "Turso") +
        word("clerk", "Clerk") +
        word("claude", "Claude") +
        word("vercel", "Vercel") +
      "</div></section>",
      { wide: true, stage: "lx-client-stage is-plain" }),
    card("clients-names", "Named marks",
      '<section class="lx-clients lx-clients-names"><h3>Trusted by the best companies</h3><p>The world\u2019s most ambitious teams build with our platform.</p><ul class="lx-name-row">' +
        named("google", "Google") +
        named("apple", "Apple") +
        named("amazon", "Amazon") +
        named("meta", "Meta") +
        named("microsoft", "Microsoft") +
        named("nvidia", "Nvidia") +
        named("netflix", "Netflix") +
        named("spotify", "Spotify") +
      "</ul><ul class=\"lx-name-row is-center\">" +
        named("tesla", "Tesla") +
        named("airbnb", "Airbnb") +
        named("github", "GitHub") +
        named("vercel", "Vercel") +
      "</ul></section>",
      { wide: true, stage: "lx-client-stage is-plain" }),
    card("clients-strip", "Wordmark bar",
      '<div class="lx-clients lx-clients-strip"><img src="' + logo("nintendo") + '" alt="Nintendo"><img src="' + logo("jquery") + '" alt="jQuery"><img src="' + logo("prada") + '" alt="Prada"><img src="' + logo("applemusic") + '" alt="Apple Music"></div>',
      { wide: true, stage: "lx-client-stage is-strip" })
  ]);
  function compareWord() {
    return '<div class="lx-compare is-word" data-lx-compare><div class="lx-compare-base"><span>COMPARE</span></div><div class="lx-compare-top"><span>COMPARE</span></div><i class="lx-compare-rule" aria-hidden="true"></i><button type="button" class="lx-compare-knob" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="Drag to compare"></button></div>';
  }

  function comparePhoto(src) {
    return '<figure class="lx-compare is-photo" data-lx-compare><img class="lx-compare-after" src="' + src + '" alt=""><div class="lx-compare-before"><img src="' + src + '" alt=""></div><span class="lx-compare-tag is-before">Before</span><span class="lx-compare-tag is-after">After</span><i class="lx-compare-rule" aria-hidden="true"></i><button type="button" class="lx-compare-knob is-chev" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="Drag to compare"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5 5.5 12 9 16.5M15 7.5 18.5 12 15 16.5"/></svg></button></figure>';
  }

  LX.spec("comparisons", [], [
    card("comparisons-word", "Split word", compareWord(), { wide: true, stage: "lx-compare-stage" }),
    card("comparisons-coast", "Photo slider", comparePhoto("assets/library/hero-coast.jpg"), { wide: true, stage: "lx-compare-stage" }),
    card("comparisons-shop", "Shop slider", comparePhoto("assets/library/hero-coffee.jpg"), { wide: true, stage: "lx-compare-stage" })
  ]);
  addLayouts("faqs");
  addLayouts("features");
  addLayouts("footers");
  addLayouts("galleries");

  LX.spec("heroes", [], [
    shot("heroes-center", "Centered photo", {
      layout: "is-center",
      image: "assets/library/hero-wind.jpg",
      heading: "Sustainable Solutions for a Better Future",
      body: "Empowering businesses and communities to thrive in a low-carbon world through tailored clean energy solutions.",
      actions: shotActions(shotLime("Start a Project") + shotLime("Start a Project", true))
    }),
    shot("heroes-split", "Photo and copy", {
      layout: "is-split",
      image: "assets/library/hero-coffee.jpg",
      kicker: "Harbor Coffee",
      heading: "Coffee on Pike, open at 7",
      body: "The address, the hours, and a way to call sit next to the shop.",
      actions: shotActions(shotLime("Call"))
    }),
    shot("heroes-video", "Video", {
      layout: "is-center",
      video: "assets/library/hero-ocean.mp4",
      poster: "assets/library/hero-coast.jpg",
      heading: "Open coast, quiet morning",
      body: "Waves on the first screen, with one clear next step.",
      actions: shotActions(shotLime("See the shore") + shotLime("See the shore", true))
    }),
    shot("heroes-bottom", "Bottom line", {
      layout: "is-bottom",
      image: "assets/library/hero-coast.jpg",
      kicker: "Harbor",
      heading: "Hours on the water",
      body: "The shop opens with the light. Call before you drive down.",
      actions: shotActions(shotLime("Call"))
    }),
    shot("heroes-card", "Card on a photo", {
      layout: "is-card",
      image: "assets/library/cta-counter.jpg",
      kicker: "Harbor Coffee",
      heading: "Reserve a seat",
      body: "Walk in at 7, or leave a name and a time.",
      actions: shotActions(shotLime("Reserve"))
    })
  ]);
  addLayouts("pricing");
  addLayouts("stats", ["surfaces-metrics"]);
  addLayouts("team");
  addLayouts("testimonials");
  addLayouts("text", ["surfaces-header", "type-display", "type-meta"]);

  LX.spec("borders", [], [
    card("borders-marks", "Corner marks", '<div class="lx-bracket-card"><div class="lx-read"><span>Visits</span><strong>128</strong></div><div class="lx-read"><span>Leads</span><strong>14</strong></div><div class="lx-read"><span>Sites</span><strong>3</strong></div></div>', { wide: true, stage: "lx-border-stage" }),
    card("borders-draw", "Draw speeds", '<div class="lx-beams"><div class="lx-beam is-quick"><i class="lx-beam-rotor" aria-hidden="true"></i><span>Short and quick</span></div><div class="lx-beam is-slow"><i class="lx-beam-rotor" aria-hidden="true"></i><span>Long and slow</span></div><div class="lx-beam is-thick"><i class="lx-beam-rotor" aria-hidden="true"></i><span>3px thick</span></div></div>', { wide: true, stage: "lx-border-stage" }),
    card("borders-ring", "Ring", '<div class="lx-ring"><span class="lx-ring-face">HK</span><span class="lx-ring-check">' + ico("check", "sm") + "</span></div>", { stage: "lx-border-stage" }),
    card("borders-drop", "Dashed drop", '<div class="lx-drop"><span class="lx-drop-ico" aria-hidden="true"><i></i><i></i><svg class="lx-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V7M8.5 10.5 12 7l3.5 3.5"/></svg></span><strong>Click to upload or drop files</strong><p>PDF, DOC, XLSX, CSV, PNG, or JPG</p><button type="button" class="lx-drop-btn"><svg class="lx-ico sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V7M8.5 10.5 12 7l3.5 3.5"/></svg>Browse files</button></div>', { wide: true, stage: "lx-border-stage" }),
    card("borders-arc", "Partial stroke", '<p class="lx-arc"><i class="lx-arc-rotor" aria-hidden="true"></i><span>Borders are cool</span></p>', { stage: "lx-border-stage" }),
    card("borders-progress", "Progress edge", '<div class="lx-progress"><button type="button" class="lx-progress-btn">Submit</button><span class="lx-progress-line"></span></div>', { wide: true, play: "lx-live", stage: "lx-border-stage" }),
    card("borders-frames", "Color frames", '<div class="lx-frames"><div class="lx-frame is-blue"><img src="assets/library/hero-coast.jpg" alt=""><em>NEW</em></div><div class="lx-frame is-red"><img src="assets/library/hero-coffee.jpg" alt=""><em>NEW</em></div><div class="lx-frame is-gold"><img src="assets/library/hero-wind.jpg" alt=""><em>NEW</em></div></div>', { wide: true, stage: "lx-border-stage" })
  ]);

  function dock(id, title, html, extra) {
    const o = extra || {};
    o.stage = o.stage || "lx-dock-stage";
    return card("docks-" + id, title, html, o);
  }
  function dockBtn(name, label, extra) {
    return '<button type="button" data-lx-opt aria-label="' + label + '"' + (extra || "") + ">" + ico(name) + "</button>";
  }
  function dockBtns(names) {
    return names.map(function (name, i) {
      return dockBtn(name, name, i === 0 ? ' class="is-on"' : "");
    }).join("");
  }
  function dockBar(kind, buttons) {
    return '<div class="lx-float is-' + kind + '">' + buttons + "</div>";
  }
  LX.spec("docks", ["nav-dock"], [
    dock("tools", "Tools", dockBar("tools", dockBtns(["dash", "toggle", "pencil", "export", "list"])), { wide: true }),
    dock("circles", "Circles", dockBar("orbs", dockBtns(["home", "box", "gems", "pulse", "file", "mail", "spark"])), { wide: true }),
    dock("mark", "Center mark", dockBar("mark", [
      dockBtn("home", "Home"),
      dockBtn("image", "Image"),
      dockBtn("crop", "Frame"),
      '<button type="button" class="lx-brand is-on" data-lx-opt aria-label="moonrise."><span class="lx-brand-tip">moonrise.</span><span class="lx-brand-mark">m</span></button>',
      dockBtn("nodes", "Share"),
      dockBtn("close", "Close"),
      dockBtn("funnel", "Filter")
    ].join("")), { wide: true }),
    dock("quiet", "Quiet", dockBar("quiet", dockBtns(["home", "search", "bell", "user", "gear"]))),
    dock("outline", "Outline", dockBar("line", dockBtns(["plus", "search", "bell", "user", "sun"])), { stage: "lx-dock-stage is-gray" }),
    dock("badge", "Badge", dockBar("inbox", [
      dockBtn("home", "Home", ' class="is-on"'),
      dockBtn("search", "Search"),
      dockBtn("folder", "Folder"),
      '<button type="button" data-lx-opt aria-label="Mail">' + ico("mail") + '<span class="lx-count">3</span></button>',
      dockBtn("music", "Music"),
      dockBtn("gear", "Settings"),
      dockBtn("trash", "Trash")
    ].join("")), { wide: true }),
    dock("labels", "Labels", '<div class="lx-float is-modes">' +
      '<button type="button" data-lx-opt>' + ico("sun") + "Light</button>" +
      '<button type="button" class="is-on" data-lx-opt>' + ico("moon") + "Dark</button>" +
      '<button type="button" data-lx-opt>' + ico("gear") + "Settings</button></div>")
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
    scroller("Shadow", "shade", lines),
    scroller("Snap", "snap", '<div class="lx-cell">Site</div><div class="lx-cell">Leads</div><div class="lx-cell">Hours</div>'),
    scroller("Log", "thin", '<p class="lx-mono">09:00 publish</p><p class="lx-mono">09:02 lead</p><p class="lx-mono">09:10 edit</p><p class="lx-mono">09:40 call</p>'),
    scroller("Thread", "", '<p class="lx-bubble">Hours?</p><p class="lx-bubble is-you">Open at 7.</p><p class="lx-bubble">Thanks.</p>'),
    scroller("Notes", "thin", "<p>Change the hero line.</p><p>Add Friday hours.</p><p>Check the phone link.</p><p>Publish.</p>"),
    scroller("Hint", "fade", '<p class="lx-meta">Scroll for the rest of the week</p>' + lines)
  ]);

  const SHADES = [["Grain", "lx-shade lx-shade-grain"], ["Scan", "lx-shade lx-shade-scan"], ["Dither", "lx-shade lx-shade-dither"], ["Crosshatch", "lx-shade lx-shade-hatch"], ["Drift", "lx-shade lx-shade-drift"], ["Line", "lx-shade lx-shade-line"], ["Paper", "lx-shade lx-shade-paper"], ["Wash", "lx-shade lx-shade-wash"], ["Still noise", "lx-shade lx-shade-still"], ["Inverse noise", "lx-shade lx-shade-ink lx-shade-grain"]];
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
    return '<div class="lx-steps ' + (extra === "vert" ? "vert" : "") + '">' + items.map(function (it) {
      const mark = extra === "nums" || it[2] !== "is-done" ? it[0] : "✓";
      if (extra === "labels") return '<div class="lx-step ' + it[2] + '"><span>' + it[1] + "</span></div>";
      return '<div class="lx-step ' + it[2] + '"><i>' + mark + "</i><span>" + it[1] + "</span></div>";
    }).join("") + "</div>";
  }
  LX.spec("steppers", ["nav-stepper"], [
    card("steppers-horiz", "Horizontal", stepRow("")),
    card("steppers-vert", "Vertical", stepRow("vert")),
    card("steppers-num", "Numbered", stepRow("nums")),
    card("steppers-dots", "Dots", '<div class="lx-steps"><i class="lx-dot"></i><i class="lx-dot mute"></i><i class="lx-dot mute"></i></div>'),
    card("steppers-labels", "Labels", stepRow("labels")),
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
    card("videos-play", "Click to play", '<figure class="lx-player"><p class="lx-player-cue">Click the video to play</p><i class="lx-player-stem" aria-hidden="true"></i><button type="button" class="lx-player-frame" data-lx-player aria-label="Play video"><video muted loop playsinline preload="metadata" src="assets/library/hero-ocean.mp4"></video><span class="lx-player-title">the coast, in motion</span></button></figure>', { stage: "lx-player-stage" })
  ]);
})();
