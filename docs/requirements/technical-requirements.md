# Technical requirements

## Locked architecture and installed stack

The required architecture is Next.js/React/TypeScript, Fastify, PostgreSQL/PostGIS, domain-owned persistence, typed platform-neutral contracts/client, one canonical Identity system and centralized Media. Railway is the intended hosting platform.

Current manifests pin Next 16.4.0, React 19.3.0, TypeScript 6.0.3, Fastify 5.12.5, next-intl 4.14.9 and Sharp 0.35.5. Node must satisfy `>=24 <25`; pnpm is `11.1.1`. These are source facts, not recommendations to upgrade. Drizzle and `pg` implement existing database adapters; pnpm workspaces cover `apps/*` and `packages/*`.

## Ownership and data

Domain/application ports remain independent of framework/database infrastructure. Composition roots inject owning repositories and narrow cross-domain capabilities. One PostgreSQL/PostGIS database is the business authority; a separate disposable test database is not a competing application store. Attachment relationships belong to features; upload/storage/processing/delivery/cleanup belong to Media. Scope financial/reward state to approved backend owners, never client counters.

Existing applied migrations are checksummed and immutable; authorized changes are additive. Repository queries are parameterized, and session/actor/authorization validation precedes mutations. Preserve foreign-reference protection and relevant transactional/concurrency invariants. Static architecture checks and runtime tests are complementary, not interchangeable.

Do not adopt the original application's Supabase, Firebase, Firestore, monolithic services, browser-local business persistence or fake fixtures. Presentation-only theme/locale preferences are allowed; they are not canonical business state.

## Two supported frontend environments

Ordinary Web and Telegram reuse one Next product/router, typed API client, feature components, navigation and design system against the same Fastify backend and PostgreSQL authority. Host differences are narrow capability adapters. A separate entry/deployment configuration may reuse this implementation if justified; no copied Telegram application, second backend, profiles, wallets or theme owner.

Web Identity works today; server-verified Telegram launch/linking and real-device acceptance remain planned. Never authenticate `initDataUnsafe`, usernames or client-reported numeric IDs. Future Identity must enforce authentic/fresh launch verification, replay/conflict defenses and secure explicit account linking without silent merges. Host readiness/viewport/back/safe areas/theme hints/haptics and contextual device permissions require cleanup and browser fallback.

Backend services control business deadlines, challenges, matching, authorization and ledger outcomes. UI timers or host suspend/resume cannot create alternate outcomes.

## Operation and verification requirements

Use [local development](../operations/local-development.md) for manifest-backed commands, explicit environment setup and test limitations. Preserve real development/production records; fixture cleanup must be scoped to isolated authorized tests. Browser fixtures do not establish provider or hardware acceptance. D01 documentation work does not certify fresh install/build/database/runtime success.

Use [Railway prerequisites](../operations/railway-deployment-requirements.md) for production preparation. Current local filesystem Media and API-hosted cleanup are not distributed production acceptance. Storage/providers/topology remain unselected. No infrastructure, authentication replacement, dependency installation or deployment is authorized here.

The [master plan](../product/VIBEQUEST_MASTER_RECONSTRUCTION_PLAN.md) controls implementation scope and acceptance. Its approved open-first/current-Vibe/linked-Trails addendum is documented, not implemented; subsequent text reconciliation is not evidence of deployed functionality.

## Approved early foundation integration (2026-10-10)

The [open-first/live Places addendum](../product/OPEN_FIRST_LIVE_PLACES_FOUNDATION_DECISIONS_2026-10-10.md) constrains later code and migrations. Browser guest-safe reads must be public through explicit per-owner API contracts, not fake persisted accounts, authorization bypass or frontend-only filtering. Shared sign-in prompts preserve navigation context; each protected mutation requires a freshly resolved canonical actor and owner validation. Telegram's signed launch is processed by Identity only; @CryptoTemplar is not a safe admin grant key. Future R42 bootstrap demands signed-actor proof, verified canonical linking and auditable narrowly scoped privilege assignment.

R29 stores durable structured atmosphere reports/history separately from factual validation. Derived current atmosphere is time-limited to a few hours; confidence may use server-validated location evidence without making GPS mandatory or exposing exact contributor position. R31 consumes privacy-respecting city-area aggregate signals, and R32 owns ordered itinerary stop references to canonical Places rather than a second place record. No star business scores, synthetic heat/ratings, invented routing times or duplicate report-aggregation owner. Redis may carry transient coordination but not canonical expiry/history; worker execution must be idempotent and use owning business transitions. Record trigger/modals/nested controls/failure/return paths and genuine host/device proof for each capability; don't infer implementation from the reference ZIP.
