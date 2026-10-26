import { createDatabase } from "@vq/database";
import { buildApi } from "./app";
import { parseApiEnvironment } from "./environment";
import { parseMediaStorageEnvironment } from "./modules/media/infrastructure/storage-configuration";
import { createRailwayMediaStorage } from "./modules/media/infrastructure/railway-storage";
import { createLocalMediaStorage } from "./modules/media/infrastructure/local-storage";

const { databaseURL, port, host } = parseApiEnvironment(process.env);
const storage = parseMediaStorageEnvironment(process.env);
const mediaStorage =
  storage.backend === "railway"
    ? createRailwayMediaStorage(storage)
    : createLocalMediaStorage(storage.directory);
const database = createDatabase(databaseURL);
const app = buildApi(database.repository, {
  logger: true,
  readiness: database.readiness,
  identity: database.identity,
  geo: database.geo,
  profiles: database.profiles,
  businesses: database.businesses,
  activities: database.activities,
  events: database.events,
  social: database.social,
  content: database.content,
  media: database.media,
  mediaStorage,
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
  await app.listen({ host, port });
} catch (error) {
  app.log.error({ err: error }, "Startup failed");
  await app.close();
  process.exitCode = 1;
}
