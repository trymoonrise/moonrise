/**
 * Moonrise floating watermark - from watermark/moonrise-watermark.html
 *
 * Usage on live sites:
 *   <script src=".../embed.js"
 *     data-project-id="..."
 *     data-worker="https://worker.example.com"
 *     defer></script>
 *
 * Or: MoonriseWatermarkEmbed.mount({ projectId, workerUrl, host, urgencyEndsAt })
 */
(function (global) {
  const bootScriptEl = typeof document !== "undefined" ? document.currentScript : null;
  const AVATAR =
    "https://moonrise-studio.vercel.app/assets/MoonriseLogo.png";
  const SITE_URL = "https://trymoonrise.com";
  const STYLE_ID = "mr-wm-embed-style";
  const DEFAULT_HQ = {
    kind: "hq",
    name: "Moonrise",
    org: "Moonrise Studio",
    subtitle: "Headquarters \u00B7 trymoonrise.com",
    email: "trymoonrise@gmail.com",
    phone: "+14013000957",
    phoneDisplay: "(401) 300-0957",
    url: "https://trymoonrise.com",
    discordUrl: "https://discord.gg/gdbA3gEVY",
    avatarUrl: "https://trymoonrise.com/assets/MoonriseLogo.png",
  };

  let keydownBound = false;

  function css() {
    return `
@import url("https://trymoonrise.com/css/fonts.css?v=20261003-fonts");
.mr-wm{--mr-brand:#3b82f6;--mr-ink:#0f172a;--mr-muted:#64748b;--mr-line:#e8edf3;--mr-font:"DM Sans",system-ui,sans-serif;position:fixed;bottom:max(1.75rem,env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);z-index:2147483000;pointer-events:none;font-family:var(--mr-font);width:max-content;max-width:calc(100vw - 1.5rem);box-sizing:border-box}
.mr-wm.mr-wm--hosted{position:absolute;width:max-content;max-width:calc(100% - 1.5rem)}
.mr-wm.is-hidden{visibility:hidden;opacity:0;pointer-events:none}
.mr-wm-chip{pointer-events:auto;appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;gap:1.1rem;box-sizing:border-box;width:100%;max-width:min(calc(100vw - 1.5rem),36rem);margin:0;padding:1.15rem 1.65rem 1.15rem 1.15rem;border:0;border-radius:18px;color:#fff;cursor:pointer;text-align:left;background:var(--mr-brand);box-shadow:0 18px 48px rgba(59,130,246,.4),0 6px 18px rgba(15,23,42,.14);transition:filter .18s ease,transform .18s ease,box-shadow .18s ease;animation:mr-widget-in .5s cubic-bezier(.22,1,.36,1) both;-webkit-tap-highlight-color:transparent}
.mr-wm-chip:focus-visible{outline:2px solid #fff;outline-offset:3px}
.mr-wm-avatar{width:56px;height:56px;border-radius:14px;object-fit:cover;background:#fff;flex:0 0 auto;box-shadow:0 0 0 1px rgba(15,23,42,.06)}
.mr-wm-copy{display:grid;gap:.12rem;min-width:0;flex:1 1 auto;line-height:1.2;text-align:left;overflow:hidden}
.mr-wm-copy strong{font-size:1.28rem;font-weight:650;letter-spacing:-.02em;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
.mr-wm-copy span{font-size:.98rem;font-weight:500;color:rgba(255,255,255,.8);line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr-wm-copy a{color:inherit;text-decoration:none;pointer-events:none}
@keyframes mr-widget-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@media (hover:hover) and (pointer:fine){.mr-wm-chip:hover{filter:brightness(1.05);transform:translateY(-3px);box-shadow:0 22px 56px rgba(59,130,246,.46),0 8px 22px rgba(15,23,42,.16)}}
@media (max-width:520px){.mr-wm{bottom:max(1rem,env(safe-area-inset-bottom,0px));max-width:calc(100vw - 1.25rem);width:calc(100vw - 1.25rem)}.mr-wm.mr-wm--hosted{width:calc(100% - 1rem);max-width:calc(100% - 1rem)}.mr-wm-chip{width:100%;max-width:100%;padding:.72rem .85rem .72rem .72rem;gap:.65rem;border-radius:14px;transform:none!important;filter:none}.mr-wm-avatar{width:40px;height:40px;border-radius:10px}.mr-wm-copy{gap:.08rem}.mr-wm-copy strong{font-size:clamp(.92rem,3.8vw,1.05rem)}.mr-wm-copy span{font-size:clamp(.7rem,3.1vw,.8rem)}}
@media (max-width:360px){.mr-wm{max-width:calc(100vw - 1rem);width:calc(100vw - 1rem)}.mr-wm-chip{padding:.62rem .72rem .62rem .62rem;gap:.55rem;border-radius:12px}.mr-wm-avatar{width:36px;height:36px;border-radius:9px}.mr-wm-copy strong{font-size:.88rem}.mr-wm-copy span{font-size:.68rem}}
#mr-wm-overlay-root{position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:none!important}
#mr-wm-overlay-root[data-open="1"]{display:block!important;pointer-events:auto}
.mr-wm-overlay{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:1rem;background:rgba(15,23,42,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .22s ease,visibility .22s ease;font-family:var(--mr-font)}
.mr-wm-overlay.is-open{opacity:1;visibility:visible;pointer-events:auto}
.mr-wm-panel{width:min(22.5rem,100%);max-height:min(92vh,720px);display:flex;flex-direction:column;overflow:auto;background:#fff;border:0;border-radius:18px;box-shadow:0 16px 48px rgba(0,0,0,.14);transform:translateY(12px) scale(.985);opacity:.96;transition:transform .28s cubic-bezier(.22,1,.36,1),opacity .22s ease}
.mr-wm-overlay.is-open .mr-wm-panel{transform:none;opacity:1}
.mr-wm-head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:1.15rem 1.1rem .15rem;border-bottom:0;flex-shrink:0}
.mr-wm-head img{display:none}
.mr-wm-head h2{margin:0;font-family:var(--mr-font);font-size:1.28rem;font-weight:700;letter-spacing:-.04em;line-height:1.15;color:#1d1d1f}
.mr-wm-head p{display:none}
.mr-wm-close{appearance:none;margin-left:auto;width:2rem;height:2rem;border:0;border-radius:8px;background:transparent;color:#8e8e93;font-size:1.35rem;line-height:1;cursor:pointer;flex-shrink:0}
.mr-wm-close:hover{background:#f5f5f7;color:#1d1d1f}
.mr-wm-body{padding:.7rem 1.1rem 1.15rem;display:flex;flex-direction:column;align-items:stretch;gap:.7rem}
.mr-wm-blurb{margin:0 0 .15rem;color:#64748b;font-size:.9rem;line-height:1.45;letter-spacing:-.01em}
.mr-wm-promo{display:grid;gap:.35rem;margin:0}
.mr-wm-promo label{margin:0;color:#8e8e93;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.mr-wm-promo input{appearance:none;width:100%;box-sizing:border-box;min-height:2.55rem;margin:0;padding:.55rem .8rem;border:1px solid #e5e5ea;border-radius:10px;background:#fff;color:#1d1d1f;font:inherit;font-family:var(--mr-font);font-size:.95rem;font-weight:600;letter-spacing:-.02em}
.mr-wm-promo input:focus{outline:2px solid #1d1d1f;outline-offset:1px}
.mr-wm-pay{appearance:none;display:flex;align-items:center;justify-content:center;width:100%;box-sizing:border-box;align-self:stretch;min-height:2.85rem;margin:0;border:0;border-radius:10px;background:#1d1d1f;color:#fff;font:inherit;font-family:var(--mr-font);font-size:1rem;font-weight:650;letter-spacing:-.02em;text-align:center;cursor:pointer}
.mr-wm-pay:disabled{opacity:.55;cursor:not-allowed}
.mr-wm-error{margin:0;color:#b91c1c;font-size:.85rem;font-weight:600;line-height:1.4}
.mr-wm-rows{display:flex;flex-direction:column;background:transparent;border:0;border-radius:0;overflow:hidden;margin-top:.15rem}
.mr-wm-row{appearance:none;display:flex;align-items:center;justify-content:space-between;gap:.75rem;width:100%;min-height:2.55rem;padding:.6rem .15rem;border:0;border-radius:10px;background:transparent;color:#1d1d1f;font:inherit;font-family:var(--mr-font);font-size:.95rem;font-weight:600;letter-spacing:-.02em;text-align:left;text-decoration:none;cursor:pointer;box-sizing:border-box}
.mr-wm-rows>.mr-wm-row:first-child,.mr-wm-row[hidden]+.mr-wm-row{border-top:0}
.mr-wm-row[hidden]{display:none!important}
.mr-wm-row:hover{background:#f5f5f7}
.mr-wm-row-main{display:inline-flex;align-items:center;gap:.7rem;min-width:0}
.mr-wm-row-avatar{width:28px;height:28px;border-radius:999px;object-fit:cover;background:#f1f5f9;flex:0 0 auto;box-shadow:0 0 0 1px rgba(15,23,42,.06)}
.mr-wm-chevron{color:#94a3b8;font-size:1.15rem;line-height:1;font-weight:500;transition:transform .2s ease}
.mr-wm-row.is-open .mr-wm-chevron{transform:rotate(90deg)}
.mr-wm-row>span:last-child:not(.mr-wm-chevron){color:#64748b;font-size:.8rem;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%}
.mr-wm-step[hidden]{display:none!important}
.mr-wm-back{appearance:none;border:0;background:transparent;color:#64748b;font:inherit;font-family:var(--mr-font);font-size:.85rem;font-weight:600;cursor:pointer;padding:0;text-align:left}
.mr-wm-back:hover{color:#2563eb}
.mr-wm-contact{display:grid;gap:.55rem}
.mr-wm-contact-avatar{width:64px;height:64px;border-radius:18px;object-fit:cover;background:#f1f5f9;box-shadow:0 0 0 1px rgba(15,23,42,.06);margin:.15rem 0 .1rem}
.mr-wm-contact-name{margin:.15rem 0 0;font-size:1.2rem;font-weight:700;letter-spacing:-.03em;color:var(--mr-ink,#0f172a)}
.mr-wm-contact-role{margin:0 0 .2rem;color:var(--mr-muted,#64748b);font-size:.85rem}
.mr-wm-frame{width:100%;height:min(68vh,560px);border:0;border-radius:12px;background:#f8fafc}
.mr-wm-open-tab{display:block;text-align:center;color:#2563eb;font-size:.85rem;font-weight:650;text-decoration:none}
.mr-wm-faq{display:grid;gap:0;margin:.35rem 0 0;padding:0 .15rem}
.mr-wm-faq details{border:0;border-bottom:1px solid var(--mr-line,#e8edf3);background:transparent}
.mr-wm-faq summary{list-style:none;cursor:pointer;padding:.85rem 0;font-size:.9rem;font-weight:600;color:var(--mr-ink,#0f172a);display:flex;align-items:center;justify-content:space-between;gap:.75rem}
.mr-wm-faq summary::-webkit-details-marker{display:none}
.mr-wm-faq summary::after{content:"+";width:1.4rem;height:1.4rem;flex-shrink:0;display:grid;place-items:center;border-radius:999px;background:#f1f5f9;color:#64748b;font-size:.95rem;font-weight:600;line-height:1;transition:transform .25s ease,background-color .2s ease,color .2s ease}
.mr-wm-faq details.is-open summary::after{content:"-";background:#e8f1ff;color:#2563eb}
.mr-wm-faq-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s cubic-bezier(.22,1,.36,1)}
.mr-wm-faq details.is-open .mr-wm-faq-panel{grid-template-rows:1fr}
.mr-wm-faq-panel-inner{overflow:hidden;min-height:0}
.mr-wm-faq details p{margin:0;padding:0 0 .9rem;color:var(--mr-muted,#64748b);font-size:.86rem;line-height:1.5;opacity:0;transform:translateY(-4px);transition:opacity .24s ease,transform .24s ease}
.mr-wm-faq details.is-open p{opacity:1;transform:none}
.mr-wm-faq details a{color:#2563eb;font-weight:600;text-decoration:none}
.mr-wm-faq details a:hover{text-decoration:underline}
body.mr-wm-open .ms-lb-price,
body.mr-wm-open .ms-lb-price-range,
body.mr-wm-open .ms-lb-price-marks,
body.mr-wm-open .ms-lb-side,
body.mr-wm-open .ms-lb-pane-resizer,
body.mr-wm-open .ms-lb-chrome,
body.mr-wm-open .ms-lb-fs-exit{visibility:hidden!important;pointer-events:none!important}
@media (prefers-reduced-motion:reduce){.mr-wm-chip,.mr-wm-overlay,.mr-wm-panel,.mr-wm-faq-panel,.mr-wm-faq details p,.mr-wm-faq summary::after{animation:none;transition:none}}
`;
  }

  function studioBaseUrl(workerUrl) {
    const base = String(workerUrl || "https://moonrise-studio.vercel.app").replace(/\/$/, "");
    return base || "https://moonrise-studio.vercel.app";
  }

  function contactPageUrl(workerUrl) {
    return studioBaseUrl(workerUrl) + "/contact.html";
  }

  function creatorContactPageUrl(workerUrl, projectId) {
    const base = studioBaseUrl(workerUrl);
    const id = String(projectId || "").trim();
    return id ? base + "/creator-contact.html?project=" + encodeURIComponent(id) : base + "/contact.html";
  }

  function decodeContactPayload(raw) {
    const token = String(raw || "").trim();
    if (!token) return null;
    try {
      const padded = token.replace(/-/g, "+").replace(/_/g, "/");
      const pad = padded.length % 4 ? "=".repeat(4 - (padded.length % 4)) : "";
      const json = decodeURIComponent(
        Array.prototype.map
          .call(atob(padded + pad), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const parsed = JSON.parse(json);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function readContactFromScript(script, attr) {
    if (!script) return null;
    return decodeContactPayload(script.getAttribute(attr));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeHttpsUrl(value, fallback) {
    const raw = String(value || "").trim();
    if (!raw) return String(fallback || "");
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") return String(fallback || "");
      return url.toString();
    } catch (_) {
      return String(fallback || "");
    }
  }

  function personRowHtml(id, label, avatarUrl, hidden) {
    const photo = safeHttpsUrl(avatarUrl);
    const main = photo
      ? '<span class="mr-wm-row-main"><img class="mr-wm-row-avatar" src="' +
        escapeHtml(photo) +
        '" alt="" width="28" height="28" decoding="async" /><span>' +
        escapeHtml(label) +
        "</span></span>"
      : "<span>" + escapeHtml(label) + "</span>";
    return (
      '<button type="button" class="mr-wm-row" id="' +
      escapeHtml(id) +
      '"' +
      (hidden ? " hidden" : "") +
      ">" +
      main +
      '<span class="mr-wm-chevron" aria-hidden="true">\u203A</span></button>'
    );
  }

  function buildVcardHtml(contact, _assetsBase, options) {
    const c = contact || {};
    const isHq = c.kind === "hq";
    const name = escapeHtml(c.name || (isHq ? "Moonrise" : "Creator"));
    const subtitle = escapeHtml(c.subtitle || (isHq ? "Headquarters" : "Website creator"));
    const email = String(c.email || "").trim();
    const phone = String(c.phone || "").trim();
    const phoneDisplay = escapeHtml(c.phoneDisplay || phone);
    const photo = safeHttpsUrl(c.avatarUrl, isHq ? AVATAR : "");
    const rows = [];
    if (phone) {
      rows.push(
        '<a class="mr-wm-row" href="tel:' +
          escapeHtml(phone.replace(/\s/g, "")) +
          '"><span>Phone</span><span>' +
          phoneDisplay +
          "</span></a>"
      );
    }
    if (email) {
      rows.push(
        '<a class="mr-wm-row" href="mailto:' +
          escapeHtml(email) +
          '"><span>Email</span><span>' +
          escapeHtml(email) +
          "</span></a>"
      );
    }
    if (isHq && c.discordUrl) {
      rows.push(
        '<a class="mr-wm-row" href="' +
          escapeHtml(c.discordUrl) +
          '" target="_blank" rel="noopener noreferrer"><span>Discord</span><span class="mr-wm-chevron" aria-hidden="true">\u203A</span></a>'
      );
    }
    if (options && options.pageUrl) {
      rows.push(
        '<a class="mr-wm-row" href="' +
          escapeHtml(options.pageUrl) +
          '" target="_blank" rel="noopener noreferrer"><span>Open full contact card</span><span class="mr-wm-chevron" aria-hidden="true">\u203A</span></a>'
      );
    }
    return (
      '<div class="mr-wm-contact">' +
      '<button type="button" class="mr-wm-back" data-mr-vcard-back>Back</button>' +
      (photo
        ? '<img class="mr-wm-contact-avatar" src="' +
          escapeHtml(photo) +
          '" alt="" width="64" height="64" decoding="async" />'
        : "") +
      '<h3 class="mr-wm-contact-name">' +
      name +
      "</h3>" +
      '<p class="mr-wm-contact-role">' +
      subtitle +
      "</p>" +
      '<div class="mr-wm-rows">' +
      '<button type="button" class="mr-wm-row" data-mr-vcard-save><span>Save contact</span></button>' +
      rows.join("") +
      "</div></div>"
    );
  }

  function buildVcardFile(contact) {
    const c = contact || {};
    const lines = ["BEGIN:VCARD", "VERSION:3.0", "FN:" + String(c.name || "Contact")];
    if (c.org) lines.push("ORG:" + c.org);
    if (c.subtitle) lines.push("TITLE:" + c.subtitle);
    if (c.phone) lines.push("TEL;TYPE=CELL,VOICE:" + c.phone);
    if (c.email) lines.push("EMAIL;TYPE=INTERNET:" + c.email);
    if (c.url) lines.push("URL:" + c.url);
    lines.push("END:VCARD");
    return lines.join("\r\n");
  }

  function faqHtml() {
    const wrap = (q, a) =>
      "<details><summary>" +
      q +
      '</summary><div class="mr-wm-faq-panel"><div class="mr-wm-faq-panel-inner"><p>' +
      a +
      "</p></div></div></details>";
    return [
      wrap(
        "What am I looking at?",
        "This is a private preview of the website Moonrise prepared for your business. The watermark stays until checkout is complete."
      ),
      wrap(
        "What happens when I unlock?",
        "Stripe confirms payment instantly. The watermark is removed and your site remains published for commercial use."
      ),
      wrap(
        "Do I own the website?",
        'The site stays managed by <a href="mailto:trymoonrise@gmail.com">@trymoonrise</a>. We handle the technical work, updates, and redesigns so it can keep evolving with your business.'
      ),
      wrap(
        "Need changes?",
        "Contact your website creator first for photos, hours, services, and quick edits. Reach Headquarters for billing, hosting, and platform support."
      ),
    ].join("");
  }

  function panelBodyHtml(creatorContact, hqContact) {
    const creatorName = String(creatorContact?.name || "your creator").trim();
    const creatorBtn = creatorContact
      ? personRowHtml(
          "mr-wm-contact-creator",
          "Contact " + creatorName,
          creatorContact.avatarUrl || ""
        )
      : "";
    const hqBtn = personRowHtml(
      "mr-wm-contact-hq",
      "Contact Headquarters",
      (hqContact && hqContact.avatarUrl) || AVATAR
    );
    return (
      '<div class="mr-wm-body" id="mr-wm-body">' +
      '<div class="mr-wm-step is-active" data-step="main">' +
      '<p class="mr-wm-blurb">We prepared a fresh website for your business. This preview still shows the Moonrise watermark\u2014unlock to remove it and publish commercially.</p>' +
      '<div class="mr-wm-promo">' +
      '<label for="mr-wm-promo">Promo code</label>' +
      '<input type="text" id="mr-wm-promo" name="promo" autocomplete="off" spellcheck="false" placeholder="Optional">' +
      "</div>" +
      '<button type="button" class="mr-wm-pay" id="mr-wm-pay">Unlock site</button>' +
      '<p class="mr-wm-error" id="mr-wm-error" hidden></p>' +
      '<div class="mr-wm-rows">' +
      '<button type="button" class="mr-wm-row" id="mr-wm-schedule" hidden><span>Book a meeting</span><span class="mr-wm-chevron" aria-hidden="true">\u203A</span></button>' +
      creatorBtn +
      hqBtn +
      '<button type="button" class="mr-wm-row" id="mr-wm-faqs" aria-expanded="false" aria-controls="mr-wm-faq"><span>FAQs</span><span class="mr-wm-chevron" aria-hidden="true">\u203A</span></button>' +
      "</div>" +
      '<div class="mr-wm-faq" id="mr-wm-faq" hidden>' +
      faqHtml() +
      "</div></div>" +
      '<div class="mr-wm-step" data-step="schedule" hidden id="mr-wm-step-schedule">' +
      '<button type="button" class="mr-wm-back" id="mr-wm-schedule-back">Back</button>' +
      '<iframe class="mr-wm-frame" id="mr-wm-schedule-frame" title="Book a meeting" hidden></iframe>' +
      '<a class="mr-wm-open-tab" id="mr-wm-schedule-open" target="_blank" rel="noopener noreferrer">Open in a new tab</a>' +
      "</div>" +
      '<div class="mr-wm-step" data-step="creator" hidden id="mr-wm-step-creator"></div>' +
      '<div class="mr-wm-step" data-step="hq" hidden id="mr-wm-step-hq"></div>' +
      "</div>"
    );
  }

  function bindExclusiveFaq(root) {
    if (!root) return;
    const items = Array.from(root.querySelectorAll("details"));

    function closeItem(details) {
      if (!details.classList.contains("is-open")) {
        details.open = false;
        return;
      }
      details.classList.remove("is-open");
      const panel = details.querySelector(".mr-wm-faq-panel");
      const finish = () => {
        details.open = false;
        panel?.removeEventListener("transitionend", finish);
      };
      if (panel) panel.addEventListener("transitionend", finish);
      else details.open = false;
      setTimeout(finish, 360);
    }

    function openItem(details) {
      items.forEach((other) => {
        if (other !== details) closeItem(other);
      });
      details.open = true;
      requestAnimationFrame(() => {
        details.classList.add("is-open");
      });
    }

    items.forEach((details) => {
      const summary = details.querySelector("summary");
      summary?.addEventListener("click", (e) => {
        e.preventDefault();
        if (details.classList.contains("is-open")) closeItem(details);
        else openItem(details);
      });
    });
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css();
    document.head.appendChild(style);
  }

  async function resolveAuthToken() {
    try {
      const session = await global.StudioAuth?.getSession?.();
      if (session?.access_token) return session.access_token;
    } catch (_) {
      /* ignore */
    }
    return "";
  }

  function unmount() {
    document.body.classList.remove("mr-wm-open");
    document.getElementById("mr-wm-chip-root")?.remove();
    document.getElementById("mr-wm-overlay-root")?.remove();
    document.getElementById("mr-wm-root")?.remove();
  }

  function allowedBookingUrl(value) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:") return "";
      if (!/^(www\.|app\.)?cal\.com$/i.test(url.hostname)) return "";
      return url.toString();
    } catch (_) {
      return "";
    }
  }

  function bindContactSteps(root, creatorContact, hqContact, workerUrl, projectId) {
    if (!root) return { setBookingUrl() {} };
    const assetsBase = studioBaseUrl(workerUrl);
    let bookingUrl = "";
    const steps = {
      main: root.querySelector('[data-step="main"]'),
      schedule: root.querySelector('[data-step="schedule"]'),
      creator: root.querySelector('[data-step="creator"]'),
      hq: root.querySelector('[data-step="hq"]'),
    };

    function showStep(name) {
      Object.entries(steps).forEach(([key, el]) => {
        if (!el) return;
        const active = key === name;
        el.hidden = !active;
        el.classList.toggle("is-active", active);
      });
    }

    function bindVcard(stepEl, contact, pageUrl) {
      if (!stepEl || !contact) return;
      stepEl.innerHTML = buildVcardHtml(contact, assetsBase, { pageUrl });
      stepEl.querySelector("[data-mr-vcard-back]")?.addEventListener("click", () => showStep("main"));
      stepEl.querySelector("[data-mr-vcard-save]")?.addEventListener("click", () => {
        const blob = new Blob([buildVcardFile(contact)], { type: "text/vcard;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (String(contact.name || "contact").replace(/[^\w\-]+/g, "-") || "contact") + ".vcf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }

    bindVcard(
      steps.creator,
      creatorContact,
      creatorContactPageUrl(workerUrl, projectId)
    );
    bindVcard(steps.hq, hqContact, contactPageUrl(workerUrl));

    root.querySelector("#mr-wm-contact-creator")?.addEventListener("click", () => {
      if (!creatorContact) return;
      showStep("creator");
    });
    root.querySelector("#mr-wm-contact-hq")?.addEventListener("click", () => {
      showStep("hq");
    });
    root.querySelector("#mr-wm-schedule-back")?.addEventListener("click", () => showStep("main"));

    const scheduleBtn = root.querySelector("#mr-wm-schedule");
    const frame = root.querySelector("#mr-wm-schedule-frame");
    const openTab = root.querySelector("#mr-wm-schedule-open");
    scheduleBtn?.addEventListener("click", () => {
      const url = allowedBookingUrl(bookingUrl);
      if (!url) return;
      if (openTab) openTab.href = url;
      if (frame && !frame.getAttribute("src")) {
        const framed = new URL(url);
        framed.searchParams.set("embed", "true");
        frame.src = framed.toString();
        frame.hidden = false;
      }
      showStep("schedule");
    });

    return {
      setBookingUrl(next) {
        bookingUrl = allowedBookingUrl(next);
        if (scheduleBtn) scheduleBtn.hidden = !bookingUrl;
        if (openTab && bookingUrl) openTab.href = bookingUrl;
      },
    };
  }

  function loadPublicBooking(workerUrl, projectId) {
    const base = String(workerUrl || "").replace(/\/$/, "");
    const id = String(projectId || "").trim();
    if (!base || !id) return Promise.resolve("");
    return fetch(base + "/public-booking?projectId=" + encodeURIComponent(id), {
      cache: "no-store",
      mode: "cors",
    })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => allowedBookingUrl(data?.url))
      .catch(() => "");
  }

  function mount(opts) {
    opts = opts || {};
    unmount();
    ensureStyle();

    const projectId = String(opts.projectId || "").trim();
    const workerUrl = String(
      opts.workerUrl || "https://moonrise-studio.vercel.app"
    ).replace(/\/$/, "");
    const paymentLink = String(opts.paymentLink || "").trim();
    const host = opts.host || null;
    const creatorContact = opts.creatorContact || null;
    const hqContact = { ...DEFAULT_HQ, ...(opts.hqContact || {}) };
    const chipHidden = opts.chipHidden === true;

    const chipRoot = document.createElement("div");
    chipRoot.id = "mr-wm-chip-root";
    chipRoot.innerHTML =
      '<div class="mr-wm' +
      (host ? " mr-wm--hosted" : "") +
      '" id="mr-wm" data-moonrise-watermark>' +
      '<button type="button" class="mr-wm-chip" id="mr-wm-open" aria-haspopup="dialog" aria-controls="mr-wm-overlay">' +
      '<img class="mr-wm-avatar" src="' +
      AVATAR +
      '" alt="Moonrise" width="48" height="48" decoding="async" />' +
      '<span class="mr-wm-copy"><strong>Complete your order</strong>' +
      "<span>Click here to remove watermark</span></span></button></div>";

    // Overlay always on document.body so it covers builder chrome / native UI bleed.
    const overlayRoot = document.createElement("div");
    overlayRoot.id = "mr-wm-overlay-root";
    overlayRoot.innerHTML =
      '<div class="mr-wm-overlay" id="mr-wm-overlay" aria-hidden="true">' +
      '<div class="mr-wm-panel" role="dialog" aria-modal="true" aria-labelledby="mr-wm-title">' +
      '<header class="mr-wm-head">' +
      '<h2 id="mr-wm-title">Unlock your website</h2>' +
      '<button type="button" class="mr-wm-close" id="mr-wm-close" aria-label="Close">&times;</button></header>' +
      panelBodyHtml(creatorContact, hqContact) +
      "</div></div>";

    const chipParent = host || document.body;
    if (host) host.innerHTML = "";
    chipParent.appendChild(chipRoot);
    document.body.appendChild(overlayRoot);

    const chip = document.getElementById("mr-wm");
    const overlay = document.getElementById("mr-wm-overlay");
    const openBtn = document.getElementById("mr-wm-open");
    const closeBtn = document.getElementById("mr-wm-close");
    const payBtn = document.getElementById("mr-wm-pay");
    const promoInput = document.getElementById("mr-wm-promo");
    const errEl = document.getElementById("mr-wm-error");

    if (chipHidden) {
      chip?.classList.add("is-hidden");
    }

    function revealChipIfAllowed() {
      if (!chipHidden) chip?.classList.remove("is-hidden");
    }

    function openPanel() {
      chip?.classList.add("is-hidden");
      document.body.classList.add("mr-wm-open");
      overlayRoot.setAttribute("data-open", "1");
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closePanel() {
      revealChipIfAllowed();
      document.body.classList.remove("mr-wm-open");
      overlayRoot.removeAttribute("data-open");
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      const body = document.getElementById("mr-wm-body");
      body?.querySelectorAll(".mr-wm-step").forEach((step) => {
        const isMain = step.getAttribute("data-step") === "main";
        step.hidden = !isMain;
        step.classList.toggle("is-active", isMain);
      });
      const faqs = document.getElementById("mr-wm-faqs");
      const faq = document.getElementById("mr-wm-faq");
      if (faq) faq.hidden = true;
      if (faqs) {
        faqs.classList.remove("is-open");
        faqs.setAttribute("aria-expanded", "false");
      }
    }

    function showError(msg) {
      if (!errEl) return;
      errEl.hidden = !msg;
      errEl.textContent = msg || "";
    }

    openBtn?.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      openPanel();
    });
    closeBtn?.addEventListener("click", closePanel);
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) closePanel();
    });

    const faqsBtn = document.getElementById("mr-wm-faqs");
    const faq = document.getElementById("mr-wm-faq");
    faqsBtn?.addEventListener("click", () => {
      if (!faq) return;
      const open = faq.hasAttribute("hidden");
      if (open) {
        faq.hidden = false;
        faqsBtn.classList.add("is-open");
        faqsBtn.setAttribute("aria-expanded", "true");
      } else {
        faq.hidden = true;
        faqsBtn.classList.remove("is-open");
        faqsBtn.setAttribute("aria-expanded", "false");
      }
    });

    if (!keydownBound) {
      keydownBound = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const open = document.getElementById("mr-wm-overlay");
          if (open?.classList.contains("is-open")) closePanel();
        }
      });
    }

    bindExclusiveFaq(document.getElementById("mr-wm-faq"));
    const schedule = bindContactSteps(
      document.getElementById("mr-wm-body"),
      creatorContact,
      hqContact,
      workerUrl,
      projectId
    );
    void loadPublicBooking(workerUrl, projectId).then((url) => schedule?.setBookingUrl?.(url));

    payBtn?.addEventListener("click", async () => {
      showError("");
      payBtn.disabled = true;
      try {
        if (paymentLink) {
          location.href = paymentLink;
          return;
        }
        if (!projectId) {
          showError(
            "Checkout is ready once this preview is linked to a project. Contact Headquarters or your creator to complete payment."
          );
          return;
        }

        const headers = { "Content-Type": "application/json" };
        let endpoint = workerUrl + "/public-checkout";
        const token = await resolveAuthToken();
        if (token) {
          headers.Authorization = "Bearer " + token;
          endpoint = workerUrl + "/checkout";
        }

        const promoCode = String(promoInput?.value || "").trim();
        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ projectId, promoCode: promoCode || undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Checkout failed");
        if ((data.alreadyPaid || data.testPromo) && data.url) {
          location.href = data.url;
          return;
        }
        if (data.url) {
          location.href = data.url;
          return;
        }
        throw new Error("No checkout URL returned");
      } catch (e) {
        showError(e.message || "Checkout failed");
      } finally {
        payBtn.disabled = false;
      }
    });

    return { open: openPanel, close: closePanel, unmount };
  }

  function cleanPaidQueryFromUrl() {
    try {
      const url = new URL(location.href);
      if (!url.searchParams.has("paid") && !url.searchParams.has("session_id")) return;
      url.searchParams.delete("paid");
      url.searchParams.delete("session_id");
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch (_) {
      /* ignore */
    }
  }

  function showPaymentReceipt(receipt) {
    const amount = String(receipt?.amountLabel || "").trim();
    const item = String(receipt?.item || "Website purchase").trim();
    const hosting = String(receipt?.hostingLabel || "").trim();
    const box = document.createElement("div");
    box.setAttribute("role", "status");
    box.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#f8fafc;font:16px/1.5 system-ui,sans-serif;padding:24px;text-align:center";
    const card = document.createElement("div");
    const title = document.createElement("h1");
    title.textContent = "Payment confirmed";
    title.style.cssText = "font-size:1.5rem;margin:0 0 8px";
    const line = document.createElement("p");
    line.textContent = amount ? "We received " + amount + " for " + item + "." : "We received your payment for " + item + ".";
    card.appendChild(title);
    card.appendChild(line);
    if (hosting) {
      const extra = document.createElement("p");
      extra.textContent = "Hosting renews at " + hosting + " until you cancel.";
      card.appendChild(extra);
    }
    box.appendChild(card);
    (document.body || document.documentElement).appendChild(box);
    return new Promise((resolve) => setTimeout(resolve, 2500));
  }

  /**
   * After Stripe redirects back with ?paid=1&session_id=, verify + unlock
   * even if the webhook is delayed or misconfigured, then hard-reload so
   * the published HTML (without embed.js) replaces this watermarked page.
   */
  async function fulfillPaidReturn(projectId, workerUrl) {
    const params = new URLSearchParams(location.search);
    if (params.get("paid") !== "1") return false;
    const sessionId = String(params.get("session_id") || "").trim();
    const base = String(workerUrl || "").replace(/\/$/, "");
    if (!base || !sessionId.startsWith("cs_") || !projectId) {
      cleanPaidQueryFromUrl();
      return false;
    }
    try {
      const res = await fetch(base + "/fulfill-go-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unlock failed");
      await showPaymentReceipt(data.receipt);
      const next = data.url || location.href.split("?")[0];
      location.replace(next);
      return true;
    } catch (e) {
      console.warn("[Moonrise] fulfill-go-live failed:", e?.message || e);
      cleanPaidQueryFromUrl();
      return false;
    }
  }

  function pingSiteVisit(projectId, workerUrl) {
    const base = String(workerUrl || "").replace(/\/$/, "");
    const id = String(projectId || "").trim();
    if (!base || !id) return;
    try {
      const key = "mr_visit_ping_" + id;
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch (_) {
      /* still try once */
    }
    try {
      fetch(base + "/site-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
        keepalive: true,
        mode: "cors",
      }).catch(() => {});
    } catch (_) {
      /* ignore */
    }
  }

  function autoMountFromScript() {
    // Capture at parse time - document.currentScript is null inside deferred
    // callbacks / DOMContentLoaded, which is how live sites load this file.
    const script =
      bootScriptEl ||
      document.currentScript ||
      document.querySelector("script[data-project-id][src*='embed.js']");
    if (!script) return;
    const projectId = script.getAttribute("data-project-id") || "";
    if (!projectId) return;
    const workerUrl = script.getAttribute("data-worker") || "";
    const creatorContact = readContactFromScript(script, "data-creator-contact");
    const hqContact = readContactFromScript(script, "data-hq-contact") || DEFAULT_HQ;
    pingSiteVisit(projectId, workerUrl);
    void fulfillPaidReturn(projectId, workerUrl).then((handled) => {
      if (handled) return;
      mount({
        projectId,
        workerUrl,
        paymentLink: script.getAttribute("data-payment-link") || "",
        urgencyEndsAt: script.getAttribute("data-urgency-ends-at") || "",
        creatorContact,
        hqContact,
      });
    });
  }

  global.MoonriseWatermarkEmbed = { mount, unmount, AVATAR, SITE_URL };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoMountFromScript);
    } else {
      autoMountFromScript();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
