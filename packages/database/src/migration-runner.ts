import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import type { Pool } from "pg";

export async function migrate(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(861001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS vq_schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = new URL("../migrations/", import.meta.url);
    for (const name of (await readdir(directory))
      .filter((name) => /^\d+.*\.sql$/.test(name))
      .sort()) {
      const source = await readFile(new URL(name, directory), "utf8");
      const hash = createHash("sha256").update(source).digest("hex");
      const existing = await client.query<{ sha256: string }>(
        "SELECT sha256 FROM vq_schema_migrations WHERE name = $1",
        [name],
      );
      if (existing.rows.length) {
        if (existing.rows[0].sha256 !== hash)
          throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await client.query(source);
      await client.query(
        "INSERT INTO vq_schema_migrations(name, sha256) VALUES ($1, $2)",
        [name, hash],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
