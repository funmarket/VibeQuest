# Open-first access and live Places — approved foundation decisions

Status: **Product decisions approved 2026-10-10; implementation not authorized by this document.** This addendum refines the [master reconstruction plan](VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md), its existing R01–R50 ownership and decision register, and the [dependency roadmap](roadmap.md). It does not replace source truth, established permissions, the 215 historical acceptance records, or the original reference material. Where a legacy inventory contradicts an approved rule below, preserve that inventory as evidence rather than silently carrying its mechanic into the rebuilt product.

## 1. Open-first public discovery (global foundation)

Opening the ordinary Web application leads directly to the shared Home experience, not a forced login, registration splash, fake guest identity or starter-points grant. Anonymous visitors can navigate **Home / Explore / SHARE / VIBE / PURSE**, open publicly authorized cards, place details, people profiles, events, trails, public feeds and their informational/nested modals, and choose local theme/locale preferences without an account. Every main destination remains navigable; restricted personal information (messages, private profiles, private media, balances, invitations, private communities, administrative data) is not disclosed or fabricated simply to fill a screen.

Authentication is requested **at the moment an anonymous visitor attempts an account-required action**: publishing, commenting, reporting/validating a place, reacting, following, saving, messaging, joining, RSVP, check-in, uploading or transferring. Use one shared contextual sign-in/create-account flow, dismissible without losing public browsing. Preserve page, item, modal, draft and intended-action context through authentication where safe. Re-evaluate actor, permissions, eligibility, current state and freshness before a resumed mutation; **never silently replay a write** or treat a stored client intention as authorization. Public read API contracts stay public; backend mutations enforce canonical actor and owner permissions. Data-sensitive private UI can show honest sign-in/empty states without exposing private records.

A genuine Telegram Mini App launch follows approved R38: server-verify raw Telegram initData, then silently resolve or atomically create the canonical account for an unassociated verified Telegram identity. No ordinary manual Telegram login screen. Web and Telegram share the same routes, domain owners and authorization. A conflicting authenticated Web/Telegram identity must not be silently merged. Browser presentation host hints do not authenticate.

**Acceptance:** public navigation and nested details with no cookie; protected actions trigger contextual authentication without writes; dismiss/return retains context; completed sign-in resumes only a newly authorized user action; guest/private/disabled tests; browser/Telegram and phone/RTL behavior.

## 2. Administrator identity bootstrap (Identity + R42)

Owner-designated prospective administrator: [@CryptoTemplar](https://t.me/CryptoTemplar). The publicly supplied handle is a **contact reference, not proof of identity, not an admin grant and not a stable authorization key**. Secure onboarding must verify the numeric Telegram user ID from authentic, fresh, server-validated launch credentials, resolve its canonical `identity_users.id`, establish explicit secure Web credentials/linking through R38, and bootstrap the separately approved platform-admin privilege through an auditable least-privilege operation. Protect recovery, revocation, role delegation and concurrent account conflicts. Never grant permissions by username match, profile claim, frontend toggle, local role flags or any bot message alone.

The currently implemented `identity_privileges` namespace only grants narrow `business.review`; full operator privilege shape/role bootstrapping remains an R42/D07 design and migration gate. No numeric Telegram ID, password, bot token, role, database row or admin assignment is claimed established here. This admin identity must be available from both Web and the genuine Telegram Mini App after correct verified linking.

## 3. Place feedback: current atmosphere, not business ranking

**Approved reporting vocabulary (positive/neutral descriptions):**

- **HighVibes:** lively, exciting, energetic.
- **Vibing:** comfortable, pleasant, relaxed.
- **LowVibes:** quiet, peaceful, subdued; **not a negative business rating**.

Replace the **planned public Places star-rating/business-ranking experience** with a **current Vibe Meter**, without removing existing Activities/official Events review functionality or silently changing their semantics. Users should be able to choose an atmosphere via a feelings-style picker when reporting/commenting, or enter `@highvibes`, `@vibing`, `@lowvibes` in their own place comment. These are alternate inputs to **one validated structured atmosphere field**; raw text alone must not bypass submission validation or independently affect the meter.

Guests can read public current Vibes and historical reports. Authenticated people may submit without mandatory location sharing. A recent, sufficiently reliable, server-validated location observation can give **higher confidence** than an unverified submission; lack of GPS alone is not grounds to refuse an otherwise authorized report. Proximity confidence must not expose a reporter's precise location, guarantee indoor presence or invent physical proof. Limit coordinated/repeated submissions, self-reinforcement and moderation abuse.

The current Vibe Meter reflects reports over **a few hours**, not an entire day or an all-time score. Older reports lose influence and cease to affect current atmosphere. **History remains browseable** under approved retention, moderation, deletion and privacy controls; expiry of influence does not itself delete the underlying report. Never produce a Vibe label when genuinely recent evidence is insufficient; use a transparent **Not enough recent vibe reports** state. The exact numerical window, confidence weighting, thresholds, anti-abuse mechanics and retention remain R29/D05/D09 technical/policy decisions—no formula or number is approved here.

**Keep two separate concepts:** a subjective, non-judgmental atmosphere observation and a factual venue validation. The latter may report accuracy of hours, venue presence, closure, queue or another approved condition. Do not convert `LowVibes` into a penalty or allow mood reports to modify canonical Places data directly. R29 Contributions owns report/review/validation intake and status; only Places applies reviewed canonical changes. Media owns image bytes, if reports allow attachments.

**Acceptance:** authenticated and anonymous reporting gates, picker/tag normalization, verified/unverified confidence provenance, guest history, freshness expiry without record loss, moderation/deletion, replay/spam limits, low-data states, cross-device/refresh consistency, no business leaderboard.

## 4. Vicinity Vibe Net and contextual validation

Explore retains its existing map/Places reader and one shared shell/theme. Improve Vicinity Vibe Net as a readable, responsive spatial discovery view of **real permitted signals**, with meaningful Live Pulse / city-area heat presentation where data supports it. Distinguish areas/places from individual people; no invented active users, fake heat, fictitious radar targets or inaccessible decorative micro-controls. Provide an accessible corresponding list and honest loading/empty/low-data/permission-denied states. Animation must be subdued and reduced-motion compatible.

The Waze-inspired nearby **Validate** prompt is optional, bounded, dismissible and consent-sensitive. An eligible prompt opens its complete modal flow: existing facts → Still accurate / Something changed / Not here → optional specific correction → submit / pending / result / error / dismissal, with one canonical state owner. Anonymous visitors can inspect venue facts and the prompt, but submitting invokes contextual sign-in. Server-side authorization, signal freshness, confidence and review approval still apply.

No new geolocation authority: Geo Presence owns consent and scoped location evidence; Places owns canonical venue facts; Contributions owns reports; shared Explore presentation composes their public capabilities. Location acquisition does not silently turn on background tracking.

## 5. City Vibe Radar — nearby town and city discovery

R31's proposed Radar enhancement recommends **nearby towns/neighborhoods whose current, credible atmosphere may match the user's desired experience**, with explicit recency, coverage and explanatory evidence. It must not rank businesses from best to worst, blindly prefer larger population counts, invent activity, expose individual location traces or claim confidence from sparse data. The existing Home Radar **10 km / maximum 20** venue-discovery target remains a separate documented search scope until deliberately reconciled; it is not assumed to be a city-comparison radius or the newly approved city-ranking formula. Query bounds, area definition, normalization, minimum sample threshold, routing/provider and refresh cadence remain design decisions in R31/D05/D09.

Use Places/Contributions aggregates and consented, permitted signals via narrow readers, with no second canonical place catalogue and no parallel Vibe Meter scoring pipeline. Card/map/detail/link flows retain anonymous public viewing and require identity only for mutations.

## 6. Vibe Trails — a linked day-tour, not a flat collection

R32 should preserve its create/search/detail/save/like/story/photo behaviors while enhancing the core **Trail** into an **ordered itinerary of linked canonical Places** and optional eligible Activities or Events through their public reader contracts. A creator can choose town/theme, add/reorder/remove stops, suggest a sequence and approximate time-of-day, explain each stop, preview the full map/route, then publish. Example only: morning coffee → brunch → afternoon exploration → cinema. These names are illustrative, not actual database places.

A public visitor can view stops, narratives, publicly available photos, hours and available directions without registration; publishing, reacting, saving and editing need authenticated permissions. Preserve each destination's canonical Place identity and provenance; the Trails owner stores trail/order/notes/metadata and Media links, not duplicate venue records. Provider-supported directions, hours, itinerary travel time and closed/expired destinations must be truthful and refreshed; no fabricated route times. Include nested modals, reorder controls, validation, failed place lookup, unavailable routing, author edit/delete, and phone/RTL/Telegram return flows in R32 acceptance.

## 7. Foundation dependency gates (not new R numbers)

1. **Public access + one auth prompt**: before new feature writes, formalize guest-safe readers, permission/action classes, sign-in context restoration and Web/Telegram R38 actor resolution.
2. **Operator setup**: verify the Telegram-to-canonical actor and explicit Web linking before executing a separately approved, auditable R42 admin bootstrap. The handle alone is insufficient.
3. **Railway staging / PostgreSQL/PostGIS**: retain one authoritative database, migration checksum discipline, least privilege and environment isolation; do not conflate HOOMA infrastructure with VibeQuest.
4. **Redis + worker contracts**: Redis is optional transient presence, rate limiting and signaling. Durable time windows, report history, deletion policy, expiry jobs and publication facts belong to owning PostgreSQL domains; background workers execute owner-owned transitions with idempotency/claims. Redis is not a substitute for canonical data.
5. **Global Media**: current centralized image storage/processing ports remain one owner; distributed storage and worker readiness must be proved before relying on cross-instance media.
6. **Global UI + interaction-tree inventory**: for every page and each feature, trace **trigger → card/modal/drawer → nested control → validation/permissions → domain/API → persistent state → return path** including keyboard, gestures, failure, loading, countdown, empty, cancellation, backdrop/back, locale/RTL and genuine Telegram/device behavior.
7. **Feature packet**: each R28–R37 implementation must reference these approved changes, update its own contract/decision register and prove cross-page consistency. No wholesale redesign, duplicate owners or upfront speculative schema.

## 8. Still undecided / not authorized

- Exact Vibe report lifetime within "a few hours"; confidence formula, insufficient-data thresholds, source verification, moderation/retention specifics, city/area scoring and provider licensing.
- Admin role schema/privilege grant mechanism, verifying the owner's numeric Telegram ID and establishing Web login through an approved R38 path.
- Exact Vicinity redesign/screens, location-prompt frequency, City Radar radius/refresh, route-provider choices, itinerary timing and public provider availability.
- Proposed removal of unrelated "heavy" features: **not approved individually**. No other original mechanic, Activities/Event review system or R01–R50 packet is cancelled by this addendum.
- Production bot/service/database/Redis/media deployment and any migration or code change: **not performed or authorized here**.

## 9. Source and coordination

Approved by the owner in the 2026-10-10 conversation: public guest-first discovery, prospective Telegram administrator, nonjudgmental Vibe categories, open authenticated reporting with higher confidence for verified proximity, few-hour influence, browsable older report history, and the improved Radar/Net/Trail product direction. Historical ZIP/page descriptions are references, not authority to revive fabricated location, finances, ratings or simulated authentication.

**Integration status (2026-10-11):** PR #2 (Railway listener preparation) and PR #3 (this product-decision addendum) have merged into `phase-0-foundation`. The master reconstruction plan was subsequently reconciled in a separate documentation packet against their accepted foundation. No application code, schema, Telegram bot or Railway resource is provisioned by that reconciliation. The governing packet still requires live source checks and full acceptance before implementation.
