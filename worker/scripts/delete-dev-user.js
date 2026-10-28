/**
 * Permanently delete a Moonrise Studio account (auth + profile + related data).
 *
 * Usage:
 *   node scripts/delete-dev-user.js --email teambrilliantt@hotmail.com --confirm
 *   node scripts/delete-dev-user.js --user-id <uuid> --confirm
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { createClient } = require("@supabase/supabase-js");
const { deleteUserAccount } = require("../delete-account");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in worker/.env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseArgs(argv) {
  const args = { confirm: false };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--confirm") args.confirm = true;
    else if (token === "--email") args.email = argv[++i];
    else if (token === "--user-id") args.userId = argv[++i];
    else if (token === "--help" || token === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Permanently delete a Moonrise Studio account.

Options:
  --email <email>     Match auth.users email
  --user-id <uuid>    Explicit user id
  --confirm           Required - performs the deletion
  --help              Show this help
`);
}

async function resolveUser(args) {
  if (args.userId) {
    const { data, error } = await supabase.auth.admin.getUserById(args.userId);
    if (error || !data?.user) throw new Error("No auth user found for id: " + args.userId);
    return data.user;
  }

  if (args.email) {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    const user = (data?.users || []).find(
      (row) => String(row.email || "").toLowerCase() === String(args.email).toLowerCase()
    );
    if (!user) throw new Error("No auth user found for email: " + args.email);
    return user;
  }

  throw new Error("Provide --email or --user-id");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.confirm) {
    console.error("Refusing to run without --confirm");
    printHelp();
    process.exit(1);
  }

  const user = await resolveUser(args);
  const summary = await deleteUserAccount(supabase, user);

  console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
