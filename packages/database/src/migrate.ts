import pg from "pg";
import { migrate } from "./migration-runner";

const url = process.env.DATABASE_URL;
if (!url || !["postgres:", "postgresql:"].includes(new URL(url).protocol))
  throw new Error("DATABASE_URL must be a PostgreSQL URL.");
const pool = new pg.Pool({
  connectionString: url,
  connectionTimeoutMillis: 3000,
});
try {
  await migrate(pool);
  console.info("Database migrations applied.");
} finally {
  await pool.end();
}
