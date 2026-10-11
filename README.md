# VibeQuest — local reconstruction in progress

VibeQuest is a phone-first local discovery and social product for places, activities, events, sharing, people and communities. The clean reconstruction preserves the original product while replacing defective architecture and simulated persistence.

**HOME → EXPLORE → central-heart SHARE → VIBE → PURSE** remain the five destinations. One Next.js frontend serves ordinary Web and Telegram entry, one Fastify API owns business execution, and PostgreSQL/PostGIS is the canonical database. Telegram authentication/linking and genuine host acceptance remain unfinished. Publication and infrastructure operations require their own bounded authority; this README grants none.

Implemented locally: published Places reads; Web registration/login/logout with database sessions; authenticated profile editing/completion; shared image upload/processing/private and public delivery with domain-owned attachments; canonical profile preference menu; four locales and RTL. Activities support real posting/scheduling, public Home cards, owned images, expand/collapse, owner edits/cancellation, reviews, saving and map navigation. Official Events support approved-owner hosting, scheduling, images, public discovery, edits/cancellation, RSVP intention, reviews, saving and directions. Social Graph supports real follow/unfollow, Orbit/Echo, mutual state and public basic profiles; Profile photographs stay private. Feeds, other social workflows, financial capabilities and the full original-product reconstruction remain unfinished.

Account -> Business management supports persisted business applications, owner invitations and membership acceptance. New businesses remain pending. Review operations require the scoped server privilege `business.review`; no real administrator has been activated. Approved owners can host Official Events; ordinary membership does not grant it. Advanced business management, administrator activation and delegation policy remain unfinished. Migrations extend through `0013_social_follows`.

Shared scrollbars use transparent tracks and thin translucent thumbs in both themes. Media uploads admit two concurrent operations per service instance; busy requests remain retryable without consuming their intents.

## Local setup

Requires Node 24, pnpm 11.1.1 and a separately configured PostgreSQL/PostGIS database. Current source pins Next 16.4.0, React 19.3.0, TypeScript 6.0.3 and Fastify 5.12.5.

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd hooks:install
# Export the explicit environment described in the local development guide.
# Confirm the authorized development database before running:
pnpm.cmd db:migrate
pnpm.cmd dev
```

These commands are derived from manifests; installation/migration/startup were not executed in D01. The API does not implicitly load the root `.env.example`. See [local development](docs/operations/local-development.md) for variable names, database prerequisites, checks, browser fixture limits and startup/build details.

Image files are stored in `.local/media` by default, independent of the working directory; `MEDIA_LOCAL_ROOT` can select another absolute directory. All API instances using this database must use the same storage root. PNG/JPEG/WebP uploads are decoded and normalized to WebP with thumbnails. Private images require a real session. Replaced/detached Profile photos, Activity images and Event images have transactional retirement jobs; a 60-second worker removes their files and expires abandoned/failed upload intents. Failed cleanup retries with backoff up to eight failures, then remains stored for operator recovery. Cloud storage, camera/audio/video acceptance, ready-orphan/interrupted-processing recovery and distributed-worker acceptance are unfinished.

Activities use completed user profiles, independently of Business/Event hosting. Scheduled activities become live according to the PostgreSQL clock. The reference establishes no automatic duration, capacity or participation roster; no expiry, ticketing or attendee privileges are invented. Cancelled records leave public feeds and retain details/attachments. Saving persists a bookmark; notification delivery and reward/boost policies remain unavailable. See [Activities implementation](docs/operations/activities-implementation.md).

Official Events keep their separate blue Home panel and approved Business hosting authority. RSVP denotes an intention to attend; physical attendance, tickets and notification delivery are not implemented. See [Events implementation](docs/operations/events-implementation.md).

Register through the account button, then edit your profile. A name and biography determine profile completion on the server. No business/admin privileges are self-granted. Email verification/recovery delivery and Telegram account linking are not implemented; the UI does not claim a verification email was sent.

## Verification

```powershell
pnpm.cmd check
```

Root `check` runs format/lint/typecheck/architecture/unit tests and Web build; API starts through `tsx`. Integration/browser suites are separate and mutate fixtures/databases. Some browser tests hardcode the historical development target. Use the [local verification guide](docs/operations/local-development.md) before executing them; D01 ran no database/browser tests. Fixture images and SDK mocks are not real camera/proximity/Telegram acceptance.

## Source authority and handoff

`vibequest last` is primary for product mechanics/content; `vibequestbest` supplies global dark/brand direction; `VQ` is tertiary. Feature-specific colors and Product Owner decisions override generic styling. Original reference projects remain read-only. Some historical product documents still contain superseded authority/timer statements; the latest owner directive controls.

See [reconstruction checkpoint](docs/operations/reconstruction-progress.md) for implemented files, verification and unfinished work. The 215-record product inventory is an acceptance inventory, not a completed-feature count. This application is not production-ready.

## Repository structure and documentation

| Path                                                                                  | Responsibility                                                                                 |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/web`                                                                            | Next routes, shared shell, feature presentation, host adapter, four locales and RTL            |
| `apps/api`                                                                            | Fastify adapters, session/validation boundary, composition root and local Media infrastructure |
| `packages/identity`, `profile`, `business`, `activities`, `events`, `social`, `media` | Existing canonical application/domain owners and ports                                         |
| `packages/contracts`, `packages/api-client`                                           | Typed platform-neutral schemas and shared HTTP client; current Places read port                |
| `packages/database`                                                                   | Owner-specific PostgreSQL adapters, PostGIS Places reader and thirteen migrations              |
| `packages/ui`                                                                         | Shared theme policy/provider and semantic tokens                                               |
| `tests/unit`, `tests/integration`, `tests/browser`                                    | Invariant/contract checks, real PostgreSQL/API tests and browser journeys                      |
| `tooling/architecture`                                                                | Dependency/cycle/layer and known table-ownership checks                                        |
| `docs`, `.github/workflows`                                                           | Product/architecture/operations evidence and checked-in source-check workflow                  |

Start with [runtime architecture](docs/architecture/overview.md), [domain ownership](docs/architecture/domain-ownership.md), [product requirements](docs/requirements/product-requirements.md), [technical requirements](docs/requirements/technical-requirements.md) and the [master reconstruction plan](docs/product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md). The plan retains 50 packets; requirements do not duplicate its 215 historical acceptance records. Historical implementation reports remain evidence with their original dates, not fresh certification.

## Publication and hosting intentions

S00 source preservation completed on 10 October 2026: public [funmarket/VibeQuest](https://github.com/funmarket/VibeQuest), development branch `phase-0-foundation`, initial commit `1e95baab86b7252cdd68f3d747824271631072f6`, exactly 232 approved files and thirteen migrations. [GitHub Actions run 38052826906](https://github.com/funmarket/VibeQuest/actions/runs/38052826906) succeeded. No `main` branch was created. Publication is not production or Railway acceptance. `main` remains reserved for the accepted stable application.

Railway is intended for the shared Web/API/PostgreSQL/PostGIS and required Media/worker infrastructure. Service topology, storage and provider choices remain open; the current local storage and loopback runtime are not production acceptance. See [Railway prerequisites](docs/operations/railway-deployment-requirements.md). Hosting remains a separate operation; service provisioning and application rollout are not established by source publication.
