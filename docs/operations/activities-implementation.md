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

## R04 interaction parity — 24 October 2026

Fresh implementation base: foundation b9093150f936c49d86a699affcd7c5024f0a76de; no open PRs at preflight. The primary product reference remains the original LiveActivitiesPanel and DiscoveryAdderModal in vibequest last.

R04 extends the existing UI rather than rebuilding the durable capability:

- Completed reporters can open the canonical Profile editor directly alongside the Activity form. Toggling the editor preserves the Activity draft. Incomplete reporters retain the real completion/check flow.
- Category labels come from the existing accepted emoji contract and locale catalogs; expanded cards now show the category. No new categories or persisted fields were introduced.
- Draft validation uses the existing input contract before uploading images. Invalid schedules, failed requests and stale edits remain explicit; stale edits offer an explicit reload of the current server record rather than overwriting it.
- Upcoming-origin reviews use a collapsible evaluation form with native keyboard-accessible star radios. Persisted history remains public. Publish, save, unsave, edit and review feedback follows actual server responses.
- Action haptics call only the shared optional Host adapter. Ordinary browsers retain its unsupported fallback; protocol fixtures do not prove physical Telegram haptics.
- Navigate retains the existing external map query (title plus location) and hands the location to the localized Explore route through a typed navigation helper. Explore initializes its own search and existing Places request from that query. The navigation text is trimmed/bounded to the existing Places 120-character limit; it neither geocodes the Activity nor changes Explore's browsing bounds or category catalog.

Existing APIs, schema, domain policies, optimistic versions, completed-profile eligibility, image authorization/retirement, and green theme tokens are unchanged. Rewards, boosts, reminders, Official Events, broader Places reconstruction and deployment remain outside R04.

The Activities browser suite now requires the existing guarded TEST_DATABASE_URL for disposable local vq_test rather than its historical vq_foundation connection. It creates real account/Profile/Activity/review/save/image records and removes its fixtures. External map delivery and the Telegram SDK are controlled transport/protocol fixtures; internal Activities and Explore calls use the real local API. No staging or production writes are part of this verification.

Source implementation, local checks, exact-head CI, PR integration, deployed runtime and product acceptance remain separate gates. This record does not mark R04 accepted or authorize its merge, deployment or R05.

R04 verification: Node 24.15.0, pnpm 11.1.1 and Prettier 3.9.9; pnpm check passed (71 unit tests, formatting, lint, TypeScript, architecture and production build). All six genuine Activities integration cases passed against disposable local vq_test. The expanded real Chrome Activities journey and 39 affected header/Console/host cases passed (40 targeted cases). Activities coverage includes incomplete/completed Profile, preserved drafts, whitespace/failed-create/five-image negatives, four public owned images, persisted save/unsave/reviews, keyboard stars, concurrent-edit reload, cancellation restoration, four localized forms and exact map/Explore request queries, plus Light/Dark/System cards at 320/1280px and Arabic RTL.

An additional 27-case Foundation probe passed 24 cases and failed three unchanged test assumptions: foundation.spec.ts uses a partial Theme label matching the header action as well as the select; it expects End to focus Echo although the current final VIBE tab is Pulls; and its Explore retry case leaves Console open over the page. The relevant test, Shell, ProfileMenu, VIBE and keyboard source is unchanged from the base. These tests were not rewritten under R04; the combined browser run is 64/67, not an all-green full-browser claim. Local unit attempts also exposed Windows timeouts/one worker exit before the successful complete check. Next.js emitted a security upgrade advisory; the unchanged build succeeded on retry. No dependency upgrade was performed.

Physical devices, genuine Telegram haptic delivery, external map-provider rendering, Railway deployment and product-owner acceptance are not established by these local results.
