import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

// Inspection only: never invoke migrate() or execute schema-changing SQL.
const url = process.env.DATABASE_URL;
if (!url || !["postgres:", "postgresql:"].includes(new URL(url).protocol))
  throw new Error("DATABASE_URL must be a PostgreSQL URL.");

const pool = new pg.Pool({
  connectionString: url,
  max: 1,
  connectionTimeoutMillis: 3000,
  statement_timeout: 10000,
});
try {
  const directory = new URL("../migrations/", import.meta.url);
  const names = (await readdir(directory))
    .filter((name) => /^\\d+.*\\.sql$/.test(name))
    .sort();
  const expected = new Map<string, string>();
  for (const name of names) {
    const source = await readFile(new URL(name, directory), "utf8");
    expected.set(name, createHash("sha256").update(source).digest("hex"));
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const identity = await client.query<{
      database_name: string;
      role_name: string;
      server_version: string;
    }>(
      "SELECT current_database() AS database_name, current_user AS role_name, current_setting('server_version') AS server_version",
    );
    const ledgerExists = await client.query<{ exists: string | null }>(
      "SELECT to_regclass('public.vq_schema_migrations')::text AS exists",
    );
    if (!ledgerExists.rows[0]?.exists)
      throw new Error("Migration ledger is absent; installation cannot be verified.");
    const installed = await client.query<{ name: string; sha256: string }>(
      "SELECT name, sha256 FROM public.vq_schema_migrations ORDER BY name",
    );
    const failures: string[] = [];
    const applied = new Set<string>();
    for (const row of installed.rows) {
      applied.add(row.name);
      const hash = expected.get(row.name);
      if (!hash) failures.push(`Unknown applied migration: ${row.name}`);
      else if (hash !== row.sha256)
        failures.push(`Checksum mismatch: ${row.name}`);
    }
    const missing = names.filter((name) => !applied.has(name));
    const basic = await client.query<{
      postgis_version: string | null;
      content_posts: string | null;
      geo_preferences: string | null;
      geo_positions: string | null;
      geo_sessions: string | null;
    }>(
      `SELECT (SELECT extversion FROM pg_extension WHERE extname = 'postgis') AS postgis_version,
        to_regclass('public.content_posts')::text AS content_posts,
        to_regclass('public.geo_preferences')::text AS geo_preferences,
        to_regclass('public.geo_positions')::text AS geo_positions,
        to_regclass('public.geo_sessions')::text AS geo_sessions`,
    );
    const result = {
      ...identity.rows[0],
      ...basic.rows[0],
      sourceMigrations: names.length,
      appliedMigrations: installed.rows.map((row) => row.name),
      missingMigrations: missing,
      integrityFailures: failures,
    };
    console.info(JSON.stringify(result, null, 2));
    if (missing.length || failures.length || !basic.rows[0]?.postgis_version)
      process.exitCode = 1;
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
