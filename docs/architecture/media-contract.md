# Shared Media contract

Current source baseline: 10 October 2026. Image upload/processing/delivery and durable cleanup are implemented. Global Media is the only binary owner; it is not a finished video/audio/capture or distributed storage service.

## Current owner and pipeline

`packages/media/src/application/media.ts` uses repository, storage and image-processor ports. The PostgreSQL adapter is `packages/database/src/media/repository.ts`; Fastify routes, local filesystem storage and Sharp processing are under `apps/api/src/modules/media`. Typed contracts/client live in their existing shared packages.

Authenticated intent with public/private visibility → owner-only claim → validated bytes/format → processing → image and thumbnail writes → durable ready metadata → feature-authorized attachment → Media-controlled delivery. Failed processing creates failed state/cleanup work; the UI must distinguish pending, processing, ready, failed and deleted rather than claim success before acceptance.

Current limits: two concurrent uploads per Media service instance, 8 MiB maximum input, PNG/JPEG/WebP with matching signature/MIME, one frame and 20-million-pixel decode limit. Sharp rotates/normalizes and emits WebP inside 2048×2048, plus a thumbnail inside 320×320 without enlargement. These are existing limits, not permission to add formats or change proof rules. Busy uploads are retryable without claiming the intent.

Media delivers ready public objects without a session and private objects only to their owner. Private Profile photographs are not public author avatars. Activities/Events require ready, public objects belonging to the authenticated author; a foreign image ID cannot establish authority.

## Relationship and deletion ownership

Profile, Activities and Events own their attachment tables, feature permissions and transactional retirement requests. Media owns object metadata, managed bytes, variants, access enforcement and cleanup/retry state. An attachment grants neither identity proof nor feature membership. Canonical foreign keys protect attached objects from deletion; owning use cases delegate retirement to Media rather than mutate files.

`apps/api/src/app.ts` runs one non-overlapping cleanup interval per API instance every 60 seconds: Profile/Activity/Event retirement processing followed by Media cleanup. Failed file removals remain queued with backoff; the current repository retains exhausted jobs after eight failures for operator recovery. This is durable retry state, not guaranteed distributed-worker correctness.

`MEDIA_LOCAL_ROOT` overrides the default workspace `.local/media` directory. All API instances using a database need consistent byte access and the same storage namespace. Merely sharing PostgreSQL does not make independent local files available across hosts.

## Explicit unfinished capabilities

Video/audio processing, real camera/microphone acceptance, entity-scoped restricted delivery beyond owner-private/public images, capture provenance, biometric/liveness/proximity verification, content scanning and full ready-orphan/interrupted-processing recovery remain unfinished. Do not claim these from the image pipeline or fixture uploads. Retention, audience and filtered/dual-frame proof rules remain packet decisions; client captions/GPS do not independently prove them.

R12/R13 and relevant feature packets extend the existing owner/ports; R49 establishes distributed storage/worker/restart/retry acceptance under separate authority. No cloud/object-storage provider is selected by this document, and no second Telegram file pipeline is permitted. See [implementation checkpoint](../operations/reconstruction-progress.md), [Railway requirements](../operations/railway-deployment-requirements.md) and the [master plan](../product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md).
