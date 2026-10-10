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
