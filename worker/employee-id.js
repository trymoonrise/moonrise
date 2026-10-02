/**
 * Rotating Employee IDs for invite-only signup.
 * The HMAC secret lives only in EMPLOYEE_ID_SECRET (server env). The code
 * itself is never stored in the repo. A new random code is shown every 30
 * seconds. Each code can create one account, and it stops working 6 hours
 * after it was issued if nobody used it.
 */
const crypto = require("crypto");

const PERIOD_SECONDS = 30;
const VALID_SECONDS = 6 * 60 * 60;

function employeeSecret() {
  const raw = String(process.env.EMPLOYEE_ID_SECRET || "").trim();
  if (!raw) return null;
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length < 32) return null;
  return decoded;
}

function codeForStep(secret, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha256", secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(bin % 1000000).padStart(6, "0");
}

function codesMatch(candidate, expected) {
  const left = Buffer.from(String(candidate || ""));
  const right = Buffer.from(String(expected || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function currentStep(now = Date.now()) {
  return Math.floor(now / 1000 / PERIOD_SECONDS);
}

function secondsLeft(now = Date.now()) {
  const elapsed = Math.floor(now / 1000) % PERIOD_SECONDS;
  return PERIOD_SECONDS - elapsed;
}

function currentEmployeeCode(now = Date.now()) {
  const secret = employeeSecret();
  if (!secret) return null;
  const step = currentStep(now);
  return {
    code: codeForStep(secret, step),
    step,
    secondsLeft: secondsLeft(now),
    periodSeconds: PERIOD_SECONDS,
    validSeconds: VALID_SECONDS,
  };
}

/** Any code issued in the last 6 hours. The newest matching step wins. */
function matchEmployeeStep(code, now = Date.now()) {
  const secret = employeeSecret();
  if (!secret) return null;
  const normalized = String(code || "").trim();
  if (!/^\d{6}$/.test(normalized)) return null;
  const step = currentStep(now);
  const oldest = step - Math.floor(VALID_SECONDS / PERIOD_SECONDS);
  for (let candidate = step; candidate >= oldest && candidate >= 0; candidate -= 1) {
    if (codesMatch(normalized, codeForStep(secret, candidate))) return candidate;
  }
  return null;
}

async function redeemEmployeeId(db, code) {
  if (!employeeSecret()) {
    return {
      ok: false,
      status: 403,
      error: "New accounts are invite-only. Ask your admin for an Employee ID.",
      code: "signup_disabled",
    };
  }
  const step = matchEmployeeStep(code);
  if (step == null) {
    return {
      ok: false,
      status: 403,
      error: "That Employee ID is not valid, or it expired after 6 hours. Ask your admin for a new one.",
      code: "invalid_auth_code",
    };
  }
  const { error } = await db.from("employee_signup_redemptions").insert({ step });
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        status: 403,
        error: "That Employee ID was already used. Ask your admin for the next code.",
        code: "auth_code_used",
      };
    }
    throw error;
  }
  return { ok: true, step };
}

async function releaseEmployeeId(db, step) {
  if (step == null) return;
  await db.from("employee_signup_redemptions").delete().eq("step", step);
}

async function attachEmployeeIdUser(db, step, userId) {
  if (step == null || !userId) return;
  await db.from("employee_signup_redemptions").update({ user_id: userId }).eq("step", step);
}

function isStudioAdmin(user) {
  const id = String(user?.id || "").trim();
  const ids = String(process.env.MOONRISE_ADMIN_USER_IDS || "")
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (id && ids.includes(id)) return true;
  const email = String(user?.email || "").trim().toLowerCase();
  const emails = String(
    process.env.MOONRISE_ADMIN_EMAILS || process.env.MOONRISE_SUPPORT_EMAIL || ""
  )
    .split(/[,;\s]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  return !!(email && emails.includes(email));
}

module.exports = {
  PERIOD_SECONDS,
  VALID_SECONDS,
  employeeSecret,
  currentEmployeeCode,
  matchEmployeeStep,
  redeemEmployeeId,
  releaseEmployeeId,
  attachEmployeeIdUser,
  isStudioAdmin,
};
