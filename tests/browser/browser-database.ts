import { createDatabase } from "../../packages/database/src/index";

// These suites create accounts. Require the disposable local database explicitly.
export function browserDatabase() {
  const url = new URL(process.env.TEST_DATABASE_URL ?? "invalid:");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.pathname !== "/vq_test"
  ) {
    throw new Error(
      "Browser writes require TEST_DATABASE_URL for local vq_test.",
    );
  }
  return createDatabase(url.href);
}
