# R08 — Home Network Feed and Post Actions

Starting foundation: `30479835ebddee68119f96648eeb8a223249e738`.

## Scope and source

Home composition consumes the merged R07 Social Content reader and interaction clients. The master plan R08 and the owner execution packet authorize this journey. Original `vibequestbest/src/screens/HomeScreen.tsx` establishes the compact post presentation; `vibequest last/src/features/home/components/HomeFeedTabs.tsx` establishes the cover-first card, author/time, inline comment drawer, Send and clipboard-link interaction. Existing reconstructed Home structure, navigation, tab controls, Activities and Events remain canonical.

No seeded posts, proximity/verification claims, synthetic counts, local comment persistence, reward points or fake clipboard success are copied. Actual post emoji/location labels are displayed only as authored metadata. Public Profile supplies name/handle; no avatar-photo source exists in that projection, so the real post emoji is used instead of an invented portrait. No tipping or accepted-match behavior is added.

## Ownership and path

`HomePage` → `NetworkFeed` / `NetworkPost` → established `@vq/api-client` → existing `/v1/content/feed`, `/posts/:id`, `/reaction` and `/comments` → Social Content → existing repository. Identity supplies the session; Social Graph supplies current relationship facts; Profile supplies its existing public projection; Media owns content-scoped image delivery and retirement.

There are no backend changes, endpoints, tables, migrations, second feed service or dependencies. Home owns only presentation, loading/pagination and transient interaction state. My Network genuinely reads own/followed posts; guests consume the existing authorized public feed. Local Vibes and For You retain their existing unavailable presentation, without making API calls for fabricated populations.

## Presentation and actions

The existing My Network tab renders genuine chronological cards with stable timestamp/UUID pagination, authoritative authors, timestamps, text, emoji, chosen labels and scoped images. Like/unlike uses the existing idempotent desired-state mutation, with actual selected state and counts. Inline comments use the existing validated comment reader/write, preserving failed drafts and guarding repeated submission. Home does not expose thread/reply, deletion, moderation or author editing tools absent from this original Home presentation; Gossip remains their existing entry.

Share follows the original clipboard interaction. It copies only a canonical locale Home URL (`/{locale}/home?post={uuid}#home-feed`), never post text, image bytes or a Media URL. Success is shown only after the browser clipboard resolves. Denial and unavailable clipboard report failure. Post/return links use normal anchors so the browser owns document navigation and the fragment; author links use the existing public-profile route. The post query is validated and consumes `readGossipPost`; invalid, hidden, removed and unauthorized records have an unavailable state. Server page metadata remains generic and contains no protected preview.

## Authorization and stale state

Every new read/write/image request goes through the same R07 authorization as Gossip. Home introduces no audience policy. Feed state is remounted on account changes, cleared while hidden, and reloaded on focus/pageshow/visibility return or explicit refresh. Generation and abort guards prevent late requests from repopulating invalidated content. Pagination reauthorizes existing displayed posts before appending and deduplicates IDs. Missing/expired authorization removes the affected card. The browser can retain bytes already downloaded, as acknowledged by D02; this is not a promise to recall them or provide instantaneous cross-client push updates.

## Verification

- Nine focused unit tests passed across Home link/copy, Content client, navigation-scroll and locale catalogs.
- Seven existing Content audience/Media integration tests passed against local PostgreSQL, covering transitions, current follows/blocks, scoped delivery, pagination and reference lifecycle.
- Seven unique actual installed-Chrome tests passed across focused runs: four R08 journeys (full Home actions; twenty-plus-comment continuation; audience/relationship/hidden/deleted/Media security; six-width/four-locale/two-theme matrix), one existing Gossip journey and two existing header/navigation journeys. The final Home journey passed again after the comment correction and additionally verified the canonical comment author.
- The 48 layout combinations cover 320, 360, 375, 390, 412, 430px × EN/FR/ES/AR × light/dark. All eight 375px card screenshots were inspected. Width/RTL, minimum touch targets, keyboard focus, inline input, actual cover image and scrolling/navigation were checked.
- Formatting, lint, TypeScript, architecture and production build passed. The pinned Next.js 16.4.0 security advisory stopped an initial build; the unchanged retry passed with a warning. No upgrade.
- A fresh source reviewer inspected all 13 paths. Its comment-pagination finding was reproduced by a failing actual-Chrome regression, corrected within Home and verified passing. No unresolved actionable review finding remains.
- The complete diff was reviewed. Exact-final-head push and pull-request CI results are recorded in the PR after execution.

All database/browser fixtures target isolated local `vq_test`, not staging or production. Browser permission denial and write-failure cases deliberately inject failures; successful publication, reads, relationships, comments and reactions use actual API/database paths. Hidden-state exclusion uses an isolated database fixture; moderation authorization remains covered by the unchanged R07 owner. Tests create no real user privileges. These checks do not establish deployed Railway, physical-phone or Telegram acceptance.

## Diff inventory

- `apps/web/src/app/[locale]/[destination]/page.tsx`
- `apps/web/src/features/home/home-page.tsx`
- `apps/web/src/features/home/home.css`
- `apps/web/src/features/home/network-feed.tsx`
- `apps/web/src/features/home/network-post.tsx`
- `apps/web/src/features/home/post-link.ts`
- `apps/web/src/i18n/locales/en.json`
- `apps/web/src/i18n/locales/fr.json`
- `apps/web/src/i18n/locales/es.json`
- `apps/web/src/i18n/locales/ar.json`
- `tests/unit/home-post-link.test.ts`
- `tests/browser/home-network.spec.ts`
- `docs/operations/home-network-implementation.md`

## Boundary

No master-plan status changes, real permission grants, database schema changes, merge, deployment or R09/R10/R11/R47 work. The main checkout's pre-existing `apps/web/next-env.d.ts` change remains untouched. Existing Next.js security advisories remain separately tracked; no upgrade is included.
