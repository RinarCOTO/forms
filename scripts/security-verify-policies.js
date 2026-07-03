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

const auditedTables = [
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

function printResult(pass, message, detail = "") {
  const label = pass ? "PASS" : "FAIL";
  console.log(`${label} ${message}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in .env or .env.local");
  }

  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const failures = [];
  const check = (condition, message, detail = "") => {
    printResult(Boolean(condition), message, detail);
    if (!condition) failures.push(`${message}${detail ? `: ${detail}` : ""}`);
  };

  await client.connect();

  try {
    const rls = await client.query(
      `
        select c.relname as table_name, c.relrowsecurity as rls_enabled
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = any($1)
        order by c.relname
      `,
      [auditedTables],
    );

    const rlsMap = new Map(rls.rows.map((row) => [row.table_name, row.rls_enabled]));
    const missingRls = auditedTables.filter((table) => !rlsMap.get(table));
    check(missingRls.length === 0, "RLS enabled on audited tables", missingRls.join(", "));

    const anonGrants = await client.query(
      `
        select table_name, privilege_type
        from information_schema.role_table_grants
        where table_schema = 'public'
          and grantee = 'anon'
          and table_name = any($1)
        order by table_name, privilege_type
      `,
      [auditedTables],
    );
    check(anonGrants.rowCount === 0, "No anon grants on audited tables", JSON.stringify(anonGrants.rows));

    const protectedColumnGrants = await client.query(
      `
        select column_name, grantee, privilege_type
        from information_schema.column_privileges
        where table_schema = 'public'
          and table_name = 'users'
          and column_name in ('role', 'is_active')
          and grantee in ('anon', 'authenticated')
          and privilege_type in ('INSERT', 'UPDATE')
        order by grantee, column_name, privilege_type
      `,
    );
    check(
      protectedColumnGrants.rowCount === 0,
      "No direct role/is_active mutation grants",
      JSON.stringify(protectedColumnGrants.rows),
    );

    const directWriteGrants = await client.query(
      `
        select table_name, grantee, privilege_type
        from information_schema.role_table_grants
        where table_schema = 'public'
          and grantee in ('anon', 'authenticated')
          and table_name in ('users', 'role_permissions', 'form_locks')
          and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
        order by table_name, grantee, privilege_type
      `,
    );
    check(
      directWriteGrants.rowCount === 0,
      "No direct anon/authenticated writes on users, role_permissions, form_locks",
      JSON.stringify(directWriteGrants.rows),
    );

    const servicePolicies = await client.query(
      `
        select tablename, policyname, roles::text as roles
        from pg_policies
        where schemaname = 'public'
          and tablename in ('role_permissions', 'form_locks', 'tax_declarations', 'form_review_history')
          and policyname in (
            'Service role manages role permissions',
            'Service role manages form locks',
            'Service role manages tax declarations',
            'Service role manages review history'
          )
        order by tablename, policyname
      `,
    );
    const nonServicePolicies = servicePolicies.rows.filter((row) => row.roles !== "{service_role}");
    check(
      servicePolicies.rowCount === 4 && nonServicePolicies.length === 0,
      "Service-only policies are explicit to service_role",
      JSON.stringify(servicePolicies.rows),
    );

    const faasSelectPolicies = await client.query(
      `
        select tablename, policyname, coalesce(qual, '') as using_expr
        from pg_policies
        where schemaname = 'public'
          and tablename in ('building_structures', 'land_improvements', 'machinery')
          and policyname in (
            'Authenticated scoped select on building_structures',
            'Authenticated scoped select on land_improvements',
            'Authenticated scoped select on machinery'
          )
        order by tablename
      `,
    );
    const laooBroadPolicies = faasSelectPolicies.rows.filter((row) => row.using_expr.includes("'laoo'"));
    check(
      faasSelectPolicies.rowCount === 3 && laooBroadPolicies.length === 0,
      "FAAS SELECT policies do not grant LAOO province-wide access",
      JSON.stringify(laooBroadPolicies.map((row) => row.tablename)),
    );

    const commentTrigger = await client.query(
      `
        select 1
        from pg_trigger
        where tgrelid = 'public.form_comments'::regclass
          and tgname = 'trg_form_comments_author_role_from_profile'
          and not tgisinternal
      `,
    );
    check(commentTrigger.rowCount === 1, "form_comments author_role trigger exists");

    const commentConstraint = await client.query(
      `
        select pg_get_constraintdef(oid) as def
        from pg_constraint
        where conrelid = 'public.form_comments'::regclass
          and conname = 'form_comments_author_role_check'
      `,
    );
    const constraintDef = commentConstraint.rows[0]?.def ?? "";
    check(
      commentConstraint.rowCount === 1 &&
        constraintDef.includes("assistant_provincial_assessor") &&
        constraintDef.includes("provincial_assessor"),
      "form_comments author_role constraint includes current reviewer roles",
      constraintDef,
    );
  } finally {
    await client.end();
  }

  if (failures.length) {
    console.error("\nSecurity policy verification failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("\nSecurity policy verification passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
