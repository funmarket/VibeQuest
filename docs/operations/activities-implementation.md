# Activities implementation evidence

Authority: the owner's COMPLETE ACTIVITIES directive, using the actual `vibequest last` source: `LiveActivitiesPanel.tsx`, `DiscoveryAdderModal.tsx`, `useHomeActivityFeed.ts`, and `openExternalMap.ts`. References were read only. No legacy implementation was copied.

## Behavior and boundaries

- `packages/activities` owns validation/invariants, public discovery, posting, scheduling, owner edits/cancellation, reviews, saves and repository ports. Official Events remain separate.
- Profile supplies canonical server completion and reporter names. Identity supplies the authenticated actor. DTOs cannot supply owner, author, status, rating aggregates or completion claims.
- Live and Upcoming are public; posting/scheduling requires a completed profile. Original completion is a name plus biography. The UI reuses the existing Profile editor.
- PostgreSQL computes scheduled/live classification. Future schedules cannot be created in the past; started activities cannot be moved back to Upcoming. Cancellation and edits lock the owned record and check its version. Cancellation removes a record from both feeds and retains its detail record and images.
- The original source defines open, free casual gatherings, without reservations, capacity or an attendee roster. No new participation privilege is created. The source's arbitrary sample feed, fictitious author/verification/location claims, client rewards and claimed reminder delivery are not reproduced.
- Upcoming-origin activities retain real authenticated ratings/reviews. Saves are durable bookmarks, not a claim that notifications will be delivered. No boost/reward or notification policy is invented. The reference supplies no expiry duration; live activities remain live until cancellation.
- Activities attach only ready, public images belonging to the actor, through the existing Media capability. Foreign/private/failed images are rejected. Attachment FKs prevent deleting an attached image. Detached images enter an Activities-owned retirement queue; the existing worker asks Global Media to retire them. Other attachments remain protected by FKs. Retry/backoff follows existing Media/Profile cleanup behavior; exhausted jobs still require operator recovery.
- Migrations 0009 and 0010 are additive and contain no application seed data. PostgreSQL transactions atomically persist an Activity and its ordered attachments. SQL adapters query only their own domain tables; owner capabilities are composed in the API.
- The shared Home panel uses dark colors `#031d10`, `#0d5330`, `#10b981`, `#052917`, `#04331a`. Light colors retain green identity and readable contrast. Four catalogs and Arabic RTL use the existing theme/localization owners. Navigation and scrollbar rules were preserved.

## Changed-source review

Reviewed the complete Activities package, both migrations, PostgreSQL adapter, contracts, HTTP routes, typed client, four focused React components, feature stylesheet and locale additions. Also reviewed the bounded integration changes in API composition, database readiness/manifests, Media's public-attachment capability, the image client's optional visibility argument, Home/layout imports, workspace lockfile, architecture namespace and test configurations/catalog assertions. This workspace has no Git repository; a Git baseline diff is unavailable. Review is of the changed source and integration boundaries, not a claim that Git produced a diff.

Checked principal provenance, strict input/response parsing, Origin enforcement, public/private delivery, rollback, row locks/version conflicts, cancellation races, FK deletion protection, detach cleanup, date conversion, pagination, request aborts/timeouts, upload failure compensation and double-submit/navigation prevention. Existing authentication, storage and database owners were extended rather than replaced.

## Verification

Real PostgreSQL integration coverage includes authorized/incomplete/guest paths, unauthorized edits, persistence through a separate pool/API instance, live/upcoming classification, strict DTOs, past schedules, malformed JSON, transactional attachment rollback, public thumbnail bytes, attachment ownership/visibility/failure checks, deletion protection, durable detach cleanup, reviews, saves and cancellation. The original failed 404 tests established missing routes before implementation. A malformed-JSON regression failed at 503 and passed after preserving the HTTP client-error status.

Final command results and actual Chrome evidence are recorded in the reconstruction checkpoint after verification. Browser fixtures are explicitly named and removed; they are not production user activity or camera/Telegram acceptance.
