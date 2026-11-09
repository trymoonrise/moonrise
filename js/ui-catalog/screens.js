(function () {
  "use strict";
  const LX = window.LX;
  const card = LX.card.bind(LX);
  const btn = LX.btn;
  const ico = LX.ico;

  function screen(id, title, html) {
    return card(id, title, html, { wide: true, stage: "lx-tall" });
  }
  function gate(title, body) {
    return '<div class="lx-panel" style="max-width:22rem;margin:0 auto"><p class="lx-kicker">Example</p><p class="lx-h">' + title + "</p>" + body + "</div>";
  }

  LX.spec("authentication", [], [
    screen("auth-in", "Sign in", gate("Sign in", LX.field("Email", "focus", "") + LX.field("Password", "", "") + btn("Sign in"))),
    screen("auth-up", "Sign up", gate("Create account", LX.field("Name", "", "Ada") + LX.field("Email", "focus", "") + btn("Create"))),
    screen("auth-forgot", "Forgot", gate("Reset password", LX.field("Email", "focus", "ada@harbor.test") + btn("Send link"))),
    screen("auth-check", "Check email", gate("Check your email", '<p class="lx-p">A link is on its way to ada@harbor.test.</p>')),
    screen("auth-new", "New password", gate("New password", LX.field("Password", "focus", "") + LX.field("Confirm", "", "") + btn("Save"))),
    screen("auth-expired", "Expired", gate("Link expired", '<p class="lx-p">Ask for a new sign-in link.</p>' + btn("Send again", "ghost"))),
    screen("auth-out", "Signed out", gate("Signed out", '<p class="lx-p">Sign in to open the studio.</p>' + btn("Sign in"))),
    screen("auth-two", "Two-factor", gate("Code", '<div class="lx-codes"><i class="is-on">2</i><i class="is-on">0</i><i></i><i></i><i></i><i></i></div><label class="lx-row">' + '<button type="button" class="lx-check" data-lx-check aria-label="Trust"></button><span>Trust this browser</span></label>')),
    screen("auth-locked", "Locked", gate("Account locked", '<div class="lx-alert is-warn"><span class="lx-dot warn"></span><span>Try again in 15 minutes</span></div>')),
    screen("auth-pick", "Pick an account", gate("Choose account", '<button type="button" class="lx-row is-on" data-lx-opt style="width:100%;border:0;background:var(--dt-action-soft)"><span class="lx-avatar sm">HK</span><span>Harbor</span></button><button type="button" class="lx-row" data-lx-opt style="width:100%;border:0;background:transparent"><span class="lx-avatar sm">NL</span><span>Northline</span></button>'))
  ]);

  const FLOW = [
    ["Site", "Name the business", LX.field("Name", "focus", "Harbor Coffee")],
    ["Work", "What do you do?", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>Cafe</button><button type="button" class="lx-chip" data-lx-opt>Shop</button></div>'],
    ["Hours", "When are you open?", LX.field("Friday", "", "7–5")],
    ["Phone", "How do people call?", LX.field("Phone", "focus", "206")],
    ["Address", "Where are you?", LX.field("Street", "", "Pike Street")],
    ["Photo", "Add a photo of the place", '<div class="lx-ph sm"></div>'],
    ["Leads", "Where should leads go?", LX.field("Email", "focus", "ada@harbor.test")],
    ["Review", "Check the draft", '<div class="lx-row"><span>Name</span><span>Harbor</span></div><div class="lx-row"><span>Hours</span><span>Fri 7–5</span></div>'],
    ["Publish", "Send the live link", '<p class="lx-p">The link stays the same if you publish again.</p>' + btn("Publish")],
    ["Done", "The site is live", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Harbor is published</span></div>']
  ];
  LX.spec("onboarding-flows", [], FLOW.map(function (row, i) {
    return screen("flow-" + i, row[0], '<p class="lx-kicker">Step ' + (i + 1) + " of 10</p><p class=\"lx-h\">" + row[1] + "</p>" + row[2] + '<div class="lx-actions">' + btn("Back", "ghost") + btn("Next") + "</div>");
  }));

  LX.spec("nav-systems", [], [
    screen("navsys-top", "Top bar", LX.app(["Sites", "Leads", "Guide"], "Sites", '<p class="lx-h">Sites</p><div class="lx-row"><span>Harbor</span><span class="lx-badge go">Live</span></div>', true)),
    screen("navsys-side", "Sidebar", LX.app(["Sites", "Leads", "Guide", "You"], "Leads", '<p class="lx-h">Leads</p><div class="lx-row"><span>Ada</span><span class="lx-meta">Today</span></div>')),
    screen("navsys-both", "Both", '<div class="lx-app"><div class="lx-side"><button type="button" class="is-on">Sites</button><button type="button">Leads</button></div><div class="lx-main"><div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>All</button><button type="button" class="lx-tab" data-lx-opt>Live</button></div><div class="lx-row"><span>Harbor</span></div></div></div>'),
    screen("navsys-drawer", "Drawer", '<div class="lx-stage-dim" style="justify-items:start"><div class="lx-side" style="background:#fff;min-height:10rem"><button type="button" class="is-on">Sites</button><button type="button">Guide</button></div></div>'),
    screen("navsys-crumbs", "Breadcrumbs", '<p class="lx-meta">Sites / Harbor</p><p class="lx-h">Harbor Coffee</p>'),
    screen("navsys-tabs", "Section tabs", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>Edit</button><button type="button" class="lx-tab" data-lx-opt>Leads</button><button type="button" class="lx-tab" data-lx-opt>Publish</button></div><p class="lx-p">Friday hours</p>'),
    screen("navsys-command", "Command", '<div class="lx-panel"><input class="lx-input is-focus" placeholder="Jump to" aria-label="Jump"><div class="lx-row"><span>Publish Harbor</span></div><div class="lx-row"><span>Open leads</span></div></div>'),
    screen("navsys-footer", "Footer nav", '<div class="lx-foot"><span>Sites</span><span class="lx-tab is-on">Leads</span><span>You</span></div>'),
    screen("navsys-inverse", "Inverse", '<div class="lx-top" style="background:#161616"><button type="button" class="is-on">Sites</button><button type="button">Guide</button></div>', { }),
    screen("navsys-title", "Page title", '<p class="lx-kicker">Studio</p><div class="lx-row"><p class="lx-h">Harbor</p>' + btn("Publish", "compact") + "</div>")
  ]);

  function table(rows) {
    return '<table class="lx-table"><tr><th></th><th>Site</th><th class="num">Leads</th></tr>' + rows + "</table>";
  }
  LX.spec("data-tables", [], [
    screen("dtab-simple", "Simple", table("<tr><td></td><td>Harbor</td><td class=\"num\">14</td></tr><tr><td></td><td>Northline</td><td class=\"num\">3</td></tr>")),
    screen("dtab-sort", "Sortable", table("<tr><td></td><td>Northline</td><td class=\"num\">3</td></tr><tr><td></td><td>Harbor</td><td class=\"num\">14</td></tr>") + '<p class="lx-meta">Sorted by leads</p>'),
    screen("dtab-select", "Selectable", table('<tr class="is-on"><td><button type="button" class="lx-check is-on" data-lx-check aria-label="Select"></button></td><td>Harbor</td><td class="num">14</td></tr>')),
    screen("dtab-sticky", "Sticky head", '<div class="lx-scroll thin">' + table("<tr><td></td><td>Mon</td><td class=\"num\">7</td></tr><tr><td></td><td>Tue</td><td class=\"num\">4</td></tr><tr><td></td><td>Wed</td><td class=\"num\">9</td></tr>") + "</div>"),
    screen("dtab-actions", "Row actions", table("<tr><td></td><td>Harbor</td><td class=\"num\"><button type=\"button\" class=\"lx-textbtn\">Open</button></td></tr>")),
    screen("dtab-pages", "Pagination", table("<tr><td></td><td>Harbor</td><td class=\"num\">14</td></tr>") + '<div class="lx-pages"><button type="button" class="lx-page is-on">1</button><button type="button" class="lx-page">2</button></div>'),
    screen("dtab-dense", "Dense", '<table class="lx-table"><tr><td class="lx-mono">01</td><td>Pike</td><td class="num">12</td></tr><tr><td class="lx-mono">02</td><td>Union</td><td class="num">4</td></tr></table>'),
    screen("dtab-empty", "Empty", table("") + '<div class="lx-empty"><p class="lx-p">No sites in this view</p></div>'),
    screen("dtab-loading", "Loading", '<div class="lx-skel"></div><div class="lx-skel"></div><div class="lx-skel" style="width:40%"></div>'),
    screen("dtab-num", "Numeric", '<table class="lx-table"><tr><th>Week</th><th class="num">Visits</th></tr><tr><td>This week</td><td class="num">128</td></tr><tr><td>Last week</td><td class="num">116</td></tr></table>')
  ]);

  LX.spec("data-viz", [], [
    screen("viz-kpi", "KPI and spark", '<div class="lx-stat"><strong>128</strong><span>visits</span></div><svg class="lx-chart" viewBox="0 0 120 36" style="height:2.2rem"><polyline fill="none" stroke="#1f6fed" stroke-width="1.5" points="2,28 30,20 60,22 90,8 118,12"/></svg>'),
    screen("viz-compare", "Comparison", '<div class="lx-cols"><div><p class="lx-kicker">This week</p><p class="lx-mono">128</p></div><div class="is-pick"><p class="lx-kicker">Last week</p><p class="lx-mono">116</p></div></div>'),
    screen("viz-dist", "Distribution", '<div class="lx-bar flat"><span style="width:80%"></span></div><p class="lx-meta">Most visits on Friday</p>'),
    screen("viz-funnel", "Funnel", '<div class="lx-bar flat"><span style="width:100%"></span></div><div class="lx-bar flat" style="margin-top:6px"><span style="width:60%"></span></div><div class="lx-bar flat" style="margin-top:6px"><span class="go" style="width:22%"></span></div>'),
    screen("viz-heat", "Heat", '<div class="lx-tiles" style="grid-template-rows:28px 28px"><i style="background:#111"></i><i style="background:#c8c8cc"></i><i style="background:#e4e4e7"></i><i style="background:#8a8a8a"></i></div>'),
    screen("viz-goal", "Goal", '<div class="lx-bar"><span class="go" style="width:70%"></span></div><p class="lx-meta">70 of 100</p>'),
    screen("viz-break", "Breakdown", '<div class="lx-legend"><span><i class="lx-swatch"></i> Direct 70</span><span><i class="lx-swatch soft"></i> Link 30</span></div>'),
    screen("viz-time", "Time series", '<svg class="lx-chart" viewBox="0 0 180 70"><polyline fill="none" stroke="#111" stroke-width="1.5" points="4,50 40,46 80,30 120,34 176,16"/></svg>'),
    screen("viz-table", "Table and bar", '<div class="lx-row"><span>Harbor</span><div class="lx-bar flat" style="width:8rem"><span style="width:80%"></span></div></div>'),
    screen("viz-empty", "Empty", '<div class="lx-empty"><p class="lx-h">No figures yet</p><p class="lx-p">They appear after the site is live.</p></div>')
  ]);

  LX.spec("file-management", [], [
    screen("files-grid", "Grid", '<div class="lx-tiles"><i></i><i></i><i></i><i></i></div>'),
    screen("files-list", "List", '<div class="lx-row">' + ico("file", "sm") + "<span>counter.jpg</span><span class=\"lx-meta\">240 KB</span></div><div class=\"lx-row\">" + ico("file", "sm") + "<span>street.jpg</span></div>"),
    screen("files-drop", "Upload", '<div class="lx-pad" style="border-color:var(--dt-action)">Drop photos</div>'),
    screen("files-select", "Selection", '<div class="lx-row" style="background:var(--dt-action-soft)">' + ico("image", "sm") + "<span>counter.jpg</span><span class=\"lx-badge go\">1</span></div>"),
    screen("files-rename", "Rename", LX.field("Name", "focus", "counter.jpg") + btn("Rename")),
    screen("files-crumbs", "Path", '<p class="lx-meta">Sites / Harbor / photos</p>' + '<div class="lx-row"><span>counter.jpg</span></div>'),
    screen("files-empty", "Empty", '<div class="lx-empty"><p class="lx-h">No files</p>' + btn("Upload", "ghost") + "</div>"),
    screen("files-quota", "Space", '<div class="lx-bar"><span style="width:35%"></span></div><p class="lx-meta">35 MB of 100 MB</p>'),
    screen("files-preview", "Preview", '<div class="lx-cols"><div class="lx-ph tall"></div><div><p class="lx-h">counter.jpg</p><p class="lx-meta">240 KB</p></div></div>'),
    screen("files-trash", "Trash", '<div class="lx-dialog"><strong>Delete counter.jpg?</strong><p class="lx-p">This removes the photo from the site.</p><div class="lx-actions">' + btn("Cancel", "ghost") + btn("Delete", "danger") + "</div></div>")
  ]);

  LX.spec("search-interfaces", [], [
    screen("searchui-field", "Field", '<label class="lx-field is-focus"><span>Search</span><span class="lx-input-wrap">' + ico("search", "sm") + '<input placeholder="Sites, leads" aria-label="Search"></span></label>'),
    screen("searchui-results", "Results", '<div class="lx-row"><span>Harbor Coffee</span><span class="lx-meta">Site</span></div><div class="lx-row"><span>Ada</span><span class="lx-meta">Lead</span></div>'),
    screen("searchui-filters", "Filters", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>All</button><button type="button" class="lx-chip" data-lx-opt>Sites</button><button type="button" class="lx-chip" data-lx-opt>Leads</button></div>'),
    screen("searchui-recent", "Recent", '<p class="lx-kicker">Recent</p><div class="lx-row"><span>Harbor</span></div><div class="lx-row"><span>Hours</span></div>'),
    screen("searchui-none", "No results", '<div class="lx-empty"><p class="lx-h">No matches</p><p class="lx-p">Try a shorter name.</p></div>'),
    screen("searchui-group", "Grouped", '<p class="lx-kicker">Sites</p><div class="lx-row"><span>Harbor</span></div><p class="lx-kicker">Leads</p><div class="lx-row"><span>Ada</span></div>'),
    screen("searchui-command", "Command", '<div class="lx-panel"><input class="lx-input is-focus" placeholder="Search" aria-label="Search"><div class="lx-row"><span>Publish</span><span class="lx-mono">↵</span></div></div>'),
    screen("searchui-hit", "Highlight", '<div class="lx-row"><span>Har<span style="background:var(--dt-action-soft)">bor</span></span></div>'),
    screen("searchui-loading", "Loading", '<div class="lx-skel"></div><div class="lx-skel" style="width:70%"></div>'),
    screen("searchui-scope", "Scope", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>This site</button><button type="button" class="lx-chip" data-lx-opt>All sites</button></div>')
  ]);

  LX.spec("profile-screens", [], [
    screen("pscreen-header", "Header", '<div class="lx-row"><span class="lx-avatar lg">HK</span><div><p class="lx-h">Harbor Coffee</p><p class="lx-meta">Pike Street · Live</p></div></div>'),
    screen("pscreen-stats", "Stats", '<div class="lx-stats"><div class="lx-stat"><strong>128</strong><span>visits</span></div><div class="lx-stat"><strong>14</strong><span>leads</span></div></div>'),
    screen("pscreen-contact", "Contact", '<div class="lx-row"><span>Phone</span><a class="lx-link" href="tel:2065550100">206 555 0100</a></div><div class="lx-row"><span>Email</span><span>ada@harbor.test</span></div>'),
    screen("pscreen-edit", "Edit", LX.field("Name", "focus", "Harbor Coffee") + LX.field("Line", "", "Coffee on Pike") + btn("Save")),
    screen("pscreen-public", "Public", '<div class="lx-tile"><p class="lx-h">Harbor Coffee</p><p class="lx-p">Open at 7. Pike Street.</p>' + btn("Call", "ghost") + "</div>"),
    screen("pscreen-activity", "Activity", '<div class="lx-row"><span>Published</span><span class="lx-meta">Today 9:00</span></div><div class="lx-row"><span>Lead</span><span class="lx-meta">Today 9:14</span></div>'),
    screen("pscreen-empty", "Empty", '<div class="lx-empty"><p class="lx-h">Profile is thin</p><p class="lx-p">Add hours and a phone.</p></div>'),
    screen("pscreen-compact", "Compact", '<div class="lx-row"><span class="lx-avatar">HK</span><span>Harbor</span><span class="lx-badge go">Live</span></div>'),
    screen("pscreen-inverse", "Inverse", '<p class="lx-h">Harbor Coffee</p><p class="lx-p">Pike Street</p>'),
    screen("pscreen-tabs", "Tabs", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>About</button><button type="button" class="lx-tab" data-lx-opt>Hours</button><button type="button" class="lx-tab" data-lx-opt>Leads</button></div><p class="lx-p">Coffee on Pike, open at 7.</p>')
  ]);

  const SETTINGS = [
    ["Account", LX.field("Email", "focus", "ada@harbor.test")],
    ["Billing", '<div class="lx-stat"><strong>$48</strong><span>this month</span></div>'],
    ["Notifications", '<label class="lx-row"><span>Email leads</span><button type="button" class="lx-toggle is-on" data-lx-toggle aria-label="Email leads"></button></label>'],
    ["Domain", LX.field("Link", "", "harbor.trymoonrise.com")],
    ["Danger zone", '<p class="lx-p">Delete the Harbor site.</p>' + btn("Delete site", "danger")],
    ["Profile", LX.field("Name", "focus", "Ada")],
    ["Team", '<div class="lx-row"><span class="lx-avatar sm">AD</span><span>Ada</span><span class="lx-meta">Owner</span></div>'],
    ["Appearance", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>Light</button><button type="button" class="lx-chip" data-lx-opt>Ink</button></div>'],
    ["Saved", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Saved</span></div>'],
    ["Connected", '<div class="lx-row"><span>Stripe</span><span class="lx-badge ok">Connected</span></div>']
  ];
  LX.spec("settings", [], SETTINGS.map(function (row) {
    return screen("settings-" + row[0].toLowerCase().replace(/\s/g, "-"), row[0], LX.app(["Account", "Billing", "Notifications", "Domain"], row[0] === "Account" || row[0] === "Billing" || row[0] === "Notifications" || row[0] === "Domain" ? row[0] : "Account", "<p class=\"lx-h\">" + row[0] + "</p>" + row[1]));
  }));

  LX.spec("notification-center", [], [
    screen("inbox-list", "Inbox", '<div class="lx-row"><span class="lx-dot"></span><span>New lead · Ada</span><span class="lx-meta">9:14</span></div><div class="lx-row"><span class="lx-dot mute"></span><span>Site published</span></div>'),
    screen("inbox-unread", "Unread", '<div class="lx-row" style="background:var(--dt-action-soft)"><span class="lx-dot"></span><span>New lead</span></div>'),
    screen("inbox-filters", "Filters", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>All</button><button type="button" class="lx-chip" data-lx-opt>Unread</button></div>'),
    screen("inbox-empty", "Empty", '<div class="lx-empty"><p class="lx-h">No notifications</p></div>'),
    screen("inbox-detail", "Detail", '<p class="lx-h">New lead</p><p class="lx-p">Ada asked about Friday hours.</p>' + btn("Open lead")),
    screen("inbox-days", "By day", '<p class="lx-kicker">Today</p><div class="lx-row"><span>Lead</span></div><p class="lx-kicker">Yesterday</p><div class="lx-row"><span>Publish</span></div>'),
    screen("inbox-all", "Mark all", '<div class="lx-row"><span>2 unread</span><button type="button" class="lx-textbtn">Mark all read</button></div>'),
    screen("inbox-prefs", "Preferences", '<label class="lx-row"><span>Leads</span><button type="button" class="lx-toggle is-on" data-lx-toggle aria-label="Leads"></button></label>'),
    screen("inbox-toast", "With toast", '<div class="lx-toast"><span>Lead saved</span></div><div class="lx-row"><span>Ada</span></div>'),
    screen("inbox-loading", "Loading", '<div class="lx-skel"></div><div class="lx-skel" style="width:80%"></div>')
  ]);

  LX.spec("form-systems", [], [
    screen("fsys-wizard", "Wizard", '<p class="lx-kicker">Step 2 of 3</p>' + LX.field("Hours", "focus", "7–5") + '<div class="lx-actions">' + btn("Back", "ghost") + btn("Next") + "</div>"),
    screen("fsys-settings", "Settings form", LX.field("Name", "", "Harbor") + LX.field("Phone", "focus", "206") + btn("Save")),
    screen("fsys-multi", "Sections", '<p class="lx-kicker">Place</p>' + LX.field("Street", "", "Pike") + '<p class="lx-kicker">Contact</p>' + LX.field("Phone", "", "206")),
    screen("fsys-review", "Review", '<div class="lx-row"><span>Name</span><span>Harbor</span></div><div class="lx-row"><span>Hours</span><span>Fri 7–5</span></div>' + btn("Publish")),
    screen("fsys-save", "Autosave", '<div class="lx-row"><span class="lx-meta">Saved</span><i class="lx-dot ok"></i></div>' + LX.field("Line", "focus", "Coffee on Pike")),
    screen("fsys-dirty", "Unsaved", '<div class="lx-alert is-info"><span>Unsaved edits</span>' + btn("Save", "compact") + "</div>"),
    screen("fsys-array", "Repeating", '<div class="lx-row"><span>Friday</span><span>7–5</span></div><div class="lx-row"><span>Saturday</span><span>8–2</span></div>' + btn("Add a day", "ghost")),
    screen("fsys-cond", "Conditional", '<label class="lx-row"><span>Take calls</span><button type="button" class="lx-toggle is-on" data-lx-toggle aria-label="Calls"></button></label>' + LX.field("Phone", "focus", "206")),
    screen("fsys-success", "Success", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Hours saved</span></div>'),
    screen("fsys-server", "Server error", '<div class="lx-alert is-bad">Could not save. Try again.</div>' + btn("Retry"))
  ]);

  LX.spec("loading-states", ["loaders-ptr", "loaders-infinite", "sys-compare"], [
    screen("load-page", "Page", '<div class="lx-skel" style="height:14px;width:40%"></div><div class="lx-skel"></div><div class="lx-skel" style="width:70%"></div><div class="lx-ph sm"></div>'),
    screen("load-section", "Section", '<div class="lx-tile"><div class="lx-skel"></div><div class="lx-skel" style="width:50%;margin-top:8px"></div></div>'),
    screen("load-inline", "Inline", '<div class="lx-row"><span>Leads</span><i class="lx-spin is-on"></i></div>'),
    screen("load-table", "Table", '<div class="lx-skel"></div><div class="lx-skel"></div><div class="lx-skel"></div>'),
    screen("load-chart", "Chart", '<div class="lx-skel" style="height:5rem"></div>'),
    screen("load-boot", "Boot bar", '<div class="lx-meter"><span></span></div><p class="lx-meta">Opening the studio</p>'),
    screen("load-overlay", "Card overlay", '<div class="lx-tile" style="position:relative"><p class="lx-p">Harbor</p><div style="position:absolute;inset:0;display:grid;place-items:center;background:rgb(255 255 255 / 72%)"><i class="lx-spin is-on"></i></div></div>')
  ]);
})();
