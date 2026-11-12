(function () {
  "use strict";
  const LX = window.LX;
  const card = LX.card.bind(LX);
  const ico = LX.ico;

  const COPIES = {
    pricing: { kicker: "Example", title: "One plan for the site", body: "A single price, a short list, and one button.", action: "Choose", visual: "price", note: "$48" },
    stats: { kicker: "Example", title: "This week on the site", body: "Visits and leads, with the comparison written out.", action: "View", visual: "stats", note: "Example figures" },
    text: { kicker: "Example", title: "About the shop", body: "A short paragraph in the shop’s own words.", action: "Continue", visual: "text", note: "Reading" }
  };

  const IMG = {
    coast: "assets/library/hero-coast.jpg",
    coffee: "assets/library/hero-coffee.jpg",
    wind: "assets/library/hero-wind.jpg",
    counter: "assets/library/cta-counter.jpg",
    nora: "assets/library/client-nora.jpg",
    miles: "assets/library/client-miles.jpg",
    ada: "assets/library/client-ada.jpg",
    leo: "assets/library/client-leo.jpg",
    ocean: "assets/library/hero-ocean.mp4"
  };

  function pic(src, cls) {
    return '<div class="lx-ph' + (cls ? " " + cls : "") + '"><img src="' + src + '" alt="" loading="lazy"></div>';
  }

  function avatar(src, cls) {
    return '<span class="lx-avatar' + (cls ? " " + cls : "") + '"><img src="' + src + '" alt="" loading="lazy"></span>';
  }

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
  const FAQ_CHEV = '<span class="lx-faq-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>';
  const FAQ_PLUS = '<span class="lx-faq-ico is-plus" aria-hidden="true"></span>';

  function faqItem(q, a, open, icon) {
    return '<div class="lx-faq-item' + (open ? " is-open" : "") + '">' +
      '<button type="button" class="lx-faq-q" aria-expanded="' + (open ? "true" : "false") + '">' + q + (icon || FAQ_CHEV) + "</button>" +
      '<div class="lx-faq-panel"><div>' + a + "</div></div></div>";
  }

  function faqList(cls, items, mode) {
    return '<div class="lx-faq ' + cls + '" data-lx-faq="' + (mode || "one") + '">' +
      items.map(function (row) {
        return faqItem(row[0], row[1], !!row[2], row[3]);
      }).join("") +
      "</div>";
  }

  const FAQ_SAMPLE = [
    ["How do I publish?", "Open the site and choose Publish. The live link stays the same when you publish again."],
    ["Can I edit later?", "Yes. Change the hours or the phone, then publish again. The watermark stays until checkout.", true],
    ["Where do leads go?", "New contact form submissions show up under Leads with the name and phone."]
  ];

  function faq(id, title, html, stage) {
    return card("faqs-" + id, title, html, { wide: true, stage: stage || "lx-faq-stage" });
  }

  LX.spec("faqs", [], [
    faq("landing", "Landing cards", faqList("is-cards", FAQ_SAMPLE)),
    faq("hairline", "Hairline list", faqList("is-hairline", FAQ_SAMPLE)),
    faq("plus", "Plus and minus", faqList("is-plus", FAQ_SAMPLE.map(function (row) {
      return [row[0], row[1], row[2], FAQ_PLUS];
    }))),
    faq("soft", "Soft cards", faqList("is-soft", FAQ_SAMPLE)),
    faq("split", "Split intro",
      '<div class="lx-faq-split"><div class="lx-faq-intro"><p class="lx-faq-kicker">FAQ</p><h3>Questions from the studio</h3><p>Short answers under the thing people ask about most.</p></div>' +
      faqList("is-hairline", FAQ_SAMPLE) + "</div>"),
    faq("cols", "Two columns", faqList("is-cards is-cols", [
      ["How do I publish?", "Open the site and choose Publish.", true],
      ["Can I edit later?", "Yes. Publish again when the hours change."],
      ["Where do leads go?", "They land in Leads with a name and phone."],
      ["Is there a watermark?", "Yes, until the shop owner pays to go live."]
    ])),
    faq("numbered", "Numbered", faqList("is-numbered", [
      ["<em>01</em> How do I publish?", "Open the site and choose Publish.", true],
      ["<em>02</em> Can I edit later?", "Yes. Change copy, then publish again."],
      ["<em>03</em> Where do leads go?", "Contact form replies show under Leads."]
    ])),
    faq("grouped", "Grouped",
      '<div class="lx-faq is-hairline is-grouped" data-lx-faq="one">' +
        '<p class="lx-faq-group">Publishing</p>' +
        faqItem("How do I publish?", "Open the site and choose Publish.", true) +
        faqItem("Can I edit later?", "Yes. Publish again when something changes.") +
        '<p class="lx-faq-group">Leads</p>' +
        faqItem("Where do leads go?", "They appear under Leads with the name and phone.") +
      "</div>"),
    faq("compact", "Compact", faqList("is-compact", FAQ_SAMPLE)),
    faq("dark", "Inverse", faqList("is-dark", FAQ_SAMPLE), "lx-faq-stage lx-on-dark")
  ]);

  function feat(id, title, html, stage) {
    return card("features-" + id, title, html, { wide: true, stage: stage || "lx-feat-stage" });
  }

  function featIcon(name) {
    return '<span class="lx-feat-ico" aria-hidden="true">' + ico(name) + "</span>";
  }

  function featCell(icon, title, body) {
    return '<article class="lx-feat-cell">' + featIcon(icon) + "<strong>" + title + "</strong><p>" + body + "</p></article>";
  }

  function bentoVisual(kind) {
    if (kind === "insight") {
      return '<div class="lx-bento-viz is-insight" aria-hidden="true"><i></i><i></i><span class="lx-bento-glass"></span></div>';
    }
    if (kind === "analysis") {
      return '<div class="lx-bento-viz is-analysis" aria-hidden="true"><i></i><span class="lx-bento-glass"></span></div>';
    }
    if (kind === "speed") {
      return '<div class="lx-bento-viz is-speed" aria-hidden="true"><span class="lx-bento-hq"><i></i>Headquarter</span><span class="lx-bento-globe"></span></div>';
    }
    if (kind === "source") {
      return '<div class="lx-bento-viz is-source" aria-hidden="true"><span class="is-a">A</span><span class="is-ok">' + ico("check", "sm") + '</span><span class="is-b">B</span></div>';
    }
    return '<div class="lx-bento-viz is-ai" aria-hidden="true"><span class="lx-bento-phone">AI</span><span class="lx-bento-bot"></span></div>';
  }

  function bentoCard(kind, label, title, body, wide) {
    return '<article class="lx-bento-card' + (wide ? " is-wide" : "") + '">' + bentoVisual(kind) +
      '<div class="lx-bento-copy"><span>' + label + "</span><strong>" + title + "</strong><p>" + body + "</p></div></article>";
  }

  LX.spec("features", [], [
    feat("split", "Media split",
      '<section class="lx-feat-split">' +
        '<figure class="lx-feat-media"><img src="assets/library/hero-coffee.jpg" alt=""><span class="lx-feat-media-tag">Live preview</span></figure>' +
        '<div class="lx-feat-copy"><span class="lx-feat-pill">Platform</span><h3>This is the start of something new</h3>' +
        "<p>Find a local shop that needs a site, publish it with Moonrise, and get paid when the owner goes live. Hours, phone, and leads sit on the first screen.</p></div></section>"),
    feat("grid", "Icon grid",
      '<section class="lx-feat-grid-wrap"><header class="lx-feat-head"><h3>Power. Speed. Control.</h3><p>Everything you need to find a lead, publish a site, and keep it current.</p></header>' +
        '<div class="lx-feat-grid">' +
          featCell("pulse", "Faaast", "One-click publish keeps the same live link when you update.") +
          featCell("gems", "Powerful", "Builder, editor, and Business Finder share one studio.") +
          featCell("nodes", "Security", "Checkout and payouts stay on Moonrise, not side deals.") +
          featCell("pencil", "Customization", "Turn hours, forms, and pages on or off in the editor.") +
          featCell("gear", "Control", "Claims, clients, and payouts live in one clear queue.") +
          featCell("spark", "Built for AI", "Generate a site from a lead, then refine what matters.") +
        "</div></section>"),
    feat("bento", "Dark bento",
      '<section class="lx-feat-bento"><header class="lx-feat-bento-head"><h3>Studio</h3><p>Know more about your leads than they do.</p></header>' +
        '<div class="lx-bento-grid">' +
          bentoCard("insight", "Insight", "Get perfect clarity", "See which shops still need a site before you claim them.", true) +
          bentoCard("analysis", "Analysis", "Undercut your competitors", "Scan the map for cafés and clinics that never went online.", true) +
          bentoCard("speed", "Speed", "Built for power users", "Claim a lead, generate the site, and send the preview the same day.") +
          bentoCard("source", "Source", "Get the furthest reach", "Open map data finds nearby businesses you can actually sell to.") +
          bentoCard("ai", "Limitless", "Sell globally", "Keep working with clients after go-live from one studio.") +
        "</div></section>",
      "lx-feat-stage is-dark"),
    feat("shots", "Photo trio",
      '<section class="lx-feat-shots">' +
        '<article><img src="assets/library/hero-coast.jpg" alt=""><div><span>Finder</span><strong>Map the neighborhood</strong><p>Claim shops that still need a website.</p></div></article>' +
        '<article><img src="assets/library/cta-counter.jpg" alt=""><div><span>Publish</span><strong>One live link</strong><p>Hours and phone stay on the first screen.</p></div></article>' +
        '<article><img src="assets/library/hero-wind.jpg" alt=""><div><span>Leads</span><strong>Calls come in</strong><p>Contact form replies land with a name and phone.</p></div></article>' +
      "</section>"),
    feat("rail", "Feature rail",
      '<section class="lx-feat-rail">' +
        '<div class="lx-feat-rail-copy"><span class="lx-feat-pill is-soft">What you get</span><h3>A site that sells itself</h3><p>Moonrise puts the shop on a live link, then pays you when the owner unlocks it.</p>' +
          '<ul><li>' + ico("check", "sm") + "<span>Publish once, update anytime</span></li>" +
          "<li>" + ico("check", "sm") + "<span>Watermark checkout for go-live</span></li>" +
          "<li>" + ico("check", "sm") + "<span>Leads with name and phone</span></li></ul></div>" +
        '<aside class="lx-feat-rail-card" aria-hidden="true">' +
          '<div class="lx-feat-preview"><span class="lx-feat-preview-bar"></span><strong>Harbor Coffee</strong><em>Open · 7:00–4:00</em><p>Pike Street · Call now</p><button type="button">View site</button></div>' +
        "</aside></section>"),
    feat("stack", "Stacked highlights",
      '<section class="lx-feat-stack">' +
        '<article class="is-on"><span class="lx-feat-pill">Publish</span><h3>Same link, fresh hours</h3><p>Edit the page, hit publish, and the live site updates without a new URL.</p></article>' +
        "<article><span class=\"lx-feat-pill is-soft\">Finder</span><h3>Leads on the map</h3><p>Scan nearby cafés and clinics, claim one, then generate their site.</p></article>" +
        '<article><span class="lx-feat-pill is-soft">Payouts</span><h3>Paid when they go live</h3><p>The owner pays through the watermark; your earnings follow the payout you set.</p></article>' +
      "</section>")
  ]);

  function foot(id, title, html, stage) {
    return card("footers-" + id, title, html, { wide: true, stage: stage || "lx-foot-stage" });
  }

  function footCol(label, links) {
    return '<div class="lx-site-foot-col"><p>' + label + "</p><ul>" +
      links.map(function (row) {
        return '<li><a href="' + row[1] + '">' + row[0] + "</a></li>";
      }).join("") +
      "</ul></div>";
  }

  LX.spec("footers", [], [
    foot("simple", "Site bar",
      '<footer class="lx-site-foot is-simple">' +
        "<strong>moonrise.</strong>" +
        '<nav aria-label="Footer">' +
          '<a href="login.html">Start</a><a href="download">Download</a><a href="orders">Orders</a>' +
          '<a href="ui-library">UI Library</a><a href="docs">Docs</a><a href="contact">Contact</a>' +
          '<a href="docs#privacy">Privacy</a><a href="docs#terms">Terms</a>' +
        "</nav>" +
        '<p class="lx-site-foot-note"><a href="mailto:trymoonrise@gmail.com">trymoonrise@gmail.com</a></p>' +
      "</footer>"),
    foot("columns", "Link columns",
      '<footer class="lx-site-foot is-columns">' +
        '<div class="lx-site-foot-brand"><strong>moonrise.</strong><p>Find a local shop, publish a site, and get paid when they go live.</p></div>' +
        '<div class="lx-site-foot-grid">' +
          footCol("Product", [["Start", "login.html"], ["Download", "download"], ["Orders", "orders"], ["UI Library", "ui-library"]]) +
          footCol("Resources", [["Docs", "docs"], ["Contact", "contact"], ["FAQ", "index.html#faq"], ["Business Finder", "leads.html"]]) +
          footCol("Sources", [["OpenStreetMap", "https://www.openstreetmap.org/"], ["OpenFreeMap", "https://openfreemap.org/"], ["Vercel", "https://vercel.com/"], ["GitHub", "https://github.com/trymoonrise/moonrise"]]) +
          footCol("Legal", [["Privacy", "docs#privacy"], ["Terms", "docs#terms"], ["Security", "docs#security"], ["License", "docs#license"]]) +
        "</div>" +
        '<div class="lx-site-foot-bar"><span>© 2026 Moonrise</span><span>trymoonrise.com</span></div>' +
      "</footer>"),
    foot("mega", "Mega footer",
      '<footer class="lx-site-foot is-mega">' +
        '<div class="lx-site-foot-top">' +
          '<div class="lx-site-foot-brand"><strong>moonrise.</strong><p>Private commercial studio for selling websites to local businesses.</p>' +
            '<a class="lx-site-foot-mail" href="mailto:trymoonrise@gmail.com">trymoonrise@gmail.com</a></div>' +
          '<div class="lx-site-foot-grid">' +
            footCol("Pages", [["Home", "index.html"], ["Start", "login.html"], ["Docs", "docs"], ["Contact", "contact"]]) +
            footCol("Studio", [["Leads", "leads.html"], ["Orders", "orders"], ["Download", "download"], ["UI Library", "ui-library"]]) +
            footCol("Sources", [["OpenStreetMap", "https://www.openstreetmap.org/"], ["OpenFreeMap", "https://openfreemap.org/"], ["Vercel", "https://vercel.com/"]]) +
          "</div>" +
        "</div>" +
        '<div class="lx-site-foot-bar">' +
          '<span>© 2026 Moonrise · Always credit Moonrise when you showcase the code.</span>' +
          '<nav><a href="docs#privacy">Privacy</a><a href="docs#terms">Terms</a><a href="docs#security">Security</a></nav>' +
        "</div>" +
      "</footer>"),
    foot("sources", "Sources strip",
      '<footer class="lx-site-foot is-sources">' +
        '<div class="lx-site-foot-brand"><strong>moonrise.</strong><p>Built with public map data and hosting you can trust.</p></div>' +
        '<ul class="lx-site-foot-sources">' +
          '<li><span>Maps</span><a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a></li>' +
          '<li><span>Tiles</span><a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a></li>' +
          '<li><span>Host</span><a href="https://vercel.com/" target="_blank" rel="noopener noreferrer">Vercel</a></li>' +
          '<li><span>Code</span><a href="https://github.com/trymoonrise/moonrise" target="_blank" rel="noopener noreferrer">GitHub</a></li>' +
        "</ul>" +
        '<div class="lx-site-foot-bar"><nav><a href="docs">Docs</a><a href="docs#privacy">Privacy</a><a href="docs#terms">Terms</a></nav><span>© 2026 Moonrise</span></div>' +
      "</footer>"),
    foot("newsletter", "Newsletter",
      '<footer class="lx-site-foot is-news">' +
        '<div class="lx-site-foot-news">' +
          "<div><strong>Stay in the loop</strong><p>Product notes and studio updates. No spam.</p></div>" +
          '<div class="lx-site-foot-form">' +
            '<label class="lx-vh" for="lx-foot-email">Email</label>' +
            '<input id="lx-foot-email" type="email" placeholder="you@shop.com" autocomplete="email">' +
            '<button type="button">Subscribe</button>' +
          "</div>" +
        "</div>" +
        '<div class="lx-site-foot-grid is-3">' +
          footCol("Product", [["Start", "login.html"], ["Download", "download"], ["Orders", "orders"]]) +
          footCol("Help", [["Docs", "docs"], ["FAQ", "index.html#faq"], ["Contact", "contact"]]) +
          footCol("Legal", [["Privacy", "docs#privacy"], ["Terms", "docs#terms"], ["Security", "docs#security"]]) +
        "</div>" +
        '<div class="lx-site-foot-bar"><span>moonrise.</span><span>© 2026</span></div>' +
      "</footer>"),
    foot("shop", "Local shop",
      '<footer class="lx-site-foot is-shop">' +
        '<div class="lx-site-foot-top">' +
          '<div class="lx-site-foot-brand"><strong>Harbor Coffee</strong><p>Pike Street · Open 7:00–4:00 · Call before you drive down.</p></div>' +
          '<div class="lx-site-foot-grid is-3">' +
            footCol("Visit", [["Hours", "#hours"], ["Menu", "#menu"], ["Directions", "#map"]]) +
            footCol("Contact", [["Call", "tel:+12065550100"], ["Email", "mailto:hello@harbor.example"], ["Instagram", "#"]]) +
            footCol("Site", [["Privacy", "#privacy"], ["Accessibility", "#a11y"], ["Made with Moonrise", "https://trymoonrise.com"]]) +
          "</div>" +
        "</div>" +
        '<div class="lx-site-foot-bar"><span>© 2026 Harbor Coffee</span><span>Site by Moonrise</span></div>' +
      "</footer>"),
    foot("minimal", "Minimal legal",
      '<footer class="lx-site-foot is-minimal">' +
        '<div><strong>moonrise.</strong><span>Find shops. Publish sites. Get paid.</span></div>' +
        '<nav aria-label="Legal"><a href="docs#privacy">Privacy</a><a href="docs#terms">Terms</a><a href="docs#security">Security</a><a href="contact">Contact</a></nav>' +
      "</footer>"),
    foot("dark", "Inverse",
      '<footer class="lx-site-foot is-columns is-dark">' +
        '<div class="lx-site-foot-brand"><strong>moonrise.</strong><p>Pages, sources, and legal links in one quiet close.</p></div>' +
        '<div class="lx-site-foot-grid">' +
          footCol("Pages", [["Home", "index.html"], ["Docs", "docs"], ["UI Library", "ui-library"], ["Contact", "contact"]]) +
          footCol("Sources", [["OpenStreetMap", "https://www.openstreetmap.org/"], ["OpenFreeMap", "https://openfreemap.org/"], ["Vercel", "https://vercel.com/"], ["GitHub", "https://github.com/trymoonrise/moonrise"]]) +
          footCol("Legal", [["Privacy", "docs#privacy"], ["Terms", "docs#terms"], ["License", "docs#license"]]) +
        "</div>" +
        '<div class="lx-site-foot-bar"><span>© 2026 Moonrise</span><a href="mailto:trymoonrise@gmail.com">trymoonrise@gmail.com</a></div>' +
      "</footer>",
      "lx-foot-stage is-dark")
  ]);

  const GALLERY_IMGS = [
    "assets/library/hero-coast.jpg",
    "assets/library/hero-coffee.jpg",
    "assets/library/hero-wind.jpg",
    "assets/library/cta-counter.jpg",
    "assets/library/client-nora.jpg",
    "assets/library/client-miles.jpg",
    "assets/library/client-ada.jpg",
    "assets/library/client-leo.jpg"
  ];

  function galImg(src, cls) {
    return '<figure class="' + (cls || "") + '"><img src="' + src + '" alt="" loading="lazy"></figure>';
  }

  function gal(id, title, html) {
    return card("galleries-" + id, title, html, { wide: true, stage: "lx-gal-stage" });
  }

  LX.spec("galleries", [], [
    gal("bento", "Bento",
      '<div class="lx-gal is-bento">' +
        galImg(GALLERY_IMGS[0], "is-hero") +
        galImg(GALLERY_IMGS[1]) +
        galImg(GALLERY_IMGS[2]) +
        galImg(GALLERY_IMGS[3]) +
        galImg(GALLERY_IMGS[4]) +
      "</div>"),
    gal("grid", "Even grid",
      '<div class="lx-gal is-grid">' +
        GALLERY_IMGS.slice(0, 6).map(function (src) { return galImg(src); }).join("") +
      "</div>"),
    gal("masonry", "Masonry",
      '<div class="lx-gal is-masonry">' +
        galImg(GALLERY_IMGS[0], "is-tall") +
        galImg(GALLERY_IMGS[5]) +
        galImg(GALLERY_IMGS[1], "is-tall") +
        galImg(GALLERY_IMGS[6]) +
        galImg(GALLERY_IMGS[2]) +
        galImg(GALLERY_IMGS[7], "is-tall") +
      "</div>"),
    gal("strip", "Film strip",
      '<div class="lx-gal is-strip">' +
        GALLERY_IMGS.slice(0, 5).map(function (src) { return galImg(src); }).join("") +
      "</div>"),
    gal("editorial", "Editorial",
      '<div class="lx-gal is-editorial">' +
        galImg(GALLERY_IMGS[2], "is-main") +
        galImg(GALLERY_IMGS[0], "is-side") +
        galImg(GALLERY_IMGS[3], "is-side") +
      "</div>"),
    gal("overlap", "Overlap",
      '<div class="lx-gal is-overlap">' +
        galImg(GALLERY_IMGS[1], "is-back") +
        galImg(GALLERY_IMGS[4], "is-mid") +
        galImg(GALLERY_IMGS[0], "is-front") +
      "</div>"),
    gal("faces", "Portrait row",
      '<div class="lx-gal is-faces">' +
        galImg(GALLERY_IMGS[4]) +
        galImg(GALLERY_IMGS[5]) +
        galImg(GALLERY_IMGS[6]) +
        galImg(GALLERY_IMGS[7]) +
      "</div>"),
    gal("spread", "Wide spread",
      '<div class="lx-gal is-spread">' +
        galImg(GALLERY_IMGS[0]) +
        galImg(GALLERY_IMGS[2]) +
      "</div>"),
    gal("stairs", "Stair steps",
      '<div class="lx-gal is-stairs">' +
        galImg(GALLERY_IMGS[3]) +
        galImg(GALLERY_IMGS[1]) +
        galImg(GALLERY_IMGS[2]) +
        galImg(GALLERY_IMGS[0]) +
      "</div>"),
    gal("mosaic", "Dense mosaic",
      '<div class="lx-gal is-mosaic">' +
        galImg(GALLERY_IMGS[0], "is-lg") +
        galImg(GALLERY_IMGS[4]) +
        galImg(GALLERY_IMGS[5]) +
        galImg(GALLERY_IMGS[1], "is-wide") +
        galImg(GALLERY_IMGS[6]) +
        galImg(GALLERY_IMGS[7]) +
        galImg(GALLERY_IMGS[2]) +
        galImg(GALLERY_IMGS[3], "is-wide") +
      "</div>")
  ]);

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

  function teamCard(id, title, html, wide) {
    return card("team-" + id, title, html, { wide: !!wide, stage: "lx-team-stage" });
  }

  LX.spec("team", [], [
    teamCard("row", "Portrait row",
      '<div class="lx-team-row">' +
        '<figure>' + avatar(IMG.nora, "lg") + "<figcaption><strong>Nora Lee</strong><span>Owner</span></figcaption></figure>" +
        '<figure>' + avatar(IMG.miles, "lg") + "<figcaption><strong>Miles Park</strong><span>Barista</span></figcaption></figure>" +
        '<figure>' + avatar(IMG.ada, "lg") + "<figcaption><strong>Ada Kim</strong><span>Roaster</span></figcaption></figure>" +
      "</div>", true),
    teamCard("cards", "People cards",
      '<div class="lx-team-cards">' +
        '<article><img src="' + IMG.leo + '" alt=""><div><strong>Leo Hart</strong><span>Manager</span></div></article>' +
        '<article><img src="' + IMG.nora + '" alt=""><div><strong>Nora Lee</strong><span>Owner</span></div></article>' +
        '<article><img src="' + IMG.miles + '" alt=""><div><strong>Miles Park</strong><span>Barista</span></div></article>' +
      "</div>", true),
    teamCard("stack", "Avatar stack",
      '<div class="lx-people">' + avatar(IMG.nora) + avatar(IMG.miles) + avatar(IMG.ada) + avatar(IMG.leo) + '<span class="lx-badge">+2</span></div>'),
    teamCard("split", "Featured person",
      '<div class="lx-team-split"><img src="' + IMG.ada + '" alt=""><div><strong>Ada Kim</strong><p>Roasts on Pike Street and keeps Friday hours honest.</p></div></div>', true),
    teamCard("grid", "Directory",
      '<div class="lx-team-grid">' +
        [IMG.nora, IMG.miles, IMG.ada, IMG.leo].map(function (src, i) {
          const names = ["Nora", "Miles", "Ada", "Leo"];
          return '<figure><img src="' + src + '" alt=""><figcaption>' + names[i] + "</figcaption></figure>";
        }).join("") +
      "</div>", true)
  ]);

  function quoteCard(id, title, html, wide) {
    return card("testimonials-" + id, title, html, { wide: !!wide, stage: "lx-quote-stage" });
  }

  LX.spec("testimonials", [], [
    quoteCard("portrait", "With portrait",
      '<figure class="lx-quote-card">' + avatar(IMG.nora, "lg") +
        '<blockquote>The new site lists our hours and the phone rings more.</blockquote>' +
        "<cite>Nora Lee · Harbor Coffee</cite></figure>"),
    quoteCard("photo", "Photo quote",
      '<figure class="lx-quote-photo"><img src="' + IMG.coffee + '" alt=""><figcaption><blockquote>Publish once. Update anytime.</blockquote><cite>Miles Park</cite></figcaption></figure>', true),
    quoteCard("stack", "Stack",
      '<div class="lx-quote-stack">' +
        '<article>' + avatar(IMG.ada) + "<blockquote>Leads land with a name and phone.</blockquote><cite>Ada Kim</cite></article>" +
        '<article>' + avatar(IMG.leo) + "<blockquote>Business Finder found our next client.</blockquote><cite>Leo Hart</cite></article>" +
      "</div>", true),
    quoteCard("wide", "Wide band",
      '<figure class="lx-quote-wide"><img src="' + IMG.coast + '" alt=""><blockquote>Find a shop. Publish the site. Keep the cut.</blockquote><cite>Harbor · example</cite></figure>', true)
  ]);

  addLayouts("text", ["surfaces-header", "type-display", "type-meta"]);

  LX.spec("borders", [], [
    card("borders-marks", "Corner marks", '<div class="lx-bracket-card"><div class="lx-read"><span>Visits</span><strong>128</strong></div><div class="lx-read"><span>Leads</span><strong>14</strong></div><div class="lx-read"><span>Sites</span><strong>3</strong></div></div>', { wide: true, stage: "lx-border-stage" }),
    card("borders-draw", "Draw speeds", '<div class="lx-beams"><div class="lx-beam is-quick"><i class="lx-beam-rotor" aria-hidden="true"></i><span>Short and quick</span></div><div class="lx-beam is-slow"><i class="lx-beam-rotor" aria-hidden="true"></i><span>Long and slow</span></div><div class="lx-beam is-thick"><i class="lx-beam-rotor" aria-hidden="true"></i><span>3px thick</span></div></div>', { wide: true, stage: "lx-border-stage" }),
    card("borders-ring", "Ring", '<div class="lx-ring"><span class="lx-ring-face"><img src="assets/library/client-nora.jpg" alt=""></span><span class="lx-ring-check">' + ico("check", "sm") + "</span></div>", { stage: "lx-border-stage" }),
    card("borders-drop", "Dashed drop", '<div class="lx-drop" role="button" tabindex="0"><svg class="lx-drop-frame" viewBox="0 0 448 240" preserveAspectRatio="none" aria-hidden="true"><rect x="6" y="6" width="436" height="228" rx="30" ry="30" fill="none" pathLength="100"/></svg><span class="lx-drop-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V8"/><path d="m8.5 11.5 3.5-3.5 3.5 3.5"/><path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5"/></svg></span><strong>Drop files here</strong><p>or browse from your device</p><span class="lx-drop-types">PDF · DOC · XLSX · CSV · PNG · JPG</span><button type="button" class="lx-drop-btn">Browse files</button></div>', { wide: true, stage: "lx-border-stage" }),
    card("borders-arc", "Partial stroke", '<p class="lx-arc"><i class="lx-arc-rotor" aria-hidden="true"></i><span>Borders are cool</span></p>', { stage: "lx-border-stage" }),
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

  const GRADS = [
    ["Sunrise", "sunrise", "Get started"],
    ["Ocean", "ocean", "Open studio"],
    ["Forest", "forest", "Claim lead"],
    ["Ember", "ember", "Go live"],
    ["Orchid", "orchid", "Invite"],
    ["Citrus", "citrus", "Publish"],
    ["Midnight", "midnight", "Continue"],
    ["Aurora", "aurora", "Explore"],
    ["Rose gold", "rosegold", "Upgrade"],
    ["Steel", "steel", "Download"]
  ];
  LX.spec("gradients", [], GRADS.map(function (row) {
    return card(
      "gradients-" + row[1],
      row[0],
      '<div class="lx-grad-card">' +
        '<div class="lx-grad-swatch is-' + row[1] + '" aria-hidden="true"></div>' +
        '<button type="button" class="lx-grad-btn is-' + row[1] + '">' + row[2] + "</button>" +
      "</div>",
      { stage: "lx-grad-stage" }
    );
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
    card("images-frame", "Frame", pic(IMG.coast, "tall") + '<p class="lx-meta">Pike Street · example</p>'),
    card("images-caption", "Caption", pic(IMG.counter, "sm") + '<p class="lx-p">The counter, morning.</p>'),
    card("images-round", "Rounded", pic(IMG.coffee, "sm round")),
    card("images-duo", "Duo", '<div class="lx-cols">' + pic(IMG.wind, "sm") + pic(IMG.coast, "sm") + "</div>", { wide: true }),
    card("images-bleed", "Full width", pic(IMG.coffee, "bleed"), { wide: true }),
    card("images-credit", "Credit", pic(IMG.wind, "sm") + '<p class="lx-meta">Photo · Harbor</p>'),
    card("images-fallback", "Fallback", '<div class="lx-empty"><span class="lx-avatar">?</span><p class="lx-p">Image unavailable</p></div>'),
    card("images-crop", "Crop", avatar(IMG.nora, "lg")),
    card("images-zoom", "Selected", pic(IMG.counter, "sm selected")),
    card("images-trio", "Trio", '<div class="lx-img-trio">' + pic(IMG.coast) + pic(IMG.coffee) + pic(IMG.wind) + "</div>", { wide: true })
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

  function scene(kind, inner) {
    return '<div class="lx-scroll-scene is-' + kind + '" data-lx-scene="' + kind + '">' +
      '<p class="lx-scene-hint">Scroll inside</p>' + inner + "</div>";
  }

  function sceneCard(id, title, kind, inner) {
    return card("scroll-effects-" + id, title, scene(kind, inner), { wide: true, stage: "lx-scene-stage" });
  }

  LX.spec("scroll-effects", [], [
    sceneCard("hero-lock", "Hero lock", "hero-lock",
      '<div class="lx-scene-lock">' +
        '<section class="lx-scene-hero">' +
          '<img class="lx-scene-hero-media" src="assets/library/hero-coast.jpg" alt="">' +
          '<div class="lx-scene-hero-copy"><p class="lx-scene-kicker">Harbor Coffee</p><h4>Build websites.<br>Get paid.</h4><p>Find a shop. Publish the site. Keep the cut.</p></div>' +
        "</section>" +
        '<section class="lx-scene-cover is-dark"><p class="lx-scene-kicker">How it works</p><h4>Find it. Build it.<br>Sell it.</h4><p>The next band slides over the locked hero.</p></section>' +
        '<section class="lx-scene-cover is-light"><p class="lx-scene-kicker">Next</p><h4>Keep scrolling</h4><p>Each panel sits above the sticky frame.</p></section>' +
      "</div>"),
    sceneCard("hero-shrink", "Hero shrink", "hero-shrink",
      '<div class="lx-scene-lock">' +
        '<section class="lx-scene-hero" data-lx-shrink>' +
          '<img class="lx-scene-hero-media" src="assets/library/hero-coffee.jpg" alt="">' +
          '<div class="lx-scene-hero-copy"><p class="lx-scene-kicker">Studio</p><h4>The shop is the picture</h4></div>' +
        "</section>" +
        '<section class="lx-scene-cover is-dark"><p class="lx-scene-kicker">After</p><h4>Hours and a phone</h4><p>The hero softens as this panel covers it.</p></section>' +
        '<section class="lx-scene-cover is-light"><p class="lx-scene-kicker">Done</p><h4>One live link</h4><p>Publish again after an edit.</p></section>' +
      "</div>"),
    sceneCard("h-scrub", "Horizontal scrub", "h-scrub",
      '<div class="lx-scene-scrub" data-lx-scrub>' +
        '<div class="lx-scene-scrub-sticky">' +
          '<div class="lx-scene-scrub-row" data-lx-scrub-row>' +
            '<article class="lx-scene-panel"><span>01</span><strong>Leads</strong><p>Claim a shop nearby.</p></article>' +
            '<article class="lx-scene-panel"><span>02</span><strong>Build</strong><p>Fill the hours and phone.</p></article>' +
            '<article class="lx-scene-panel"><span>03</span><strong>Publish</strong><p>Share one live link.</p></article>' +
            '<article class="lx-scene-panel"><span>04</span><strong>Paid</strong><p>They checkout. You keep 90%.</p></article>' +
          "</div>" +
        "</div>" +
      "</div>"),
    sceneCard("pin-stack", "Pinned stack", "pin-stack",
      '<div class="lx-scene-stack">' +
        '<article class="lx-scene-pin" style="--i:0"><strong>Draft</strong><p>Write the first screen.</p></article>' +
        '<article class="lx-scene-pin" style="--i:1"><strong>Review</strong><p>Check hours and phone.</p></article>' +
        '<article class="lx-scene-pin" style="--i:2"><strong>Publish</strong><p>Put the site live.</p></article>' +
        '<article class="lx-scene-pin" style="--i:3"><strong>Earn</strong><p>Collect when they pay.</p></article>' +
      "</div>"),
    sceneCard("snap-gallery", "Snap gallery", "snap-gallery",
      '<div class="lx-scene-snap" data-lx-scrub>' +
        '<div class="lx-scene-scrub-sticky">' +
          '<div class="lx-scene-snap-row" data-lx-scrub-row>' +
            '<figure class="lx-scene-slide"><img src="assets/library/hero-coast.jpg" alt=""><figcaption>Coast</figcaption></figure>' +
            '<figure class="lx-scene-slide"><img src="assets/library/hero-coffee.jpg" alt=""><figcaption>Counter</figcaption></figure>' +
            '<figure class="lx-scene-slide"><img src="assets/library/cta-counter.jpg" alt=""><figcaption>Shop</figcaption></figure>' +
            '<figure class="lx-scene-slide"><img src="assets/library/hero-wind.jpg" alt=""><figcaption>Wind</figcaption></figure>' +
          "</div>" +
        "</div>" +
      "</div>"),
    sceneCard("parallax", "Parallax layers", "parallax",
      '<div class="lx-scene-parallax" data-lx-parallax>' +
        '<div class="lx-scene-para-sticky">' +
          '<div class="lx-scene-para-layer is-back" data-lx-para="0.25"><img src="assets/library/hero-wind.jpg" alt=""></div>' +
          '<div class="lx-scene-para-layer is-mid" data-lx-para="0.55"><span>Harbor</span></div>' +
          '<div class="lx-scene-para-layer is-fore" data-lx-para="0.9"><strong>Open at 7</strong><p>Layers move at different rates.</p></div>' +
        "</div>" +
      "</div>"),
    sceneCard("curtain", "Curtain reveal", "curtain",
      '<div class="lx-scene-lock">' +
        '<section class="lx-scene-hero is-plain">' +
          '<div class="lx-scene-hero-copy"><p class="lx-scene-kicker">Under</p><h4>The page underneath</h4><p>Hours, phone, and the first screen stay here.</p></div>' +
        "</section>" +
        '<section class="lx-scene-curtain"><p class="lx-scene-kicker">Reveal</p><h4>This panel peels up</h4><p>A rounded curtain slides over the quiet page below.</p></section>' +
        '<section class="lx-scene-cover is-light"><p class="lx-scene-kicker">Then</p><h4>Keep going</h4><p>Another band follows the peel.</p></section>' +
      "</div>"),
    sceneCard("progress-rail", "Progress rail", "progress-rail",
      '<div class="lx-scene-rail" data-lx-rail>' +
        '<aside class="lx-scene-rail-nav" aria-label="Steps">' +
          '<button type="button" class="is-on" data-lx-rail-step="0">Site</button>' +
          '<button type="button" data-lx-rail-step="1">Hours</button>' +
          '<button type="button" data-lx-rail-step="2">Publish</button>' +
          '<button type="button" data-lx-rail-step="3">Paid</button>' +
        "</aside>" +
        '<div class="lx-scene-rail-main">' +
          '<section data-lx-rail-panel><h4>Site</h4><p>Name the shop and pick a look.</p></section>' +
          '<section data-lx-rail-panel><h4>Hours</h4><p>Write when the door is open.</p></section>' +
          '<section data-lx-rail-panel><h4>Publish</h4><p>Put one link on the street.</p></section>' +
          '<section data-lx-rail-panel><h4>Paid</h4><p>They checkout. You keep most of it.</p></section>' +
        "</div>" +
      "</div>"),
    sceneCard("phone-spin", "Phone rotate", "device-phone", deviceScene("phone",
      "assets/library/hero-coffee.jpg", "Harbor Coffee", "Open at 7 · Pike Street")),
    sceneCard("ipad-spin", "iPad rotate", "device-ipad", deviceScene("ipad",
      "assets/library/hero-coast.jpg", "Business Finder", "Claim a shop on the map")),
    sceneCard("laptop-spin", "Laptop rotate", "device-laptop", deviceScene("laptop",
      "assets/library/hero-wind.jpg", "Moonrise Studio", "Publish once. Update anytime."))
  ]);

  function deviceScreen(src, title, line) {
    return '<div class="lx-device-screen">' +
      '<img src="' + src + '" alt="" data-lx-depth="0.55">' +
      '<div class="lx-device-ui" data-lx-depth="0.92"><span></span><strong>' + title + "</strong><p>" + line + "</p></div>" +
      "</div>";
  }

  function deviceSpace() {
    return '<div class="lx-device-space" aria-hidden="true">' +
      '<i class="lx-device-orb is-a" data-lx-depth="0.18"></i>' +
      '<i class="lx-device-orb is-b" data-lx-depth="0.42"></i>' +
      '<i class="lx-device-orb is-c" data-lx-depth="0.68"></i>' +
      '<i class="lx-device-plane is-back" data-lx-depth="0.12"></i>' +
      '<i class="lx-device-plane is-mid" data-lx-depth="0.3"></i>' +
      "</div>";
  }

  function deviceScene(kind, src, title, line) {
    if (kind === "phone") {
      return '<div class="lx-scene-device" data-lx-device>' +
        '<div class="lx-scene-device-sticky">' +
          deviceSpace() +
          '<div class="lx-device is-phone" data-lx-device-spin>' +
            '<i class="lx-device-shadow" data-lx-depth="0.22" aria-hidden="true"></i>' +
            '<i class="lx-device-btn is-silent" aria-hidden="true"></i>' +
            '<i class="lx-device-btn is-vol-up" aria-hidden="true"></i>' +
            '<i class="lx-device-btn is-vol-down" aria-hidden="true"></i>' +
            '<i class="lx-device-btn is-power" aria-hidden="true"></i>' +
            '<div class="lx-device-shell">' +
              '<span class="lx-device-island" aria-hidden="true"></span>' +
              deviceScreen(src, title, line) +
              '<span class="lx-device-home" aria-hidden="true"></span>' +
            "</div>" +
            '<span class="lx-device-glare" data-lx-depth="0.75" aria-hidden="true"></span>' +
          "</div>" +
          '<p class="lx-device-caption">Scroll for 3D parallax</p>' +
        "</div></div>";
    }
    if (kind === "ipad") {
      return '<div class="lx-scene-device" data-lx-device>' +
        '<div class="lx-scene-device-sticky">' +
          deviceSpace() +
          '<div class="lx-device is-ipad" data-lx-device-spin>' +
            '<i class="lx-device-shadow" data-lx-depth="0.22" aria-hidden="true"></i>' +
            '<i class="lx-device-btn is-power" aria-hidden="true"></i>' +
            '<div class="lx-device-shell">' +
              '<span class="lx-device-cam" aria-hidden="true"></span>' +
              deviceScreen(src, title, line) +
              '<span class="lx-device-home" aria-hidden="true"></span>' +
            "</div>" +
            '<span class="lx-device-glare" data-lx-depth="0.75" aria-hidden="true"></span>' +
          "</div>" +
          '<p class="lx-device-caption">Scroll for 3D parallax</p>' +
        "</div></div>";
    }
    return '<div class="lx-scene-device" data-lx-device>' +
      '<div class="lx-scene-device-sticky">' +
        deviceSpace() +
        '<div class="lx-device is-laptop" data-lx-device-spin>' +
          '<i class="lx-device-shadow is-wide" data-lx-depth="0.2" aria-hidden="true"></i>' +
          '<div class="lx-device-lid" data-lx-depth="0.35">' +
            '<div class="lx-device-shell">' +
              '<span class="lx-device-cam" aria-hidden="true"></span>' +
              deviceScreen(src, title, line) +
            "</div>" +
            '<span class="lx-device-glare" data-lx-depth="0.8" aria-hidden="true"></span>' +
          "</div>" +
          '<div class="lx-device-hinge" aria-hidden="true"></div>' +
          '<div class="lx-device-base" data-lx-depth="0.15" aria-hidden="true">' +
            '<div class="lx-device-keys"></div>' +
            '<div class="lx-device-track"></div>' +
          "</div>" +
        "</div>" +
        '<p class="lx-device-caption">Scroll for 3D parallax</p>' +
      "</div></div>";
  }

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

  function videoCard(id, title, html, stage) {
    return card("videos-" + id, title, html, { wide: true, stage: stage || "lx-player-stage" });
  }

  LX.spec("videos", ["media-scrub"], [
    videoCard("play", "Click to play",
      '<figure class="lx-player"><p class="lx-player-cue">Click the video to play</p><i class="lx-player-stem" aria-hidden="true"></i><button type="button" class="lx-player-frame" data-lx-player aria-label="Play video"><video muted loop playsinline preload="metadata" poster="' + IMG.coast + '" src="' + IMG.ocean + '"></video><span class="lx-player-title">the coast, in motion</span></button></figure>'),
    videoCard("auto", "Autoplay loop",
      '<figure class="lx-vid is-frame"><video autoplay muted loop playsinline preload="metadata" poster="' + IMG.coast + '" src="' + IMG.ocean + '"></video></figure>'),
    videoCard("cover", "Cover still",
      '<figure class="lx-vid is-cover"><button type="button" class="lx-vid-hit" data-lx-player aria-label="Play video"><video muted loop playsinline preload="metadata" poster="' + IMG.coast + '" src="' + IMG.ocean + '"></video><span class="lx-vid-mark" aria-hidden="true"></span></button></figure>'),
    videoCard("split", "Video and still",
      '<div class="lx-vid-split"><figure class="lx-vid is-frame"><video autoplay muted loop playsinline preload="metadata" poster="' + IMG.coast + '" src="' + IMG.ocean + '"></video></figure>' + pic(IMG.coffee, "tall") + "</div>"),
    videoCard("poster", "Poster card",
      '<figure class="lx-vid is-poster"><img src="' + IMG.wind + '" alt=""><span class="lx-vid-badge">Film</span></figure>')
  ]);
})();
