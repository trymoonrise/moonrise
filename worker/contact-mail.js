/**
 * Send transactional email via Resend (https://resend.com).
 * Used for contact-form leads and website purchase invoices.
 */
const fs = require("fs");
const path = require("path");

const MOONRISE_LOGO_URL = "https://trymoonrise.com/doc/MoonriseLogo.png";
let moonriseLogoAttachmentCache;

function moonriseLogoAttachment() {
  if (moonriseLogoAttachmentCache !== undefined) return moonriseLogoAttachmentCache;
  try {
    const file = path.join(__dirname, "..", "doc", "MoonriseLogo.png");
    const content = fs.readFileSync(file).toString("base64");
    moonriseLogoAttachmentCache = {
      filename: "MoonriseLogo.png",
      content,
      content_id: "moonrise-logo",
    };
  } catch (_) {
    moonriseLogoAttachmentCache = null;
  }
  return moonriseLogoAttachmentCache;
}

function moonriseProfilePictureHtml(font) {
  const src = moonriseLogoAttachment() ? "cid:moonrise-logo" : MOONRISE_LOGO_URL;
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center">
  <tr>
    <td align="center" width="72" height="72" bgcolor="#f8fafc" style="width:72px;height:72px;background:#f8fafc;border-radius:50%;overflow:hidden;">
      <img src="${src}" width="72" height="72" alt="Moonrise" style="display:block;width:72px;height:72px;border:0;border-radius:50%;outline:none;text-decoration:none;">
    </td>
  </tr>
  <tr>
    <td align="center" style="padding-top:12px;font-family:${font};font-size:16px;font-weight:600;letter-spacing:-0.03em;color:#0f172a;">moonrise</td>
  </tr>
</table>`;
}
function formatLeadPlain({ businessName, fields, projectId }) {
  const lines = [
    `New lead for ${businessName || "your website"}`,
    "",
    `Name: ${fields.name || "(not provided)"}`,
    `Phone: ${fields.phone || "(not provided)"}`,
    `Message: ${fields.message || "(not provided)"}`,
  ];

  const extras = fields.extras && typeof fields.extras === "object" ? fields.extras : {};
  for (const [key, value] of Object.entries(extras)) {
    if (value) lines.push(`${key}: ${value}`);
  }

  lines.push("", `Project: ${projectId || ""}`, "Sent by Moonrise Studio");
  return lines.join("\n");
}

function formatLeadHtml({ businessName, fields, projectId }) {
  const extras = fields.extras && typeof fields.extras === "object" ? fields.extras : {};
  const extraRows = Object.entries(extras)
    .filter(([, value]) => value)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-weight:600;">${escapeHtml(
          key
        )}</td><td style="padding:6px 0;">${escapeHtml(String(value))}</td></tr>`
    )
    .join("");

  return `<!doctype html><html><body style="font-family:DM Sans,system-ui,sans-serif;color:#0f172a;line-height:1.5;">
<p style="margin:0 0 16px;font-size:16px;"><strong>New lead for ${escapeHtml(
    businessName || "your website"
  )}</strong></p>
<table style="border-collapse:collapse;font-size:15px;">
<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-weight:600;">Name</td><td style="padding:6px 0;">${escapeHtml(
    fields.name || "(not provided)"
  )}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-weight:600;">Phone</td><td style="padding:6px 0;">${escapeHtml(
    fields.phone || "(not provided)"
  )}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-weight:600;vertical-align:top;">Message</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(
    fields.message || "(not provided)"
  )}</td></tr>
${extraRows}
</table>
<p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">Project ${escapeHtml(
    projectId || ""
  )} · Moonrise Studio</p>
</body></html>`;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendResendEmail({ to, subject, text, html, attachments }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("Email delivery is not configured (RESEND_API_KEY missing)");
  }

  const from =
    String(process.env.RESEND_FROM || "").trim() || "Moonrise Forms <onboarding@resend.dev>";

  const body = {
    from,
    to: [to],
    subject,
    text,
    html,
  };
  if (Array.isArray(attachments) && attachments.length) {
    body.attachments = attachments;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "Could not send email");
  }
  return data;
}

async function sendContactLeadEmail({ to, businessName, fields, projectId }) {
  const subject = `New lead for ${businessName || "your website"}`;
  const text = formatLeadPlain({ businessName, fields, projectId });
  const html = formatLeadHtml({ businessName, fields, projectId });
  return sendResendEmail({ to, subject, text, html });
}

/**
 * Short payment email to the buyer with the Stripe invoice PDF attached.
 */
async function sendPurchaseInvoiceEmail({
  to,
  businessName,
  amountCents,
  siteUrl,
  pdfBase64,
  pdfFilename,
  manageBillingUrl,
  hostingMonthlyCents,
}) {
  const amount = Number.isFinite(Number(amountCents))
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
        Number(amountCents) / 100
      )
    : "";
  const hosting =
    Number.isFinite(Number(hostingMonthlyCents)) && Number(hostingMonthlyCents) > 0
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
          Number(hostingMonthlyCents) / 100
        )
      : "";
  const name = String(businessName || "your website").trim() || "your website";
  const manage = String(manageBillingUrl || "").trim();
  const subject = `Invoice for ${name}`;
  const text = [
    `Thanks for your payment for ${name}.`,
    amount ? `Amount paid: ${amount}` : "",
    hosting ? `Hosting & maintenance: ${hosting}/month (cancel anytime).` : "",
    siteUrl ? `Your site: ${siteUrl}` : "",
    pdfBase64 ? "Your invoice PDF is attached." : "",
    manage ? `Manage or cancel hosting: ${manage}` : "",
    "",
    "- Moonrise",
  ]
    .filter(Boolean)
    .join("\n");
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.5;">
<p style="margin:0 0 12px;">Thanks for your payment for <strong>${escapeHtml(name)}</strong>.</p>
${amount ? `<p style="margin:0 0 12px;">Amount paid: ${escapeHtml(amount)}</p>` : ""}
${
  hosting
    ? `<p style="margin:0 0 12px;">Hosting &amp; maintenance: <strong>${escapeHtml(
        hosting
      )}/month</strong> - cancel anytime.</p>`
    : ""
}
${
  siteUrl
    ? `<p style="margin:0 0 12px;">Your site: <a href="${escapeHtml(siteUrl)}">${escapeHtml(
        siteUrl
      )}</a></p>`
    : ""
}
${pdfBase64 ? `<p style="margin:0 0 12px;">Your invoice PDF is attached.</p>` : ""}
${
  manage
    ? `<p style="margin:20px 0 12px;"><a href="${escapeHtml(
        manage
      )}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;">Manage or cancel hosting</a></p>
<p style="margin:0 0 12px;font-size:13px;color:#64748b;">Use the email address you paid with to open Stripe's secure billing portal.</p>`
    : ""
}
<p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">Moonrise</p>
</body></html>`;

  const attachments = pdfBase64
    ? [
        {
          filename: pdfFilename || "invoice.pdf",
          content: pdfBase64,
        },
      ]
    : undefined;

  return sendResendEmail({ to, subject, text, html, attachments });
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

/**
 * Branded password-reset email (sent via Resend API, not Supabase SMTP).
 */
async function sendPasswordResetEmail({ to, resetUrl }) {
  const email = String(to || "").trim();
  const link = String(resetUrl || "").trim();
  if (!email || !link) throw new Error("Missing reset email or link");

  const subject = "Reset your Moonrise password";
  const text = [
    "Reset your Moonrise password",
    "",
    `We received a request to reset the password for ${email}.`,
    "",
    `Open this link to choose a new password:`,
    link,
    "",
    "If you did not request a password reset, you can ignore this email.",
    "",
    "- Moonrise",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0b1220;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111827;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 10px;text-align:center;">
              <div style="font-size:24px;font-weight:700;letter-spacing:-0.03em;color:#ffffff;">Moonrise</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:6px;">Build websites. Get paid.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <h1 style="margin:0 0 12px;font-family:Segoe UI,Arial,sans-serif;font-size:22px;line-height:1.35;color:#ffffff;">Reset your password</h1>
              <div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.65;color:#cbd5e1;">
                <p style="margin:0 0 12px;">We received a request to reset the password for your Moonrise account (<strong>${escapeHtml(
                  email
                )}</strong>).</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px 8px;">
              <a href="${escapeAttr(link)}" style="display:inline-block;background:#6d5efc;color:#ffffff;text-decoration:none;font-family:Segoe UI,Arial,sans-serif;font-weight:650;font-size:15px;padding:12px 22px;border-radius:10px;">Reset password</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-family:Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.55;color:#64748b;">
              If you did not request a password reset, you can safely ignore this email.
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #1e293b;font-family:Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.5;color:#64748b;text-align:center;">
              Moonrise · <a href="https://trymoonrise.com" style="color:#93c5fd;text-decoration:none;">trymoonrise.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendResendEmail({ to: email, subject, text, html });
}

/**
 * Branded email-verification link for passwordless sign-in and sign-up.
 * kind: "signin" | "signup"
 */
async function sendEmailVerifyLink({ to, verifyUrl, kind }) {
  const email = String(to || "").trim();
  const link = String(verifyUrl || "").trim();
  const signup = kind === "signup";
  if (!email || !link) throw new Error("Missing verification email or link");

  const subject = signup ? "Confirm your Moonrise email" : "Sign in to Moonrise";
  const heading = signup ? "Confirm your email" : "Sign in to Moonrise";
  const lead = signup
    ? "Open this link to verify your email. Only the device where you started sign-up will be signed in."
    : "Open this link to verify your email. Only the device where you requested sign-in will be signed in. This link works once.";
  const button = "Verify email";
  const text = [heading, "", lead, "", `Sent to ${email}`, "", button, link, "", "If you did not ask for this email, you can ignore it.", "", "Moonrise", "https://trymoonrise.com"].join("\n");
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(lead)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f6f8" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:520px;background:#ffffff;border:1px solid #e6eaf0;border-radius:20px;">
          <tr>
            <td align="center" style="padding:36px 36px 8px;">
              ${moonriseProfilePictureHtml(font)}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 0;">
              <h1 style="margin:0;font-family:${font};font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.035em;color:#0f172a;">${escapeHtml(heading)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 36px 0;font-family:${font};font-size:16px;line-height:1.6;color:#334155;">
              ${escapeHtml(lead)}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 36px 0;font-family:${font};font-size:14px;line-height:1.5;color:#64748b;">
              Sent to <span style="color:#0f172a;font-weight:600;">${escapeHtml(email)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="#2563eb" style="border-radius:12px;background:#2563eb;">
                    <a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 22px;font-family:${font};font-size:15px;font-weight:600;letter-spacing:-0.01em;color:#ffffff;text-decoration:none;">${escapeHtml(button)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 0;font-family:${font};font-size:13px;line-height:1.5;color:#64748b;">
              If you did not ask for this email, you can ignore it.
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #eef2f6;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-family:${font};font-size:12px;line-height:1.5;color:#94a3b8;">
                Moonrise · <a href="https://trymoonrise.com" style="color:#64748b;text-decoration:none;">trymoonrise.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const logo = moonriseLogoAttachment();
  return sendResendEmail({
    to: email,
    subject,
    text,
    html,
    attachments: logo ? [logo] : undefined,
  });
}

module.exports = {
  sendContactLeadEmail,
  sendPurchaseInvoiceEmail,
  sendPasswordResetEmail,
  sendEmailVerifyLink,
  sendResendEmail,
  formatLeadPlain,
  formatLeadHtml,
};
