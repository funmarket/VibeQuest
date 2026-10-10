export function parseApiEnvironment(
  environment: Record<string, string | undefined>,
) {
  const databaseURL = environment.DATABASE_URL;
  let validURL: boolean;
  try {
    validURL =
      !!databaseURL &&
      ["postgres:", "postgresql:"].includes(new URL(databaseURL).protocol);
  } catch {
    validURL = false;
  }
  if (!validURL || !databaseURL)
    throw new Error("DATABASE_URL must be a PostgreSQL URL.");
  const port = Number(environment.PORT ?? 4100);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be a valid TCP port.");
  return { databaseURL, port };
}
