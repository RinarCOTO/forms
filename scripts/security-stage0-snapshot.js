const fs = require("fs");
const { Client } = require("pg");

const env = {};

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;

  for (const line of fs.readFileSync(file, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    env[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const tables = [
  "building_structures",
  "land_improvements",
  "machinery",
  "users",
  "role_permissions",
  "form_locks",
  "form_comments",
  "tax_declarations",
  "form_review_history",
];

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

function printMarkdownTable(title, columns, rows) {
  console.log(`\n## ${title}`);
  console.log(`| ${columns.join(" | ")} |`);
  console.log(`| ${columns.map(() => "---").join(" | ")} |`);

  if (!rows.length) {
    console.log(`| ${columns.map((_, index) => (index === 0 ? "(none)" : "")).join(" | ")} |`);
    return;
  }

  for (const row of rows) {
    console.log(`| ${columns.map((column) => escapeCell(row[column])).join(" | ")} |`);
  }
}

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in .env or .env.local");
  }

  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const rlsStatus = await client.query(
      `
        select
          c.relname as table_name,
          c.relrowsecurity as rls_enabled,
          c.relforcerowsecurity as rls_forced
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = any($1)
        order by c.relname
      `,
      [tables],
    );

    const grants = await client.query(
      `
        select
          table_name,
          grantee,
          privilege_type
        from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name = any($1)
          and grantee in ('anon', 'authenticated', 'service_role')
        order by table_name, grantee, privilege_type
      `,
      [tables],
    );

    const userColumnGrants = await client.query(
      `
        select
          table_name,
          column_name,
          grantee,
          privilege_type
        from information_schema.column_privileges
        where table_schema = 'public'
          and table_name = 'users'
          and grantee in ('anon', 'authenticated', 'service_role')
        order by grantee, column_name, privilege_type
      `,
    );

    const policies = await client.query(
      `
        select
          tablename as table_name,
          policyname,
          permissive,
          roles::text as roles,
          cmd,
          coalesce(qual, '') as using_expr,
          coalesce(with_check, '') as with_check
        from pg_policies
        where schemaname = 'public'
          and tablename = any($1)
        order by tablename, policyname
      `,
      [tables],
    );

    console.log("# Stage 0 Live Policy Snapshot");
    console.log(`Generated: ${new Date().toISOString()}`);
    console.log("");
    console.log("This snapshot only includes policy and grant metadata. It does not print database credentials or row data.");

    printMarkdownTable("RLS Status", ["table_name", "rls_enabled", "rls_forced"], rlsStatus.rows);
    printMarkdownTable("Table Grants", ["table_name", "grantee", "privilege_type"], grants.rows);
    printMarkdownTable(
      "Users Column Grants",
      ["table_name", "column_name", "grantee", "privilege_type"],
      userColumnGrants.rows,
    );
    printMarkdownTable(
      "Policies",
      ["table_name", "policyname", "permissive", "roles", "cmd", "using_expr", "with_check"],
      policies.rows,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
