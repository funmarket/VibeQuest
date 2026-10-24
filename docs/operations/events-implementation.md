# Official Events implementation evidence

Authority: the owner's complete reconstruction directive and authorized continuation after Activities. The primary reference is the actual `vibequest last/src/features/home/components/LiveEventsPanel.tsx`, with its related feed and map mechanics. References remained read only.

## Behavior and ownership

- `packages/events` owns official Event discovery, hosting, editing/cancellation, RSVP intention, reviews, bookmarks, lifecycle invariants and repository ports. Activities retain their independent owner, permissions and tables. RSVP here records an Event-specific intention; verified physical attendance and Geo Presence remain separate unfinished capabilities.
- Identity supplies the authenticated actor. Business supplies approved, active owner hosting authority and the canonical business name through its public application capability. Ordinary membership and client role switches cannot grant hosting. No administrator or production review privilege was bootstrapped.
- Guests browse public Live/Upcoming lists and real public images. Hosting/editing requires the actual approved business owner. Cancellation requires the publishing owner; concurrent changes use row locks and optimistic versions. The business of a published Event cannot be switched.
- PostgreSQL classifies scheduled Events by its clock. Past new schedules are rejected; started Events cannot be moved back to Upcoming. The primary source supplies no automatic duration, ticket or capacity policy. Cancelled records leave feeds and retain their details and attachments.
- Authenticated RSVP toggles persist with uniqueness constraints and truthful counts. They promise no ticket or reserved seat. Reviews use canonical Profile names, validated ratings/text and persisted aggregates. Saving is a private durable bookmark, independently of RSVP and notification delivery.
- Event image attachments reference owned, ready, public Global Media objects. Private/foreign/failed images are rejected. FK constraints prevent deleting attached objects. Editing persists ordered attachments and transactional detach jobs; the existing worker calls Global Media retirement with capped retry/backoff. Physical storage is not duplicated in Events.
- Additive, checksummed migrations `0011_official_events.sql` and `0012_event_saves.sql` contain no application seed records. Event creation and attachments commit atomically. SQL adapters access Event-owned tables; other domains are reached through injected capabilities.
- Four translated catalogs and the existing theme owner supply the shared Web/Telegram frontend. Home retains its hierarchy and the original blue surfaces: `#081022`, `#1d4ed8`, `#0c162f`, expanded `#0b1b3d`. Light mode retains blue identity. Host Event opens its own real form, independently of Create Flash. Navigation and scrollbar styles were preserved.

## Changed-source review

Reviewed the complete Events package, two migrations, database adapter/readiness, contracts, HTTP routes, typed client, four React components, stylesheet, four catalogs and Home/layout wiring. Reviewed the bounded Business hosting capability, API composition and cleanup-worker integration, package manifests/lockfile, architecture namespace and test configurations. No Git baseline exists in this workspace; this is a changed-source and integration-boundary review, not a Git-generated diff.

Traced server principal/name provenance, strict DTOs, Origin checks, transaction rollback, locks/version checks, cancellation races, attachment FK protection, image authorization/compensation, detach retirement, public delivery, native forms, date conversion, aborts/timeouts, pagination and busy states. Existing Identity, Business, Profile, Media and database owners were preserved.

## Verification approach

Initial real PostgreSQL tests failed at missing routes before implementation. The bookmark regression failed at 404 before its reachable API/database flow was added. Integration coverage includes pending/approved owner versus ordinary member, role spoofing, guest reads/protected writes, separate API/pool persistence, owner edit/cancel/version enforcement, scheduling, RSVP, review storage, private bookmarks, malformed input/Origin rejection and actual FK rollback.

The dedicated Chrome suite runs actual Web/API services on ports 3002/4102 against isolated loopback `vq_test`. It grants a scoped review privilege only to a UUID-labelled test account in that database, then approves the business through the real audited Business API. No development/production administrator or role simulation is used. Chrome covers pending-host rejection, approval, real public image upload, persisted Event/attachment, guest retrieval/thumbnail, rejected private/foreign Media, attachment deletion protection, RSVP/bookmark reloads, edit/detach and actual worker deletion, reviews, cancellation, dark/light presentation and mobile overflow. Scoped fixture data/files are cleaned through real owner capabilities.

This dedicated flow uses the same frontend in Next development mode; the reconstruction regression suite separately exercises the production Web build on port 3000. Neither proves actual Telegram hosting, camera use, notification delivery or complete product acceptance. Final command results are recorded in the reconstruction checkpoint.

## R05 interaction parity — 24 October 2026

Fresh implementation base: b741ba349ff4083244979dd85384165d27e0614a; no open PRs at preflight. The primary LiveEventsPanel and Explore useVenueSearch reference were inspected alongside the existing R04 navigation capability.

R05 extends Events presentation: compact real ratings/Going status, collapsible native star evaluation with keyboard operation, truthful action feedback, draft validation through existing contracts, explicit stale-edit reload, confirmation restoration and optional shared Host haptics. Business remains the server authority for approved active-owner hosting; no client role/approval switch was introduced. Existing APIs, persistence, lifecycle, RSVP intention semantics, four-image authorization, attachment retirement, version protection and blue tokens are unchanged.

Navigate retains the external map query using Event title/location, while the existing Explore navigation owner carries the Event name and raw category tag in the localized URL. Explore applies the original reference mapping: music to Venues, art to Art, other current Event tags to All. This preserves the original cafe/theatre fallback rather than inventing a new Places taxonomy. Query-only Activity navigation still initializes All. No new provider, bounds, catalog, geocoding or Places request owner is introduced.

The Events browser test now uses the existing guarded local vq_test helper and an explicit loopback-origin check, instead of a historical fixed-port skip/hardcoded connection. Its scoped reviewer privilege exists only for a disposable test account and Business approval still goes through the real audited API. Test files use the configured isolated Media root for cleanup. These fixtures do not establish production privileges or device acceptance.

Merge, Railway deployment, physical-device/Telegram haptics, external map rendering and owner product acceptance remain separate gates. This evidence does not mark R05 integrated or authorize R06.

Local verification used Node 24.15.0, pnpm 11.1.1 and Prettier 3.9.9. The complete pnpm check passed with 72 unit tests, formatting, lint, TypeScript, architecture boundaries and production build. All eight Events/Business integration cases passed on disposable vq_test, both before and after the UI work. The Business browser suite passed; the expanded Events suite passed after correcting an agent-authored Live-tab selector to use its existing ID (the visual symbol is part of its accessible name).

Real production-build Chrome coverage includes pending-host denial, audited approval, authenticated hosting, whitespace/failed-create/five-image negatives, four-image persistence, private/foreign image rejection, attachment FK protection and real worker retirement, RSVP and bookmark toggles/reloads, owner editing, unauthorized edits/cancellation, stale-edit reload, keyboard star reviews, past/future scheduling, cancellation confirmation restoration and persistence. Four localized forms and cards were exercised; Light/Dark/System at 320/1280px and Arabic RTL had no horizontal overflow. The real local Places API returned successful responses for each exact Event-name/category handoff; query-only navigation reset the filter to All. The external map transport and optional Telegram haptics were controlled fixtures, not physical device/provider acceptance.

Next.js emitted its existing security upgrade advisory and the unchanged build succeeded on retry; no dependency upgrade was performed. The broader Foundation browser limitations recorded under R04 were not repaired or rerun as unrelated R05 work. These focused results do not claim full browser/product acceptance.
