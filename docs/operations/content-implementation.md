# R07 Social Content — partial author lifecycle

Foundation inspected: `7465661d07c8e0ff52ed5bf7d8a1a4b182c8aef4`.
Authority: R07 implementation packet and the master plan's approved D02 record
dated 25 October 2026. This evidence does not advance the master-plan checkpoint.

## Implemented boundary

`@vq/content` is the canonical Social Content owner, separate from Social Graph.
This partial implementation supplies actual PostgreSQL-backed **author-only text
post operations**. It does not complete R07 publication or Gossip acceptance.

- Strict text validation uses the original JavaScript string length of at most
  280, including surrogate pairs; the authored location label is limited to 40.
- Public is the default stored audience; Followers-only can be recorded when
  creating a post. Neither value grants another reader access in this subset.
- Identity's existing server session supplies the actor. Client actor IDs,
  attachment fields and audience edits are rejected by the author text routes.
- Authors can create, read, list, edit, delete and restore their own records.
  Foreign records return 404. Guests receive 401; mutations require an approved
  Origin. All author responses use `Cache-Control: no-store`.
- Mutations lock the record and compare its version within a transaction.
  Concurrent edits cannot silently overwrite one another.
- Ordinary reads exclude deleted posts. An explicitly requested author-only
  deleted list exposes recoverable records for restoration before 11 days.
- Restoration checks database time and the deletion deadline. A minute worker
  permanently deletes expired ordinary text in batches of up to 1,000; expiry
  failures are logged and retried on the next tick. This subset has no attachment
  references, reports or moderation evidence to purge.
- Pagination orders by creation timestamp and UUID, preserving PostgreSQL
  microseconds in cursors. Lists contain at most 20 records.

## API and persistence

All routes are below `/v1/content/me/posts`: POST/GET collection, GET/PUT/DELETE
`/:id`, and POST `/:id/restore`. Edits contain text, location label and version;
deletion/restoration contain version. The existing typed client exports the
corresponding author operations with strict input/output parsing and timeouts.

Migration `0015_content_posts.sql` introduces only the Content-owned post table,
indexes and a UTF-16 length constraint function. The canonical Identity foreign
key cascades account deletion. Database composition/readiness and the architecture
namespace gate include Content. The lockfile adds workspace links only.

The image-capable input contract captures approved shape/length requirements;
it is **not** a Media authorization capability and is not accepted by these text
routes. No image processing, storage, public delivery or attachment link changes
were made. Existing Profile privacy and Graph ownership remain in place.

## Unresolved decisions and excluded acceptance

The packet and D02 explicitly require identifying unspecified consequential
mechanics rather than choosing defaults. Questions were presented to the owner:

1. Whether follower access, including image delivery, uses current relationships
   on every read, and the exact follow/block transition contract.
2. How Local Vibes / My Network distribution maps to Public / Followers-only.
3. Whether post audience may change and how existing attachment references and
   delivery follow a transition.
4. Report fields, duplicate-report handling, start of the 30-day evidence clock,
   evidence snapshots/attachments and permitted evidence access.

Current Identity source has only Business review privilege, not an approved
Social moderator capability. No privilege was invented or granted. Moderator
decisions and retained-evidence access require a legitimate trusted authority.

Consequently this PR does not implement or claim public/follower Gossip readers,
blocking, attachment publication/delivery, comments/reactions, reports/moderation,
30-day evidence retention, or the VIBE composer/Gossip presentation. It makes no
phone/theme/localization/RTL acceptance claim for that unfinished journey.
The existing frontend is unchanged. These are remaining R07 dependencies, not
new defects or an authorization to begin later milestones.

## Verification

- Unit suite: 83 tests across 18 files passed, including six Content/client tests.
- Focused integration suite: 39 tests across Content, Social Graph, Profile, Media
  and Identity passed using explicitly isolated local `vq_test` on port 55439.
- Formatting, lint, TypeScript and architecture checks passed.
- Production build passed on unchanged retry. The first attempt compiled and
  generated pages but stopped at Next.js 16.4.0's existing security advisory;
  the retry completed with its warning. Upgrading dependencies is outside R07.
- Real Chrome: both author transport and the existing R06 Profile regression
  passed (2 tests). The author transport check uses real Web
  rewrites, API, session cookies and local PostgreSQL; it is not Gossip UI proof.

## Full diff inventory

- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/main.ts`
- `apps/api/src/modules/content/http.ts`
- `packages/api-client/src/content.ts`
- `packages/api-client/src/index.ts`
- `packages/content/package.json`
- `packages/content/src/application/content.ts`
- `packages/content/src/domain/invariants.ts`
- `packages/content/src/domain/ports.ts`
- `packages/content/src/index.ts`
- `packages/contracts/src/content.ts`
- `packages/contracts/src/index.ts`
- `packages/database/package.json`
- `packages/database/migrations/0015_content_posts.sql`
- `packages/database/src/content/repository.ts`
- `packages/database/src/index.ts`
- `pnpm-lock.yaml`
- `tooling/architecture/database-ownership.ts`
- `tests/browser/content.spec.ts`
- `tests/integration/content.test.ts`
- `tests/unit/content-client.test.ts`
- `tests/unit/content.test.ts`
- `docs/operations/content-implementation.md`

No master-plan edits, Railway changes, production migration, merge or deployment
are included. The main checkout's pre-existing `next-env.d.ts` change is preserved.
