# R07 — Persistent Social Content and Gossip

Foundation: `7465661d07c8e0ff52ed5bf7d8a1a4b182c8aef4`.
Implementation PR: [#27](https://github.com/funmarket/VibeQuest/pull/27).
This record supersedes the initial author-text-only implementation evidence.
It records source/local verification, not a merge, deployment or master-plan advancement.

## Authority and reconciliation

The R07 implementation packet, the master plan's D02 approval of 25 October 2026,
and the owner's subsequent explicit R07 decisions govern this implementation.
The original primary `vibequestbest/src/components/vibe/VibeComposer.tsx` supplies
composer mechanics; legacy persistence, identity simulation and geographic
claims were not copied.

The earlier open-decision register is closed by the owner's clarifications:

| Decision             | Binding outcome                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Relationship changes | Current follow/block state authorizes every new read, interaction and attachment request.                                                                                |
| Distribution         | My Network publishes chronological own/followed Gossip. Local Vibes remains visibly disabled and is never persisted as a working destination. Visibility is independent. |
| Audience editing     | Only the author can change Public/Followers-only, using the current version. Subsequent access follows the persisted audience.                                           |
| Report fields        | Exactly one of the eight approved predefined reasons; optional explanation. All labels localized in EN/FR/ES/AR.                                                         |
| Duplicates           | One active report per authenticated reporter/target; repeated active submissions return the same case without changing its deadline or snapshot.                         |
| Pending retention    | At most 30 days from submission. Expiry closes the pending report and deletes its evidence, reason and explanation, without hiding the target.                           |
| Decision retention   | An authorized decision before the pending deadline starts 30 days of evidence retention from the decision timestamp.                                                     |
| Evidence             | Text and metadata only, accessible only through dedicated moderator checks. No image snapshot, Media ID or delivery URL is copied into evidence.                         |
| Authority            | Identity defines `content.moderate` separately from `business.review`. No migration or application endpoint grants it.                                                   |

No R07 policy choice remains open in this implementation. Closed-case reopening
or resubmission is not introduced: a further attempt returns `REPORT_CLOSED`.
There is no administrator/bootstrap/permission-assignment workflow. Real operator
assignment requires separate owner authorization; ordinary accounts cannot perform
moderator operations. Test grants exist only in explicitly isolated fixtures and
are removed with those fixtures.

## Canonical ownership and execution

- `@vq/content` owns post lifecycle/audience, comments/tombstones, likes, reports,
  moderation state, evidence and the Gossip reader. Its repository uses only
  Content tables and explicit Identity/Media foreign-key references.
- Social Graph owns follows, blocks and relationship facts. Blocking is mutual for
  Gossip access, atomically removes both follows and prevents follows while either
  block is active. Unblocking removes only the actor's block and never restores
  deleted follows. Content consumes Graph ports, not Graph tables.
- Graph's scoped relationship lock serializes access with follow/block mutations.
  Relationship lock waiters use a separate small pool so they cannot exhaust the
  Content/data pool while an authorized operation completes. Content mutations
  additionally lock/check the current post version.
- Identity supplies the actor from its existing session and checks the dedicated
  moderation privilege on each moderator operation. Business review is insufficient.
- Profile supplies only its existing four-field public projection. Current profile
  changes are reflected on retrieval; private photos/interests/contact fields are
  not copied into Content.
- Media owns image processing, byte storage, delivery and retirement. Fresh
  `content` uploads are the only image references accepted by Gossip. Existing
  public uploads, private Profile images and foreign images are rejected.

## Access and attachment lifecycle

Public is the default post audience. Guests can read public records; authenticated
Gossip contains own/followed records. Followers-only reads require the author or a
current follower. Active blocks, hidden content, disabled authors and deletion
prevent ordinary delivery. Mutations never trust client actor IDs or timestamps.

Content images have no generic public/owner URL. Delivery requires a `postId` plus
current Content/Graph authorization and a matching attachment reference. Every
content-image response is `private, no-store`; bare IDs and copied URLs cannot
bypass an audience change. Moderator permission alone does not grant image access.
Files already downloaded cannot be recalled. A separately authorized reference to
the same image is evaluated in its own post context.

Author mutations are transactional and versioned. Ordinary reads exclude deleted
records; an explicit author-only deleted list supports restoration before 11 days.
Referenced images remain protected by foreign keys during that window. Expiry or
attachment replacement queues durable Content retirement work; Media refuses to
retire a still-referenced object. The final unlink permits actual byte removal.
Comments have no restoration operation. Deleted/hidden comments with surviving
replies retain a text-free, author-free tombstone; empty deleted leaves disappear.
Likes use a unique post/user row and idempotent desired-state writes, awarding no points.

## Reporting, review and retention

A report requires a currently authenticated authorized viewer of the target post
and, for a comment, a live comment on that post. The API validates the eight stable
reason identifiers and an optional explanation bounded to 1,000 JavaScript code
units, following existing review/comment validation conventions. A unique partial
index plus transactional target locking prevents duplicate active reports.

Submission snapshots the actual target text and bounded metadata in Content storage.
The reporter receives a receipt, never retained evidence. Reporting performs no
visibility change. Only `content.moderate` permits case listing, evidence retrieval
and versioned hide/remove decisions after review. Hidden/removed targets cannot
be exposed or restored through ordinary reads, interactions or Media requests.

Pending and decision deadlines use the database clock. The decision transaction
rechecks the pending deadline at its final write, rolling back any target change
if the deadline elapsed while waiting for a lock. Reading a case or repeating a
report never extends retention. Expired evidence is inaccessible immediately at
the deadline; the Content minute worker erases due snapshot/reason/explanation
payloads in bounded batches. Minimal closed-case headers remain for the recorded
decision and anti-reopening/idempotency behavior; they are not returned as evidence.
Evidence expiry never reverses an authorized moderation decision.

## Presentation and API

The VIBE Share capsule opens the real composer. Its 280-code-unit limit, warning
at 30 remaining, six controls from the twelve-emoji catalog, selection/insertion
behavior, optional 40-code-unit authored location label and image preview/removal
follow the approved source mechanics. Preset names are explicitly chosen labels,
not verified coordinates. My Network must remain selected to publish; Local Vibes
is disabled, unchecked and explained. The separate Public/Followers-only selector
also works when editing.

Publication waits for genuine upload/write success, then reloads canonical Gossip.
Failures preserve the draft and retire newly uploaded, unattached media; reference
protection prevents uncertain responses from deleting a committed attachment.
Guests use the existing contextual Identity form without silently replaying a write.
Cards provide real comments/replies, likes, edit/delete/restore, report and block/
unblock flows. Moderator review is visible only to accounts with the dedicated
capability and renders text/metadata, never evidence images.

Author routes remain below `/v1/content/me/posts`; authorized readers/interactions
and reporting are below `/v1/content/posts/:id`. Gossip uses `/v1/content/feed`.
Moderator capability, case and evidence routes are below `/v1/content/moderation`.
All DTOs and typed clients use strict shared contracts. Private responses are
no-store, mutations require the existing approved Origin, and keyset pagination
preserves PostgreSQL microseconds plus UUID ordering for tied timestamps.

Migrations 0015–0019 add only Content persistence/lifecycle, Graph blocks, the
Media content scope and the dedicated Identity permission definition. The lockfile
adds workspace links only; external dependency versions remain pinned.

## Verification

- 83 unit tests across 18 files passed.
- 52 focused integration tests across seven files passed against isolated local
  `vq_test`, covering Content/Graph/Profile/Media/Identity, transitions, spoofing,
  privacy, concurrency, pagination, reference safety and both retention clocks.
- Final formatting, lint, TypeScript and architecture checks passed.
- Production build passed, retaining the existing Next.js 16.4.0 security advisory.
  The first advisory stop required an unchanged retry; no dependency upgrade was made.
- Twelve unique Chrome browser tests passed across focused runs, covering real image publication, failed-publication cleanup, reporting, authorized moderation, author lifecycle, Profile and capsule regressions. Both composer tests passed again after the final phone-header and localized image-picker correction.
- EN/FR/ES/AR light/dark phone screenshots were inspected; RTL, width and visible header publication controls were verified. Browser runs use a local API and isolated PostgreSQL, not staging writes or simulated publication.
- The complete R07 diff was reviewed. Exact-final-head CI results are recorded in PR #27 after pushing; local tests do not substitute for CI.

## Release boundary

No master-plan checkpoint edit, Railway mutation, production migration, merge,
deployment or R08–R10/R14/R17/R42 implementation is included. The main checkout's
pre-existing `next-env.d.ts` change is preserved. No real account was granted the
moderation permission. Local browser evidence does not establish physical-phone,
Telegram hardware, staging deployment or production acceptance.

## Full diff inventory

- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/main.ts`
- `apps/api/src/modules/content/http.ts`
- `apps/api/src/modules/media/http.ts`
- `apps/api/src/modules/social/http.ts`
- `apps/web/src/features/content/composer.tsx`
- `apps/web/src/features/content/content.css`
- `apps/web/src/features/content/gossip.tsx`
- `apps/web/src/features/content/moderation.tsx`
- `apps/web/src/features/vibe/vibe-page.tsx`
- `apps/web/src/i18n/locales/ar.json`
- `apps/web/src/i18n/locales/en.json`
- `apps/web/src/i18n/locales/es.json`
- `apps/web/src/i18n/locales/fr.json`
- `docs/operations/content-implementation.md`
- `packages/api-client/src/content.ts`
- `packages/api-client/src/index.ts`
- `packages/api-client/src/media.ts`
- `packages/api-client/src/social.ts`
- `packages/content/package.json`
- `packages/content/src/application/content.ts`
- `packages/content/src/domain/invariants.ts`
- `packages/content/src/domain/ports.ts`
- `packages/content/src/index.ts`
- `packages/contracts/src/content.ts`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/media.ts`
- `packages/contracts/src/social.ts`
- `packages/database/migrations/0015_content_posts.sql`
- `packages/database/migrations/0016_content_audiences.sql`
- `packages/database/migrations/0017_content_permission.sql`
- `packages/database/migrations/0018_content_emoji.sql`
- `packages/database/migrations/0019_content_moderation.sql`
- `packages/database/package.json`
- `packages/database/src/content/moderation.ts`
- `packages/database/src/content/repository.ts`
- `packages/database/src/index.ts`
- `packages/database/src/social/repository.ts`
- `packages/identity/src/application/accounts.ts`
- `packages/identity/src/domain/ports.ts`
- `packages/media/src/application/media.ts`
- `packages/media/src/domain/ports.ts`
- `packages/social/src/application/social.ts`
- `packages/social/src/domain/invariants.ts`
- `packages/social/src/domain/ports.ts`
- `pnpm-lock.yaml`
- `tests/browser/content.spec.ts`
- `tests/browser/gossip-failure.spec.ts`
- `tests/browser/gossip.spec.ts`
- `tests/integration/content-audience.test.ts`
- `tests/integration/content-moderation.test.ts`
- `tests/integration/content.test.ts`
- `tests/unit/content-client.test.ts`
- `tests/unit/content.test.ts`
- `tests/unit/locales.test.ts`
- `tooling/architecture/database-ownership.ts`
