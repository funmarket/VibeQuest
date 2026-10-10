# Railway deployment prerequisites — planned, not provisioned

Railway is the intended hosting platform. At D01 preparation, only local source/configuration was inspected; its account/resource and remote-state limitations below are historical. S00 source preservation completed on 10 October 2026: public [funmarket/VibeQuest](https://github.com/funmarket/VibeQuest), development branch `phase-0-foundation`, initial commit `1e95baab86b7252cdd68f3d747824271631072f6`, exactly 232 approved files and thirteen migrations. [GitHub Actions run 38052826906](https://github.com/funmarket/VibeQuest/actions/runs/38052826906) succeeded. No `main` branch was created. Publication is not production or Railway acceptance. Railway staging creation is a separate bounded packet; no application service, database, storage or deployment is established by this document. The application is not certified production-ready.

## Required shared services and unresolved topology

| Responsibility                            | Required preparation / current limit                                                                                                                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical Web frontend and Telegram entry | Deploy the existing Next implementation with shared routes/components/client/styles. Decide one entry origin versus separately configured origins without copied product code                                                                 |
| Shared Fastify API                        | One backend and canonical actor/domain owners. Current `main.ts` binds `127.0.0.1`; Railway reachability/binding and runtime start/build/port configuration require separately authorized preparation                                         |
| PostgreSQL/PostGIS                        | One business authority, PostGIS support, appropriate migration and runtime roles, connection security, bounded pooling, backups and recovery. Keep disposable tests separate                                                                  |
| Global Media storage                      | Current `.local/media` is local filesystem storage. Choose a suitable durable shared/object-storage adapter through existing ports; provider and credentials remain unselected. Prove cross-instance/restart byte access and private delivery |
| Background execution                      | Current cleanup is a 60-second timer inside each API instance. Decide worker placement/claiming/concurrency/retry/operator handling without a second Media owner. Future outbox/expiry/delivery jobs belong to their approved owners          |
| Host/provider configuration               | Verified Telegram Identity/launch/linking, authorized bot credentials, delivery channels, maps and any payment/email provider prerequisites remain future packet gates                                                                        |

Do not copy another application's service layout or switch VibeQuest to Vite/Express/Prisma. No Firebase, Firestore or Supabase backend. No storage provider, service count or separate Telegram deployment is selected here.

## Configuration and security gates

Map the current variables documented in [local development](local-development.md) to the chosen services. Keep `DATABASE_URL` and future bot/provider credentials server-side; `NEXT_PUBLIC_*` variables are browser-visible and must contain no secrets. Use platform-managed secrets without committing values. Set explicit API destination and allowed mutation Origins; verify HTTPS Secure-cookie/session behavior in ordinary browsers and actual Telegram clients. Resolve CORS/proxy/origin/link transport choices in R38/R49 rather than disabling protections.

Prepare least-privilege database roles, authorized migration execution, unchanged migration checksums, health probes, graceful shutdown and bounded connection/request capacity. Current `/health/live` and `/health/ready` are available, but neither proves provider delivery or stored-file health.

## Durability and acceptance before rollout

Require backups/restore testing for database and managed Media, retention/access policy, worker crash/retry/exhaustion recovery, orphan/interrupted-processing handling, multiple-instance consistency, reference/deletion races and observability without logged credentials. Define rollback and migration compatibility; do not reset production records.

R49 owns the production-preparation decisions. R50 requires genuine device/provider acceptance, complete product dispositions, reproducible installation/checks and the runbook. Verify Web/Telegram canonical accounts, permissions and shared records, including denied/revoked capabilities, deep links and background/resume. Do not call Chrome fixtures genuine Telegram acceptance.

GitHub source preservation is completed at the commit above. Stable `main` promotion, Railway service provisioning and production rollout remain separate decisions/authorizations. The development branch is `phase-0-foundation`; `main` is reserved for accepted stable application. Follow the [master plan](../product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md) and the latest explicit packet authority. An empty staging project, if separately created, does not resolve these deployment prerequisites.
