/**
 * Owner audit: company totals and per-employee websites and sales.
 * Runs only after the Admin Console owner gate.
 */
(function () {
  const PROJECT_SELECT =
    "id, user_id, business_name, status, watermark_enabled, price_cents, vercel_url, business_context, created_at, updated_at";
  const PAYMENT_SELECT = "id, user_id, project_id, amount_cents, kind, status, created_at";

  let employees = [];
  let savedEmployees = [];
  let savedExtras = { hostingCents: 0, liveTotal: 0, siteCount: 0 };
  let query = "";
  let siteQuery = "";
  let siteFilter = "all";
  let subscriberQuery = "";
  let subscriberFilter = "all";
  let loading = false;
  let playtestOn = false;
  const openIds = new Set();

  const $ = (id) => document.getElementById(id);
  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  function money(cents) {
    const n = Number(cents);
    const safe = Number.isFinite(n) ? n : 0;
    return "$" + (safe / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function shares(cents) {
    const sale = Math.max(0, Math.round(Number(cents) || 0));
    const creator = Math.round(sale * (window.StudioIncome?.INCOME_RATE || 0.9));
    return { sale, creator, platform: Math.max(0, sale - creator) };
  }

  function when(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function readContext(project) {
    const ctx = project?.business_context;
    return ctx && typeof ctx === "object" && !Array.isArray(ctx) ? ctx : {};
  }

  function siteHref(project) {
    const direct = String(project?.vercel_url || "").trim();
    const ctx = readContext(project);
    const custom = String(ctx.customDomain || "").trim();
    const slug = String(ctx.vercelSlug || "").trim();
    const raw = direct || custom || (slug ? slug + ".vercel.app" : "");
    if (!raw) return "";
    const withProto = /^https?:\/\//i.test(raw) ? raw : "https://" + raw.replace(/^\/+/, "");
    try {
      const url = new URL(withProto);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      return url.href;
    } catch (_) {
      return "";
    }
  }

  function siteLabel(href) {
    return String(href || "")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
  }

  function isGoLiveSale(payment, project) {
    if (!payment || !project) return false;
    if (String(payment.status || "").toLowerCase() !== "paid") return false;
    const kind = String(payment.kind || "").toLowerCase();
    if (kind && kind !== "go_live") return false;
    if (project.watermark_enabled === false) return true;
    return String(project.status || "").toLowerCase() === "paid";
  }

  function isLive(project) {
    const status = String(project?.status || "").toLowerCase();
    return status === "paid" || status === "published";
  }

  async function fetchAll(makeQuery) {
    const pageSize = 1000;
    const all = [];
    for (let from = 0; from < 20000; from += pageSize) {
      const { data, error } = await makeQuery().range(from, from + pageSize - 1);
      if (error) throw error;
      const batch = Array.isArray(data) ? data : [];
      all.push(...batch);
      if (batch.length < pageSize) break;
    }
    return all;
  }

  function setStat(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function cloneList(list) {
    return (list || []).map((employee) => ({
      ...employee,
      sites: (employee.sites || []).map((site) => ({ ...site })),
    }));
  }

  function renderAttention(list) {
    const box = $("admin-attention");
    if (!box) return;
    const ready = [];
    (list || []).forEach((employee) => {
      employee.sites.forEach((site) => {
        if (site.saleCents > 0) return;
        if (site.status === "preview" || site.status === "published") {
          ready.push((employee.handle ? "@" + employee.handle : "Account") + " · " + site.name);
        }
      });
    });
    const quiet = (list || []).filter(
      (employee) => !employee.owner && employee.sites.length > 0 && employee.soldCount === 0
    );
    const items = [];
    if (ready.length) {
      items.push({
        title: ready.length + (ready.length === 1 ? " website is built and still unsold" : " websites are built and still unsold"),
        detail: ready.slice(0, 4).join(", "),
      });
    }
    if (quiet.length) {
      items.push({
        title: quiet.length + (quiet.length === 1 ? " employee has sites and no sales" : " employees have sites and no sales"),
        detail: quiet
          .slice(0, 4)
          .map((employee) => (employee.handle ? "@" + employee.handle : "Account"))
          .join(", "),
      });
    }
    if (!items.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    box.innerHTML = items
      .map(
        (item) =>
          '<article class="ms-admin-attention-item"><strong>' +
          esc(item.title) +
          "</strong><span>" +
          esc(item.detail) +
          "</span></article>"
      )
      .join("");
  }

  function publish(list, extras, save) {
    const hostingCents = Number(extras?.hostingCents) || 0;
    const siteCount =
      extras?.siteCount != null
        ? extras.siteCount
        : list.reduce((sum, employee) => sum + employee.sites.length, 0);
    const liveTotal =
      extras?.liveTotal != null
        ? extras.liveTotal
        : list.reduce(
            (sum, employee) =>
              sum + employee.sites.filter((site) => site.status === "paid" || site.status === "published").length,
            0
          );
    if (save) {
      savedEmployees = cloneList(list);
      savedExtras = { hostingCents, liveTotal, siteCount };
    }
    employees = list;
    const soldCount = list.reduce((sum, employee) => sum + employee.soldCount, 0);
    const salesTotal = list.reduce((sum, employee) => sum + employee.saleCents, 0);
    const platformTotal = list.reduce((sum, employee) => sum + (employee.platformCents || 0), 0);
    const owedTotal = list.reduce((sum, employee) => sum + (employee.owedCents || 0), 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    let monthSales = 0;
    list.forEach((employee) => {
      employee.sites.forEach((site) => {
        if (!site.saleCents || !site.soldAt) return;
        const sold = new Date(site.soldAt);
        if (!Number.isNaN(sold.getTime()) && sold >= monthStart) monthSales += site.saleCents;
      });
    });
    setStat("admin-stat-employees", String(list.length));
    setStat("admin-stat-sites", String(siteCount));
    setStat("admin-stat-live", String(liveTotal));
    setStat("admin-stat-sales", money(salesTotal));
    setStat("admin-stat-platform", money(platformTotal));
    setStat("admin-stat-owed", money(owedTotal));
    setStat("admin-stat-close", siteCount ? Math.round((soldCount / siteCount) * 100) + "%" : "0%");
    setStat("admin-stat-average", soldCount ? money(Math.round(salesTotal / soldCount)) : "$0.00");
    setStat("admin-stat-pipeline", String(Math.max(0, siteCount - soldCount)));
    setStat("admin-stat-month", money(monthSales));
    setStat("admin-stat-hosting", money(hostingCents));
    const payingNow = list.reduce(
      (sum, employee) =>
        sum +
        employee.sites.filter((site) => site.hostingStatus === "paying" || site.hostingStatus === "canceling").length,
      0
    );
    setStat("admin-stat-subscribers", String(payingNow));
    renderAttention(list);
    render();
    renderWebsites();
    renderSubscribers();
  }

  function allSites() {
    const rows = [];
    employees.forEach((employee) => {
      (employee.sites || []).forEach((site) => {
        rows.push({
          ...site,
          handle: employee.handle,
          displayName: employee.displayName,
          owner: employee.owner,
        });
      });
    });
    rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return rows;
  }

  function weekSeries() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const weeks = [];
    for (let i = 7; i >= 0; i -= 1) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: 0,
        cents: 0,
      });
    }
    return weeks;
  }

  function inWeek(iso, week) {
    const date = new Date(iso || "");
    if (Number.isNaN(date.getTime())) return false;
    return date >= week.start && date < week.end;
  }

  function barChart(title, weeks, key, format) {
    const max = Math.max(1, ...weeks.map((week) => Number(week[key]) || 0));
    const bars = weeks
      .map((week) => {
        const value = Number(week[key]) || 0;
        const height = Math.max(2, Math.round((value / max) * 100));
        return (
          '<div class="ms-admin-bar" title="' +
          esc(week.label + ": " + format(value)) +
          '"><i style="height:' +
          height +
          '%"></i><em>' +
          esc(week.label) +
          "</em></div>"
        );
      })
      .join("");
    return '<section class="ms-admin-chart"><h2>' + esc(title) + '</h2><div class="ms-admin-bars">' + bars + "</div></section>";
  }

  function statusChart(sites) {
    const labels = [
      ["paid", "Paid"],
      ["published", "Published"],
      ["preview", "Preview"],
      ["draft", "Draft"],
    ];
    const counts = labels.map(([status]) => sites.filter((site) => site.status === status).length);
    const max = Math.max(1, ...counts);
    const rows = labels
      .map(([status, label], index) => {
        const count = counts[index];
        const width = Math.round((count / max) * 100);
        return (
          '<div class="ms-admin-status-row"><span>' +
          esc(label) +
          '</span><span class="ms-admin-status-track"><i style="width:' +
          width +
          '%"></i></span><b>' +
          count +
          "</b></div>"
        );
      })
      .join("");
    return '<section class="ms-admin-chart"><h2>Status</h2>' + rows + "</section>";
  }

  function filteredSites(sites) {
    const q = siteQuery.trim().toLowerCase();
    return sites.filter((site) => {
      if (siteFilter === "paid" && !(site.saleCents > 0)) return false;
      if (siteFilter === "unpaid" && site.saleCents > 0) return false;
      if (["draft", "preview", "published"].includes(siteFilter) && site.status !== siteFilter) return false;
      if (!q) return true;
      return [site.name, site.handle, site.displayName, site.category, site.address, site.href, site.sampleHost]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }

  function hostingLabel(status) {
    if (status === "paying") return "Paying";
    if (status === "canceling") return "Cancels soon";
    if (status === "past_due") return "Past due";
    if (status === "canceled") return "Canceled";
    return status ? "On file" : "Not subscribed";
  }

  function hostingState(ctx, saleCents) {
    const stored = String(ctx.hostingStatus || "").toLowerCase();
    if (["paying", "canceling", "past_due", "canceled"].includes(stored)) return stored;
    if (ctx.hostingEndedAt) return "canceled";
    const sub = String(ctx.hostingSubscriptionId || "");
    const email = String(ctx.hostingBuyerEmail || ctx.purchaseInvoiceEmailTo || "").trim();
    if (sub.startsWith("sub_") || email || saleCents > 0) return "paying";
    return "";
  }

  function renderWebsites() {
    const charts = $("admin-charts");
    const list = $("admin-sites");
    const empty = $("admin-sites-empty");
    if (!list || !charts) return;
    const sites = allSites();
    const created = weekSeries();
    const sold = weekSeries();
    sites.forEach((site) => {
      created.forEach((week) => {
        if (inWeek(site.createdAt, week)) week.count += 1;
      });
      sold.forEach((week) => {
        if (site.saleCents > 0 && inWeek(site.soldAt || site.createdAt, week)) week.cents += site.saleCents;
      });
    });
    charts.innerHTML =
      barChart("Websites created", created, "count", (value) => String(value)) +
      barChart("Sales", sold, "cents", (value) => money(value)) +
      statusChart(sites);
    const visible = filteredSites(sites);
    if (!visible.length) {
      list.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        const title = empty.querySelector(".ms-clients-empty-title");
        const desc = empty.querySelector(".ms-clients-empty-desc");
        if (siteQuery.trim() || siteFilter !== "all") {
          if (title) title.textContent = "No matches";
          if (desc) desc.textContent = "Try another name or filter.";
        } else {
          if (title) title.textContent = "No websites yet";
          if (desc) desc.textContent = "Sites employees create in the Builder show up here.";
        }
      }
      return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = visible
      .map((site) => {
        const href = site.href
          ? '<a href="' + esc(site.href) + '" target="_blank" rel="noopener noreferrer">' + esc(siteLabel(site.href)) + "</a>"
          : site.sampleHost
            ? esc(site.sampleHost)
            : "No link yet";
        const maker = site.handle ? "@" + site.handle : site.displayName || "Unknown";
        const paid = site.saleCents > 0 ? "Paid " + money(site.saleCents) : "Not paid";
        const fields = [
          ["Made by", maker + (site.owner ? " · Owner" : "")],
          ["Created", when(site.createdAt) || "—"],
          ["Updated", when(site.updatedAt) || when(site.createdAt) || "—"],
          ["Payment", paid],
          ["Asking", site.listCents > 0 ? money(site.listCents) : "—"],
          ["Category", site.category || "—"],
          ["Watermark", site.watermark === false ? "Off" : "On"],
          ["Hosting", site.hostingStatus ? hostingLabel(site.hostingStatus) : "Not subscribed"],
          ["Link", href],
        ];
        if (site.address) fields.splice(6, 0, ["Address", site.address]);
        return (
          '<article class="ms-admin-website">' +
          '<header class="ms-admin-website-head"><strong>' +
          esc(site.name || "Untitled business") +
          '</strong><span class="ms-admin-badge is-' +
          esc(site.status) +
          '">' +
          esc(site.status || "draft") +
          "</span></header>" +
          '<dl class="ms-admin-website-grid">' +
          fields
            .map(([label, value]) => fieldHtml(label, value, label === "Link"))
            .join("") +
          "</dl></article>"
        );
      })
      .join("");
  }

  function fieldHtml(label, value, raw) {
    const wide = label === "Link" || label === "Address" || label === "Record";
    return (
      '<div class="' +
      (wide ? "is-wide" : "") +
      '"><dt>' +
      esc(label) +
      "</dt><dd>" +
      (raw ? value : esc(value)) +
      "</dd></div>"
    );
  }

  function subscribers() {
    return allSites().filter((site) => site.hostingStatus);
  }

  function renderSubscribers() {
    const charts = $("admin-subscriber-charts");
    const list = $("admin-subscribers");
    const empty = $("admin-subscribers-empty");
    if (!list || !charts) return;
    const rows = subscribers();
    const started = weekSeries();
    const collected = weekSeries();
    rows.forEach((site) => {
      started.forEach((week) => {
        if (inWeek(site.hostingStarted, week)) week.count += 1;
      });
      (site.hostingPayments || []).forEach((payment) => {
        collected.forEach((week) => {
          if (inWeek(payment.at, week)) week.cents += Number(payment.cents) || 0;
        });
      });
    });
    const labels = [
      ["paying", "Paying"],
      ["canceling", "Cancels soon"],
      ["past_due", "Past due"],
      ["canceled", "Canceled"],
    ];
    const counts = labels.map(([status]) => rows.filter((site) => site.hostingStatus === status).length);
    const max = Math.max(1, ...counts);
    const mix = labels
      .map(([status, label], index) => {
        const count = counts[index];
        const width = Math.round((count / max) * 100);
        return (
          '<div class="ms-admin-status-row"><span>' +
          esc(label) +
          '</span><span class="ms-admin-status-track"><i style="width:' +
          width +
          '%"></i></span><b>' +
          count +
          "</b></div>"
        );
      })
      .join("");
    charts.innerHTML =
      barChart("Subscribers started", started, "count", (value) => String(value)) +
      barChart("Hosting collected", collected, "cents", (value) => money(value)) +
      '<section class="ms-admin-chart"><h2>Who is paying</h2>' +
      mix +
      "</section>";

    const q = subscriberQuery.trim().toLowerCase();
    const visible = rows.filter((site) => {
      if (subscriberFilter !== "all" && site.hostingStatus !== subscriberFilter) return false;
      if (!q) return true;
      return [site.name, site.buyerEmail, site.buyerPhone, site.handle, site.displayName, site.address, site.category]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    if (!visible.length) {
      list.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        const title = empty.querySelector(".ms-clients-empty-title");
        const desc = empty.querySelector(".ms-clients-empty-desc");
        if (subscriberQuery.trim() || subscriberFilter !== "all") {
          if (title) title.textContent = "No matches";
          if (desc) desc.textContent = "Try another name, email, or status.";
        } else {
          if (title) title.textContent = "No subscribers yet";
          if (desc) desc.textContent = "Business owners who pay hosting show up here.";
        }
      }
      return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = visible
      .map((site) => {
        const href = site.href
          ? '<a href="' + esc(site.href) + '" target="_blank" rel="noopener noreferrer">' + esc(siteLabel(site.href)) + "</a>"
          : site.sampleHost
            ? esc(site.sampleHost)
            : "No link yet";
        const maker = site.handle ? "@" + site.handle : site.displayName || "Unknown";
        const payments = site.hostingPayments || [];
        const collectedTotal = payments.reduce((sum, payment) => sum + (Number(payment.cents) || 0), 0);
        const history = payments.length
          ? payments
              .slice(0, 6)
              .map((payment) => (when(payment.at) || "Payment") + " · " + money(payment.cents))
              .join("<br>")
          : "No renewal recorded yet";
        const renews =
          site.hostingStatus === "canceled"
            ? when(site.hostingEnded) || "Ended"
            : when(site.hostingRenews) || "—";
        const fields = [
          ["Business owner", site.buyerEmail || "Email not on file"],
          ["Phone", site.buyerPhone || "—"],
          ["Address", site.address || "—"],
          ["Monthly", site.hostingMonthly > 0 ? money(site.hostingMonthly) : "—"],
          ["Started", when(site.hostingStarted) || "—"],
          ["Last payment", when(site.hostingLastPaid) || "—"],
          [site.hostingStatus === "canceled" ? "Ended" : "Renews", renews],
          ["Collected", payments.length ? payments.length + " · " + money(collectedTotal) : "—"],
          ["Record", history],
          ["Sold by", maker],
          ["Link", href],
        ];
        return (
          '<article class="ms-admin-website">' +
          '<header class="ms-admin-website-head"><strong>' +
          esc(site.name || "Untitled business") +
          '</strong><span class="ms-admin-badge is-' +
          esc(site.hostingStatus) +
          '">' +
          esc(hostingLabel(site.hostingStatus)) +
          "</span></header>" +
          '<dl class="ms-admin-website-grid">' +
          fields
            .map(([label, value]) => fieldHtml(label, value, label === "Link" || label === "Record"))
            .join("") +
          "</dl></article>"
        );
      })
      .join("");
  }

  function showTab(name) {
    const panels = {
      employees: $("admin-panel-employees"),
      websites: $("admin-panel-websites"),
      subscribers: $("admin-panel-subscribers"),
      payouts: $("admin-panel-payouts"),
    };
    Object.keys(panels).forEach((key) => {
      if (panels[key]) panels[key].hidden = key !== name;
    });
    document.querySelectorAll("[data-admin-tab]").forEach((button) => {
      const on = button.getAttribute("data-admin-tab") === name;
      button.classList.toggle("is-active", on);
      button.setAttribute("aria-selected", on ? "true" : "false");
    });
    const hashes = { websites: "#websites", subscribers: "#subscribers", payouts: "#payouts" };
    const wanted = hashes[name] || "";
    const known = Object.values(hashes);
    if (location.hash !== wanted && (wanted || known.includes(location.hash))) {
      history.replaceState(null, "", wanted || location.pathname + location.search);
    }
  }

  function filtered() {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((employee) => {
      const blob = [
        employee.handle,
        employee.displayName,
        ...employee.sites.map((site) => site.name + " " + site.href),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  function render() {
    const list = $("admin-employees");
    const empty = $("admin-employees-empty");
    if (!list) return;
    const rows = filtered();
    if (!rows.length) {
      list.innerHTML = "";
      if (empty) {
        empty.hidden = false;
        const title = empty.querySelector(".ms-clients-empty-title");
        const desc = empty.querySelector(".ms-clients-empty-desc");
        if (query.trim()) {
          if (title) title.textContent = "No matches";
          if (desc) desc.textContent = "Try another employee or website name.";
        } else {
          if (title) title.textContent = "No employees yet";
          if (desc) desc.textContent = "Accounts created with an Employee ID show up here.";
        }
      }
      return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = rows
      .map((employee) => {
        const open = openIds.has(employee.id);
        const sites = employee.sites
          .map((site) => {
            const href = site.href
              ? '<a href="' + esc(site.href) + '" target="_blank" rel="noopener noreferrer">' + esc(siteLabel(site.href)) + "</a>"
              : site.sampleHost
                ? '<span class="ms-clients-muted">' + esc(site.sampleHost) + "</span>"
                : '<span class="ms-clients-muted">No link yet</span>';
            const priceLabel =
              site.saleCents > 0
                ? money(site.saleCents)
                : site.listCents > 0
                  ? "Asking " + money(site.listCents)
                  : "Not sold";
            return (
              '<div class="ms-admin-site">' +
              "<div><strong>" +
              esc(site.name) +
              "</strong><div>" +
              href +
              (site.category ? " · " + esc(site.category) : "") +
              "</div></div>" +
              '<span class="ms-admin-badge is-' +
              esc(site.status) +
              '">' +
              esc(site.status || "draft") +
              "</span>" +
              "<span>" +
              esc(when(site.createdAt) || "—") +
              "</span>" +
              "<b>" +
              esc(priceLabel) +
              "</b></div>"
            );
          })
          .join("");
        return (
          '<article class="ms-admin-employee">' +
          '<button type="button" class="ms-admin-employee-head" data-employee-id="' +
          esc(employee.id) +
          '" aria-expanded="' +
          (open ? "true" : "false") +
          '">' +
          '<span class="ms-admin-employee-name"><strong>' +
          esc(employee.handle ? "@" + employee.handle : "Account") +
          (employee.owner ? " · Owner" : "") +
          (employee.frozen ? ' <span class="ms-admin-badge is-frozen">Frozen</span>' : "") +
          "</strong><span>" +
          esc(
            [
              employee.displayName,
              when(employee.joinedAt) ? "Joined " + when(employee.joinedAt) : "",
              employee.sites.length ? employee.soldCount + " of " + employee.sites.length + " sold" : "",
            ]
              .filter(Boolean)
              .join(" · ") || "Account"
          ) +
          "</span></span>" +
          '<span class="ms-admin-metric"><span>Websites</span><b>' +
          employee.sites.length +
          "</b></span>" +
          '<span class="ms-admin-metric"><span>Sold</span><b>' +
          employee.soldCount +
          "</b></span>" +
          '<span class="ms-admin-metric"><span>Sales</span><b>' +
          esc(money(employee.saleCents)) +
          "</b></span>" +
          '<span class="ms-admin-metric"><span>Their share</span><b>' +
          esc(money(employee.shareCents)) +
          "</b></span>" +
          "</button>" +
          (open
            ? '<div class="ms-admin-sites">' +
              (sites || '<p class="ms-admin-note">No websites yet.</p>') +
              (employee.owner
                ? ""
                : '<div class="ms-admin-employee-actions">' +
                  '<button type="button" class="ms-btn ms-btn-secondary" data-employee-action="rename" data-employee-target="' +
                  esc(employee.id) +
                  '">Rename</button>' +
                  '<button type="button" class="ms-btn ms-btn-secondary" data-employee-action="freeze" data-employee-target="' +
                  esc(employee.id) +
                  '">' +
                  (employee.frozen ? "Unfreeze" : "Freeze") +
                  "</button>" +
                  '<button type="button" class="ms-btn ms-btn-danger" data-employee-action="delete" data-employee-target="' +
                  esc(employee.id) +
                  '">Delete</button></div>') +
              "</div>"
            : "") +
          "</article>"
        );
      })
      .join("");
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function rand(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 28) || "sample";
  }

  function buildPlaytest() {
    const first = ["Ava", "Noah", "Mia", "Leo", "Sofia", "Ethan", "Nora", "Owen"];
    const last = ["Reed", "Nguyen", "Cole", "Park", "Diaz", "Shah", "Brooks", "Kim"];
    const businesses = ["Harbor Dental", "Northside Plumbing", "Luna Yoga", "Cedar Auto", "Bright Pet Care", "Oak Street Bakery", "Summit HVAC", "Kindred Nails", "River Dental", "Pallet Coffee"];
    const categories = ["Dental", "Home services", "Fitness", "Auto", "Food", "Beauty"];
    const cities = ["Austin, TX", "Tampa, FL", "Boise, ID", "Reno, NV"];
    const methods = ["venmo", "paypal", "zelle", "cashapp"];
    const people = [];
    const payouts = [];
    const count = rand(5, 8);
    for (let i = 0; i < count; i += 1) {
      const given = pick(first);
      const family = pick(last);
      const handle = (given + family).toLowerCase();
      const sites = [];
      let saleCents = 0;
      let shareCents = 0;
      let platformCents = 0;
      let owedCents = 0;
      let soldCount = 0;
      const siteCount = rand(1, 4);
      for (let s = 0; s < siteCount; s += 1) {
        const sold = Math.random() < 0.5;
        const amount = sold ? rand(6, 24) * 2500 : 0;
        const status = sold ? (Math.random() < 0.5 ? "paid" : "published") : Math.random() < 0.45 ? "preview" : "draft";
        const name = pick(businesses);
        const id = "play-" + i + "-" + s + "-" + rand(100, 999);
        const created = new Date(Date.now() - rand(1, 70) * 86400000).toISOString();
        const category = pick(categories);
        const cut = shares(amount);
        const hostingRoll = sold ? Math.random() : 1;
        const hostingStatus = !sold ? "" : hostingRoll < 0.72 ? "paying" : hostingRoll < 0.84 ? "canceling" : hostingRoll < 0.92 ? "past_due" : "canceled";
        const hostingPayments = [];
        if (sold && hostingStatus) {
          const charges = rand(1, 4);
          for (let c = 0; c < charges; c += 1) {
            hostingPayments.push({
              at: new Date(Date.now() - c * 30 * 86400000).toISOString(),
              cents: 2000,
            });
          }
        }
        sites.push({
          id,
          name,
          status,
          createdAt: created,
          updatedAt: created,
          href: "",
          sampleHost: slug(name) + ".test",
          saleCents: amount,
          soldAt: sold ? created : "",
          listCents: amount || rand(8, 20) * 2500,
          category,
          address: pick(cities),
          watermark: !sold,
          buyerEmail: sold ? slug(name) + "@example.com" : "",
          buyerPhone: sold ? "555-014" + rand(0, 9) : "",
          hostingStatus,
          hostingMonthly: hostingStatus ? 2000 : 0,
          hostingStarted: sold ? created : "",
          hostingRenews: hostingStatus && hostingStatus !== "canceled" ? new Date(Date.now() + 20 * 86400000).toISOString() : "",
          hostingEnded: hostingStatus === "canceled" ? created : "",
          hostingLastPaid: hostingPayments[0]?.at || "",
          hostingPayments,
        });
        if (!sold) continue;
        soldCount += 1;
        saleCents += cut.sale;
        shareCents += cut.creator;
        platformCents += cut.platform;
        const pending = Math.random() < 0.65;
        if (pending) owedCents += cut.creator;
        payouts.push({
          project_id: id,
          payment_id: "play-pay-" + id,
          creator_user_id: "play-user-" + i,
          business_name: name,
          category,
          address: pick(cities),
          business_phone: "",
          website: "https://" + slug(name) + ".test",
          creator_handle: handle,
          creator_display_name: given + " " + family,
          sale_cents: cut.sale,
          creator_share_cents: cut.creator,
          platform_share_cents: cut.platform,
          payout_method: pick(methods),
          payout_handle: "@" + handle,
          payout_email: handle + "@example.com",
          payout_phone: "555-010" + rand(0, 9),
          sold_at: created,
          payout_status: pending ? "pending" : "paid",
          paid_out_at: pending ? "" : created,
          paid_out_note: "",
        });
      }
      people.push({
        id: "play-user-" + i,
        handle,
        displayName: given + " " + family,
        joinedAt: new Date(Date.now() - rand(10, 120) * 86400000).toISOString(),
        owner: false,
        frozen: i === 1,
        sites,
        saleCents,
        shareCents,
        platformCents,
        owedCents,
        soldCount,
      });
    }
    people.sort((a, b) => b.saleCents - a.saleCents || b.sites.length - a.sites.length);
    const hostingCents = people.reduce(
      (sum, employee) =>
        sum +
        employee.sites.reduce(
          (siteSum, site) => siteSum + (site.hostingPayments || []).reduce((paySum, payment) => paySum + payment.cents, 0),
          0
        ),
      0
    );
    return { people, payouts, hostingCents };
  }

  let scrambleGen = 0;
  let scrambleTimer = 0;
  let scrambleTick = 0;

  function setPlaytestUi(on) {
    playtestOn = on;
    const banner = $("admin-playtest-banner");
    if (banner) banner.hidden = !on;
    const button = $("admin-playtest");
    if (button) {
      button.hidden = on;
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.textContent = "Playtest";
    }
  }

  function scrambleFrame() {
    document.querySelectorAll("#admin-overview .ms-payouts-stat-value").forEach((el) => {
      const sample = el.textContent || "";
      if (sample.includes("%")) el.textContent = rand(0, 100) + "%";
      else if (sample.includes("$")) el.textContent = money(rand(0, 900) * 100);
      else el.textContent = String(rand(0, 48));
    });
  }

  function playScramble(apply) {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) {
      document.body?.classList.remove("is-playtest-scramble");
      apply();
      return;
    }
    const gen = ++scrambleGen;
    document.body?.classList.add("is-playtest-scramble");
    window.clearInterval(scrambleTick);
    window.clearTimeout(scrambleTimer);
    scrambleTick = window.setInterval(scrambleFrame, 48);
    scrambleTimer = window.setTimeout(() => {
      if (gen !== scrambleGen) return;
      window.clearInterval(scrambleTick);
      apply();
      scrambleTimer = window.setTimeout(() => {
        if (gen !== scrambleGen) return;
        document.body?.classList.remove("is-playtest-scramble");
      }, 240);
    }, 560);
  }

  function startPlaytest() {
    const pack = buildPlaytest();
    setPlaytestUi(true);
    playScramble(() => {
      if (!playtestOn) return;
      publish(pack.people, { hostingCents: pack.hostingCents }, false);
      document.dispatchEvent(new CustomEvent("ms:admin-playtest", { detail: { on: true, payouts: pack.payouts } }));
    });
  }

  function stopPlaytest() {
    setPlaytestUi(false);
    playScramble(() => {
      if (playtestOn) return;
      if (savedEmployees.length) publish(cloneList(savedEmployees), savedExtras, false);
      document.dispatchEvent(new CustomEvent("ms:admin-playtest", { detail: { on: false } }));
      if (!savedEmployees.length) void load();
    });
  }

  async function load() {
    if (playtestOn) {
      startPlaytest();
      return;
    }
    if (loading) return;
    const sb = window.SiteSupabase?.getClient?.();
    if (!sb) {
      window.StudioToast?.error?.("Connect Supabase to load the owner view.");
      return;
    }
    loading = true;
    const list = $("admin-employees");
    if (list && !employees.length) list.innerHTML = '<p class="ms-admin-note">Loading company data…</p>';
    try {
      const [profiles, projects, payments] = await Promise.all([
        fetchAll(() =>
          sb.from("profiles").select("id, handle, display_name, frozen, created_at").order("created_at", { ascending: true })
        ),
        fetchAll(() => sb.from("projects").select(PROJECT_SELECT).order("created_at", { ascending: false })),
        fetchAll(() =>
          sb.from("payments").select(PAYMENT_SELECT).eq("status", "paid").order("created_at", { ascending: false })
        ),
      ]);

      let payoutRows = [];
      try {
        payoutRows = await fetchAll(() =>
          sb.from("creator_payouts").select("project_id, status, creator_share_cents, sale_cents")
        );
      } catch (err) {
        if (!/creator_payouts|schema cache|does not exist/i.test(String(err?.message || err))) throw err;
      }
      const payoutByProject = new Map();
      payoutRows.forEach((row) => {
        if (row?.project_id) payoutByProject.set(String(row.project_id), row);
      });

      const projectMap = new Map();
      projects.forEach((project) => {
        if (project?.id) projectMap.set(String(project.id), project);
      });

      const salesByProject = new Map();
      const hostingByProject = new Map();
      let hostingCents = 0;
      payments.forEach((payment) => {
        if (String(payment.status || "").toLowerCase() !== "paid") return;
        if (String(payment.kind || "").toLowerCase() === "site_hosting") {
          const amount = Math.max(0, Number(payment.amount_cents) || 0);
          hostingCents += amount;
          const projectId = String(payment.project_id || "");
          if (projectId) {
            const bucket = hostingByProject.get(projectId) || [];
            bucket.push({ at: payment.created_at, cents: amount });
            hostingByProject.set(projectId, bucket);
          }
        }
        const project = projectMap.get(String(payment.project_id || ""));
        if (!isGoLiveSale(payment, project)) return;
        const id = String(project.id);
        const prev = salesByProject.get(id) || { cents: 0, soldAt: "" };
        const amount = Math.max(0, Number(payment.amount_cents) || 0);
        const soldAt =
          payment.created_at && (!prev.soldAt || String(payment.created_at) > String(prev.soldAt))
            ? payment.created_at
            : prev.soldAt;
        salesByProject.set(id, { cents: prev.cents + amount, soldAt });
      });

      const sitesByUser = new Map();
      projects.forEach((project) => {
        const userId = String(project.user_id || "");
        if (!userId) return;
        const sale = salesByProject.get(String(project.id)) || { cents: 0, soldAt: "" };
        const ctx = readContext(project);
        const hostingPayments = (hostingByProject.get(String(project.id)) || []).sort((a, b) =>
          String(b.at || "").localeCompare(String(a.at || ""))
        );
        const hostingStatus = hostingState(ctx, sale.cents);
        const monthlyRaw = Number(ctx.hostingMonthlyCents);
        const bucket = sitesByUser.get(userId) || [];
        bucket.push({
          id: String(project.id),
          name: project.business_name || "Untitled business",
          status: String(project.status || "draft").toLowerCase(),
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          href: siteHref(project),
          sampleHost: "",
          saleCents: sale.cents,
          soldAt: sale.soldAt,
          listCents: Number(project.price_cents) || 0,
          category: String(ctx.category || ctx.categoryGroup || ctx.businessType || "").trim(),
          address: String(ctx.address || ctx.businessAddress || "").trim(),
          watermark: project.watermark_enabled !== false,
          buyerEmail: String(ctx.hostingBuyerEmail || ctx.purchaseInvoiceEmailTo || "").trim(),
          buyerPhone: String(ctx.phone || ctx.businessPhone || "").trim(),
          hostingStatus,
          hostingMonthly: Number.isFinite(monthlyRaw) && monthlyRaw > 0 ? monthlyRaw : hostingStatus ? 2000 : 0,
          hostingStarted: ctx.paidAt || sale.soldAt || "",
          hostingRenews: ctx.hostingRenewsAt || "",
          hostingEnded: ctx.hostingEndedAt || "",
          hostingLastPaid: hostingPayments[0]?.at || ctx.hostingLastPaidAt || ctx.lastHostingInvoiceEmailAt || "",
          hostingPayments,
        });
        sitesByUser.set(userId, bucket);
      });

      const liveTotal = projects.filter((project) => isLive(project)).length;
      const built = profiles.map((profile) => {
        const id = String(profile.id);
        const sites = (sitesByUser.get(id) || []).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
        let saleCents = 0;
        let shareCents = 0;
        let platformCents = 0;
        let owedCents = 0;
        let soldCount = 0;
        sites.forEach((site) => {
          if (site.saleCents > 0) {
            soldCount += 1;
            const cut = shares(site.saleCents);
            saleCents += cut.sale;
            shareCents += cut.creator;
            platformCents += cut.platform;
            const payout = payoutByProject.get(site.id);
            const payoutStatus = String(payout?.status || "pending").toLowerCase();
            if (payoutStatus !== "paid" && payoutStatus !== "cancelled") {
              const recorded = Number(payout?.creator_share_cents);
              owedCents += recorded > 0 ? recorded : cut.creator;
            }
          }
        });
        const handle = String(profile.handle || profile.display_name || "").replace(/^@/, "").trim();
        return {
          id,
          handle,
          displayName: String(profile.display_name || "").trim(),
          joinedAt: profile.created_at,
          owner: handle.toLowerCase() === "moonrise",
          frozen: profile.frozen === true,
          sites,
          saleCents,
          shareCents,
          platformCents,
          owedCents,
          soldCount,
        };
      });
      built.sort((a, b) => b.saleCents - a.saleCents || b.sites.length - a.sites.length || a.handle.localeCompare(b.handle));
      if (!playtestOn) publish(built, { hostingCents, liveTotal, siteCount: projects.length }, true);
    } catch (err) {
      window.StudioToast?.error?.(err?.message || "Could not load the owner view.");
      if (list) list.innerHTML = "";
    } finally {
      loading = false;
    }
  }

  let employeeAction = null;

  function closeEmployeeModal() {
    employeeAction = null;
    const modal = $("admin-employee-modal");
    if (modal) modal.hidden = true;
  }

  function openEmployeeAction(type, id) {
    const employee = employees.find((row) => row.id === id);
    if (!employee || employee.owner) return;
    employeeAction = { type, id };
    const modal = $("admin-employee-modal");
    const title = $("admin-employee-modal-title");
    const lead = $("admin-employee-modal-lead");
    const fields = $("admin-employee-rename-fields");
    const confirm = $("admin-employee-confirm");
    const name = $("admin-employee-name");
    const handle = $("admin-employee-handle");
    if (!modal || !title || !lead || !confirm) return;
    const label = employee.handle ? "@" + employee.handle : "this employee";
    if (fields) fields.hidden = type !== "rename";
    confirm.classList.toggle("ms-btn-danger", type === "delete");
    confirm.classList.toggle("ms-btn-secondary", false);
    if (type === "rename") {
      title.textContent = "Rename " + label;
      lead.textContent = "This updates the name and username on their account.";
      confirm.textContent = "Save";
      if (name) name.value = employee.displayName || "";
      if (handle) handle.value = employee.handle || "";
    } else if (type === "freeze") {
      title.textContent = employee.frozen ? "Unfreeze " + label : "Freeze " + label;
      lead.textContent = employee.frozen
        ? "They can sign in again."
        : "They are signed out and cannot sign in until you unfreeze them. Their websites stay.";
      confirm.textContent = employee.frozen ? "Unfreeze" : "Freeze";
    } else {
      title.textContent = "Delete " + label + "?";
      lead.textContent = "This removes their account and the websites they created. It cannot be undone.";
      confirm.textContent = "Delete";
    }
    modal.hidden = false;
    if (type === "rename") handle?.focus();
  }

  function applyPlaytestEmployee(id, change) {
    const next = employees.map((employee) => ({
      ...employee,
      sites: (employee.sites || []).map((site) => ({ ...site })),
    }));
    const index = next.findIndex((employee) => employee.id === id);
    if (index < 0) return;
    if (change.remove) next.splice(index, 1);
    else Object.assign(next[index], change.patch || {});
    publish(next, savedExtras, false);
  }

  async function adminEmployee(path, options) {
    const session = await window.StudioAuth?.getSession?.();
    const token = session?.access_token;
    const base = window.StudioAuth?.workerUrl?.();
    if (!token || !base) throw new Error("Sign in again to manage employees.");
    const res = await fetch(base + path, {
      method: options?.method || "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: options?.body == null ? undefined : JSON.stringify(options.body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not update that employee.");
    return data;
  }

  async function confirmEmployeeAction() {
    const action = employeeAction;
    if (!action) return;
    const confirm = $("admin-employee-confirm");
    if (confirm) confirm.disabled = true;
    try {
      if (playtestOn || String(action.id).startsWith("play-")) {
        if (action.type === "rename") {
          const handle = String($("admin-employee-handle")?.value || "")
            .trim()
            .replace(/^@/, "")
            .toLowerCase();
          const displayName = String($("admin-employee-name")?.value || "").trim();
          if (handle.length < 3) throw new Error("Username must be at least 3 characters.");
          applyPlaytestEmployee(action.id, { patch: { handle, displayName } });
        } else if (action.type === "freeze") {
          const employee = employees.find((row) => row.id === action.id);
          applyPlaytestEmployee(action.id, { patch: { frozen: !employee?.frozen } });
        } else {
          applyPlaytestEmployee(action.id, { remove: true });
        }
        window.StudioToast?.success?.("Playtest only. Nothing was saved.");
        closeEmployeeModal();
        return;
      }
      if (action.type === "rename") {
        await adminEmployee("/admin/employees/" + encodeURIComponent(action.id), {
          method: "PATCH",
          body: {
            handle: $("admin-employee-handle")?.value || "",
            displayName: $("admin-employee-name")?.value || "",
          },
        });
      } else if (action.type === "freeze") {
        const employee = employees.find((row) => row.id === action.id);
        await adminEmployee("/admin/employees/" + encodeURIComponent(action.id) + "/freeze", {
          method: "POST",
          body: { frozen: !employee?.frozen },
        });
      } else {
        await adminEmployee("/admin/employees/" + encodeURIComponent(action.id), { method: "DELETE" });
      }
      closeEmployeeModal();
      window.StudioToast?.success?.("Employee updated.");
      await load();
    } catch (err) {
      window.StudioToast?.error?.(err?.message || "Could not update that employee.");
    } finally {
      if (confirm) confirm.disabled = false;
    }
  }

  function bind() {
    document.querySelectorAll("[data-admin-tab]").forEach((button) => {
      button.addEventListener("click", () => showTab(button.getAttribute("data-admin-tab") || "employees"));
    });
    $("admin-employee-search")?.addEventListener("input", (event) => {
      query = event.target.value || "";
      render();
    });
    $("admin-site-search")?.addEventListener("input", (event) => {
      siteQuery = event.target.value || "";
      renderWebsites();
    });
    $("admin-site-filter")?.addEventListener("change", (event) => {
      siteFilter = event.target.value || "all";
      renderWebsites();
    });
    $("admin-subscriber-search")?.addEventListener("input", (event) => {
      subscriberQuery = event.target.value || "";
      renderSubscribers();
    });
    $("admin-subscriber-filter")?.addEventListener("change", (event) => {
      subscriberFilter = event.target.value || "all";
      renderSubscribers();
    });
    $("admin-audit-refresh")?.addEventListener("click", () => void load());
    $("admin-playtest")?.addEventListener("click", () => {
      if (playtestOn) stopPlaytest();
      else startPlaytest();
    });
    $("admin-playtest-off")?.addEventListener("click", () => stopPlaytest());
    document.addEventListener("ms:admin-playtest-payouts", (event) => {
      if (!playtestOn) return;
      const payouts = event.detail?.payouts || [];
      const owed = payouts.reduce((sum, row) => {
        const status = String(row.payout_status || "").toLowerCase();
        if (status === "paid" || status === "cancelled") return sum;
        return sum + (Number(row.creator_share_cents) || 0);
      }, 0);
      setStat("admin-stat-owed", money(owed));
    });
    $("admin-employees")?.addEventListener("click", (event) => {
      const action = event.target.closest?.("[data-employee-action]");
      if (action) {
        event.preventDefault();
        openEmployeeAction(action.getAttribute("data-employee-action"), action.getAttribute("data-employee-target"));
        return;
      }
      const button = event.target.closest?.("[data-employee-id]");
      if (!button || event.target.closest("a")) return;
      const id = button.getAttribute("data-employee-id");
      if (!id) return;
      if (openIds.has(id)) openIds.delete(id);
      else openIds.add(id);
      render();
    });
    $("admin-employee-cancel")?.addEventListener("click", closeEmployeeModal);
    $("admin-employee-modal")?.addEventListener("click", (event) => {
      if (event.target === $("admin-employee-modal")) closeEmployeeModal();
    });
    $("admin-employee-confirm")?.addEventListener("click", () => void confirmEmployeeAction());
    $("ms-payouts-note-confirm")?.addEventListener("click", () => {
      if (playtestOn) return;
      setTimeout(() => void load(), 900);
    });
    $("ms-payouts-remove-confirm")?.addEventListener("click", () => {
      if (playtestOn) return;
      setTimeout(() => void load(), 900);
    });
    window.addEventListener("hashchange", () => {
      if (location.hash === "#payouts") showTab("payouts");
      else if (location.hash === "#websites") showTab("websites");
      else if (location.hash === "#subscribers") showTab("subscribers");
    });
    const opening =
      location.hash === "#payouts"
        ? "payouts"
        : location.hash === "#websites"
          ? "websites"
          : location.hash === "#subscribers"
            ? "subscribers"
            : "employees";
    showTab(opening);
  }

  async function boot() {
    const allowed = await window.StudioOwner?.gateOwnerPage?.("dashboard.html");
    if (!allowed) return;
    bind();
    await load();
  }

  if (document.body?.dataset?.msAuthFired === "1") void boot();
  else document.addEventListener("ms:auth-ready", () => void boot(), { once: true });
})();
