# Local reconstruction checkpoint

Latest completed packet: **Social Graph / Orbit & Echo**, with the authority and
verified results in the final checkpoint below. Its explicit stop-after-report
boundary supersedes broader continuation for this turn. Public basic profile
visibility is approved; the older pending visibility question is resolved.

Authority: COMPLETE PRODUCT RECONSTRUCTION / FINAL IMPLEMENTATION DIRECTIVE,
`C:/Users/GrowB/.codex/attachments/ad268cf1-8438-4163-b22b-a08cc3836875/Pasted text.txt`.

Continuation authority: RESUME FULL RECONSTRUCTION,
`C:/Users/GrowB/.codex/attachments/0e4c6da1-2ecd-4460-b5b2-015358071dfc/Pasted text.txt`.
The owner also requests transparent, modern scrollbars throughout the application.

All five phases are locally authorized. Git initialization/publication and Railway provisioning/deployment are forbidden. References remain read-only. No fabricated production records or sensor/provider success.

## Execution decisions

- Execute directly in the owner-designated workspace; no Git/worktree creation because expressly forbidden.
- The owner's directive and existing audit supply the approved design/sequence; no additional approval roadmap.
- Add schemas only with cohesive, reachable capabilities rather than speculative empty domain folders.
- Preserve the existing Places reader and shared shell.
- Passwords use Node scrypt N=32768/r=8/p=3, salted; sessions use 256-bit opaque tokens with only SHA-256 digests stored. Session lifetime is 14 days, revocable. These are technical security settings, not game-mechanic decisions.
- Email verification/recovery delivery and genuine Telegram launch testing require actual provider configuration; never report a message sent or Telegram authentication proven without it.

## Checkpoints

- Architecture regression RED: five missing protections failed. GREEN: seven architecture tests passed. Added application/database isolation, contract purity, UI/server isolation and source/package cycle detection. Later checkpoints below strengthen alias/import enforcement; broader ownership/reachability guarantees remain unfinished.
- Identity integration RED: missing endpoints/schema. GREEN: five genuine PostgreSQL `vq_test` checks passed for registration/hash/HttpOnly cookie, cross-origin rejection, duplicate-registration rollback, invalid password/logout, and session visibility across API instances/expiry.
- Additional architecture RED/GREEN: browser imports of newly introduced domain packages and TypeScript import-type bypasses are rejected. Four later regression cases cover alias boundaries/cycles, aliased HTTP access, template literals and computed targets (12 reconstruction architecture cases plus the existing case). TypeScript aliases resolve before boundary checks. Unprovable computed module imports are rejected; the locale loader now uses four explicit catalog imports. No claim of exhaustive reachability enforcement.
- Identity/Profile: real registration/login/logout/session endpoints and typed UI; canonical guest profile menu with Settings/Appearance/Language/Account; four translations. Standalone header preferences removed after menu verification. Profile completion is calculated on the server from name + biography; optimistic version checks reject stale edits. Handle uniqueness/availability is implemented on the server.
- Database: additive checksummed migrations `0002_identity` through `0007_media_cleanup_retry` applied to explicitly selected local `vq_foundation` and isolated `vq_test`. Migration 0006 is Profile's transactional photo retirement queue; 0007 adds Media cleanup backoff. Existing Places migration/data retained. No seed application accounts, places or activity.
- Media: real local image upload sessions, MIME/magic/decode validation, 8MiB/20MP limits, normalized WebP/thumbnail processing, authenticated private delivery, owner authorization, transactionally owned Profile attachment, foreign-key deletion protection and durable file-cleanup jobs. The 60-second worker retires replaced/detached photos and expires abandoned pending/failed intents, preserving ready/processing objects. A failed partial upload records failure and its cleanup atomically before attempting physical removal. Genuine filesystem failure tests cover invalid roots, blocked thumbnail writes, retry persistence and one failed job not blocking later jobs. Profile/Media retries back off and stop after eight failures; retained exhausted jobs require operator recovery (no operator UI implemented). Only PNG/JPEG/WebP is supported here; audio/video, remote adapters, ready-orphan and interrupted-processing recovery, broader attachments and resource/distributed-worker limits remain unfinished.
- Actual Chrome verified register -> profile save -> image upload -> real private thumbnail -> replace -> remove -> actual API-worker deletion -> reload -> logout. Test images/accounts are clearly scoped test fixtures and removed; no camera/Telegram/provider proof is claimed.
- Tests use `vq_test` and real repositories/API. Duplicate-registration rollback assertion now checks orphan users rather than the total live user count, because parallel test files legitimately create/delete their own fixtures.
- Mechanical formatting corrected the nine existing product-document failures. Their old source-priority statements remain historical/stale; the current directive controls.
- Phase 1/2 remain partial. Email verification/recovery adapters and Telegram linking are not implemented. Business capabilities below are implemented without bootstrapping an administrator. Actual privileged-account activation/review policy remains an owner decision; it does not block independent implementation.

## Continuation checkpoint

- Global scrollbars now have transparent tracks/corners, thin translucent thumbs, rounded WebKit fallback thumbs and no arrow buttons. Shared styles cover root scrolling, dialogs and rails; forced-colors mode preserves native contrast. Actual installed Chrome inspected root/rail/profile-dialog styles in both themes at 390px, and scrolled the real 2977px Home to offset 2133. This proves ordinary-browser rendering, not Telegram or Firefox acceptance.
- Architecture RED/GREEN: four new cases enforce literal SQL table namespaces, private database-adapter boundaries and composition-root separation while permitting owned joins/schema-only readiness reads. The existing Places reader moved to `packages/database/src/places/repository.ts` with unchanged parameterized PostGIS behavior; all real Places integration tests pass. This is an extension of the existing checker. Dynamic SQL analysis, broader handler reachability and exhaustive ownership guarantees remain unfinished; do not claim Phase 1 complete.
- Media: each canonical service instance now admits at most two concurrent upload operations before claiming intents. Overflow reports `MEDIA_BUSY`/503 with Retry-After and leaves intents pending/retryable. A real PostgreSQL/Sharp/filesystem test proves the cap, successful retries and capacity release after decode failure. This is not a distributed limiter or a cap on every incoming HTTP buffer.
- Business: new `packages/business` owns organization creation, memberships, invitation acceptance, scoped review and owner eligibility. Migration `0008_business_membership.sql` adds normalized organizations/memberships/review records and Identity-owned scoped privileges. Organizations start pending with an active owner; inviting another canonical account creates an invitation, and only that account can accept. Inputs cannot self-grant approval/owner roles; all writes require sessions and an allowed Origin. Approval is transactional and audited in Business; Identity supplies `business.review` authority and excludes disabled accounts. No public privilege-grant/bootstrap endpoint or real privileged account was created.
- Reachable Business UI: Account -> Business management provides real creation, invitations and acceptance; canonical IDs are displayed for exchanging invitations. Typed clients and four translations are wired. Actual Chrome used two real accounts, created a pending business, invited/accepted membership, reloaded and verified PostgreSQL state. This is a core membership checkpoint, not complete business management: hours/photos/statistics, editing, membership revocation, transfer, pagination, full Admin review UI and policy-driven delegation remain unfinished. Owner-only approved hosting eligibility is implemented; ordinary membership does not grant hosting rights. Event operations themselves remain unimplemented.
- Business tests use only isolated `vq_test` privileges. The initial RED run's cleanup encountered the missing Business table and left three fixture accounts; cleanup now always deletes accounts, and those three UUID-labelled `@example.test` fixtures were explicitly removed from `vq_test`. No development/production administrator or application seed record was created.
- Fresh verification: `pnpm check` passed (format/lint/typecheck/architecture/37 unit tests/production build), all 33 PostgreSQL integration tests passed, and all 10 actual Chrome checks passed. Additional Business Origin/actor-spoof negatives passed in a focused rerun. Shared scrollbar runtime inspection passed on the current build. API readiness returned 200; eight migrations are applied locally. Source review traced owner/principal provenance, approval transactions, membership acceptance, FK constraints, import direction, upload capacity release and component lifecycle.

## Earlier checkpoint (superseded by the continuation above)

Prior checkpoint: `pnpm check` passed (format/lint/typecheck/architecture/33 unit tests/production build); all 29 genuine PostgreSQL/API integration cases passed; all nine actual Chrome cases passed (28.1 seconds). Chrome covered account/profile/photo replacement/removal/worker cleanup and guest preferences at 320/768 across all four locales. The locale helper's initial menu-unmount race was fixed. Readiness returned HTTP 200; that development state had seven migrations and zero users, Media records, Profile retirement jobs or pending file-cleanup jobs after fixture cleanup. No full 215-record acceptance matrix, genuine Telegram host, camera or email delivery proof.

Changed-file self-review traced principal ownership, strict DTO validation, transaction/rollback boundaries, optimistic edits, private retrieval, attachment/deletion concurrency, physical cleanup, source/package import direction, error paths and reachable UI wiring. Readiness checks the wired Identity/Profile/Media tables and cleanup columns. Reattaching cancels pending Profile retirement; foreign keys protect an attachment racing deletion. Local storage requires one stable shared root per database deployment; multi-host/distributed acceptance is not proven. Remaining Media limitations are listed above. Do not describe the entire Global Media requirement or Phase 2 as complete.

## Activities checkpoint

Activities is now implemented as a canonical domain in `packages/activities`, with strict contracts, application use cases, an owned PostgreSQL adapter and registered Fastify routes. The real Home panel supports public Live/Upcoming reads, completed-profile posting/scheduling, public owned image attachments, thumbnails/details, owner edits/cancellation, upcoming-origin reviews, durable bookmarks and map navigation. Migrations `0009_activities` and `0010_activity_media_retirement` are applied locally; no application seeds were introduced. Detached images are retired through the existing Global Media worker. Official Events remain separate and unimplemented. See [Activities implementation evidence](activities-implementation.md) for source authority, reviewed boundaries and remaining policy limitations.

Fresh verification: `pnpm check` passed (format/lint/typecheck/architecture/39 unit tests/production build), all 39 real PostgreSQL integration tests passed, and all 11 actual Chrome checks passed. Chrome proved profile completion -> rejected invalid upload/no activity -> public image upload -> persisted Activity/attachment -> rendered Home card -> guest thumbnail -> save/reload -> edit -> schedule -> review/reload -> cancel, plus existing regression coverage. Computed dark panel/border/expanded colors and light panel/card colors matched the feature tokens; no mobile horizontal overflow at 390px. Four locales, 320/768 layouts, RTL and dark/light/system continue to pass. Screenshots live in `.local/reconstruction/activities-{dark,light}.png`.

The first Activities browser run timed out on an exact label selector for an edit textarea and then on cleanup after its deadline. Runtime selector evidence was label=0, accessible textbox role=1; the test now uses that verified role. Cleanup uses the real Global Media service for only fixture-owned objects, independently of the browser deadline. The exact leaked UUID-labelled fixture was explicitly removed. Activities also wait for initial session resolution before reading the personalized public feed. No form-disappearance bug is claimed from the compressed trace. A full changed-source/integration review was completed; this workspace has no Git baseline, so no Git-generated diff is claimed.

Canonical owners live in `packages/{identity,profile,media,business,activities}`; application code uses repository ports. PostgreSQL adapters live in `packages/database/src/{identity,profile,media,business,activities,places}`. The API composition root connects existing owner capabilities. Navigation, shared profile menu and scrollbar styling were preserved. The current source build and 11 browser cases passed; ten additive migrations are applied locally.

Continue the authorized program without another approval request, beginning with Official Events using the existing Business hosting authority and Global Media. The original `LiveEventsPanel` establishes business-only hosting, public Live/Upcoming lists, RSVP/Going toggles, reviews and map navigation; its simulated role switch and fabricated descriptions/photos are not authoritative persistence or permission behavior. Remaining architecture reachability/dynamic-SQL guarantees, Identity/Media capabilities and later original workflows remain unfinished. Privileged bootstrap and delegation policy remain pending independently. Preserve the source hierarchy and 215-record inventory. Home/social/Purse still have substantial unfinished workflows; do not describe the full product as restored or production-ready.

## Current resume state — Activities and Official Events

The independently owned Official Events capability is implemented in `packages/events`, with strict contracts, repository ports, PostgreSQL adapter, Fastify routes and typed clients. Home's original blue panel supports public Live/Upcoming discovery, approved Business owner hosting, real owned public images, details, scheduling, owner edit/cancel, persisted RSVP intention, reviews, private bookmarks and map navigation. Activities remain separate and retain completed-profile eligibility. See [Events implementation evidence](events-implementation.md).

Additive migrations `0011_official_events` and `0012_event_saves` are applied to the explicitly selected local development and isolated test databases. Event creation/attachments commit in one transaction; versions and row locks protect mutations. Business supplies approved active-owner authority and the canonical host name. Event detach jobs use the existing Global Media worker; attached objects remain FK-protected. No new authentication, Media or database owner was created. No production administrator or scoped privilege was bootstrapped. Business approval activation/delegation policy remains independently pending.

Fresh verification passed: `pnpm check` (format/lint/typecheck/architecture/41 unit tests/production build); 44 genuine PostgreSQL integration tests; 11 installed Chrome production reconstruction regression checks; and the dedicated real-services Chrome Event flow. The dedicated flow passed in 54.5 seconds, including rejected private/foreign images, attachment deletion protection, actual worker deletion after detach, RSVP/bookmark reloads, reviews, edit/cancel and dark/light colors at 390px. The expanded dark surface is the original `#0b1b3d`. An additional real PostgreSQL clock test proves Upcoming -> Live and rejects moving a started Event to Upcoming, RSVPing or bookmarking after cancellation. The dedicated Event flow uses Next development on ports 3002/4102 with guarded `vq_test`; the 11 reconstruction tests use the production build on port 3000. The production build/server was refreshed after the final bookmark/color change; screenshots are `.local/reconstruction/events-{dark,light}.png`. A fresh production Chrome guest read returned HTTP 200 through Web -> API with a genuine empty feed and no horizontal overflow at 390px. No actual Telegram, camera or provider-delivery acceptance is claimed.

The missing bookmark route first failed its real database regression at 404, then passed with durable per-user persistence across repository instances, guest rejection and idempotent toggles. Initial combined integration invocations lacked `TEST_DATABASE_URL`, then used an incorrect database role; these were command configuration failures, corrected to the existing `vq_local` role and guarded local `vq_test`. All 43 cases passed with the explicit configuration. A single HTTP file formatting failure was corrected. The initial hosting browser selector failed because a wrapping select label included option text; the test uses the actual combobox role. No permission or persistence bug is claimed from that selector failure.

Canonical owners now include `packages/events` and `packages/database/src/events`. Complete changed-source and integration review covered both Event migrations and the feature's wiring. This workspace still has no Git baseline; no Git-generated diff is claimed. API readiness returned 200, twelve checksummed migrations are applied, and development fixture cleanup left zero users, businesses, privileges, Media objects, Profile retirements or pending file-cleanup jobs. The Event test approves only its explicitly scoped reviewer fixture in isolated `vq_test`, through the actual audited Business API, and cleans its accounts/data/files afterward.

The final two-database check found eight retained cleanup jobs in isolated `vq_test`, with no corresponding live users or Media objects; development had none. Existing Media integration teardown deleted its scoped account but did not finish the resulting queued deletion work. Teardown now resolves the exact fixture owner, deletes that fixture account, and asks the existing Global Media service to remove only that owner's pending objects against the test's actual storage root, asserting no pending jobs for that owner. All 13 Media cases passed after the change. The existing cleanup path also completed the historical pending jobs. A fresh state check found twelve migrations and zero users, privileges, businesses, Activities, Events, Media objects, Activity/Event retirements or pending file-cleanup jobs in both databases. Production Media behavior was not refactored.

Continue Phase 4 in dependency order from the primary source and existing inventory, starting with canonical social relationships/public profiles needed by Orbit/Echo and subsequent social feeds. Focused source inspection confirmed `useSocialGraph`, `socialGraphStore`, `VibeCenterView` define Orbit = following, Echo = followers, authenticated follow/unfollow and Pulls = challenge invitations. Their seeded profiles, fake default coordinates/online flags and localStorage persistence are rejected implementation details. The existing rebuilt Profile API and photo delivery are authenticated/private; public profile visibility is not yet implemented. A Product Owner question is pending: publicly expose saved name/handle/biography while keeping photos private until explicitly shared, or require explicit profile publication. Do not silently convert private Profile Media to public or expose account email/session data. Continue independent authorized work while that decision is pending.

Preserve the current Identity/Profile/Business/Media/Activities/Events/Places owners, navigation, theme/localization and scrollbar styling. Full Social/Share/Vibe/Purse, provider-dependent workflows, remaining Media/Identity capabilities, advanced Business/Admin policy, exhaustive architecture guarantees and the 215-record final acceptance remain unfinished. No publication or external provisioning is authorized.

## Current checkpoint — Social Graph / Orbit & Echo

Authority: `C:/Users/GrowB/.codex/attachments/df47bff0-3e17-4036-94e4-03d4ee18d578/Pasted text.txt`.
The owner approves guest-visible saved name, handle and biography with a safe
canonical ID. Profile photographs remain private; no public photo publication,
email/session/GPS disclosure or Media-rule change is authorized. This resolves
the earlier pending question.

The narrow `packages/social` owner now provides actual directed follow/unfollow,
following/follower lists and counts, and derived mutual state. Migration
`0013_social_follows` is checksummed and applied to local `vq_foundation` and
guarded `vq_test`. Uniqueness, canonical foreign keys, deletion cascades,
self-follow prevention, indexed timestamp/UUID cursors and transactional pair
locking protect persistence. Identity supplies availability and session actors;
Profile supplies a separate four-field projection without private photo reads.
No new authentication, Media owner or database abstraction was introduced.

Orbit and Echo are fully wired through the typed client and registered Fastify
routes, with public profile navigation, follow-back/unfollow, mutual state,
counts, pagination and real loading/error/empty states. The original six Vibe
tabs are retained. Black dark surfaces, compact 40px avatar rows, fuchsia/teal
controls, light adaptation, four translations and existing RTL/navigation remain.
Photos use explicitly approved public-safe initials. Home/Explore/Share/Purse,
global theme and scrollbar styling are preserved.

Fresh verification passed: `pnpm check` (format/lint/typecheck/architecture,
43 unit tests and production build), 50 genuine PostgreSQL integration tests,
11 installed Chrome production reconstruction regression checks, and the
dedicated Social Chrome flow (26.9 seconds). The dedicated run proves A follows
B -> Orbit reload -> B's Echo -> follow-back/mutual reload -> A unfollows ->
both lists update. Guest projection, private-photo rejection, owner delivery,
dark/light rows, 390px navigation/overflow, six tab selections and empty states
passed. A scrolled-row bounds check confirms clearance above the fixed navbar;
the earlier overlapping screenshot was corrected by scrolling before capture.
Screenshots are `.local/reconstruction/orbit-{dark,light}.png`.

The final production build/server was refreshed on port 3000. Four additional
actual Chrome guest Orbit checks passed in English/French/Arabic/Spanish, with
the handle lookup, six tabs, correct RTL direction, no 390px horizontal overflow
and real authenticated-list 401 responses. API readiness returned 200. The local
edited-source ledger records hashes for 48 files, without Git provenance.

Integration negatives include guests, actor spoofing, self-follow including
uppercase UUIDs, foreign Origins, malformed JSON, incomplete cursors,
nonexistent/disabled accounts and disabled actors. Repeated/concurrent and mixed
follow/unfollow mutations, two API/database instances, live Profile updates,
deletion cascades and tied microsecond pagination passed. A repeated Chrome run
hit the existing registration limiter; its natural expiry was observed and the
rerun passed without changing or clearing Identity protection. Review fixed
uppercase UUID comparisons and stale pending pagination/profile-refresh paths.

The source/change ledger and full bounded completion report are in
[Social implementation evidence](social-implementation.md). This workspace has
no Git baseline, so no Git diff or Git provenance is claimed. Final cleanup
found thirteen migrations and zero users, privileges, businesses, Activities,
Events, follows, Media objects, Activity/Event retirements or pending file
cleanup jobs in both databases. Only identified test fixtures were cleaned,
using the existing Global Media owner for files.

Counts currently scan degree in bounded batches; large-degree/load acceptance
and a single snapshot of counts/lists under concurrent writes are not proven.
Genuine Telegram, provider delivery and production deployment remain untested.
The full VibeQuest reconstruction remains unfinished.

**Next existing milestone: Social Content / Gossip**, using this canonical
relationship reader for a persisted follow-aware feed. It has not been started:
this latest packet explicitly requires reporting and stopping after Orbit/Echo.

## Mobile header correction

The owner's subsequent header request authorizes this focused presentation fix.
The mobile rule previously wrapped the header and gave its controls 100% width,
forcing a second row. It now keeps one compact row with a 32px brand mark,
smaller wordmark and plain action icons retaining 44px touch targets. Mobile
context labels truncate long account text instead of widening the page.
Only the existing mobile CSS was changed; header actions/content remain intact.
The alignment check first failed on the old 320px production header, then passed
in installed Chrome at 320/390px in all four languages, including account and
notification dialog opening and no horizontal overflow. Production build and
CSS formatting passed; dark/light screenshots were inspected. A second image
reference was not present in the request; no exact match to it is claimed.
