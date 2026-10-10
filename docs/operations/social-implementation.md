# Social Graph / Orbit & Echo implementation

Authority: the Social Graph / Orbit & Echo packet at
`C:/Users/GrowB/.codex/attachments/df47bff0-3e17-4036-94e4-03d4ee18d578/Pasted text.txt`.
This packet approves public basic profiles, keeps Profile photographs private,
and requires stopping after this outcome. No subsequent functionality, Git
initialization, publication, deployment or external provisioning is authorized.

## Original mechanics preserved

The read-only primary reference is
`C:/Users/GrowB/Desktop/ViBeQues-Selection/vibequest last`:

- `src/hooks/useSocialGraph.ts` and `src/services/socialGraphStore.ts`: directed
  following/follower relationships, follow/unfollow and derived mutual state.
- `src/components/chat/VibeCenterView.tsx`: Gossip, Drift, Vibes, Orbit, Echo,
  Pulls; Orbit means following and Echo means followers. Pulls are challenge
  invitations, not followers. Mutual follows do not create accepted challenges
  or Vibes matches.
- `src/components/profile/FollowRow.tsx`: compact rows, round 40px avatars,
  handle/name/biography, separators and relationship-aware controls. Fuchsia
  Follow and subdued Unfollow with teal UserCheck are retained. Public-safe
  initials replace private photographs under the owner's explicit decision.

Legacy seeded people, GPS/online defaults and localStorage relationship
authority were not copied. “Orbit People” retains its navigation to Drift;
Drift's matchmaking remains unavailable.

## Canonical ownership and persistence

`packages/social` owns only follow use cases, invariants and repository ports.
Identity supplies canonical active-user availability; Profile supplies only
the approved public projection. Global Media's private delivery rules remain
unchanged. Social's adapter queries only its own `social_follows` table.

Additive checksummed migration `0013_social_follows.sql` creates one row per
directed `(follower_id, followed_id)` pair, two canonical Identity foreign keys
with deletion cascades, a self-follow check, a server timestamp and indexed
keyset scans in both directions. A transaction and pair advisory lock serialize
repeated/concurrent follow/unfollow mutations. UUID input is normalized to
canonical lowercase before identity comparisons. Browser actor IDs are rejected;
the actor comes from the existing session.

Disabled accounts cannot authenticate or be followed/read publicly, and are
excluded from lists and counts. Existing relationships to disabled accounts
are retained but hidden; unfollow remains available, and canonical deletion
cascades relationships. This uses existing Identity availability facts without
inventing an account-deactivation API or purge policy.

Lists return at most 20 visible profiles. Scans use deterministic timestamp/UUID
ordering and preserve PostgreSQL microsecond cursor precision. Availability,
public projections and relationship flags are read in batches, without per-row
private Profile or Media lookups.

## APIs, public projection and UI

| Route                                         | Behavior                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `GET /v1/public-profiles/handle/:handle`      | Guest-safe saved profile lookup by canonical handle                     |
| `GET /v1/public-profiles/id/:id`              | Same narrow projection for canonical-ID navigation                      |
| `GET /v1/social/users/:id`                    | Public counts and viewer-relative following/followedBy/mutual flags     |
| `GET /v1/social/me?side=following\|followers` | Session-owned list, counts and optional paired keyset cursor            |
| `PUT /v1/social/users/:id/follow`             | Authenticated, allowed-Origin, strict `{ following: boolean }` mutation |

All routes use no-store responses and strict validated inputs/outputs. Missing
and unavailable public accounts return the same 404. Guest relationship flags
are false; guest mutations/lists require authentication. System failures return
unavailable errors rather than fabricated success.

The public DTO contains exactly `id`, `handle`, `name`, `bio`. It never reads or
serializes private photo IDs, object keys/URLs, email, sessions, credentials,
favorite vibe, completion status or coordinates. Saved name/biography updates
appear on subsequent public reads. Canonical users without saved Profile
details expose their actual empty public fields and a safe initials/avatar
presentation. Existing private Profile APIs and photo authorization are retained.

The existing shared Web frontend adds `/{locale}/people/{handle-or-id}` with the
same router, shell, providers and typed API authority. Orbit supports durable
following, public profile navigation and unfollow; Echo supports followers,
Follow Back/Unfollow and derived mutual state. Counts, paginated lists,
loading/error/retry and genuine empty states are wired. Pending read requests
are aborted when account/tab/revision changes; profile mutations refresh through
the guarded reader rather than updating a different profile from a stale request.

Orbit/Echo retain black dark surfaces and compact rows, with a white light-theme
adaptation, existing responsive navigation and logical RTL spacing. English,
French, Arabic and Spanish have aligned messages. The other four Vibe tabs remain
navigable; no feeds, matchmaking, invitation delivery or messaging were added.
Home, Explore, Share, Purse, global themes, navigation and scrollbars were not
restyled.

## Verification evidence

`pnpm check` passed: formatting, lint, typecheck, architecture enforcement,
43 unit tests and the production build. The real PostgreSQL integration suite passed 50 tests
across nine files, including six Social cases, after the final API/input changes.
These cover narrow guest projections and live Profile updates; private photos;
following/followers/counts/mutual state; another pool/API instance reading the
persisted relationship; duplicate and mixed concurrent mutations; self-follow,
uppercase UUID inputs, actor spoofing, guests, foreign Origins, malformed JSON,
invalid cursors, nonexistent/disabled targets and disabled actors; account
deletion; and 22-profile pagination with tied microsecond timestamps.

Installed Chrome passed the complete real-services Social flow in 26.9 seconds:
login A, public-profile lookup B, Follow, Orbit after reload, login B, Echo,
Follow Back/mutual state after reload, A's Unfollow and both updated lists.
Guest basic-profile visibility, guest/foreign private-photo rejection and owner
delivery passed. Dark/light screenshots show the original compact rows; a
390px bounds assertion proves the scrolled row clears the fixed bottom navbar.
All six Vibe tabs were selected without horizontal page overflow, with genuine
empty states. This dedicated run uses Next development and real API/PostgreSQL
on ports 3003/4103; it does not claim Telegram-host acceptance.

The 11 installed Chrome production reconstruction regression checks also passed,
covering Activities, Business, Identity/Profile/Media and four-language
preferences at 320/768px. One repeated Social run hit the existing loopback
registration rate limit at HTTP 429; the stored expiry was read and allowed to
reset naturally before the passing rerun. No Identity limiter was changed or
cleared. Earlier test selectors/version arguments were corrected from actual
UI/API evidence. The uppercase self-follow regression first returned 404,
then passed at 422 after canonical UUID normalization.

Fixtures are explicitly identified test accounts in guarded loopback `vq_test`.
Cleanup deletes only those accounts and uses the existing Global Media service
against the actual test storage root for their pending file deletions. No seeded
production people or relationships were created.

The final production build/server on port 3000 was refreshed. Four additional
installed-Chrome guest checks passed for English, French, Arabic and Spanish:
Orbit's authenticated-list notice, public handle lookup, all six tabs, correct
locale/RTL direction, no 390px page overflow and the actual list API's 401.
API readiness returned 200. Both local databases had thirteen migrations and
zero users, follows, Media objects or pending file-cleanup jobs after cleanup.

## Source/change ledger and review

There is no Git baseline in this workspace. This is a reviewed edited-source
ledger, not a Git diff or proof that all unrelated historic files are unchanged.
The final source hashes are recorded locally in
`.local/reconstruction/social-source-ledger.json` (48 edited source/doc files).

| Area              | Edited source files                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Social owner      | `packages/social/package.json`; `packages/social/src/index.ts`; `packages/social/src/domain/ports.ts`; `packages/social/src/domain/invariants.ts`; `packages/social/src/application/social.ts`                                                                                                                                                                                                                                                   |
| Contracts/client  | `packages/contracts/src/social.ts`; `packages/contracts/src/index.ts`; `packages/api-client/src/social.ts`; `packages/api-client/src/index.ts`                                                                                                                                                                                                                                                                                                   |
| Database          | `packages/database/migrations/0013_social_follows.sql`; `packages/database/src/social/repository.ts`; `packages/database/src/index.ts`; `packages/database/package.json`                                                                                                                                                                                                                                                                         |
| Identity boundary | `packages/identity/src/domain/ports.ts`; `packages/identity/src/application/accounts.ts`; `packages/database/src/identity/repository.ts`                                                                                                                                                                                                                                                                                                         |
| Profile boundary  | `packages/profile/src/domain/ports.ts`; `packages/profile/src/application/profile.ts`; `packages/database/src/profile/repository.ts`; `apps/api/src/modules/profile/http.ts`; `apps/api/src/modules/profile/public-http.ts`                                                                                                                                                                                                                      |
| API wiring        | `apps/api/src/modules/social/http.ts`; `apps/api/src/app.ts`; `apps/api/src/main.ts`; `apps/api/package.json`                                                                                                                                                                                                                                                                                                                                    |
| Frontend          | `apps/web/src/features/social/connections-panel.tsx`; `apps/web/src/features/social/follow-button.tsx`; `apps/web/src/features/social/follow-row.tsx`; `apps/web/src/features/social/profile-lookup.tsx`; `apps/web/src/features/social/public-profile.tsx`; `apps/web/src/features/social/social.css`; `apps/web/src/features/vibe/vibe-page.tsx`; `apps/web/src/app/[locale]/people/[handle]/page.tsx`; `apps/web/src/app/[locale]/layout.tsx` |
| Localization      | `apps/web/src/i18n/locales/en.json`; `apps/web/src/i18n/locales/fr.json`; `apps/web/src/i18n/locales/ar.json`; `apps/web/src/i18n/locales/es.json`                                                                                                                                                                                                                                                                                               |
| Enforcement/tests | `tooling/architecture/database-ownership.ts`; `tests/unit/social.test.ts`; `tests/unit/locales.test.ts`; `tests/integration/social.test.ts`; `tests/browser/social.spec.ts`; `playwright.social.config.ts`                                                                                                                                                                                                                                       |
| Workspace/docs    | `pnpm-lock.yaml`; `README.md`; `docs/operations/social-implementation.md`; `docs/operations/reconstruction-progress.md`                                                                                                                                                                                                                                                                                                                          |

Review traced session actor provenance, strict DTO rejection, owned SQL,
transactions/rollback and pair locking, FK cascades, availability filtering,
cursor ordering/precision, batched projections, no-store API/client delivery,
actual route composition, React request cancellation, locale keys and isolated
fixture/file cleanup. The review corrected uppercase UUID comparisons and
unguarded pagination/profile refreshes. It preserved private photo reads and
all prior domain owners. No blocking source finding remains for this bounded
capability; this is not an independent security or scalability audit.

## Limits and exact next milestone

Exact visible counts currently scan the user's relationships in bounded
1,000-row batches and ask Identity for availability. Cost grows with degree;
large-degree/load acceptance is not proven. Hidden accounts may require several
bounded scans to fill a list page. Counts and lists are separate reads, not one
global snapshot under concurrent changes. Public details/availability can change
between reads; existing FK integrity and per-pair mutation locking remain the
durable guarantees.

No public photographs, feed, notifications, accepted VibeCheck matches, Pulls
invitations, Drift matchmaking, chat or financial mechanics are implemented by
this packet. Genuine Telegram-host acceptance and production deployment/load
acceptance were not tested. The full product remains unfinished.

The next existing reconstruction milestone is **Social Content / Gossip**:
domain-owned persisted posts and a follow-aware reader using this canonical
Social Graph. It has not been started; this packet expressly withholds authority
to begin unrelated next functionality.
