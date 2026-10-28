/**
 * Permanently delete a Moonrise Studio account (auth + profile + related data).
 * Shared by Settings self-serve delete and the CLI script.
 */
const crypto = require("crypto");

function emailHash(email) {
  return crypto
    .createHash("sha256")
    .update("email:" + String(email || "").trim().toLowerCase(), "utf8")
    .digest("hex");
}

async function deleteStoragePrefix(supabase, bucket, prefix) {
  const limit = 100;
  let offset = 0;
  let removed = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      if (String(error.message || "").toLowerCase().includes("not found")) return removed;
      throw error;
    }
    const entries = data || [];
    if (!entries.length) break;
    const paths = entries
      .filter((entry) => entry?.name)
      .map((entry) => (prefix ? `${prefix}/${entry.name}` : entry.name));
    if (paths.length) {
      const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
      if (removeError) throw removeError;
      removed += paths.length;
    }
    if (entries.length < limit) break;
    offset += limit;
  }
  return removed;
}

async function deleteByColumn(supabase, table, column, value) {
  const { count, error: countError } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);
  if (countError) {
    // Table may not exist in every environment.
    if (/relation|does not exist|could not find/i.test(String(countError.message || ""))) {
      return 0;
    }
    throw countError;
  }
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) throw error;
  return count || 0;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ id: string, email?: string | null }} user
 */
async function deleteUserAccount(supabase, user) {
  const userId = user.id;
  const email = String(user.email || "");
  const summary = { userId, email, deleted: {}, storageRemoved: {} };

  const tables = [
    ["contact_leads", "user_id"],
    ["generation_jobs", "user_id"],
    ["payments", "user_id"],
    ["projects", "user_id"],
    ["credit_transactions", "user_id"],
    ["credit_accounts", "user_id"],
    ["push_subscriptions", "user_id"],
    ["manual_clients", "user_id"],
    ["client_hides", "user_id"],
    ["creator_payouts", "creator_user_id"],
    ["employee_signup_redemptions", "user_id"],
  ];

  for (const [table, column] of tables) {
    summary.deleted[table] = await deleteByColumn(supabase, table, column, userId);
  }

  summary.deleted.profiles = await deleteByColumn(supabase, "profiles", "id", userId);

  if (email) {
    const hash = emailHash(email);
    const { error: lockoutError } = await supabase
      .from("auth_lockouts")
      .delete()
      .eq("subject_type", "email")
      .eq("subject_hash", hash);
    if (lockoutError && !/relation|does not exist|could not find/i.test(String(lockoutError.message || ""))) {
      throw lockoutError;
    }
    summary.deleted.auth_lockouts = 1;

    try {
      await supabase.from("auth_email_handoffs").delete().eq("email", email.toLowerCase());
    } catch (_) {
      /* optional */
    }
  }

  summary.storageRemoved["studio-avatars"] = await deleteStoragePrefix(supabase, "studio-avatars", userId);
  summary.storageRemoved["site-images"] = await deleteStoragePrefix(supabase, "site-images", userId);

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
  if (authDeleteError) throw authDeleteError;
  summary.authDeleted = true;

  return summary;
}

module.exports = { deleteUserAccount, emailHash };
