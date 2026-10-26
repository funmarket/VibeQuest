# R09 — consenting Geo Presence and readable area

Implementation baseline: GitHub `phase-0-foundation` at `1340ff4e4e067f63ef1e7c8b9fe039e8f82f6e2c`. This inventory describes the R09 implementation branch, not a merged milestone or deployment. The authoritative master plan remains unchanged.

## Ownership and runtime

`packages/geo` owns consent, observation validity, current position, expiry and revocation. `packages/contracts/src/geo.ts` supplies strict DTOs, and `packages/api-client/src/geo.ts` supplies the shared client. Composition wires the Geo repository and existing Identity/Places capabilities into `apps/api/src/modules/geo/http.ts`.

Additive migration `0020_geo_presence.sql` creates `geo_preferences`, one `geo_positions` row per actor, and coordinate-free `geo_sessions` participation. No history, venue catalogue, match state or new provider exists. The migration has only been exercised in the disposable local test database; applying it to staging/production requires separate deployment authorization.

Identity supplies authenticated actor, opaque session digest and expiry under a shared session lock. Geo never reads Identity tables or authenticates client-provided actor/session IDs. Identity's canonical logout revokes the session then invokes Geo retirement. Revocation is serialized against in-flight authenticated Geo operations. Session locks use the existing bounded relationship pool, keeping lock waiters out of the data pool.

## API and data protection

All Geo routes are authenticated and `Cache-Control: no-store`; writes require an approved Origin. Strict input rejects actor spoofing, unknown fields and unreliable readings. Reading bodies and session material are not logged by the Geo error boundary.

| Route                         | Behavior                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/geo/me`              | Own remembered consent and session-authorized current position only                                                          |
| `PUT /v1/geo/me/consent`      | Versioned private consent and separate social preference; full withdrawal deletes coordinates/participation                  |
| `PUT /v1/geo/me/observation`  | Authenticated latest reading; 5-minute/100-meter gate, future/invalid denial, concurrency checks                             |
| `POST /v1/geo/me/unavailable` | Clear active coordinates and participation, advance consent version against delayed callbacks; retain application preference |
| `GET /v1/geo/me/places`       | Compose own valid presence with canonical published Places; caller sends search filters, never GPS coordinates               |

There is no cross-user location route or accepted-match reader. R11 must supply canonical accepted matches before any matched-user area disclosure can become available. Mutual follows are not substituted. Existing public Profile projection remains ID/handle/name/bio.

Observations expire 15 minutes after server acceptance. Identical observations are idempotent without refreshing their expiry clock; older/conflicting observations cannot overwrite the latest one. Reads deny expired presence independently of physical cleanup. The API's bounded minute cleanup invokes the Geo owner's idempotent due work and stops cleanly with the application. Session participation expires no later than its Identity session or observation eligibility. Logout removes its participation and deletes coordinates when no authorized participating session remains.

## Shared presentation and host lifecycle

The current Shell location entry and console Settings open one Access Request dialog. Location uses genuine host capability; Camera/Microphone remain explicitly unavailable without requesting either API. Guest sign-in reuses the existing account form; public/manual browsing stays available without consent or an account. Consent is remembered server-side, not repeatedly requested on launch.

One shared Geo provider controls acquisition, status and expiry across Home/Explore. The existing host adapter supplies browser/WebView geolocation, supported permission queries/change subscriptions and honest unsupported/denied/timeout behavior. No native Telegram LocationManager or background tracking is claimed. Hidden/page-exit/logout paths cancel acquisition and ignore delayed callbacks; resume refreshes when allowed. Platform permission loss invalidates presence while retaining the distinct remembered preference. Coordinate-free Geo and Identity invalidation messages clear other open tabs; generation/actor guards prevent obsolete reads from restoring revoked state. Hosts without BroadcastChannel revalidate consent on supported foreground/resume paths before acquisition.

Editorial browse bounds have a separate presentation context. Only explicitly selected manual bounds are stored locally. Device coordinates are neither local-storage preferences nor URL parameters. Manual Places reads retain the existing anonymous bounded API; automatic nearby reads resolve GPS at the authenticated server boundary. No city-name provider is selected: labels say Nearby area, Selected browse area or Location not set, and Explore shows the actual viewport rather than inventing a city name or venue attendance.

## Reconstruction evidence and acceptance limits

The implementation plan contains the original/current/approved parity inventory and exact reference sources. Original shared location display, manual selection and refresh concepts are preserved; implicit acquisition, indefinite last-known positions, fabricated city fallback and Find Hub simulation are superseded/deferred. The owner-described Geographic Location/Camera/Microphone/Apply interaction is reconstructed using the accepted shared modal/tokens and EN/FR/ES/AR catalogs. The exact owner screenshot was unavailable, so pixel parity is not claimed.

Automated browser geolocation/permission fixtures prove application behavior, not physical GPS or real Telegram acceptance. Production build, exact-head CI, local PostgreSQL tests and installed Chrome are separate evidence from Railway deployment/device acceptance. R10 discovery, R11 matches, challenge/venue proof, geofences and background guarantees remain in their owning milestones.

Verification record: 86 local unit tests (two existing Windows hook fixtures locally blocked), 90 complete local integration tests, 23 R09 Chrome scenarios and 11 existing affected Chrome regressions; formatting/lint/types/architecture and production build passed. Full exact-head CI is required separately. The current pinned Next.js advisory remains an existing limitation; no upgrade was authorized.
