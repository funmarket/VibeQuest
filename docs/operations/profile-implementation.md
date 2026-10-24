# R06 Profile implementation evidence

Foundation: `d194a18fe34c276459fd3378ae285bfb819a7bca` on `phase-0-foundation`.
This records the implementation boundary; it does not record merge, deployment or owner acceptance. The authoritative reconstruction plan is unchanged.

## Source and product mechanics

The master plan's R06 packet and owner instructions control this change. Primary product evidence is `vibequest last/src/components/profile/ProfileView.tsx` and `screens/ProfileScreen.tsx`; the existing accepted register also identifies `vibequestbest/src/components/profile/ProfileView.tsx`. Both sources agree on the ten presets and order: cyberpunk, web3, solana, neon, tokyo, tunis, coffee-seeker, retro-gaming, cultural-pass, minimalist. Presets toggle; custom input converts whitespace to hyphens, trims, lowercases and deduplicates. Handle hints wait 450 ms, and an unchanged own handle needs no lookup.

Reference minima, stored passwords, simulated sessions/rewards, public personal data and self-assigned verification are superseded by the current packet's protected rules. Cozy Diary is an optional private preference. Name plus biography still determine completion; no three-interest/photo/phone requirement is added. New interests and contact fields remain owner-only until D01. The reference's conflicting required/optional Diary contacts do not become participation requirements.

## Canonical implementation

- The existing Profile form now presents the authenticated self-profile and one Edit journey within its existing Console and Activity entry points. Save returns to the persisted summary; cancel discards text/interest drafts. Failed saves retain drafts. Stale versions require explicit reload before another edit.
- Profile owns interests, location, contact protocol (`telegram`, `x`, `email`), independently entered contact email/phone, X/Telegram handles and Cozy Diary. Contact preferences perform no messaging, synchronization or external verification. Identity email/password/session state is neither copied nor changed.
- Strict contracts normalize and validate inputs. Transport limits are 50 interests of 64 characters, location 200, phone 40, social handles 32 and contact email 254; these bound payloads, not eligibility. Social handles accept an optional leading `@` and store the handle. Custom tags have no invented taxonomy.
- Additive migration `0014_profile_personal_fields.sql` adds defaulted columns to `profile_profiles`. Existing rows, the unique handle constraint, photo relations and optimistic versions remain. Older input shapes preserve existing personal columns when omitted; explicit empty values clear them.
- The existing authenticated handle use case is exposed through a strict query/response contract and typed client. A 450 ms debounce, ten-second request deadline, abort cleanup, current-handle association and effect liveness guard prevent stale feedback. Failed checks remain unknown; final database uniqueness remains authoritative.
- The existing private Media flow provides a local object-URL preview, explicit Update and Remove, error feedback and stale-version reload. Preview selection/cancel performs no upload. Explicit photo operations save separately from text, as disclosed in the UI, and advance the shared Profile version. Replacement/removal retains existing durable retirement and reference protection.
- Public Profile readers still select exactly `id`, `handle`, `name`, `bio`; new fields and photos are not exposed. No domain owner, global Console behavior, policy, dependency, provider or deployment changes.

## Verification record

Verification results and exact PR/head/CI evidence are recorded in the final PR description after checks complete. Required local checks use Node 24.15.0, pnpm 11.1.1 and the repository's pinned tools. All API/database/browser mutations target guarded local `vq_test` on loopback, with disposable test accounts. No staging or production database is used.

Local results on 24 October 2026: formatting, lint, TypeScript, architecture and 77 unit tests passed. The production build passed on retry after the existing Next.js 16.4.0 security advisory gate; no dependency changed. One earlier locale-test import exceeded its existing five-second timeout and passed on an unchanged rerun; no test timeout or check was weakened. All 42 focused integrations and 31 distinct targeted browser cases passed. The final rebuilt R06 and Identity/photo cases passed again. English and Arabic 320px screenshots were visually inspected; Profile forms were checked at 320/1280px in EN/FR/ES/AR with Light/Dark/System, and the existing Console suite covered additional widths and R03 gestures/focus/scrolling. Physical device and staging acceptance are not inferred from these local checks.

Tests cover private/public HTTP projections, separate API/database-instance reload, old-client preservation, strict invalid inputs, authenticated ownership, atomic competing handle claims and stale-version rejection. Existing Identity/Media/Activities/Events/Business integrations exercise protected behavior. Browser coverage targets Console self-profile/Edit, presets/custom interests, debounce/late/error feedback, save/cancel/conflict/reload, private uploads/retirement, four locales/RTL, themes, keyboard use and phone/desktop layouts.

Physical Telegram/device acceptance and staging runtime acceptance require their own authorized work. R07, merge, Railway deployment and remote migration are not authorized by this packet.
