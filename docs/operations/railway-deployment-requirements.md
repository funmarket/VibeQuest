# Railway deployment prerequisites — planned, not provisioned

Railway is the intended hosting platform. At D01 preparation, only local source/configuration was inspected; its account/resource and remote-state limitations below are historical. S00 source preservation completed on 10 October 2026: public [funmarket/VibeQuest](https://github.com/funmarket/VibeQuest), development branch `phase-0-foundation`, initial commit `1e95baab86b7252cdd68f3d747824271631072f6`, exactly 232 approved files and thirteen migrations. [GitHub Actions run 38052826906](https://github.com/funmarket/VibeQuest/actions/runs/38052826906) succeeded. No `main` branch was created. Publication is not production or Railway acceptance. Railway staging creation is a separate bounded packet; no application service, database, storage or deployment is established by this document. The application is not certified production-ready.

## Required shared services and unresolved topology

| Responsibility                            | Required preparation / current limit                                                                                                                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical Web frontend and Telegram entry | Deploy the existing Next implementation with shared routes/components/client/styles. Decide one entry origin versus separately configured origins without copied product code                                                                   |
| Shared Fastify API                        | One backend and canonical actors. `main.ts` binds `0.0.0.0` in production, local loopback otherwise. Railway start, port and reachability remain unverified.                                                                                    |
| PostgreSQL/PostGIS                        | One business authority, PostGIS support, appropriate migration and runtime roles, connection security, bounded pooling, backups and recovery. Keep disposable tests separate                                                                    |
| Global Media storage                      | Railway Storage Buckets are selected by A6-MEDIA-01; the adapter uses the existing MediaStorage port. Local development retains `.local/media`. Live cross-instance/restart byte access and private delivery remain deployment acceptance gates |
| Background execution                      | Current cleanup is a 60-second timer inside each API instance. Decide worker placement/claiming/concurrency/retry/operator handling without a second Media owner. Future outbox/expiry/delivery jobs belong to their approved owners            |
| Host/provider configuration               | Verified Telegram Identity/launch/linking, authorized bot credentials, delivery channels, maps and any payment/email provider prerequisites remain future packet gates                                                                          |

Do not copy another application's service layout or switch VibeQuest to Vite/Express/Prisma. No Firebase, Firestore or Supabase backend. The latest A6-MEDIA-01 packet selects Railway Storage Buckets; service count and separate Telegram deployment remain unresolved.

## Configuration and security gates

Map the current variables documented in [local development](local-development.md) to the chosen services. Keep `DATABASE_URL` and future bot/provider credentials server-side; `NEXT_PUBLIC_*` variables are browser-visible and must contain no secrets. Use platform-managed secrets without committing values. Set explicit API destination and allowed mutation Origins; verify HTTPS Secure-cookie/session behavior in ordinary browsers and actual Telegram clients. Resolve CORS/proxy/origin/link transport choices in R38/R49 rather than disabling protections.

Prepare least-privilege database roles, authorized migration execution, unchanged migration checksums, health probes, graceful shutdown and bounded connection/request capacity. Current `/health/live` and `/health/ready` are available, but neither proves provider delivery or stored-file health.

## Durability and acceptance before rollout

Require backups/restore testing for database and managed Media, retention/access policy, worker crash/retry/exhaustion recovery, orphan/interrupted-processing handling, multiple-instance consistency, reference/deletion races and observability without logged credentials. Define rollback and migration compatibility; do not reset production records.

R49 owns the production-preparation decisions. R50 requires genuine device/provider acceptance, complete product dispositions, reproducible installation/checks and the runbook. Verify Web/Telegram canonical accounts, permissions and shared records, including denied/revoked capabilities, deep links and background/resume. Do not call Chrome fixtures genuine Telegram acceptance.

GitHub source preservation is completed at the commit above. Stable `main` promotion, Railway service provisioning and production rollout remain separate decisions/authorizations. The development branch is `phase-0-foundation`; `main` is reserved for accepted stable application. Follow the [master plan](../product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md) and the latest explicit packet authority. An empty staging project, if separately created, does not resolve these deployment prerequisites.

## Railway Media bucket configuration - A6-MEDIA-01

The server selects one canonical MediaStorage implementation at startup. Local development defaults to local storage and honors `MEDIA_LOCAL_ROOT`; production (`NODE_ENV=production`) and Railway environments (`RAILWAY_ENVIRONMENT_NAME` present) require explicit `MEDIA_STORAGE=railway`. Bucket selection never falls back to local files. Missing settings, malformed HTTPS base endpoints, invalid bucket names or URL-style flags fail before database creation or listening. Startup performs no remote bucket probe. This source integration does not provision or deploy anything.

Use the actual S3 bucket name and credentials from the later authorized environment's bucket. `MediaBucket` below is an example Railway resource display name, not an existing resource. Configure these **server-only** service variables through Railway references at the later deployment gate:

| Application variable             | Railway reference / value                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `MEDIA_STORAGE`                  | `railway`                                                                                                              |
| `MEDIA_BUCKET_ENDPOINT`          | `${{MediaBucket.ENDPOINT}}`                                                                                            |
| `MEDIA_BUCKET_REGION`            | `${{MediaBucket.REGION}}` (Railway documents `auto`)                                                                   |
| `MEDIA_BUCKET_NAME`              | `${{MediaBucket.BUCKET}}` - not `RAILWAY_BUCKET_NAME`                                                                  |
| `MEDIA_BUCKET_ACCESS_KEY_ID`     | `${{MediaBucket.ACCESS_KEY_ID}}`                                                                                       |
| `MEDIA_BUCKET_SECRET_ACCESS_KEY` | `${{MediaBucket.SECRET_ACCESS_KEY}}`                                                                                   |
| `MEDIA_BUCKET_FORCE_PATH_STYLE`  | `false` for current virtual-hosted buckets; `true` only if the bucket Credentials tab specifies legacy path-style URLs |

These `MEDIA_*` names are application configuration, not Railway-managed defaults. Never use `NEXT_PUBLIC_*` for them. The [Railway bucket documentation](https://docs.railway.com/guides/storage-buckets) specifies private buckets, a base endpoint, region and S3 compatibility; match the URL style shown in the bucket Credentials tab.

The AWS SDK S3 client communicates with Railway using awaited PutObject/GetObject/DeleteObject requests. Requests have a five-second connection timeout, ten-second request/socket timeouts and at most three SDK attempts. Keys are `media/<validated lowercase UUID>/<image|thumbnail>.webp`; filenames, personal data and user-supplied URLs do not control keys. Reads return stored bytes through the existing Media delivery routes. Confirmed NoSuchKey reads become MEDIA_NOT_FOUND; access errors, missing buckets and service failures propagate. Deletes remove both managed variants; missing keys are idempotent, while partial/genuine failures retain canonical retry work. No public ACL or presigned delivery is introduced. Readiness, visibility, feature attachments, retirement and the API cleanup scheduler remain owned by their existing layers.

Tests use the real SDK against loopback S3 request fixtures plus isolated PostgreSQL; no live credentials or remote objects are used. Actual Railway upload/read/delete, restart/multiple-instance availability, credential distribution and backup/restore remain acceptance work for a separately authorized deployment gate. Existing local bytes are not automatically migrated by changing the backend; any populated environment needs a separately scoped migration before switching storage.
