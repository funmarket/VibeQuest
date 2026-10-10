# Domain ownership

Current source baseline: 10 October 2026. These are canonical business responsibilities in one application and one PostgreSQL/PostGIS system of record. Pages compose capabilities; they do not own competing copies of business state.

## Implemented owners

Paths below are repository-relative. The API composition root is `apps/api/src/app.ts`; PostgreSQL implementations are under `packages/database/src/<owner>/repository.ts`.

| Owner / canonical source                                                              | Owned state and capabilities                                                                                                  | Public dependencies / limits                                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Identity — `packages/identity`                                                        | Users, password accounts, hashed sessions, attempt limits and scoped privileges; registration/login/logout/session resolution | API crypto adapter supplies scrypt and token operations. Telegram verification/linking, recovery and OAuth remain planned |
| Profile — `packages/profile`                                                          | Profile fields/completion, private photo relationships and retirement requests; basic public ID/name/handle/bio projection    | Identity account facts and Media capabilities. Completion currently uses name and bio; photographs are not public         |
| Business — `packages/business`                                                        | Applications/organizations, memberships/invitations, review decisions and approved active-owner hosting facts                 | Identity supplies `business.review` capability; no self-granted administrator or membership-to-host privilege             |
| Places — `apps/api/src/modules/places/application` and `packages/contracts` read port | Canonical `places` public published reader and bounded spatial/filter query                                                   | PostgreSQL/PostGIS adapter; no implemented contribution/approval writer or second place catalog                           |
| Activities — `packages/activities`                                                    | Entries, public image links, saves, reviews and attachment retirements; Live/Upcoming, create/schedule/edit/cancel            | Profile completion/author reader and Media public attachment capabilities; independent of official Events                 |
| Official Events — `packages/events`                                                   | Entries, public image links, RSVP intentions, saves, reviews and retirements                                                  | Business hosting, Profile author and Media capabilities; RSVP is not attendance proof or ticketing                        |
| Media — `packages/media`                                                              | Upload intent/object metadata, processing states, variants, delivery, file deletion and cleanup retry jobs                    | Local storage and Sharp adapters are injected. Feature owners retain attachment/audience decisions                        |
| Social Graph — `packages/social`                                                      | Directed follow edges, following/follower lists/counts and derived mutual flag                                                | Identity availability and public Profile reader; not accepted matches, challenges, SHARE requests or Circle membership    |
| Shared presentation — `apps/web/src/components`, `platform`, `i18n`, `packages/ui`    | Shell/navigation, locale/RTL and theme preferences, transient host capabilities                                               | Typed client/contracts only for business operations; no canonical backend state or separate Telegram theme owner          |

Table ownership and thirteen migrations are listed in the [database contract](database-contract.md). Feature relationship tables may reference canonical Identity/Media IDs without transferring ownership. Domain attachment retirement and Media byte cleanup remain distinct responsibilities.

## Dependency direction and enforcement

UI → typed client/contracts → registered Fastify validation/session adapter → owner application use case → repository port → owning PostgreSQL implementation. Pure domain models/ports do not import React, Next, Telegram, Fastify, Drizzle or Node infrastructure. Application use cases do not import SQL/storage/HTTP adapters. Infrastructure implements ports; composition roots wire concrete dependencies.

Use exported owner capabilities such as Profile reads/completion, Business hosting, Media attachment/retirement and Identity availability. Do not import another owner's private repository, pass a naked pool into business use cases, or create another authentication/database/Media abstraction.

`pnpm.cmd architecture` runs `tooling/architecture/check.ts`: declared dependencies, private imports, application/domain boundaries, browser/server separation, package/source cycles and known table-namespace SQL access are checked. `database-ownership.ts` tracks current namespaces. Static checks are a bounded safeguard, not proof of every runtime permission or dynamically assembled SQL path; relevant invariant/integration tests remain required.

## Future capabilities and semantic separation

The [master reconstruction plan](../product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md), section 3 and R01–R50, allocates future meaningful owners and dependencies. These are proposed responsibility boundaries, not installed packages or permission to implement them.

- Persistent Social Content/Gossip is distinct from ephemeral SHARE moments.
- Orbit means following; VIBE Echo means incoming followers. Derived mutual follows are not accepted Vibes matches.
- Matching/discovery and Pulls challenge invitations do not belong to Social Graph merely because they are social.
- SHARE Echo Connection/Join Vibe requests are not automatic follows or matches. Circle membership belongs to Communities.
- Messaging/rooms, Presence and consenting Geo Presence have separate authorization/lifecycle responsibilities.
- Native VibeCheck/VibeFlash state is distinct from Home Flash Events. Activities, official Events and casual venue Gatherings remain independent.
- Contributions use approved Places interfaces; Rewards owns ledger/claims, Payments owns approved external receipts and Marketplace owns offer/deal transitions. No UI or Geo owner mints financial state.
- Notifications deliver approved domain intents; Admin orchestrates scoped owner commands rather than writing arbitrary foreign tables.

Do not revive the foundation-era catalog that grouped Flash Events with official Events or challenges/connections with Social Graph. Do not split correct domains merely to increase folders. Future exact schemas and public interfaces are established only in their separately authorized packets.
