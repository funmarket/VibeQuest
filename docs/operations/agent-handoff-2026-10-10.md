# VibeQuest — complete project handoff for ChatGPT / the next agent

Prepared on 10 October 2026 from the conversation, current source, implementation
reports and a fresh local runtime/database check. This document summarizes the
handoff; it does not grant new implementation, publication or deployment authority.

## 1. What we are building

VibeQuest is a mobile-first local discovery and social application: discover
places, activities and events; share moments; meet people; build communities;
and eventually use the original marketplace/Purse experiences.

The owner wants to preserve the original product, including its names, page
content, subnavigation, ideas, mechanics and recognizable visual identity.
“Clean rebuild” means replacing defective implementation and ownership, not
replacing VibeQuest with a generic new product.

The long-term target is a production-ready application. **The current application
is a functioning local reconstruction with several real domains, not a completed
or certified production-ready product.**

The five primary destinations, in this exact order, are:

**HOME → EXPLORE → heart icon labelled SHARE → VIBE → PURSE.**

The heart must remain within the bottom navigation borders. Earlier wording
about an elevated heart is superseded by the owner's direct correction.

English is the default language. French, Arabic and Spanish must ship from the
first release. Arabic requires RTL. Dark, light and system themes are foundational
requirements, with one shared theme owner.

## 2. Project boundaries and source authority

The writable application is:

`C:/Users/GrowB/Desktop/Vibequest`

Original references are read-only:

| Reference                                                       | Current role                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `C:/Users/GrowB/Desktop/ViBeQues-Selection/vibequest last`      | First authority for features, mechanics, interactions, content and original feature presentation |
| `C:/Users/GrowB/Desktop/ViBeQues-Selection/vibequestbest`       | Global dark brand, typography and compatible supplementary reference                             |
| `C:/Users/GrowB/Desktop/ViBeQues-Selection/VQ`                  | Tertiary compatible reference                                                                    |
| `C:/Users/GrowB/Desktop/ViBeQues-Selection/ViBeGuEst-GLM-basic` | Historical inspected attempt; not current product authority                                      |

The latest direct owner requirements override historical documents and legacy
implementation defects. Do not copy old monolithic scripts, business stores,
localStorage persistence, fake coordinates/people, permissive auth, swallowed
writes or reward counters.

Shotgun and Meetup were early references for color/discovery direction, and
betrue.fr for Vibe visual inspiration. They do not replace the actual VibeQuest
product or the later source hierarchy.

An unrelated HOOMA security/PR prompt was accidentally pasted and then explicitly
cancelled. **HOOMA, its repositories, npm workflow and PRs #405–#410 are not part
of VibeQuest.** No HOOMA source or repository changes were made by this chat.

## 3. Authority history and where execution currently stops

The initial foundation prompt was replaced by the owner's product-parity V2
foundation directive. Later product-truth, theme and prepublication packets
expanded the reconstruction requirements. The owner then authorized the full
five-phase local reconstruction, followed by a continuation packet.

Key source attachments:

- Full reconstruction directive:
  `C:/Users/GrowB/.codex/attachments/ad268cf1-8438-4163-b22b-a08cc3836875/Pasted text.txt`.
- Full reconstruction continuation:
  `C:/Users/GrowB/.codex/attachments/0e4c6da1-2ecd-4460-b5b2-015358071dfc/Pasted text.txt`.
- Most recent completed domain packet, Social Graph / Orbit & Echo:
  `C:/Users/GrowB/.codex/attachments/df47bff0-3e17-4036-94e4-03d4ee18d578/Pasted text.txt`.
- Earlier replacement foundation:
  `C:/Users/GrowB/Downloads/VIBEQUEST_FOUNDATION_001_V2_PRODUCT_PARITY_CLEAN_REBUILD.md`.

The five-phase program is Structural Foundation → Identity/Media → Activities/
Events → Social/Original Features → Visual Parity/Final Acceptance. These phases
are not all complete; foundational/provider work remains even though later
independent domains have been implemented.

The latest Social Graph packet explicitly required completing Orbit/Echo,
reporting and stopping. It expressly did **not** authorize beginning the next
unrelated capability. That packet is complete. The subsequent mobile header
request was completed as a separate presentation correction.

**The current request is to write this handoff.** The next agent must use the
owner's next instruction to determine implementation authority. Do not turn this
handoff or the older broad program authorization into permission to ignore the
latest bounded stop condition.

There is no Git repository in the VibeQuest workspace. Do not initialize Git,
publish to GitHub, create PRs, provision Railway, deploy or provision a Telegram
bot without new explicit authorization. GitHub/Railway are intended future
destinations, not configured/proven current infrastructure.

## 4. Architecture established

One shared Next.js frontend serves ordinary browsers and the Telegram entry.
Telegram is another host for the same application, not another frontend or
business backend. Both environments must share users, posts, follows, messages,
places, events, notifications and media through the same canonical owners.

Current stack from the manifests:

- Node 24; pnpm 11.1.1 workspace.
- TypeScript 6.0.3.
- Next.js 16.4.0, React 19.3.0, next-intl 4.14.9.
- Fastify 5.12.5 API.
- PostgreSQL/PostGIS; parameterized repositories in the existing database package.
- Sharp 0.35.5 for real image processing.
- Vitest and Playwright using installed Chrome for the focused runtime checks.

The established flow is:

`Shared frontend → typed API client/contracts → Fastify validation/session → owning application use case → repository port → PostgreSQL adapter → persisted result → reader → rendered UI`.

Important code locations, relative to the workspace:

| Location                                                     | Responsibility                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `apps/web/src/app/[locale]`                                  | Shared locale routes and providers; public profiles use `people/[handle]` |
| `apps/web/src/app/(entry)`                                   | Ordinary/Telegram entry routing                                           |
| `apps/web/src/components/shell.tsx`                          | Shared header, context strip and five-destination navigation              |
| `apps/web/src/features`                                      | Feature components and typed client integration                           |
| `apps/web/src/platform/host.tsx`                             | Browser fallback and Telegram host capabilities                           |
| `packages/ui/src/tokens.css`, `theme.tsx`, `theme-policy.ts` | Shared tokens and theme policy                                            |
| `apps/web/src/styles/global.css`                             | Shared layout, navigation and scrollbar styling                           |
| `apps/web/src/i18n/locales/{en,fr,ar,es}.json`               | Four aligned catalogs                                                     |
| `packages/contracts`                                         | Platform-neutral validated DTOs/contracts                                 |
| `packages/api-client`                                        | Shared typed HTTP clients                                                 |
| `apps/api/src/app.ts`, `main.ts`                             | API composition and runtime wiring                                        |
| `apps/api/src/modules/*/http.ts`                             | Owning HTTP adapters                                                      |
| `packages/database/src/*/repository.ts`                      | Domain-specific PostgreSQL adapters                                       |
| `packages/database/migrations`                               | Ordered checksummed additive SQL migrations                               |
| `tooling/architecture`                                       | Existing automated boundary/cycle/owned-SQL checks                        |

Canonical packages currently present: `identity`, `profile`, `business`, `media`,
`activities`, `events`, `social`, `database`, `contracts`, `api-client`, `ui`.
Places retains its existing reader/use-case boundary; do not move it just to
make its folder shape resemble another domain.

Application/domain layers use ports. Owners expose narrow capabilities to other
owners; they do not read or mutate foreign tables directly. Media owns bytes,
processing and delivery; each feature owns its attachment relationship.

No Supabase, Firebase, Firestore, alternate business database or client-owned
business persistence is permitted. LocalStorage is acceptable for an existing
presentation preference such as theme, not accounts, follows, posts, wallets,
check-ins or publishing success.

The architecture checker has been strengthened for package/source cycles,
UI/server and contract purity boundaries, aliases/import forms, owned SQL and
composition roots. Exhaustive dynamic-SQL, feature reachability and duplicate
ownership guarantees are not proven. Do not claim the entire architecture audit
or Phase 1 is finished.

## 5. Product map: real capability versus retained shell

| Destination | Product identity and current state                                                                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HOME        | Original hierarchy is retained. Activities and Official Events are real. Check-ins, Flash alerts, Vibe Feed/rewards, Radar, Find Hub, social feeds and other panels are still wholly or partly unavailable shells.                                                                                  |
| EXPLORE     | Real public published-Places reads, search/category/bounds/list flow and genuine loading/error/empty states. Map rendering requires configured styles. Enrichment, contributions, reviews/favorites, heatmap, Sonar, secrets, trails, curation, leaderboard and social proximity remain unfinished. |
| SHARE       | Recognizable Vibe Shot, VibeCheck, VibeFlash, moments/feed, circles/hotspots and support concepts are retained. Real capture, posts, challenges, communities and financial support workflows are not implemented.                                                                                   |
| VIBE        | Six tabs: Gossip, Drift, Vibes, Orbit, Echo, Pulls. Orbit and Echo now work end to end. Gossip, Drift, Vibes, Pulls, composer/chat/camera and soundboard remain pending.                                                                                                                            |
| PURSE       | Original wallet/ledger, P2P trading, explorer key, marketplace/neighbor exchange, history and support ideas remain visible as unavailable concepts. No real balance, key, transfer, custody, escrow or settlement is claimed.                                                                       |

Target Home composition remains area/search → check-ins → Flash alert →
Activities → Events → Vibe Feed → Discovery Radar → Find Hub → social feeds →
curated coordinates → local gems → Guide. A heading, selected tab or unavailable
dialog is not a completed business capability.

The 215-record inventory is the acceptance inventory, not 215 completed features
or necessarily 215 distinct domains. It includes nested actions and variants.
Use its source traces instead of restarting discovery or creating a new long
implementation roadmap.

## 6. Completed domains and their limits

### Web Identity and Sessions

Real registration, login/logout, canonical users, database sessions, expiration,
revocation and throttled attempts. Passwords use salted scrypt; session tokens
are opaque, with only hashes stored. Existing HttpOnly cookies and Origin checks
protect authenticated writes. Tests proved another API instance can read the
same persisted session.

Email verification/resend, recovery/password reset delivery and secure Telegram
account linking are **not implemented**. No delivery provider is configured or
falsely reported as successful. This is not a comprehensive security certification.

### Profile and shared profile menu

Real saved name, biography, unique handle, favorite vibe, optimistic version
checks, server-calculated completion, and private photo upload/replace/remove.
Completion requires a saved name and biography. The shared Voyager Console
exposes account, Settings, Appearance, language, Profile and Business management.
Theme/language controls were consolidated here; do not add another state owner.

The owner approved public basic social profiles: exactly safe canonical `id`,
`handle`, `name`, `bio`. Public reads reflect saved updates. Guests may browse.
Profile photos remain private. Public DTOs exclude email, photo IDs/URLs/keys,
session/auth data, private details and GPS. Public-safe initials are expressly
approved; they are not fabricated people or public photo publication.

### Business organizations and membership

Persisted pending applications, active owner membership, invitations and
invitation acceptance by the invited canonical account. Audited review operations
require Identity's scoped `business.review` privilege. Users cannot self-grant
approval or hosting permissions. Only an active owner of an approved organization
can host Official Events; ordinary membership is insufficient.

No real administrator/reviewer was bootstrapped. Owner policy for privileged
activation/delegation remains pending. Hours, media, statistics, broader editing,
membership revocation/transfer, pagination and a complete administration UI remain
unfinished.

### Global Media

One real owner for upload intents, authorization, MIME/magic/decode validation,
PNG/JPEG/WebP, 8MiB/20MP limits, normalized WebP plus thumbnail, persisted lifecycle,
local physical files, private/public delivery, deletion and retryable cleanup.
Profile, Activities and Events own their attachment links; attached objects have
FK deletion protection.

Domain detach/replace operations queue retirement transactionally. A 60-second
API-hosted cleanup worker calls the same Media owner. Failed operations retain
durable cleanup work. Retries back off and stop after eight failures, retaining
records for operator recovery. Per-instance uploads are capped at two, returning
retryable busy responses without consuming pending intents.

Storage is local `.local/media` unless `MEDIA_LOCAL_ROOT` selects another absolute
root. All API instances sharing a database must share the same root. No remote
storage provider exists. Camera/audio/video, broader domain attachments,
ready-orphan/interrupted-processing recovery, operator tooling and distributed
worker/storage acceptance remain unfinished.

### Activities

Independent `packages/activities` domain with actual public Live/Upcoming feeds,
posting, scheduling, Profile-completion eligibility, title/description/location,
owned public image attachments, cards/thumbnails/details, expand/collapse,
owner edits/cancellation, reviews, private saved bookmarks and map/directions.
The owner comes from the session; reporting names come from Profile. Creation
and attachments are transactional and survive repository/API recreation.

Scheduling uses the server/PostgreSQL clock. No invented expiry, capacity,
ticketing or attendee roster was added where the reference did not establish it.
Reminder delivery and reward/boost policies remain unavailable.

Original dark colors: outer `#031d10`, border `#0d5330`, teal `#10b981`, card
`#052917`, expanded `#04331a`. Light mode preserves green identity.

### Official Events

Separate `packages/events` owner: real public Live/Upcoming feeds, approved
Business-owner hosting, scheduling, category/venue/organizer identity, owned
public images, details, owner edit/cancel, persisted RSVP intention, reviews,
private saved bookmarks and directions. Host Event opens its own Event form,
not Create Flash.

Versions/row locks enforce lifecycle and concurrent mutations. Started Events
cannot be moved back to Upcoming. RSVP means intention to attend, not tickets,
reserved seats or verified physical attendance. No notification delivery,
automatic duration or capacity policy was invented.

Original dark colors: outer `#081022`, border `#1d4ed8`, card `#0c162f`, expanded
`#0b1b3d`. Light mode preserves blue identity.

### Social Graph / Orbit & Echo — latest completed domain packet

One narrow `packages/social` owner, one directed follow record per canonical
user pair, FK integrity/deletion cascades, self-follow rejection, duplicate-safe
and serialized repeated/concurrent follow/unfollow operations.

**Orbit = Following. Echo = Followers. Pulls = incoming invitations.** Mutual
follows are derived graph facts; they are not automatically accepted VibeCheck
challenges or completed Vibes matches.

Real public-profile lookup/navigation, own following/follower lists and counts,
Follow/Follow Back/Unfollow, mutual indicators, 20-visible-profile pagination,
reload persistence, loading/error/retry and genuine empty states. Disabled
accounts are unavailable and excluded from visible lists/counts; their edges
are retained but hidden until canonical deletion or unfollow. No new deactivation
or purge policy was invented.

Routes:

- `GET /v1/public-profiles/handle/:handle` and `/id/:id`.
- `GET /v1/social/users/:id`.
- `GET /v1/social/me?side=following|followers`, with paired optional cursor fields.
- `PUT /v1/social/users/:id/follow`, strict `{ following: boolean }`.
- Shared UI: `/{locale}/people/{handle-or-id}`.

All use the existing session/API authority, strict contracts and no-store reads.
UUID input is normalized to avoid uppercase self/target comparison errors.
PostgreSQL microsecond cursor precision is retained. Profile/Identity facts and
relationship flags are batched; there are no per-row private Media reads.

Exact visible counts scan degree in bounded batches, so cost grows with graph
size. Large-degree/load acceptance and one globally consistent counts/list
snapshot during concurrent changes are not proven. Stale pagination/profile
refresh paths were guarded during review.

Orbit/Echo preserve black dark surfaces, compact rows, 40px initials avatars,
fuchsia follow controls and subdued unfollow with teal UserCheck. The light
adaptation, locale text and RTL reuse the existing design system.

## 7. Shared presentation: what the owner has already corrected

Preserve the recognizable feature colors and content. Do not substitute generic
grey cards or navy surfaces for every domain.

- Bottom navigation was reconciled with the actual `vibequest last` shell. Its
  five destinations remain ordered and the middle heart is labelled Share and
  stays inside the bar.
- Theme reconciliation retains one dark/light/system owner. Explicit selection
  wins; system uses the Telegram host hint when present, otherwise OS preference.
- Scrollbar tracks/corners are transparent, thumbs thin/translucent and rounded,
  with no old-style arrow buttons. Forced-colors preserves usable native contrast.
- **Latest UI fix:** mobile CSS previously wrapped the header and made its tools
  100% wide, forcing a second row. The existing mobile rule now keeps one compact
  row, a 32px brand mark, smaller wordmark and plain icon controls with 44px touch
  targets. Account/context text truncates instead of widening the page.
- Header actions/content were preserved. No business or bottom-navigation
  redesign was performed during the header fix.
- The owner mentioned a second header reference image, but only one image arrived.
  Do not claim an exact match to a missing second reference.

## 8. Telegram and device capability truth

There is one shared router/frontend and a `/telegram` entry. The host adapter
supports ordinary-browser fallback, optional Telegram BackButton, safe areas,
haptics and theme hints. Launch data is only a host-presence hint at present;
it does not establish authenticated identity.

Server-side Telegram signature verification, freshness/replay protection and
secure cross-platform linking are pending. Never authenticate from
`initDataUnsafe` or a browser-supplied Telegram ID.

Ordinary Chrome, a `/telegram` URL or SDK test fixtures do not prove genuine
Telegram acceptance. No actual Telegram host/device, camera, microphone,
physical proximity or external notification/email delivery was certified.

Browse-area coordinates are not consenting social presence. Future capture and
location work must handle real permission, denial/revocation, accuracy, hardware
cleanup and genuine evidence; no fake Tunis location, sensor success or footage.

## 9. Database and runtime state

Fresh read-only handoff check:

- Web listening on `http://127.0.0.1:3000`.
- API listening on `http://127.0.0.1:4100`; `/health/ready` returned HTTP 200.
- PostgreSQL listening on loopback port `55439`.
- Development database `vq_foundation`; isolated integration database `vq_test`;
  local database role `vq_local`.
- Both databases have 13 applied checksummed migrations.
- Both contained zero users, scoped privileges, businesses, Activities, Events,
  follows, Media objects, Activity/Event retirements and pending file-cleanup jobs.
- `.git` is absent. There is no VibeQuest commit SHA, PR or remote CI result to report.

This empty state is intentional after scoped test cleanup. Empty feeds are
truthful; do not seed fake production activity to make screenshots look busy.
Recheck these mutable facts before operating; do not kill processes by stale IDs.
The loopback trust-authenticated cluster is development infrastructure, not a
production database authentication configuration.

Migrations, in order:

`0001_places`, `0002_identity`, `0003_profiles`, `0004_media`,
`0005_profile_media`, `0006_profile_photo_retirement`,
`0007_media_cleanup_retry`, `0008_business_membership`, `0009_activities`,
`0010_activity_media_retirement`, `0011_official_events`, `0012_event_saves`,
`0013_social_follows`.

Never edit an applied migration. Add a new ordered migration for an authorized
new capability. Use explicit database targets and retain existing data.

## 10. Verification actually achieved

These are recorded prior implementation results, not a claim that every suite
was rerun while writing this handoff:

| Evidence                                        | Result and scope                                                                                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Latest complete `pnpm check` after Social       | Format, lint, typecheck, architecture, 43 unit tests and production build passed                                                                                                         |
| Latest combined PostgreSQL integration suite    | 50 tests across nine files passed, including six Social cases and prior Places/Identity/Profile/Media/Business/Activities/Events regressions                                             |
| Production reconstruction Chrome suite          | 11 checks passed, including Activity, Business, account/profile/media flows and four-locale preferences at 320/768px                                                                     |
| Dedicated Events real-services Chrome flow      | Passed approved hosting, images/private rejection, FK protection, RSVP/bookmark reload, reviews, edit/detach/worker deletion, cancel and dark/light/mobile behavior                      |
| Dedicated Social real-services Chrome flow      | Passed A follows B → Orbit reload → B's Echo → Follow Back/mutual reload → A unfollows → both lists update; guest public profile and private-photo protection; 390px layout and six tabs |
| Additional final-production Social guest checks | Four locales, RTL, six tabs, handle lookup, 390px no overflow, actual own-list 401 boundary passed                                                                                       |
| Latest mobile header correction                 | Production build/format passed; actual Chrome at 320/390px across four locales proved compact alignment, no overflow and both menu actions; dark/light screenshots inspected             |
| Handoff fresh checks                            | Runtime ports, API readiness, no Git repository, thirteen migrations and the database cleanup state above                                                                                |

Integration tests use real PostgreSQL repositories/APIs and actual image
processing/files. Browser accounts/images are explicitly labelled fixtures and
cleaned. Real infrastructure test fixtures are not simulation of production
activity. Do not disable eligibility, Origin checks or private photo protection
to make tests pass.

The dedicated Events suite runs real API/Next development on 4102/3002 and the
Social suite on 4103/3003, against guarded `vq_test` with separate actual storage
roots. Production regression checks separately use the port-3000 build. Fixtures
grant review authority only to exact isolated test accounts, not real users.

Earlier foundation/theme browser suites include transport/SDK fixtures; they
are not device/provider acceptance. Broad historical screenshots are not proof
that later-added functionality or all original interactions work.

One repeated Social run encountered the real registration throttle; its expiry
was inspected and allowed to reset naturally. No limiter was bypassed. Initial
selector/version mistakes were corrected from actual UI/API evidence.

No complete 215-record acceptance, remote CI, deployment, production load,
distributed storage/worker, real email/notification provider, camera or genuine
Telegram certification has been performed.

## 11. Remaining reconstruction work and locked distinctions

The immediate existing dependency milestone is **Social Content / Gossip**:
persisted posts/feed readers using the canonical graph and Global Media. It has
not been started. Its exact implementation scope and associated privacy,
moderation/access requirements must come from the owner's next packet and source.

Other unfinished areas include Communities/Circles/Drift, messaging/rooms/read
state/voice/soundboard, challenge invitations and matching, native capture,
VibeCheck/VibeFlash lifecycle, Home Flash Events, Geo Presence/Find Hub,
Radar/provider discovery, Places contributions/enrichment/reviews/favorites,
trails/curation, notifications, streaks/rewards, marketplace, administration and
remaining Profile/Business/Identity/Media capabilities.

Do not blur these distinctions:

- Activities are ordinary eligible-user activities; Official Events require
  approved Business-owner hosting.
- Orbit/Echo are social relationships, not Share Echo content or accepted matches.
- Native VibeFlash is not a Home Flash Event.
- Browse map bounds are not social GPS presence or physical attendance.
- RSVP intention is not a ticket, seat or verified attendance.
- Saving is a bookmark, not proof that a reminder notification was delivered.
- Public basic profiles do not make private Profile photographs public.

Later owner-locked targets in the full directive supersede older register conflicts:
native VibeCheck expiry 33,000ms; prompt maximum 60 characters; photo freshness
five minutes as a separate rule; native VibeFlash response window 60,000ms.
These are targets, not currently implemented challenge behavior.

The later Radar target is a 10km search, maximum 20 provider results,
review-count ordering, source-defined rarity and real proximity; not fake venues
or unsupported charge/recharge mechanics. Find Hub is consenting social
proximity with the established 150/200/250/500m radius choices, not merely a link
to Places discovery. These workflows are not yet implemented.

Do not reproduce the defective five-days-per-click streak or client-minted
points. Reward/boost/notification policies need real approved rules and an atomic
server ledger. Do not invent real-money custody, balances, transfers, escrow or
settlement; consequential financial decisions remain with the owner.

Provider gaps should not be turned into false success. Independently authorized
work can proceed when its dependencies are satisfied, but the current handoff
does not itself authorize it.

## 12. Documents to read, with historical warnings

Start with current evidence:

1. `README.md`.
2. `docs/operations/reconstruction-progress.md` — read its latest checkpoints,
   including Social and the mobile header fix, not just earlier paragraphs.
3. `docs/operations/social-implementation.md`.
4. `docs/operations/activities-implementation.md`.
5. `docs/operations/events-implementation.md`.
6. The latest owner packet relevant to the next authorized outcome.

Then consult the product acceptance inventory and original traces:

- `docs/product/legacy-parity-inventory.md`.
- `docs/product/references/product-truth-discovery.md`.
- `docs/product/references/product-truth-social.md`.
- `docs/product/references/product-truth-platform-purse.md`.
- `docs/product/references/product-truth-source-coverage.json`.
- `docs/product/screen-contract.md`, `mechanics-permissions.md`, `roadmap.md`.

Historical architecture/foundation documents in `docs/architecture` and earlier
operation reports remain useful context but are not complete current architecture
descriptions. Some still call implemented Identity/Media/Social “future,” reverse
Orbit/Echo, elevate the heart, use old reference priorities/timers or require
per-packet approval under an earlier program. The latest owner instructions,
current checkpoint and actual source supersede those statements.

Do not silently treat outdated wording as current product rules, or perform a
broad documentation rewrite during a narrow implementation packet. Record and
reconcile contradictions within the authorized scope.

Evidence screenshots are in `docs/operations/evidence` and `.local/reconstruction`.
Recent files include `activities-{dark,light}.png`, `events-{dark,light}.png`,
`orbit-{dark,light}.png`, `header-{dark,light}.png` and scrollbar captures.
The Social edited-source ledger records 48 files at that packet's checkpoint.
It is not a Git diff or a continuously current whole-project baseline.

## 13. Local execution and verification commands

Do not run these blindly against already listening services. Inspect actual
processes and database selection first. The API requires exported environment
variables; `.env.example` is documentation, not an implicitly loaded secret file.

```powershell
Set-Location 'C:\Users\GrowB\Desktop\Vibequest'
$env:DATABASE_URL = 'postgresql://vq_local@127.0.0.1:55439/vq_foundation'
$env:TEST_DATABASE_URL = 'postgresql://vq_local@127.0.0.1:55439/vq_test'
$env:API_ORIGIN = 'http://127.0.0.1:4100'
$env:PORT = '4100'
$env:WEB_ORIGINS = 'http://127.0.0.1:3000,http://localhost:3000'

# Only if installation/migration/start is needed and authorized:
pnpm.cmd install --frozen-lockfile
pnpm.cmd db:migrate
pnpm.cmd dev

# Engineering checks, appropriate to the authorized change:
pnpm.cmd check
pnpm.cmd test:integration

# Production build/start when port 3000 is free:
pnpm.cmd build
pnpm.cmd --filter @vq/web start

# Actual Chrome checks:
pnpm.cmd exec playwright test --config playwright.reconstruction.config.ts
pnpm.cmd exec playwright test --config playwright.events.config.ts
pnpm.cmd exec playwright test --config playwright.social.config.ts
```

Map styles are optional configuration fields in `.env.example`; no licensed map
provider was provisioned. Do not claim a configured interactive map from the
map-unavailable fallback or an external directions link.

The full default browser command starts its own Web server; a running port-3000
production process can conflict. Manage only verified task-owned processes, not
all Node processes. Other projects may be active on this machine.

## 14. How the new agent should work

Preserve completed owners and working behavior. Do not restart architecture
inspection from zero, rebuild completed domains or substitute another plan for
an explicit implementation request. Inspect the current checkpoint and only
the source/reference slice needed for the authorized next outcome.

Follow the owner's reliability rules: route through `workflow`, read before
editing, establish exact target/outcome, ask only for material missing facts,
keep one cohesive outcome at a time, gather real runtime evidence, inspect the
complete changed set and distinguish implemented from tested. Use debugging for
failures and source/diff review for consequential changes.

Read applicable `AGENTS.md` instructions, including `apps/web/AGENTS.md` and the
installed Next documentation before relevant framework changes. Do not guess
new framework APIs from memory.

Use actual PostgreSQL tests and actual Chrome flows. Never fabricate publishing,
balances, check-ins, sensor/provider success or persistence. Use genuine failure,
loading and empty states. Clean only specifically identified fixtures, with
Global Media handling their files. Keep references untouched.

Finish in-scope corrections and verification; do not stop for ordinary failed
first attempts or selector mistakes. Stop for an actual ownership conflict,
missing consequential policy, unauthorized external action or unrelated required
change. Report the exact blocker once and avoid stacked speculative fixes.

Every completion report should state what changed, why, actual checks/results,
material remaining limits and checkpoint updates. Do not claim Git-generated
provenance, remote CI or deployment when none exists.

## 15. Copyable introduction for the new chat

> We are continuing VibeQuest in `C:\Users\GrowB\Desktop\Vibequest`. Preserve
> the original product while rebuilding its implementation cleanly. Primary
> functional reference is `vibequest last`; `vibequestbest` supplies compatible
> global dark brand direction; `VQ` is tertiary. One shared Web/Telegram frontend,
> one Fastify API and PostgreSQL/PostGIS only. English default plus French,
> Arabic/RTL and Spanish; dark/light/system themes; mobile-first presentation.
>
> Read this handoff and the latest reconstruction checkpoint before working.
> Web Identity/Profile/Media, core Business membership, Activities, Official
> Events and Social Graph/Orbit/Echo have real persistence and verification.
> Preserve them. Orbit means following, Echo means followers, and private Profile
> photos stay private. The latest UI correction makes the phone header one compact
> row. Most remaining social, challenge, proximity, notification and Purse flows
> are unfinished; do not report their shells as working features.
>
> The next existing milestone is Social Content/Gossip, but the latest completed
> Social packet explicitly stopped after reporting. Use my next instruction to
> establish your authorized task. Do not initialize Git, publish, deploy, provision
> external infrastructure or invent product/financial/reward policy. Do not work
> on HOOMA; that pasted request was cancelled. If you cannot access local files,
> tell me which specific source/report you need uploaded instead of pretending
> you inspected it.
