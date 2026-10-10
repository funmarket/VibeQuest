import { createDatabase } from "@vq/database";
import { buildApi } from "./app";
import { parseApiEnvironment } from "./environment";
import { fileURLToPath } from "node:url";

const { databaseURL, port } = parseApiEnvironment(process.env);
const database = createDatabase(databaseURL);
const app = buildApi(database.repository, {
  logger: true,
  readiness: database.readiness,
  identity: database.identity,
  profiles: database.profiles,
  businesses: database.businesses,
  activities: database.activities,
  events: database.events,
  social: database.social,
  media: database.media,
  mediaRoot:
    process.env.MEDIA_LOCAL_ROOT?.trim() ||
    fileURLToPath(new URL("../../../.local/media/", import.meta.url)),
  allowedOrigins: (
    process.env.WEB_ORIGINS ?? "http://127.0.0.1:3000,http://localhost:3000"
  ).split(","),
  secureCookies: process.env.NODE_ENV === "production",
});
app.addHook("onClose", async () => {
  await database.close();
});
let closing = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    void app.close().catch((error: unknown) => {
      app.log.error({ err: error }, "Shutdown failed");
      process.exitCode = 1;
    });
  });
try {
  await app.listen({ host: "127.0.0.1", port });
} catch (error) {
  app.log.error({ err: error }, "Startup failed");
  await app.close();
  process.exitCode = 1;
}
