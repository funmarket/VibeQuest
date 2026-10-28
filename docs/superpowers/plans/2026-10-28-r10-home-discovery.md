# R10 and Home presentation implementation plan

> Execution: inline, using the executing-plans and test-driven-development skills. The owner's strict execution packet authorizes ordinary implementation through merge; no additional design approval is required for the explicitly specified presentation.

**Goal:** Implement approved R10 discovery/feed readers and restore the specified Home presentation without replacing canonical owners.

**Spec:** Owner packet `fb8576d4-2d07-49bc-9f1b-704b1783a5fe`; current master reconstruction plan.

**Starting source:** `0d923f70c53401e7d2c56e36b15c3d3e55b88860`; no open PRs at preflight. Fresh disposable clone, historical checkouts untouched.

**Owner clarification:** The subsequent owner reply authorizes a fully verified independent slice through merge and master-plan synchronization. This branch delivers Home presentation calibration only; full R10 remains incomplete. Event title/status badges, category/Going tray and gold rating are included from the available reference; no new Event facts are invented. Approved quarterly Romance complementarity, monthly Social similarity, ongoing suggestions and separate manual invitations are not reopened.

**Architecture:** Existing Home composes its one NetworkFeed, ActivitiesPanel and EventsPanel. Profile, Graph, Content, Geo and Identity retain their canonical authorities. Discovery remains blocked on the D03 decision register below; presentation is independent.

## Constraints and evidence

- No Railway deployment, R11 implementation, seeded users/posts, new providers or unrelated changes.
- Read original Gemini `Downloads/vibequest.zip`, extracted `Downloads/vibequest`, page-by-page reference dated 2026-10-28. Source supports the flat gold-underlined tabs and green/blue compact cards. Separate screenshot unavailable; no screenshot-exact claim.
- Preserve Flash markup, all existing My Network actions, lifecycle, media and permissions.
- Browser transport fixtures prove layout and interaction only; they do not prove live API persistence or authorization.

## Command ledger

- L1 READ: verified foundation/open PRs, operating contract, master plan and relevant current/original source.
- L2 MUTATE: isolated branch and pinned dependency setup.
- L3 VERIFY/MUTATE: failing Home browser tests, focused presentation changes, passing browser tests.
- L4 WAIT: resolve D03 product decisions before dependent discovery/feed implementation.
- L5 VERIFY: full diff, relevant existing regressions and prescribed checks.
- L6 GITHUB: exact-head checks/review, merge and master-plan synchronization only when the packet's complete gates pass.

## Task 1: Home composition and feed tabs

Files: `apps/web/src/features/home/home-page.tsx`, `home.css`, `tests/browser/home-presentation.spec.ts`, `playwright.home-presentation.config.ts`.

- [x] Browser test asserts Check-ins → Flash → single feed → Activities → Events; flat three equal columns, no horizontal scrolling; gold active underline, keyboard/RTL and route-preserving selection at 320/360/375/390/393/412/430/768/1280 widths and EN/FR/ES/AR.
- [x] Run and observe the intended failure before editing product code.
- [x] Move the existing feed section and give its tablist a dedicated canonical style; retain NetworkFeed and its state ownership.
- [x] Run the browser test and inspect representative rendered screenshots.

## Task 2: Home Activities/Events presentation

Files: existing Activity/Event card and CSS owners (including `features/events/event-card.tsx`) under `features/activities` and `features/events`; the same focused browser suite.

- [x] Test compact thumbnails, green/blue section/card hierarchy, expanded details and preserved actions with explicitly labeled presentation fixtures.
- [x] Adjust existing card layout and styles to source-proven Gemini structure, retain genuine images or honest emoji fallback, and preserve all event handlers/data.
- [x] Verify mobile, light/dark, RTL, expansion and affected real functional suites.

## Task 3: D03-dependent readers — pending owner decisions

Do not implement until the bundled decision register is resolved: preference/reciprocity/opt-in eligibility; wavelength/interests/description relevance and tie-breaking; enumeration/request/repeated-action numbers; coarse area and trustworthy post provenance/no-GPS behavior; For You relevance/no-interests behavior; private comparison versus D05 cross-user disclosure. Current plan explicitly leaves these unresolved; original seeded/fallback readers do not resolve them.

## Review focus

- Narrow/translated labels wrap inside balanced columns without overflow or hidden tabs.
- Keyboard selection changes aria-selected and focus together, with RTL using the existing shared handler.
- Reordering preserves exactly one feed and unchanged Flash markup.
- Card expansion/actions retain ownership and do not redesign standalone pages.
- No partial implementation is represented as completed R10, and no merge occurs without the complete required gates.

## Verification evidence

- Initial failures proved the section-order/Event-radius gaps. Further red cases pinned light-theme tab contrast, Event status/tray structure and light-card rating contrast before their corrections.
- Initial 16-case matrix passed; final markup matrix passed 16/16 against production. The final color-corrected publication matrix passed 16/16 (45.1s). Widths: 320/360/375/390/393/412/430/768/1280; all four locales and both themes. EN dark and AR light screenshots were viewed directly; regenerated final screenshots are local evidence.
- Independent review found light active-text contrast and duplicate feed grid placement; both corrected. Self-review of final Event markup confirms the same facts, handlers, media, ownership and accessible expand/collapse label. Light gold: #8a6500 on white 5.33:1; Event rating #805c00 on the unexpanded blue card 5.07:1.
- Repository formatting, lint, TypeScript and architecture passed. Focused existing integration suite: 16/16 across Activities, Events and Content. Local unit run: 85 passed and one unchanged Places five-second timeout; isolated Places file then passed all four tests (86 unique non-hook cases verified). The two existing Windows push-hook fixtures remain covered by full GitHub CI.
- Six unique real browser journeys passed: Activities (one), Events (one), My Network (four). Development-mode navigation timing initially failed in Events/Home; production passed all four Home cases. The Event test now closes its external Maps popup and restores parent focus before checking the unchanged Explore handoff; all original functional assertions remain. The final Event markup lifecycle passed again. No product navigation handler was changed.
- Exact publication production build passed, using the framework-supported unchanged retry after its known advisory pause. No dependency/configuration upgrade or advisory bypass was added. Generated next-env.d.ts returned to its baseline content.
- Flash markup is byte-identical to the base; one NetworkFeed instance remains. No API, database, migration, domain, master-plan, infrastructure or deployment change belongs to this implementation diff. Master-plan synchronization follows the authorized implementation merge separately.
- Exact-head and merged-foundation GitHub checks are separate gates recorded in the publication/master-plan integration records. Full R10 and later milestones are not complete.
