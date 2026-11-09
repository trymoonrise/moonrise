(function () {
  "use strict";
  const LX = window.LX;
  const card = LX.card.bind(LX);
  const ico = LX.ico;
  const btn = LX.btn;

  function tog(on) {
    return '<button type="button" class="lx-toggle' + (on ? " is-on" : "") + '" data-lx-toggle aria-pressed="' + (on ? "true" : "false") + '" aria-label="Toggle"></button>';
  }
  function chk(on) {
    return '<button type="button" class="lx-check' + (on ? " is-on" : "") + '" data-lx-check aria-label="Select"></button>';
  }
  function dialog(title, body, ok, tone) {
    return '<div class="lx-stage-dim"><div class="lx-dialog"><strong>' + title + '</strong><p class="lx-p">' + body + '</p><div class="lx-actions">' + btn("Cancel", "ghost") + btn(ok, tone || "") + "</div></div></div>";
  }
  function bars(vals, color) {
    return '<div style="display:flex;align-items:flex-end;gap:6px;height:6.5rem">' + vals.map(function (h) {
      return '<i style="flex:1;height:' + h + "%;background:" + (color || "#111") + ';border-radius:4px 4px 0 0;display:block"></i>';
    }).join("") + "</div>";
  }

  LX.spec("accordions", ["acc-basic"], [
    card("accordions-one", "One open", '<div class="lx-acc"><button type="button" class="is-open" data-lx-acc>Publish</button><p class="lx-p">Sends the live link.</p><button type="button" data-lx-acc>Edit later</button></div>'),
    card("accordions-all", "Collapsed", '<div class="lx-acc"><button type="button" data-lx-acc>Hours</button><button type="button" data-lx-acc>Phone</button><button type="button" data-lx-acc>Address</button></div>'),
    card("accordions-numbered", "Numbered", '<div class="lx-acc"><button type="button" class="is-open" data-lx-acc>1 · Site</button><p class="lx-p">Name and line of work.</p><button type="button" data-lx-acc>2 · Hours</button></div>'),
    card("accordions-group", "Grouped", '<p class="lx-kicker">Billing</p><div class="lx-acc"><button type="button" data-lx-acc>Plan</button><button type="button" data-lx-acc>Invoices</button></div>'),
    card("accordions-inline", "Inline", '<div class="lx-row"><span>Can I edit after publish?</span><button type="button" class="lx-textbtn" data-lx-acc>Show</button></div><p class="lx-p">Yes. The live page updates when you publish again.</p>'),
    card("accordions-inverse", "Inverse", '<div class="lx-acc"><button type="button" class="is-open" data-lx-acc>Guide</button></div>', { stage: "lx-on-dark" }),
    card("accordions-anchor", "Anchors", '<div class="lx-row"><a class="lx-link" href="#faqs">Hours</a></div><div class="lx-row"><a class="lx-link" href="#faqs">Phone</a></div>'),
    card("accordions-plus", "With icon", '<div class="lx-row">' + ico("plus", "sm") + "<span>Add a question</span></div>"),
    card("accordions-long", "Long answer", '<div class="lx-scroll thin"><p class="lx-p">Publish keeps the same link. Change the hours, then publish again. The watermark stays until checkout.</p></div>')
  ]);

  LX.spec("ai-chats", ["status-typing"], [
    card("ai-empty", "Empty", '<div class="lx-empty"><p class="lx-h">Ask about this site</p><p class="lx-p">Hours, phone, or what to change.</p></div>'),
    card("ai-you", "You", '<div class="lx-bubbles"><div class="lx-bubble is-you">What time do we open?</div></div>'),
    card("ai-bot", "Assistant", '<div class="lx-bubbles"><div class="lx-bubble">Harbor opens at 7.</div></div>'),
    card("ai-tool", "Tool line", '<div class="lx-bubble is-tool">read · hours</div>'),
    card("ai-source", "Source", '<div class="lx-bubble">Friday is 7–5. <a class="lx-link" href="#text">Hours</a></div>'),
    card("ai-error", "Error", '<div class="lx-alert is-bad">' + ico("alert", "sm") + "<span>Could not send. Try again.</span></div>"),
    card("ai-compose", "Composer", '<div class="lx-compose"><input class="lx-input" placeholder="Message" aria-label="Message">' + btn("Send", "compact") + "</div>"),
    card("ai-suggest", "Suggestions", '<div class="lx-chips"><button type="button" class="lx-chip" data-lx-opt>Hours</button><button type="button" class="lx-chip" data-lx-opt>Phone</button><button type="button" class="lx-chip" data-lx-opt>Publish</button></div>'),
    card("ai-thread", "Dated thread", '<p class="lx-meta">Today</p><div class="lx-bubbles"><div class="lx-bubble is-you">Update Friday.</div><div class="lx-bubble">Set to 7–5.</div></div>', { wide: true })
  ]);

  LX.spec("alerts", ["motion-success", "motion-shake", "feedback-banner", "feedback-callout"], [
    card("alerts-info", "Info", '<div class="lx-alert is-info"><span class="lx-dot"></span><span>Draft saved</span></div>'),
    card("alerts-ok", "Success", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Site published</span></div>'),
    card("alerts-warn", "Warning", '<div class="lx-alert is-warn"><span class="lx-dot warn"></span><span>Phone is missing</span></div>'),
    card("alerts-bad", "Danger", '<div class="lx-alert is-bad"><span class="lx-dot bad"></span><span>Publish failed</span></div>'),
    card("alerts-action", "With action", '<div class="lx-alert is-info"><span>Unsaved edits</span><button type="button" class="lx-textbtn">Review</button></div>'),
    card("alerts-dismiss", "Dismiss", '<div class="lx-alert"><span>New lead</span><button type="button" class="lx-textbtn" data-lx-dismiss>Dismiss</button></div>')
  ]);

  LX.spec("avatars", ["surfaces-avatars", "status-presence"], [
    card("avatars-initial", "Initial", '<span class="lx-avatar">HK</span>'),
    card("avatars-icon", "Icon", '<span class="lx-avatar">' + ico("user", "sm") + "</span>"),
    card("avatars-stack", "Stack", '<div class="lx-people"><span>NL</span><span>HK</span><span>CR</span></div>'),
    card("avatars-status", "Status", '<span style="position:relative;display:inline-grid"><span class="lx-avatar">HK</span><i class="lx-dot ok" style="position:absolute;right:0;bottom:0"></i></span>'),
    card("avatars-sizes", "Sizes", '<div class="lx-people"><span class="lx-avatar sm">A</span><span class="lx-avatar">B</span><span class="lx-avatar lg">C</span></div>'),
    card("avatars-square", "Square", '<span class="lx-avatar is-sq">HK</span>'),
    card("avatars-fallback", "Fallback", '<span class="lx-avatar">?</span>'),
    card("avatars-more", "Overflow", '<div class="lx-people"><span>NL</span><span>HK</span><span class="lx-badge">+4</span></div>')
  ]);

  LX.spec("badges", ["feedback-badge"], [
    card("badges-neutral", "Neutral", '<span class="lx-badge">Draft</span>'),
    card("badges-count", "Count", '<span class="lx-badge go">3</span>'),
    card("badges-dot", "Dot", '<span class="lx-badge"><i class="lx-dot ok"></i> Live</span>'),
    card("badges-ok", "Success", '<span class="lx-badge ok">Paid</span>'),
    card("badges-bad", "Danger", '<span class="lx-badge bad">Failed</span>'),
    card("badges-outline", "Outline", '<span class="lx-badge">Guide</span>'),
    card("badges-dark", "On dark", '<span class="lx-badge on-dark">Live</span>', { stage: "lx-on-dark" }),
    card("badges-icon", "With icon", '<span class="lx-badge">' + ico("check", "sm") + " Saved</span>"),
    card("badges-remove", "Removable", '<span class="lx-badge">Friday <button type="button" class="lx-textbtn" data-lx-dismiss aria-label="Remove">×</button></span>')
  ]);

  LX.spec("buttons", ["buttons-primary", "buttons-secondary", "buttons-danger", "buttons-icon", "buttons-loading", "buttons-disabled", "buttons-press", "buttons-shapes", "buttons-group"], [
    card("buttons-focus", "Focus", btn("Publish", "focus"))
  ]);

  LX.spec("calendars", [], [
    card("calendars-month", "Month", LX.month(0, 8), { wide: true }),
    card("calendars-week", "Week", '<div class="lx-cal"><div class="lx-cal-head"><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span></div><p class="lx-p">Sunday is today.</p></div>'),
    card("calendars-agenda", "Agenda", '<div class="lx-row"><span>Sun 8</span><span class="lx-meta">Today</span></div><div class="lx-row"><span>Fri 13</span><span class="lx-meta">Close 5</span></div>'),
    card("calendars-range", "Range", LX.month(8, 0).replace("is-on", "is-on") + '<p class="lx-meta">8–13 selected in the month view</p>'),
    card("calendars-time", "With time", '<div class="lx-row"><span>Nov 8</span><span class="lx-mono">9:00</span></div>'),
    card("calendars-disabled", "Disabled days", LX.month(0, 0, [1, 2, 15])),
    card("calendars-selected", "Selected", LX.month(8, 0)),
    card("calendars-today", "Today", LX.month(0, 8)),
    card("calendars-compact", "Compact", '<p class="lx-mono">Nov 8, 2026</p>'),
    card("calendars-pop", "In a popover", '<div class="lx-pop">' + LX.month(8, 8) + "</div>", { wide: true })
  ]);

  LX.spec("cards", [], [
    card("cards-plain", "Plain", '<div class="lx-tile"><p class="lx-h">Harbor Coffee</p><p class="lx-p">Pike Street</p></div>'),
    card("cards-media", "Media", '<div class="lx-tile"><div class="lx-ph sm"></div><p class="lx-p">Counter</p></div>'),
    card("cards-metric", "Metric", '<div class="lx-stat"><strong>14</strong><span>leads</span></div>'),
    card("cards-select", "Selectable", '<button type="button" class="lx-tile is-on" data-lx-opt style="width:100%;cursor:pointer"><strong>Site</strong><p class="lx-p">Selected</p></button>'),
    card("cards-row", "Horizontal", '<div class="lx-row"><span class="lx-avatar">HK</span><span>Harbor Coffee</span><span class="lx-meta">Live</span></div>', { wide: true }),
    card("cards-inverse", "Inverse", '<div class="lx-tile" style="background:#161616;color:#fff;border-color:#2a2a2a"><p class="lx-h" style="color:#fff">moonrise.</p></div>', { stage: "lx-on-dark" }),
    card("cards-actions", "Actions", '<div class="lx-tile"><p class="lx-p">Draft</p><div class="lx-actions">' + btn("Publish") + btn("Edit", "ghost") + "</div></div>"),
    card("cards-quiet", "Outlined", '<div class="lx-tile"><p class="lx-p">No fill beyond the line.</p></div>'),
    card("cards-bento", "Bento cell", '<div class="lx-bento"><div class="lx-bento-main"><p class="lx-h">Lead</p></div><div class="lx-bento-side"><p class="lx-mono">14</p></div><div class="lx-bento-foot">Today</div></div>', { wide: true }),
    card("cards-hover", "Hover", '<div class="lx-tile" style="transition:transform .18s cubic-bezier(.22,1,.36,1)"><p class="lx-p">Lifts slightly on hover.</p></div>')
  ]);

  LX.spec("carousels", ["media-carousel"], [
    card("carousels-one", "Single", '<div class="lx-ph tall"></div>'),
    card("carousels-dots", "Dots", '<div class="lx-ph sm"></div><div class="lx-pages"><button type="button" class="lx-page is-on" data-lx-opt>1</button><button type="button" class="lx-page" data-lx-opt>2</button><button type="button" class="lx-page" data-lx-opt>3</button></div>'),
    card("carousels-arrows", "Arrows", '<div class="lx-row">' + btn("Back", "ghost") + '<span class="lx-meta">2 / 4</span>' + btn("Next", "compact") + "</div>"),
    card("carousels-caption", "Caption", '<div class="lx-ph sm"></div><p class="lx-meta">Pike Street</p>'),
    card("carousels-peek", "Peek", '<div class="lx-scroll snap"><div class="lx-cell"><div class="lx-ph sm"></div></div><div class="lx-cell"><div class="lx-ph sm"></div></div></div>', { stage: "lx-clip" }),
    card("carousels-thumbs", "Thumbs", '<div class="lx-tiles"><i></i><i></i><i></i><i></i></div>'),
    card("carousels-inverse", "Inverse", '<div class="lx-ph" style="background:#2a2a2a"></div>', { stage: "lx-on-dark" }),
    card("carousels-count", "Count", '<p class="lx-mono">01 — 04</p>'),
    card("carousels-empty", "Empty", '<div class="lx-empty"><p class="lx-h">No slides</p></div>')
  ]);

  LX.spec("charts", ["data-bars"], [
    card("charts-hbar", "Horizontal", '<div class="lx-bar flat"><span style="width:72%"></span></div><div class="lx-bar flat" style="margin-top:6px"><span style="width:40%"></span></div>'),
    card("charts-line", "Line", '<svg class="lx-chart" viewBox="0 0 160 70"><polyline fill="none" stroke="#111" stroke-width="1.5" points="4,54 36,40 68,46 100,22 132,28 156,12"/></svg>'),
    card("charts-area", "Area", '<svg class="lx-chart" viewBox="0 0 160 70"><polygon fill="#e4e4e7" points="4,60 36,42 68,48 100,24 156,30 156,70 4,70"/><polyline fill="none" stroke="#111" stroke-width="1.4" points="4,60 36,42 68,48 100,24 156,30"/></svg>'),
    card("charts-donut", "Donut", '<svg class="lx-ring" viewBox="0 0 36 36"><circle class="lx-ring-track" cx="18" cy="18" r="15"/><circle class="lx-ring-val" cx="18" cy="18" r="15" style="stroke-dasharray:60 100"/></svg>'),
    card("charts-stacked", "Stacked", '<div class="lx-bar flat"><span style="width:100%;background:linear-gradient(90deg,#111 55%,#c4c4c8 55%)"></span></div>'),
    card("charts-spark", "Sparkline", '<svg class="lx-chart" viewBox="0 0 120 36" style="height:2.4rem"><polyline fill="none" stroke="#1f6fed" stroke-width="1.5" points="2,28 24,22 46,24 70,10 96,14 118,6"/></svg>'),
    card("charts-legend", "Legend", bars([40, 65, 50]) + '<div class="lx-legend"><span><i class="lx-swatch"></i> Visits</span><span><i class="lx-swatch soft"></i> Quiet</span></div>'),
    card("charts-goal", "Goal", '<div class="lx-bar"><span class="go" style="width:64%"></span></div><p class="lx-meta">64 of 100 leads</p>'),
    card("charts-empty", "Empty", '<div class="lx-empty"><p class="lx-h">No data yet</p><p class="lx-p">Figures show after the first week.</p></div>')
  ]);

  LX.spec("checkboxes", ["forms-check"], LX.states("checkboxes", function (k) {
    const on = k === "filled" || k === "focus";
    const extra = [];
    if (k === "focus") extra.push("is-focus");
    if (k === "ghost") extra.push("is-ghost");
    if (k === "danger") extra.push("is-danger");
    if (k === "hover") extra.push("is-hover");
    if (k === "compact") extra.push("is-compact");
    let box = chk(on);
    if (extra.length) box = box.replace("lx-check", "lx-check " + extra.join(" "));
    if (k === "disabled") box = box.replace(">", " disabled>");
    const spin = k === "loading" ? ' <i class="lx-spin is-on"></i>' : "";
    const hint = k === "error" ? '<p class="lx-hint is-danger">Choose one</p>' : (k === "danger" ? '<p class="lx-hint is-danger">Required</p>' : "");
    return '<label class="lx-row"><span>' + box + "</span><span>Show hours" + spin + "</span></label>" + hint;
  }, 9));

  LX.spec("cursors", [], [
    ["Default", "default"],
    ["Pointer", "pointer"],
    ["Text", "text"],
    ["Crosshair", "crosshair"],
    ["Grab", "grab"],
    ["Not allowed", "not-allowed"]
  ].map(function (row) {
    return card("cursors-" + row[1], row[0], '<div class="lx-pad" style="cursor:' + row[1] + '">' + row[0] + "</div>");
  }).concat([
    card("cursors-dot", "Dot", '<div class="lx-pad">Move here<span class="lx-fake dot"></span></div>'),
    card("cursors-ring", "Ring", '<div class="lx-pad">Move here<span class="lx-fake"></span></div>'),
    card("cursors-trail", "Trailing dot", '<div class="lx-pad"><span class="lx-fake dot trail"></span></div>', { play: "lx-live" }),
    card("cursors-hover", "Appear on hover", '<div class="lx-pad"><span class="lx-meta">Hover the pad</span></div>')
  ]));

  function dash(title, main, items, active) {
    return card("dashboards-" + title.toLowerCase().replace(/\s/g, "-"), title, LX.app(items || ["Home", "Leads", "Sites"], active || "Home", main), { wide: true, stage: "lx-tall" });
  }
  LX.spec("dashboards", [], [
    dash("KPI row", '<div class="lx-stats"><div class="lx-stat"><strong>128</strong><span>visits</span></div><div class="lx-stat"><strong>14</strong><span>leads</span></div></div>'),
    dash("Chart and list", bars([30, 55, 40, 80]) + '<div class="lx-row"><span>Harbor</span><span class="lx-meta">4</span></div>'),
    dash("Sidebar", '<p class="lx-h">Sites</p><div class="lx-row"><span>Harbor</span><span class="lx-badge go">Live</span></div>', ["Sites", "Leads", "Guide"], "Sites"),
    dash("Activity", '<div class="lx-row"><span>Published</span><span class="lx-meta">9:00</span></div><div class="lx-row"><span>Lead</span><span class="lx-meta">9:14</span></div>'),
    dash("Billing", '<div class="lx-stat"><strong>$48</strong><span>this month</span></div><div class="lx-row"><span>Plan</span><span>Site</span></div>', ["Plan", "Invoices"], "Plan"),
    dash("Empty", '<div class="lx-empty"><p class="lx-h">No sites yet</p>' + btn("Start") + "</div>"),
    dash("Skeleton", '<div class="lx-skel"></div><div class="lx-skel" style="width:70%"></div><div class="lx-skel"></div>', ["Home"], "Home"),
    dash("Alert", '<div class="lx-alert is-warn"><span class="lx-dot warn"></span><span>Phone missing on Harbor</span></div>'),
    dash("Two columns", '<div class="lx-cols"><div><p class="lx-kicker">Visits</p><strong class="lx-mono">128</strong></div><div><p class="lx-kicker">Leads</p><strong class="lx-mono">14</strong></div></div>'),
    card("dashboards-inverse", "Inverse header", '<div class="lx-panel" style="padding:0;overflow:hidden"><div style="background:#161616;color:#fff;padding:10px">Harbor</div><div style="padding:10px"><p class="lx-p">Open at 7</p></div></div>', { wide: true, stage: "lx-tall" })
  ]);

  LX.spec("date-pickers", ["adv-date"], [
    card("dates-field", "Field", '<label class="lx-field"><span>Date</span><input class="lx-input is-focus" value="Nov 8, 2026" aria-label="Date"></label>'),
    card("dates-range", "Range", '<div class="lx-pair"><label class="lx-field"><span>From</span><input class="lx-input" value="Nov 8" aria-label="From"></label><label class="lx-field"><span>To</span><input class="lx-input" value="Nov 13" aria-label="To"></label></div>'),
    card("dates-time", "With time", '<label class="lx-field"><span>When</span><input class="lx-input" value="Nov 8 · 9:00" aria-label="When"></label>'),
    card("dates-clear", "Clear", '<div class="lx-compose"><input class="lx-input" value="Nov 8" aria-label="Date">' + btn("Clear", "ghost") + "</div>"),
    card("dates-presets", "Presets", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>Today</button><button type="button" class="lx-chip" data-lx-opt>7 days</button><button type="button" class="lx-chip" data-lx-opt>Month</button></div>'),
    card("dates-month", "Month and year", '<div class="lx-row"><span>November 2026</span>' + ico("chevron", "sm") + "</div>"),
    card("dates-error", "Error", '<label class="lx-field is-danger"><span>Date</span><input class="lx-input" value="Feb 31" aria-label="Date"></label><p class="lx-hint is-danger">That day does not exist</p>'),
    card("dates-disabled", "Disabled", '<label class="lx-field is-disabled"><span>Date</span><input class="lx-input" disabled value="Nov 8" aria-label="Date"></label>'),
    card("dates-loading", "Loading", '<div class="lx-row"><span>Finding days</span><i class="lx-spin is-on"></i></div>', { play: "lx-live" })
  ]);

  LX.spec("dialogs", ["menus-modal", "menus-sheet", "sys-confirm"], [
    card("dialogs-inform", "Inform", dialog("Publish site", "The live link goes to your client.", "Publish"), { wide: true }),
    card("dialogs-danger", "Destructive", dialog("Delete site", "This cannot be undone.", "Delete", "danger"), { wide: true }),
    card("dialogs-form", "Form", '<div class="lx-stage-dim"><div class="lx-dialog"><strong>Rename</strong>' + LX.field("Name", "focus", "Harbor") + '<div class="lx-actions">' + btn("Cancel", "ghost") + btn("Rename") + "</div></div></div>", { wide: true }),
    card("dialogs-scroll", "Scrolling", '<div class="lx-stage-dim"><div class="lx-dialog"><strong>Details</strong><div class="lx-scroll thin"><p>Hours, phone, address, and the line of work stay on the page.</p><p>Publish again after an edit.</p></div></div></div>'),
    card("dialogs-anchored", "Anchored", '<div class="lx-menu"><button type="button">Copy link</button><button type="button">Send email</button></div>'),
    card("dialogs-stack", "Stack", '<div class="lx-stage-dim"><div class="lx-dialog" style="transform:translate(8px,8px);opacity:.5"><p class="lx-meta">Behind</p></div><div class="lx-dialog"><strong>Discard edits?</strong>' + btn("Discard", "danger") + "</div></div>", { wide: true }),
    card("dialogs-success", "Success", dialog("Published", "The site is live.", "Done"), { wide: true })
  ]);

  LX.spec("dropdowns", ["menus-dropdown"], [
    card("dropdowns-closed", "Closed", '<button type="button" class="lx-btn lx-btn-ghost">Actions ' + ico("chevron", "sm") + "</button>"),
    card("dropdowns-open", "Open", '<div class="lx-menu"><button type="button">Edit</button><button type="button">Duplicate</button><button type="button" class="bad">Delete</button></div>'),
    card("dropdowns-icons", "Icons", '<div class="lx-menu"><button type="button">' + ico("file", "sm") + " Edit</button><button type=\"button\">" + ico("arrow", "sm") + " Share</button></div>"),
    card("dropdowns-kbd", "Shortcuts", '<div class="lx-menu"><button type="button">Publish <span class="lx-mono">⌘P</span></button></div>'),
    card("dropdowns-search", "Filter", '<div class="lx-menu"><input class="lx-input" placeholder="Filter" aria-label="Filter"><button type="button">Harbor</button></div>'),
    card("dropdowns-empty", "Empty", '<div class="lx-menu"><p class="lx-meta">No matches</p></div>'),
    card("dropdowns-scroll", "Long", '<div class="lx-menu lx-scroll thin"><button type="button">Sites</button><button type="button">Leads</button><button type="button">Guide</button><button type="button">Hours</button></div>'),
    card("dropdowns-selected", "Selected", '<div class="lx-menu"><button type="button" class="is-on">Studio</button><button type="button">Guide</button></div>'),
    card("dropdowns-danger", "Danger item", '<div class="lx-menu"><button type="button" class="bad">Delete site</button></div>')
  ]);

  LX.spec("empty-states", ["feedback-empty"], [
    card("empty-items", "No items", '<div class="lx-empty"><p class="lx-h">No sites</p><p class="lx-p">Start one when you are ready.</p></div>'),
    card("empty-results", "No results", '<div class="lx-empty"><p class="lx-h">No matches</p><p class="lx-p">Try another name.</p></div>'),
    card("empty-first", "First run", '<div class="lx-empty"><p class="lx-h">Welcome in</p>' + btn("Create a site") + "</div>"),
    card("empty-error", "Error", '<div class="lx-empty"><p class="lx-h">Could not load</p>' + btn("Retry", "ghost") + "</div>"),
    card("empty-access", "No access", '<div class="lx-empty"><p class="lx-h">You cannot open this</p></div>'),
    card("empty-offline", "Offline", '<div class="lx-empty"><p class="lx-h">You are offline</p><p class="lx-p">Check the connection.</p></div>'),
    card("empty-filter", "Filtered", '<div class="lx-empty"><p class="lx-h">Nothing in this filter</p><button type="button" class="lx-textbtn">Clear</button></div>'),
    card("empty-done", "Done", '<div class="lx-empty"><span class="lx-dot ok"></span><p class="lx-h">All caught up</p></div>'),
    card("empty-upload", "Upload", '<div class="lx-empty"><p class="lx-h">Drop a photo</p><p class="lx-meta">PNG or JPG</p></div>')
  ]);

  function tree(sel, open) {
    return '<div class="lx-tree"><button type="button" data-lx-folder aria-expanded="' + (open ? "true" : "false") + '">Sites</button><div class="sub"' + (open ? "" : " hidden") + '><button type="button" class="' + (sel ? "is-on" : "") + '">Harbor</button><button type="button">Northline</button></div></div>';
  }
  LX.spec("file-trees", [], [
    card("trees-nested", "Nested", tree(false, false)),
    card("trees-selected", "Selected", tree(true, true)),
    card("trees-open", "Open folder", tree(false, true)),
    card("trees-empty", "Empty", '<div class="lx-tree"><button type="button">Sites</button><p class="lx-meta sub">Empty</p></div>'),
    card("trees-loading", "Loading", '<div class="lx-row"><span>Sites</span><i class="lx-spin is-on"></i></div>', { play: "lx-live" }),
    card("trees-filter", "Filter", '<input class="lx-input" placeholder="Filter files" aria-label="Filter">' + tree(true, true)),
    card("trees-drag", "Drop target", '<div class="lx-pad" style="border-color:var(--dt-action)">Drop here</div>'),
    card("trees-error", "Error", '<div class="lx-alert is-bad">Could not read the folder</div>'),
    card("trees-compact", "Compact", '<div class="lx-tree"><button type="button" class="is-on">index</button><button type="button">hours</button></div>'),
    card("trees-file", "File", '<div class="lx-row">' + ico("file", "sm") + "<span>hours.txt</span></div>")
  ]);

  LX.spec("file-uploads", ["adv-drop"], [
    card("uploads-idle", "Idle", '<div class="lx-pad">Drop a file</div>'),
    card("uploads-over", "Drag over", '<div class="lx-pad" style="border-color:var(--dt-action);background:var(--dt-action-soft)">Release to add</div>'),
    card("uploads-list", "File list", '<div class="lx-row">' + ico("file", "sm") + "<span>counter.jpg</span><span class=\"lx-meta\">240 KB</span></div>"),
    card("uploads-progress", "Progress", '<p class="lx-meta">counter.jpg</p><div class="lx-meter"><span></span></div>', { play: "lx-live" }),
    card("uploads-type", "Wrong type", '<p class="lx-hint is-danger">Use a PNG or JPG</p>'),
    card("uploads-preview", "Preview", '<div class="lx-ph sm"></div><p class="lx-meta">counter.jpg</p>'),
    card("uploads-multi", "Several", '<div class="lx-row"><span>a.jpg</span></div><div class="lx-row"><span>b.jpg</span></div>'),
    card("uploads-disabled", "Disabled", '<div class="lx-pad" style="opacity:.45">Uploads off</div>'),
    card("uploads-done", "Success", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Uploaded</span></div>')
  ]);

  LX.spec("forms", [], [
    card("forms-stack", "Stacked", LX.panel(LX.field("Name", "rest", "Harbor") + LX.field("Phone", "rest", "") + btn("Save")), { wide: true }),
    card("forms-two", "Two columns", '<div class="lx-pair">' + LX.field("City", "", "Seattle") + LX.field("Street", "", "Pike") + "</div>", { wide: true }),
    card("forms-inline", "Inline", '<div class="lx-compose"><input class="lx-input" placeholder="Email" aria-label="Email">' + btn("Add", "compact") + "</div>"),
    card("forms-sections", "Sections", '<p class="lx-kicker">Contact</p>' + LX.field("Phone", "focus", "206") + '<p class="lx-kicker">Hours</p>' + LX.field("Friday", "", "7–5"), { wide: true }),
    card("forms-set", "Fieldset", '<fieldset style="border:1px solid var(--dt-line);border-radius:12px;padding:10px"><legend class="lx-kicker">Site</legend>' + LX.field("Name", "", "Harbor") + "</fieldset>"),
    card("forms-summary", "Error summary", '<div class="lx-alert is-bad">2 fields need a look</div>' + LX.field("Phone", "error", "", "Add a phone"), { wide: true }),
    card("forms-sticky", "Actions", '<div class="lx-row"><span class="lx-meta">Unsaved</span>' + btn("Save") + "</div>"),
    card("forms-optional", "Optional", LX.field("Suite", "ghost", "") + '<p class="lx-hint">Optional</p>'),
    card("forms-help", "Help", LX.field("Slug", "focus", "harbor", "Used in the link")),
    card("forms-compact", "Compact", LX.field("Name", "compact", "Harbor"))
  ]);

  LX.spec("globes", [], [
    card("globes-wire", "Wireframe", LX.globe()),
    card("globes-dots", "Dots", LX.globe({ dots: true })),
    card("globes-meridian", "Meridians", LX.globe()),
    card("globes-pin", "Pin", LX.globe({ pin: true }) + '<p class="lx-meta" style="text-align:center">Seattle</p>'),
    card("globes-flat", "Flat dots", '<div class="lx-pad"><span class="lx-pin" style="position:static;display:inline-block"></span> <span class="lx-pin" style="position:static;display:inline-block"></span></div>'),
    card("globes-arc", "Arc", LX.globe({ arc: true, pin: true })),
    card("globes-inverse", "Inverse", LX.globe(), { stage: "lx-on-dark" }),
    card("globes-spin", "Spin", LX.globe({ spin: true }), { play: "lx-live" }),
    card("globes-list", "With list", '<div class="lx-cols"><div>' + LX.globe({ pin: true }) + '</div><div><div class="lx-row"><span>Seattle</span></div><div class="lx-row"><span>Portland</span></div></div></div>', { wide: true }),
    card("globes-still", "Still", LX.globe({ dots: true }))
  ]);

  LX.spec("bento", [], [
    card("bento-2", "Two", '<div class="lx-cols"><div class="lx-tile">Sites</div><div class="lx-tile">Leads</div></div>', { wide: true }),
    card("bento-3", "Three", '<div class="lx-cols"><div class="lx-tile">A</div><div class="lx-tile">B</div><div class="lx-tile" style="grid-column:1 / -1">C</div></div>', { wide: true }),
    card("bento-4", "Four", '<div class="lx-tiles"><i></i><i></i><i></i><i></i></div>'),
    card("bento-asym", "Asymmetric", '<div class="lx-bento"><div class="lx-bento-main"><p class="lx-h">Harbor</p><p class="lx-p">Open at 7</p></div><div class="lx-bento-side"><p class="lx-mono">14</p></div><div class="lx-bento-foot">Leads</div></div>', { wide: true }),
    card("bento-feature", "Featured", '<div class="lx-bento"><div class="lx-bento-main"><div class="lx-ph sm"></div></div><div class="lx-bento-side"><p class="lx-p">Photo</p></div><div class="lx-bento-foot">Pike</div></div>', { wide: true }),
    card("bento-equal", "Equal", '<div class="lx-stats"><div class="lx-stat"><strong>12</strong><span>sites</span></div><div class="lx-stat"><strong>3</strong><span>drafts</span></div></div>'),
    card("bento-media", "Media", '<div class="lx-cols"><div class="lx-ph sm"></div><div><p class="lx-h">Shop</p><p class="lx-p">Morning light</p></div></div>', { wide: true }),
    card("bento-stats", "Stats", '<div class="lx-stats"><div class="lx-stat"><strong>128</strong><span>visits</span><span class="up">+12%</span></div><div class="lx-stat"><strong>14</strong><span>leads</span></div></div>'),
    card("bento-inverse", "Inverse", '<div class="lx-tile" style="background:#161616;color:#fff">Night</div>', { stage: "lx-on-dark" }),
    card("bento-dense", "Dense", '<div class="lx-tiles" style="grid-template-rows:36px 36px"><i></i><i></i><i></i><i></i></div>')
  ]);

  const ICONS = ["search", "close", "check", "chevron", "user", "file", "calendar", "pin", "image", "alert", "plus", "arrow"];
  LX.spec("icons", [], [
    card("icons-16", "16", '<div class="lx-actions">' + ICONS.slice(0, 6).map(function (n) { return ico(n, "sm"); }).join("") + "</div>"),
    card("icons-20", "20", '<div class="lx-actions">' + ICONS.slice(0, 6).map(function (n) { return ico(n); }).join("") + "</div>"),
    card("icons-24", "24", '<div class="lx-actions">' + ICONS.slice(0, 4).map(function (n) { return ico(n, "lg"); }).join("") + "</div>"),
    card("icons-label", "Labeled", '<div class="lx-row">' + ico("search", "sm") + "<span>Search</span></div>"),
    card("icons-circle", "Circle", '<span class="lx-avatar">' + ico("user", "sm") + "</span>"),
    card("icons-square", "Square", '<span class="lx-avatar is-sq">' + ico("file", "sm") + "</span>"),
    card("icons-status", "Status dot", '<span class="lx-row">' + ico("user", "sm") + '<i class="lx-dot ok"></i></span>'),
    card("icons-draw", "Draw on", '<span class="lx-underline">' + ico("check", "lg") + "</span>", { play: "lx-live" }),
    card("icons-disabled", "Disabled", '<span style="opacity:.35">' + ico("plus") + "</span>"),
    card("icons-row", "Row", '<div class="lx-actions">' + ICONS.map(function (n) { return ico(n, "sm"); }).join("") + "</div>", { wide: true })
  ]);

  LX.spec("inputs", ["forms-text", "forms-password", "forms-validation", "adv-qty", "sys-copy"], LX.states("inputs", function (k) {
    const val = k === "filled" || k === "error" || k === "danger" ? "Harbor" : "";
    const hint = k === "error" ? "Enter a studio name" : "";
    return LX.field("Name", k, val, hint);
  }, 5));

  LX.spec("links", ["type-links"], [
    card("links-inline", "Inline", '<p class="lx-p">Read the <a class="lx-link" href="#text">guide</a>.</p>'),
    card("links-draw", "Underline", '<a class="lx-link lx-underline" href="#heroes">Harbor</a>', { play: "lx-live" }),
    card("links-nav", "Nav", '<a class="lx-tab is-on" href="#nav-menus">Sites</a>'),
    card("links-quiet", "Quiet", '<a class="lx-link is-quiet" href="#footers">Privacy</a>'),
    card("links-external", "External", '<a class="lx-link" href="https://trymoonrise.com">trymoonrise.com</a>'),
    card("links-icon", "With icon", '<a class="lx-link" href="#maps">' + ico("arrow", "sm") + " Map</a>"),
    card("links-visited", "Visited", '<a class="lx-link is-quiet" href="#text">Already open</a>'),
    card("links-focus", "Focus", '<a class="lx-link is-focus" href="#buttons">Publish</a>'),
    card("links-btn", "Button link", '<a class="lx-btn" href="#cta">Start a site</a>')
  ]);

  LX.spec("lists", ["surfaces-rows"], [
    card("lists-plain", "Plain", '<div class="lx-row"><span>Harbor</span></div><div class="lx-row"><span>Northline</span></div>'),
    card("lists-meta", "Meta", '<div class="lx-row"><span>Harbor</span><span class="lx-meta">Live</span></div>'),
    card("lists-select", "Selectable", '<button type="button" class="lx-row is-on" data-lx-opt style="width:100%;border:0;background:var(--dt-action-soft)"><span>Harbor</span></button>'),
    card("lists-handle", "Handle", '<div class="lx-row"><span class="lx-meta">⋮⋮</span><span>Friday</span></div>'),
    card("lists-nested", "Nested", '<div class="lx-tree"><button type="button">Week</button><div class="sub"><button type="button">Friday</button></div></div>'),
    card("lists-more", "More", '<div class="lx-scroll thin"><div class="lx-row"><span>Mon</span></div><div class="lx-row"><span>Tue</span></div><div class="lx-row"><span>Wed</span></div><div class="lx-row"><span>Thu</span></div></div>'),
    card("lists-empty", "Empty", '<div class="lx-empty"><p class="lx-p">No rows</p></div>'),
    card("lists-loading", "Loading", '<div class="lx-skel"></div><div class="lx-skel" style="width:60%"></div>', { play: "lx-live" }),
    card("lists-action", "Action", '<div class="lx-row"><span>Harbor</span>' + btn("Open", "compact") + "</div>")
  ]);

  LX.spec("menus", ["menus-action", "sys-kbd"], [
    card("menus-list", "List", '<div class="lx-menu"><button type="button">Edit</button><button type="button">Share</button></div>'),
    card("menus-icons", "Icons", '<div class="lx-menu"><button type="button">' + ico("file", "sm") + " Edit</button></div>"),
    card("menus-kbd", "Keys", '<div class="lx-menu"><button type="button">Save <span class="lx-mono">⌘S</span></button></div>'),
    card("menus-bad", "Destructive", '<div class="lx-menu"><button type="button" class="bad">Delete</button></div>'),
    card("menus-section", "Sections", '<div class="lx-menu"><p class="lx-kicker">Site</p><button type="button">Publish</button><p class="lx-kicker">Account</p><button type="button">Sign out</button></div>'),
    card("menus-check", "Checks", '<div class="lx-menu"><button type="button">' + chk(true) + " Hours</button><button type=\"button\">" + chk(false) + " Phone</button></div>"),
    card("menus-radio", "Radio items", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>Day</button><button type="button" class="lx-chip" data-lx-opt>Week</button></div>'),
    card("menus-sub", "Submenu", '<div class="lx-row"><span>Share</span>' + ico("chevron", "sm") + "</div>")
  ]);

  LX.spec("notifications", [], [
    card("notes-info", "Info", '<div class="lx-toast"><span class="lx-dot"></span><span>Draft saved</span></div>'),
    card("notes-ok", "Success", '<div class="lx-toast"><span class="lx-dot ok"></span><span>Published</span></div>'),
    card("notes-bad", "Error", '<div class="lx-toast"><span class="lx-dot bad"></span><span>Failed</span></div>'),
    card("notes-action", "Action", '<div class="lx-toast"><span>New lead</span><button type="button" class="lx-textbtn">Open</button></div>'),
    card("notes-undo", "Undo", '<div class="lx-toast"><span>Site deleted</span><button type="button" class="lx-textbtn">Undo</button></div>'),
    card("notes-stack", "Stack", '<div style="display:grid;gap:6px"><div class="lx-toast">One</div><div class="lx-toast">Two</div><div class="lx-toast">Three</div></div>'),
    card("notes-top", "Top", '<div class="lx-toast">Shown at the top</div>'),
    card("notes-bottom", "Bottom", '<div class="lx-toast">Shown at the bottom</div>'),
    card("notes-progress", "Progress", '<div class="lx-toast" style="display:grid"><span>Uploading</span><div class="lx-meter"><span></span></div></div>', { play: "lx-live" }),
    card("notes-dismiss", "Dismiss", '<div class="lx-toast"><span>Note</span><button type="button" class="lx-textbtn" data-lx-dismiss>Close</button></div>')
  ]);

  LX.spec("numbers", ["type-mono", "choice-stars", "status-countdown"], [
    card("numbers-fig", "Figure", '<p class="lx-stat"><strong>128</strong><span>visits</span></p>'),
    card("numbers-delta", "Delta", '<p class="lx-stat"><strong>14</strong><span class="up">+3 vs last week</span></p>'),
    card("numbers-count", "Count up", '<p class="lx-hook"><span data-count="128">0</span></p>', { play: "lx-count" }),
    card("numbers-tab", "Tabular", '<p class="lx-mono">1,280.00</p>'),
    card("numbers-unit", "Unit", '<p class="lx-stat"><strong>48</strong><span>USD</span></p>'),
    card("numbers-pair", "Pair", '<div class="lx-figs"><div><strong>12</strong><span>sites</span></div><div><strong>3</strong><span>drafts</span></div></div>'),
    card("numbers-frac", "Fraction", '<p class="lx-mono">3 / 10</p>')
  ]);

  LX.spec("onboarding", [], [
    card("onboard-dots", "Dots", '<div class="lx-steps"><i class="lx-dot"></i><i class="lx-dot mute"></i><i class="lx-dot mute"></i></div>'),
    card("onboard-title", "Title", '<p class="lx-kicker">Step 1</p><p class="lx-h">Name the site</p>'),
    card("onboard-choice", "Choices", '<div class="lx-cols"><button type="button" class="lx-tile is-on" data-lx-opt>Cafe</button><button type="button" class="lx-tile" data-lx-opt>Shop</button></div>', { wide: true }),
    card("onboard-media", "Media slot", '<div class="lx-ph sm"></div><p class="lx-meta">A photo of the place</p>'),
    card("onboard-skip", "Skip", '<div class="lx-row"><button type="button" class="lx-textbtn">Skip</button>' + btn("Next", "compact") + "</div>"),
    card("onboard-nav", "Back and next", '<div class="lx-actions">' + btn("Back", "ghost") + btn("Next") + "</div>"),
    card("onboard-check", "Checklist", '<div class="lx-row">' + chk(true) + "<span>Name</span></div><div class=\"lx-row\">" + chk(false) + "<span>Hours</span></div>"),
    card("onboard-welcome", "Welcome", '<p class="lx-h">Set up the studio</p><p class="lx-p">A site, then publish.</p>'),
    card("onboard-done", "Done", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Ready to publish</span></div>'),
    card("onboard-error", "Error", '<p class="lx-hint is-danger">Add a name to continue</p>')
  ]);

  LX.spec("pagination", ["nav-pagination"], [
    card("pages-simple", "Simple", '<div class="lx-pages"><button type="button" class="lx-page" data-lx-opt>Prev</button><button type="button" class="lx-page is-on" data-lx-opt>1</button><button type="button" class="lx-page" data-lx-opt>2</button><button type="button" class="lx-page" data-lx-opt>Next</button></div>'),
    card("pages-ends", "Ends", '<div class="lx-pages"><button type="button" class="lx-page" disabled>Prev</button><button type="button" class="lx-page is-on">1</button></div>'),
    card("pages-compact", "Compact", '<p class="lx-mono">1 / 4</p>'),
    card("pages-input", "Jump", '<label class="lx-field is-compact"><span>Page</span><input class="lx-input" value="2" aria-label="Page"></label>'),
    card("pages-ellipsis", "Gap", '<div class="lx-pages"><button type="button" class="lx-page is-on">1</button><span class="lx-meta">…</span><button type="button" class="lx-page">8</button></div>'),
    card("pages-text", "Text", '<div class="lx-row"><button type="button" class="lx-textbtn">Previous</button><button type="button" class="lx-textbtn">Next</button></div>'),
    card("pages-icon", "Icons", '<div class="lx-actions"><button type="button" class="lx-btn lx-btn-ghost" aria-label="Next">' + ico("chevron", "sm") + "</button></div>"),
    card("pages-loading", "Loading", '<i class="lx-spin is-on"></i>', { play: "lx-live" }),
    card("pages-none", "Single page", '<p class="lx-meta">One page</p>')
  ]);

  LX.spec("popovers", [], [
    card("pop-info", "Info", '<div class="lx-pop"><strong>Hours</strong><p class="lx-p">Friday 7–5</p></div>'),
    card("pop-form", "Form", '<div class="lx-pop">' + LX.field("Name", "focus", "") + btn("Save", "compact") + "</div>"),
    card("pop-date", "Date", '<div class="lx-pop">' + LX.month(8, 8) + "</div>", { wide: true }),
    card("pop-menu", "Menu", '<div class="lx-pop"><button type="button" class="lx-row" style="border:0;background:transparent;width:100%">Copy</button></div>'),
    card("pop-confirm", "Confirm", '<div class="lx-pop"><p class="lx-p">Delete this lead?</p>' + btn("Delete", "danger") + "</div>"),
    card("pop-rich", "Rich", '<div class="lx-pop"><div class="lx-row"><span class="lx-avatar sm">HK</span><span>Harbor</span></div></div>'),
    card("pop-bottom", "Below", '<div class="lx-tip">Opens under the control</div>'),
    card("pop-top", "Above", '<div class="lx-tip">Opens above the control</div>'),
    card("pop-arrow", "Arrow", '<div class="lx-tip">Note<span class="lx-dot" style="margin-left:6px"></span></div>'),
    card("pop-dismiss", "Dismiss", '<div class="lx-pop"><span>Tip</span><button type="button" class="lx-textbtn" data-lx-dismiss>Close</button></div>')
  ]);

  LX.spec("profiles", [], [
    card("profiles-header", "Header", '<div class="lx-row"><span class="lx-avatar lg">HK</span><span><strong>Harbor Coffee</strong><br><span class="lx-meta">Pike Street</span></span></div>', { wide: true }),
    card("profiles-stats", "Stats", '<div class="lx-figs"><div><strong>12</strong><span>sites</span></div><div><strong>4</strong><span>years</span></div></div>'),
    card("profiles-contact", "Contact", '<div class="lx-row"><span>Phone</span><span class="lx-mono">206 555 0100</span></div>'),
    card("profiles-edit", "Edit", LX.field("Name", "focus", "Harbor") + btn("Save")),
    card("profiles-public", "Public card", '<div class="lx-tile"><p class="lx-h">Harbor Coffee</p><p class="lx-p">Open at 7</p></div>'),
    card("profiles-activity", "Activity", '<div class="lx-row"><span>Published</span><span class="lx-meta">Today</span></div>'),
    card("profiles-empty", "Empty", '<div class="lx-empty"><p class="lx-h">No bio yet</p></div>'),
    card("profiles-compact", "Compact", '<div class="lx-row"><span class="lx-avatar sm">HK</span><span>Harbor</span></div>'),
    card("profiles-inverse", "Inverse", '<p class="lx-h">Harbor</p>', { stage: "lx-on-dark" }),
    card("profiles-tabs", "Tabs", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>About</button><button type="button" class="lx-tab" data-lx-opt>Hours</button></div>')
  ]);

  LX.spec("progress", ["loaders-progress"], [
    card("progress-label", "Labeled", '<div class="lx-row"><span>Upload</span><span class="lx-mono">40%</span></div><div class="lx-meter"><span style="width:40%"></span></div>'),
    card("progress-indet", "Indeterminate", '<div class="lx-skel"></div>', { play: "lx-live" }),
    card("progress-steps", "Steps", '<div class="lx-bar flat"><span style="width:66%"></span></div><p class="lx-meta">Step 2 of 3</p>'),
    card("progress-ring", "Circular", '<svg class="lx-ring" viewBox="0 0 36 36"><circle class="lx-ring-track" cx="18" cy="18" r="15"/><circle class="lx-ring-val" cx="18" cy="18" r="15"/></svg>', { play: "lx-live" }),
    card("progress-upload", "Upload", '<p class="lx-meta">counter.jpg</p><div class="lx-meter"><span></span></div>', { play: "lx-live" }),
    card("progress-thin", "Thin", '<div class="lx-bar" style="height:3px"><span style="width:50%"></span></div>'),
    card("progress-pct", "Percent", '<p class="lx-mono"><span data-count="80">0</span>%</p>', { play: "lx-count" }),
    card("progress-seg", "Segments", '<div style="display:flex;gap:4px"><i style="flex:1;height:6px;background:#111;border-radius:99px"></i><i style="flex:1;height:6px;background:#111;border-radius:99px"></i><i style="flex:1;height:6px;background:#e4e4e7;border-radius:99px"></i></div>'),
    card("progress-done", "Complete", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>100%</span></div>')
  ]);

  LX.spec("radio-groups", ["forms-radio", "choice-cards", "choice-quiz"], [
    card("radios-row", "Row", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>Day</button><button type="button" class="lx-chip" data-lx-opt>Week</button></div>'),
    card("radios-stack", "Stack", '<div class="lx-acc"><button type="button" class="is-open" data-lx-opt>Cafe</button><button type="button" data-lx-opt>Shop</button></div>'),
    card("radios-desc", "With description", '<button type="button" class="lx-tile" data-lx-opt style="width:100%;text-align:left"><strong>Publish</strong><p class="lx-p">Send the live link</p></button>'),
    card("radios-error", "Error", '<p class="lx-hint is-danger">Pick one</p>'),
    card("radios-disabled", "Disabled", '<button type="button" class="lx-chip" disabled>Closed</button>'),
    card("radios-focus", "Focus", '<button type="button" class="lx-chip is-on is-focus" data-lx-opt>Selected</button>'),
    card("radios-compact", "Compact", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>A</button><button type="button" class="lx-chip" data-lx-opt>B</button></div>')
  ]);

  LX.spec("search-bars", ["forms-search"], LX.states("search-bars", function (k) {
    const cls = ["lx-field"];
    if (k === "focus") cls.push("is-focus");
    if (k === "error" || k === "danger") cls.push("is-danger");
    if (k === "ghost") cls.push("is-ghost");
    if (k === "hover") cls.push("is-hover");
    if (k === "disabled") cls.push("is-disabled");
    if (k === "compact") cls.push("is-compact");
    const val = k === "filled" || k === "danger" ? "harbor" : "";
    const spin = k === "loading" ? '<i class="lx-spin is-on"></i>' : "";
    const hint = k === "error" ? '<p class="lx-hint is-danger">Nothing matched</p>' : (k === "danger" ? '<p class="lx-hint is-danger">Search failed</p>' : "");
    return '<label class="' + cls.join(" ") + '"><span>Search</span><span class="lx-input-wrap">' + ico("search", "sm") + '<input value="' + val + '" placeholder="Search" aria-label="Search"' + (k === "disabled" ? " disabled" : "") + ">" + spin + "</span></label>" + hint;
  }, 9));

  LX.spec("selects", ["menus-select"], [
    card("selects-rest", "Rest", '<label class="lx-field"><span>City</span><select class="lx-input" aria-label="City"><option>Seattle</option><option>Tacoma</option></select></label>'),
    card("selects-focus", "Focus", '<label class="lx-field is-focus"><span>City</span><select class="lx-input" aria-label="City"><option>Seattle</option></select></label>'),
    card("selects-filled", "Filled", '<label class="lx-field"><span>Plan</span><select aria-label="Plan"><option>Site</option></select></label>'),
    card("selects-error", "Error", '<label class="lx-field is-danger"><span>City</span><select aria-label="City"><option>Choose</option></select></label><p class="lx-hint is-danger">Choose a city</p>'),
    card("selects-disabled", "Disabled", '<select class="lx-input" disabled aria-label="City"><option>Seattle</option></select>'),
    card("selects-ghost", "Ghost", '<select class="lx-input" style="background:transparent" aria-label="Sort"><option>Newest</option></select>'),
    card("selects-compact", "Compact", '<select class="lx-input" style="min-height:28px" aria-label="Rows"><option>10</option></select>'),
    card("selects-multi", "Grouped", '<select class="lx-input" aria-label="Place"><optgroup label="Washington"><option>Seattle</option><option>Tacoma</option></optgroup></select>'),
    card("selects-loading", "Loading", '<div class="lx-row"><span>Cities</span><i class="lx-spin is-on"></i></div>', { play: "lx-live" })
  ]);

  function side(active) {
    return LX.app(["Sites", "Leads", "Guide", "You"], active, '<p class="lx-h">' + active + "</p>", false);
  }
  LX.spec("sidebars", [], [
    card("side-icons", "Icons", '<div class="lx-side">' + ["search", "file", "user"].map(function (n, i) { return '<button type="button" class="' + (i === 0 ? "is-on" : "") + '">' + ico(n, "sm") + "</button>"; }).join("") + "</div>"),
    card("side-labels", "Labels", side("Sites"), { wide: true, stage: "lx-tall" }),
    card("side-collapsed", "Collapsed", '<div class="lx-side" style="width:3rem">' + ico("file", "sm") + "</div>"),
    card("side-nested", "Nested", '<div class="lx-tree"><button type="button" class="is-on">Sites</button><div class="sub"><button type="button">Harbor</button></div></div>'),
    card("side-user", "Footer user", LX.app(["Sites", "Leads"], "Sites", '<p class="lx-p">Main</p>') + "", { wide: true }),
    card("side-active", "Active", side("Leads"), { wide: true, stage: "lx-tall" }),
    card("side-sections", "Sections", '<div class="lx-side"><p class="lx-kicker">Work</p><button type="button" class="is-on">Sites</button><p class="lx-kicker">Account</p><button type="button">You</button></div>'),
    card("side-overlay", "Overlay", '<div class="lx-stage-dim" style="justify-items:start"><div class="lx-side" style="min-height:8rem;background:#fff">' + side("Guide") + "</div></div>", { wide: true }),
    card("side-inverse", "Inverse", '<div class="lx-side" style="background:#161616">' + '<button type="button" class="is-on">Sites</button></div>', { stage: "lx-on-dark" }),
    card("side-search", "Search", '<div class="lx-side"><input class="lx-input" placeholder="Find" aria-label="Find"><button type="button" class="is-on">Sites</button></div>')
  ]);

  function authMini(title, body) {
    return '<div class="lx-panel"><p class="lx-h">' + title + "</p>" + body + "</div>";
  }
  LX.spec("sign-in", [], [
    card("signin-minimal", "Minimal", authMini("Sign in", LX.field("Email", "focus", "") + btn("Continue"))),
    card("signin-split", "Split", '<div class="lx-panel split"><div class="lx-aside"><p class="lx-h" style="color:#fff">moonrise.</p><p class="lx-p">Studio</p></div><div class="lx-form">' + LX.field("Email", "", "") + btn("Continue") + "</div></div>", { wide: true, stage: "lx-tall" }),
    card("signin-stack", "Stacked", authMini("Sign in", LX.field("Email", "", "ada@harbor.test") + LX.field("Password", "", "••••••••") + btn("Sign in"))),
    card("signin-error", "Error", authMini("Sign in", LX.field("Email", "error", "ada", "Enter a full email"))),
    card("signin-loading", "Loading", authMini("Sign in", btn("Sign in", "loading")), { play: "lx-live" }),
    card("signin-code", "Code", authMini("Check the code", '<div class="lx-codes"><i class="is-on">4</i><i></i><i></i><i></i><i></i><i></i></div>')),
    card("signin-magic", "Magic link", authMini("Check your email", '<p class="lx-p">We sent a link to ada@harbor.test.</p>')),
    card("signin-sso", "Other ways", authMini("Sign in", btn("Email a link", "ghost") + btn("Use a code", "ghost"))),
    card("signin-success", "Success", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Signed in</span></div>'),
    card("signin-compact", "Compact", '<div class="lx-compose"><input class="lx-input" placeholder="Email" aria-label="Email">' + btn("Go", "compact") + "</div>")
  ]);

  LX.spec("sign-up", [], [
    card("signup-name", "Name and email", authMini("Create account", LX.field("Name", "", "Ada") + LX.field("Email", "focus", "") + btn("Create"))),
    card("signup-rules", "Password", authMini("Password", LX.field("Password", "focus", "") + '<p class="lx-hint">At least 8 characters</p>')),
    card("signup-terms", "Terms", authMini("Create account", '<label class="lx-row">' + chk(false) + "<span>I agree to the terms</span></label>" + btn("Create"))),
    card("signup-error", "Error", authMini("Create account", LX.field("Email", "error", "ada", "That email is in use"))),
    card("signup-loading", "Loading", authMini("Create account", btn("Create", "loading")), { play: "lx-live" }),
    card("signup-success", "Success", '<div class="lx-alert is-ok"><span class="lx-dot ok"></span><span>Account ready</span></div>'),
    card("signup-invite", "Invite", authMini("You are invited", '<p class="lx-p">Join Harbor Coffee.</p>' + btn("Accept"))),
    card("signup-split", "Split", '<div class="lx-panel split"><div class="lx-aside"><p class="lx-h" style="color:#fff">Start</p></div><div class="lx-form">' + LX.field("Email", "", "") + btn("Create") + "</div></div>", { wide: true, stage: "lx-tall" }),
    card("signup-minimal", "Minimal", authMini("Create account", LX.field("Email", "focus", "") + btn("Continue"))),
    card("signup-have", "Already in", authMini("Create account", LX.field("Email", "", "") + '<p class="lx-p">Already have an account? <a class="lx-link" href="#sign-in">Sign in</a></p>'))
  ]);

  LX.spec("sliders", ["adv-slider"], [
    card("sliders-rest", "Rest", '<input class="lx-slider" type="range" value="40" aria-label="Volume">'),
    card("sliders-focus", "Focus", '<input class="lx-slider is-focus" type="range" value="40" aria-label="Volume">'),
    card("sliders-filled", "Set", '<input class="lx-slider" type="range" value="70" aria-label="Volume"><p class="lx-mono">70</p>'),
    card("sliders-disabled", "Disabled", '<input class="lx-slider" type="range" value="20" disabled aria-label="Volume">'),
    card("sliders-compact", "Compact", '<input class="lx-slider" type="range" value="50" aria-label="Zoom" style="height:4px">'),
    card("sliders-label", "Labeled", '<div class="lx-row"><span>Brightness</span><span class="lx-mono">40</span></div><input class="lx-slider" type="range" value="40" aria-label="Brightness">'),
    card("sliders-range", "Ends", '<div class="lx-row"><span class="lx-meta">0</span><input class="lx-slider" type="range" value="30" aria-label="Amount"><span class="lx-meta">100</span></div>'),
    card("sliders-error", "Error", '<input class="lx-slider" type="range" value="10" aria-label="Amount"><p class="lx-hint is-danger">Too low</p>'),
    card("sliders-play", "Move", '<input class="lx-slider" type="range" value="15" aria-label="Progress">', { play: "lx-live" })
  ]);

  LX.spec("spinner-loaders", ["loaders-spinner", "loaders-skeleton", "loaders-pulse", "loaders-button", "loaders-fullscreen"], [
    card("spinners-thin", "Thin", '<div class="lx-spinbox"><i class="lx-spin thin is-on"></i></div>', { play: "lx-live" }),
    card("spinners-inverse", "Inverse", '<div class="lx-spinbox"><i class="lx-spin is-on"></i></div>', { play: "lx-live", stage: "lx-on-dark" }),
    card("spinners-det", "Determinate", '<svg class="lx-ring" viewBox="0 0 36 36"><circle class="lx-ring-track" cx="18" cy="18" r="15"/><circle class="lx-ring-val" cx="18" cy="18" r="15"/></svg>', { play: "lx-live" }),
    card("spinners-logo", "Logo", '<div class="lx-row"><strong>moonrise.</strong><i class="lx-spin is-on"></i></div>', { play: "lx-live" }),
    card("spinners-bar", "Bar", '<div class="lx-skel"></div>', { play: "lx-live" })
  ]);

  LX.spec("tables", ["data-table"], [
    card("tables-simple", "Simple", '<table class="lx-table"><tr><th>Site</th><th>Status</th></tr><tr><td>Harbor</td><td>Live</td></tr></table>'),
    card("tables-sort", "Sortable", '<table class="lx-table"><tr><th>Name</th><th class="num">Leads</th></tr><tr><td>Harbor</td><td class="num">14</td></tr><tr><td>Northline</td><td class="num">3</td></tr></table>'),
    card("tables-select", "Selectable", '<table class="lx-table"><tr class="is-on"><td>' + chk(true) + "</td><td>Harbor</td></tr></table>"),
    card("tables-sticky", "Sticky head", '<div class="lx-scroll thin"><table class="lx-table is-sticky"><tr><th>Day</th><th>Hours</th></tr><tr><td>Mon</td><td>7–3</td></tr><tr><td>Tue</td><td>7–3</td></tr><tr><td>Wed</td><td>7–3</td></tr></table></div>'),
    card("tables-actions", "Row action", '<table class="lx-table"><tr><td>Harbor</td><td>' + btn("Open", "compact") + "</td></tr></table>"),
    card("tables-pages", "Pages", '<p class="lx-meta">1–2 of 8</p>'),
    card("tables-dense", "Dense", '<table class="lx-table"><tr><td class="lx-mono">01</td><td>Pike</td></tr><tr><td class="lx-mono">02</td><td>Union</td></tr></table>'),
    card("tables-empty", "Empty", '<table class="lx-table"><tr><th>Site</th></tr></table><p class="lx-meta">No rows</p>'),
    card("tables-loading", "Loading", '<div class="lx-skel"></div><div class="lx-skel"></div>', { play: "lx-live" })
  ]);

  LX.spec("tabs", ["nav-tabs"], [
    card("tabs-line", "Line", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>Hours</button><button type="button" class="lx-tab" data-lx-opt>Menu</button><button type="button" class="lx-tab" data-lx-opt>Visit</button></div>'),
    card("tabs-fill", "Filled", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>Day</button><button type="button" class="lx-chip" data-lx-opt>Week</button></div>'),
    card("tabs-icon", "Icons", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>' + ico("file", "sm") + '</button><button type="button" class="lx-tab" data-lx-opt>' + ico("user", "sm") + "</button></div>"),
    card("tabs-vert", "Vertical", '<div class="lx-side"><button type="button" class="is-on">About</button><button type="button">Hours</button></div>'),
    card("tabs-count", "Count", '<button type="button" class="lx-tab is-on">Leads <span class="lx-badge go">3</span></button>'),
    card("tabs-disabled", "Disabled", '<button type="button" class="lx-tab" disabled>Soon</button>'),
    card("tabs-panel", "Panel", '<div class="lx-tabs"><button type="button" class="lx-tab is-on" data-lx-opt>About</button></div><p class="lx-p">Open at 7 on Pike.</p>'),
    card("tabs-inverse", "Inverse", '<div class="lx-tabs"><button type="button" class="lx-tab is-on">Live</button></div>', { stage: "lx-on-dark" }),
    card("tabs-scroll", "Scroll", '<div class="lx-scroll x"><span class="lx-tab is-on">Mon</span> <span class="lx-tab">Tue</span> <span class="lx-tab">Wed</span> <span class="lx-tab">Thu</span> <span class="lx-tab">Fri</span></div>', { stage: "lx-clip" })
  ]);

  LX.spec("tags", ["adv-tags", "choice-chips"], [
    card("tags-neutral", "Neutral", '<span class="lx-badge">Friday</span>'),
    card("tags-selected", "Selected", '<span class="lx-badge go">Live</span>'),
    card("tags-remove", "Removable", '<span class="lx-badge">Pike <button type="button" class="lx-textbtn" data-lx-dismiss>×</button></span>'),
    card("tags-add", "Add", '<div class="lx-compose"><input class="lx-input" placeholder="Add a tag" aria-label="Tag"><button type="button" class="lx-btn is-compact" data-lx-add>Add</button></div>'),
    card("tags-more", "Overflow", '<span class="lx-badge">Cafe</span> <span class="lx-badge">+2</span>'),
    card("tags-status", "Status", '<span class="lx-badge"><i class="lx-dot ok"></i> Open</span>'),
    card("tags-filter", "Filter", '<div class="lx-chips"><button type="button" class="lx-chip is-on" data-lx-opt>All</button><button type="button" class="lx-chip" data-lx-opt>Live</button></div>'),
    card("tags-dark", "Inverse", '<span class="lx-badge on-dark">Draft</span>', { stage: "lx-on-dark" })
  ]);

  LX.spec("text-areas", [], LX.states("text-areas", function (k) {
    return LX.area("Note", k) + (k === "error" ? '<p class="lx-hint is-danger">Add a note</p>' : "") + (k === "filled" ? '<p class="lx-meta">18 / 200</p>' : "");
  }, 10));

  LX.spec("toasts", ["feedback-toast"], [
    card("toasts-info", "Info", '<div class="lx-toast">Saved</div>'),
    card("toasts-ok", "Success", '<div class="lx-toast"><span class="lx-dot ok"></span> Published</div>'),
    card("toasts-bad", "Error", '<div class="lx-toast"><span class="lx-dot bad"></span> Try again</div>'),
    card("toasts-action", "Action", '<div class="lx-toast">Lead in <button type="button" class="lx-textbtn" data-lx-act="Opened">View</button></div>'),
    card("toasts-undo", "Undo", '<div class="lx-toast">Removed <button type="button" class="lx-textbtn" data-lx-act="Undone">Undo</button></div>'),
    card("toasts-stack", "Stack", '<div style="display:grid;gap:6px"><div class="lx-toast">First</div><div class="lx-toast">Second</div></div>'),
    card("toasts-top", "Top", '<div class="lx-toast">Top of the screen</div>'),
    card("toasts-bottom", "Bottom", '<div class="lx-toast">Bottom of the screen</div>'),
    card("toasts-time", "Timed", '<div class="lx-toast"><span>Closing</span><div class="lx-meter"><span></span></div></div>', { play: "lx-live" })
  ]);

  LX.spec("toggles", ["forms-toggle", "forms-segmented", "choice-like"], [
    card("toggles-off", "Off", tog(false)),
    card("toggles-on", "On", tog(true)),
    card("toggles-label", "Label", '<label class="lx-row"><span>Publish notice</span>' + tog(true) + "</label>"),
    card("toggles-desc", "Description", '<div class="lx-row"><span>Email leads<br><span class="lx-meta">Once a day</span></span>' + tog(false) + "</div>"),
    card("toggles-disabled", "Disabled", '<button type="button" class="lx-toggle" disabled aria-label="Off"></button>'),
    card("toggles-focus", "Focus", '<button type="button" class="lx-toggle is-on is-focus" data-lx-toggle aria-label="On"></button>'),
    card("toggles-loading", "Loading", '<i class="lx-spin is-on"></i>', { play: "lx-live" })
  ]);

  LX.spec("tooltips", ["menus-tooltip"], [
    card("tips-top", "Top", '<div class="lx-tip">Copy link</div>'),
    card("tips-bottom", "Bottom", '<div class="lx-tip">More</div>'),
    card("tips-start", "Start", '<div class="lx-tip">Back</div>'),
    card("tips-end", "End", '<div class="lx-tip">Next</div>'),
    card("tips-kbd", "Shortcut", '<div class="lx-tip">Save <span class="lx-mono">⌘S</span></div>'),
    card("tips-long", "Long", '<div class="lx-tip">Publishes the current draft to the live link.</div>'),
    card("tips-instant", "Instant", '<div class="lx-tip">Shown at once</div>'),
    card("tips-delay", "Delay", '<div class="lx-reveal"><div class="lx-rise"><div class="lx-tip">After a beat</div></div></div>', { play: "lx-live" }),
    card("tips-icon", "On icon", '<span class="lx-avatar">' + ico("alert", "sm") + '</span><div class="lx-tip">Needs a phone</div>')
  ]);
})();
