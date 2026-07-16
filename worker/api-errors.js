/**
 * Map backend failures to short, actionable messages for the Studio UI.
 */

const STRIPE_CHECKOUT_WRITE_MSG =
  'Stripe key is missing Checkout Sessions Write. In Stripe Dashboard -> API keys -> edit this restricted key, enable "Checkout Sessions: Write", save, then retry payment.';

const STRIPE_CHECKOUT_READ_MSG =
  'Stripe key is missing Checkout Sessions Read. In Stripe Dashboard -> API keys -> edit this restricted key, enable "Checkout Sessions: Read", save, then retry.';

const STRIPE_BILLING_PORTAL_MSG =
  'Stripe key is missing Billing Portal access. In Stripe Dashboard -> API keys -> edit this restricted key, enable "Billing Portal: Write", save, then retry.';

const STRIPE_SUBSCRIPTIONS_MSG =
  'Stripe key is missing Subscriptions Read. In Stripe Dashboard -> API keys -> edit this restricted key, enable "Subscriptions: Read", save, then retry.';

const STRIPE_GENERIC_PERM_MSG =
  'Stripe key is missing required permissions. In Stripe Dashboard -> API keys -> edit this restricted key, enable Checkout Sessions (Read + Write), Billing Portal (Write), and Subscriptions (Read), save, then retry payment.';

const STRIPE_NOT_CONFIGURED_MSG =
  "Stripe is not configured on the server. Add STRIPE_SECRET_KEY in your deployment environment (Vercel -> Settings -> Environment Variables), redeploy, then retry payment.";

const OPENROUTER_NOT_CONFIGURED_MSG =
  "Website generation is not configured. Add OPENROUTER_API_KEY in your deployment environment, redeploy the worker, then try again.";

const SUPABASE_NOT_CONFIGURED_MSG =
  "Supabase is not configured on the worker. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to worker/.env (local) or Vercel -> Settings -> Environment Variables, restart/redeploy, then retry.";

const VERCEL_NOT_CONFIGURED_MSG =
  "Publishing is not configured. Add VERCEL_TOKEN in your deployment environment, redeploy the worker, then try publishing again.";

function isStripePermissionError(err) {
  const msg = String(err?.message || "");
  return (
    err?.type === "StripePermissionError" ||
    err?.code === "permission_denied" ||
    /does not have the required permissions|permission denied|missing the required permissions|checkout_session_write/i.test(
      msg
    )
  );
}

function stripePermissionMessage(err) {
  if (!isStripePermissionError(err)) return null;
  const msg = String(err?.message || "").toLowerCase();

  if (/checkout_session_write|checkout sessions: write|checkout sessions write/.test(msg)) {
    return STRIPE_CHECKOUT_WRITE_MSG;
  }
  if (/checkout_session_read|checkout sessions: read|checkout sessions read/.test(msg)) {
    return STRIPE_CHECKOUT_READ_MSG;
  }
  if (/customer_portal|billing_portal|billing portal/.test(msg)) {
    return STRIPE_BILLING_PORTAL_MSG;
  }
  if (/subscriptions?_read|subscriptions: read|subscriptions read/.test(msg)) {
    return STRIPE_SUBSCRIPTIONS_MSG;
  }
  if (/checkout/.test(msg)) return STRIPE_CHECKOUT_WRITE_MSG;
  return STRIPE_GENERIC_PERM_MSG;
}

function isProduction() {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}

function looksInternal(message) {
  return /select |insert |update |delete from|syntax error|postgres|postgrest|supabase|stack|node_modules|ECONN|ENOTFOUND|service_role|STRIPE_|OPENROUTER_|VERCEL_|process\.env|duplicate key|violates |relation |column |jwt|secret key|password authentication|\/worker\/|at \w+ \(|resend\.com|environment variable/i.test(
    String(message || "")
  );
}

const PUBLIC_SETUP = {
  STRIPE_PERMISSION_DENIED: "Payment could not be started. Please try again later.",
  STRIPE_NOT_CONFIGURED: "Payment is unavailable right now. Please try again later.",
  OPENROUTER_NOT_CONFIGURED: "Website generation is unavailable right now. Please try again later.",
  SUPABASE_NOT_CONFIGURED: "The studio is unavailable right now. Please try again later.",
  VERCEL_NOT_CONFIGURED: "Publishing is unavailable right now. Please try again later.",
};

function clientError(err, fallback, status) {
  const safe = fallback || "Something went wrong. Please try again.";
  const raw = String(err?.message || "").trim();
  const code = Number(status || err?.status) || 500;
  if (!isProduction()) return raw || safe;
  if (code >= 500 || looksInternal(raw)) return safe;
  return raw || safe;
}

function formatApiError(err, fallback) {
  const stripeMsg = stripePermissionMessage(err);
  if (stripeMsg) {
    return hideSetupDetail(err, {
      message: stripeMsg,
      status: 403,
      code: "STRIPE_PERMISSION_DENIED",
    }, fallback);
  }

  const raw = String(err?.message || "").trim();
  const lower = raw.toLowerCase();

  if (!raw && fallback) {
    return { message: fallback, status: err?.status || 500, code: err?.code || undefined };
  }

  if (/^stripe not configured$/i.test(raw)) {
    return hideSetupDetail(err, { message: STRIPE_NOT_CONFIGURED_MSG, status: 500, code: "STRIPE_NOT_CONFIGURED" }, fallback);
  }

  if (/openrouter is not configured|website generation is not configured|minimax website generation is not configured/i.test(raw)) {
    return hideSetupDetail(err, { message: OPENROUTER_NOT_CONFIGURED_MSG, status: 503, code: "OPENROUTER_NOT_CONFIGURED" }, fallback);
  }

  if (/supabase is not configured|supabase_url and supabase_service_role_key are required/i.test(lower)) {
    return hideSetupDetail(err, { message: SUPABASE_NOT_CONFIGURED_MSG, status: 503, code: "SUPABASE_NOT_CONFIGURED" }, fallback);
  }

  if (/vercel.*not configured|vercel_token is required/i.test(lower)) {
    return hideSetupDetail(err, { message: VERCEL_NOT_CONFIGURED_MSG, status: 500, code: "VERCEL_NOT_CONFIGURED" }, fallback);
  }

  if (err?.code === "INSUFFICIENT_CREDITS") {
    return hideSetupDetail(
      err,
      {
        message: raw || "This action is no longer credit-gated.",
        status: 402,
        code: "INSUFFICIENT_CREDITS",
      },
      "Not enough credits for this action."
    );
  }

  return hideSetupDetail(
    err,
    {
      message: raw || fallback || "Something went wrong. Please try again.",
      status: err?.status || 500,
      code: err?.code || undefined,
    },
    fallback
  );
}

function hideSetupDetail(err, result, fallback) {
  if (!isProduction()) return result;
  const safe = fallback || "Something went wrong. Please try again.";
  const status = result.status || 500;
  let message = result.message;
  if (PUBLIC_SETUP[result.code]) message = PUBLIC_SETUP[result.code];
  else if (status >= 500 || looksInternal(message)) message = safe;
  if (message !== result.message) console.error(err);
  return { ...result, message };
}

function stripeMissingResponse() {
  return { message: STRIPE_NOT_CONFIGURED_MSG, status: 500, code: "STRIPE_NOT_CONFIGURED" };
}

function respondApiError(res, err, fallback, defaultStatus = 500) {
  const formatted = formatApiError(err, fallback);
  const status = formatted.status || defaultStatus;
  const body = { error: formatted.message };
  if (formatted.code) body.code = formatted.code;
  return res.status(status).json(body);
}

function sendStripeMissing(res) {
  const formatted = stripeMissingResponse();
  const hidden = hideSetupDetail(new Error("Stripe is not configured"), formatted, PUBLIC_SETUP.STRIPE_NOT_CONFIGURED);
  return res.status(hidden.status).json({ error: hidden.message, code: hidden.code });
}

module.exports = {
  formatApiError,
  respondApiError,
  sendStripeMissing,
  stripeMissingResponse,
  stripePermissionMessage,
  clientError,
  isProduction,
  STRIPE_CHECKOUT_WRITE_MSG,
};
