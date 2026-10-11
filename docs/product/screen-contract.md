# VibeQuest original-product screen and visual contract

Authority: [Product Truth 002](legacy-parity-inventory.md), owner decisions → vibequestbest → vibequest last → VQ. This specifies corrections only. Current rebuilt design is not accepted.

## Global navigation and route crosswalk

HOME → EXPLORE → elevated central-heart SHARE → VIBE → PURSE is fixed. Primary App.tsx MainContent selects local state routes; primary Shell.tsx calls the fifth item Crypto with Coins. Secondary calls it Purse with Bitcoin. Explicit owner PURSE wins; neither internal crypto ID nor primary label creates a sixth destination.

| Original access / symbols                                | Rebuilt equivalent                                | Target crosswalk / current disposition                                        |
| -------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| MainContent / HomeScreen / home                          | /:locale/home                                     | Implemented shell; original nested workflows detailed in discovery register   |
| ExploreScreen / explore                                  | /:locale/explore                                  | Real bounded Places list; provider/map/Radar/venue subflows not complete      |
| ShareGoodVibesScreen / share                             | /:locale/share                                    | Shell; capture/challenge/publishing flows unavailable                         |
| VibeScreen → VibeCenterView / vibe                       | /:locale/vibe                                     | Five primary tabs with contextual empty panels                                |
| CryptoScreen / CryptoDashboard / crypto                  | /:locale/purse                                    | Wallet/P2P shell; no financial authority                                      |
| Primary LoginConsole splash/login/register               | /:locale/sign-in, register, recover               | Planned; no fake Identity                                                     |
| ProfileScreen / ProfileView / ProfileSidebar             | /:locale/profile, settings                        | Planned; current account notice is not profile menu                           |
| PeopleProfilePage / PersonProfileAccess                  | /:locale/people/:id                               | Planned; role/private access must be server authorized                        |
| BusinessProfilePage / BusinessEventManager               | /:locale/businesses/:id; organizer tools          | Planned; preserve business/person distinction                                 |
| EventThreadPage / event detail; Flash detail/create/hunt | /:locale/events/:id; events/new; events/flashes   | Planned; event and challenge clocks stay distinct                             |
| VenueDetailSheet Info/Mayor/Gatherings                   | /:locale/places/:id                               | Planned; no verified mayor or fake gathering                                  |
| Trails / curation / passport                             | /:locale/trails and trails/:id                    | Planned; preserve original discover/create/save/detail actions                |
| Find Hub / Social Circle / alerts / Lock-On              | /:locale/presence/find-hub                        | Planned; social presence, not ordinary Places search                          |
| Capture/preview/history/response/reveal                  | /:locale/share/capture; challenge views           | Planned; secure Media and challenge capabilities required                     |
| Gossip / Drift / Vibes / Orbit / Echo                    | Existing contextual tabs                          | Keep these five primary identities; restore actual content in later packets   |
| Primary Local and Pulls; secondary Pulls                 | Additional nested Vibe views, placement undecided | Preserve capabilities; no silent deletion or unapproved primary-tab expansion |
| VibeChatThread / Paltalk rooms / MessageModal            | /:locale/messages/:id; circles/:id/room           | Planned; transcript/audio/polls/moderation preserved                          |
| Circles directory/create/join/edit/members               | /:locale/circles; circles/new; circles/:id        | Planned; canonical Communities membership                                     |
| Wallet/send/receive/offers/chat/ledger/support           | /:locale/purse and later nested actions           | Planned financial mechanics decision; no invented balances                    |
| AdminScreen / admin metrics / sandbox                    | /:locale/admin                                    | Planned; no client privilege elevation                                        |
| Notifications/privacy/device-access/help/languages/theme | Profile dropdown and settings subviews            | Theme/locales functional but placement wrong; remainder planned               |

Only the five locale pages and shared / and /telegram entries currently exist. Future URLs above are proposed crosswalks, not implemented route claims. Locale prefix is en/fr/ar/es; Arabic logical direction mirrors visual positioning while destination DOM order and central heart stay invariant.

## Original page personalities and content

HOME must keep Current Vibe/check-ins, Flash alert/Hunt/Create, live/upcoming activities/events, Daily Streak, Radar, Find Hub/social proximity, three feed tabs, curated coordinates, gems and Guide. Primary has Live Matrix and Neighborhood Loops vocabulary; secondary has richer activity/Flash/Find Hub flows. Preserve both evidence sets and resolve copy in the decision ledger, not generic place-search descriptions.

EXPLORE retains seven original categories, area/search/nearby map and discovery, venue details/Mayor/Gatherings as qualified historical interaction evidence, Radar/Sonar/Heat Wave, Secrets/Spawn Flash, Trails/curation/hidden gems, favorites/directions and suggestions. The approved target replaces legacy venue star/rating presentation with nonjudgmental current Vibe plus moderated history. Waze-style factual validation is a distinct Contributions journey, not a duplicate venue-editing owner; nearby cities and linked day tours extend these established entry points.

SHARE retains capture/Live Vibe Shot, distinct VibeCheck/VibeFlash, Pure Heart/Friendly Spark/Shared Moments, ephemeral nearby feed, discovery compass categories/Echo/Circle, circles/hotspots and Support the Pulse.

VIBE retains the distinctive camera/share/chat capsule, editorial banner, five established primary rail identities, Drift wavelengths, matching/following/followers, additional Local/Pulls access, composers, direct/room messaging, voice/audio/soundboard and moderation. Exact approved placement of extra views remains unresolved.

PURSE retains wallet/P2P identities and original send/receive/key/ledger/offer/trade/support concepts. Primary Crypto Hub/Pulse Trading naming does not override locked PURSE. Never use its simulated exchange reward as settlement.

Detailed action/copy/source requirements are the three active registers, not just this page summary.

## Verified source palette versus required target

Primary src/index.css:44–49 applies bg-black/text-white to body. Primary components/layout/Shell.tsx:114 onward uses bg-black, zinc-950/zinc-900 surfaces/borders, white/zinc text. VibeCenterView uses near-black and gold capsule treatment. Primary Home includes individual navy, green, amber and pink cards; therefore the source is not uniformly neutral. Preserve feature expression without copying every tinted surface globally.

The packet's earlier #0e0f11 / #1e1f22 / #2a2b2f / #f1f3f4 examples are SOURCE-PROVEN in **secondary** src/index.css:35–40, not primary global tokens. Later secondary mappings/overrides and screen CSS also exist, so these are declarations, not a measured universal computed palette. VQ declares #0C0B0E / #141217. That earlier navy declaration describes a superseded rebuild state, not the current `packages/ui/src/tokens.css`, which uses neutral light/dark surfaces and current legacy destination accents; target color corrections still require owner-approved rendered proof.

Required target: one semantic near-black/charcoal/dark-grey hierarchy with light-readable text, refined 2.5D surfaces and elegant thin icons. **Approved configurable page identity accents:** HOME `#00CED1`, EXPLORE `#00FF00`, SHARE Carmine `#FF0040`; no pink substitute for SHARE. White/light text is mandatory on genuinely colored controls and active containers, using darker contrast-safe accent-surface tokens where necessary (not white on raw bright green). Neutral Light-mode surfaces retain contrast-safe dark text. VIBE/PURSE final color choices and numeric variants remain open, not invented. Avoid thick orange/brown PURSE outlines and accent-colored-on-accent-colored button text. Centralize tokens instead of scattering new literals or CSS overrides.

Primary font identity includes system UI plus Montserrat, Inter, Lato and expressive script fonts. Preserve deliberate capsule/banner personality; resolve typography in one shared system with Arabic coverage and readable localized labels. Remote font/artwork availability and licensing were not verified. Original quote attribution/copy is an explicit decision; current replacement is not silently accepted.

## Header, profile and navigation target

Keep playful face/wordmark, meaningful area context and profile access. Primary tagline is Super App Matrix; secondary/current Gather & Discover: copy decision tracked. Do not show invented city, user, notification dot or unread count.

Profile dropdown must contain Settings, Light/Dark/System, English/French/Arabic/Spanish and related preferences. It presents existing theme/localization state; it never owns a second theme or locale. Guest users can change presentation preferences without fake login.

Primary Shell has Lucide Home/Compass/Heart/Users/Coins; secondary has Bitcoin for Purse. Use a coherent clean futuristic icon treatment, preserving central-heart identity. Purse icon selection needs visual approval, not a new financial interpretation. Existing rounded nav-icon containers, filled broad bar and tiny labels are unaccepted; define spacing, typography, active indicators and localized widths in the correction packet.

**Owner decision resolved (2026-10-11):** the shared bottom navigation must hide on downward page scrolling and reappear on upward scrolling, near the top and after destination changes. The old >20px/<10px threshold values are source evidence, not authorization to alter the live implementation without proper regression proof. Bind the actual scroll owner; ignore nested modal/form scroll, respect reduced motion, keyboard access and safe areas, and never patch feature pages with arbitrary offsets or z-index.

## Approved UI accessibility and interaction details — 2026-10-11

Every page includes full create/edit/view/delete forms, modals, sheets, selectors, image/file controls, validations, confirmation/cancel and return paths in its acceptance tree. Protect working Activity/Event scheduling, media, reviews, RSVP and ownership mechanics instead of rewriting them. Settings must expose one global scalable-text preference with Device Default; device zoom and 200% text expansion must not clip navigation, inputs, dialogs or Arabic RTL. Check ordinary text contrast >=4.5:1 and qualifying large text/non-text controls >=3:1 on actual rendered surfaces. Reconcile supplied photographic place pins, neon radar and layered venue-detail references without invented people/data, new providers or revival of venue star judgments. These are requirements pending implementation and rendered owner acceptance.

## Acceptance

Prove phone/tablet/wide layouts in both themes, all four locales/RTL, scroll and keyboard/focus/menu behaviors, correct active route, one central heart and one preference authority. Review actual rendered empty/error/denied states and owner-provided visual references. Screenshots/build success never constitute product-owner acceptance. Actual Telegram launch, SDK capabilities and device capture require real-host/device checks; ordinary-browser operation cannot establish genuine Telegram-host acceptance. No host simulation is an acceptance method.

## Approved guest-first and Explore UX corrections — 2026-10-10

The [open-first/live Places foundation addendum](OPEN_FIRST_LIVE_PLACES_FOUNDATION_DECISIONS_2026-10-10.md) supersedes contradictory legacy login, ratings and discovery descriptions in this historical screen crosswalk. The five main routes and any publicly authorized nested modal/drawer/detail are viewable without a Web account. The old LoginConsole is **not** the default launch page; attempted protected actions invoke the single shared sign-in/create-account modal and preserve safe page/return context. This does not expose protected records. Genuine Telegram launch automatically resolves/provisions one canonical actor after server verification under R38.

In Explore, place details and community remarks present **HighVibes** (energetic), **Vibing** (pleasant/relaxed) and **LowVibes** (quiet/peaceful) as atmosphere, not stars or penalties. Comments may select a structured feeling or enter a recognized @vibe tag, resulting in the same normalized observation. Show recent public current Vibe with explicit low-data states and a separate browseable historical report view; older reports lose meter influence but aren't automatically deleted. Preserve separate factual Waze-style Validate/Something changed/Not here suggestion flows and the full modal lifecycle. Only authenticated users submit reports or validations; location is optional, and verified recent presence may improve confidence. No fake active pings or people.

**Vicinity Vibe Net** retains spatial discovery but becomes readable, attractive and accessible using genuine permitted signals. **City Vibe Radar** suggests suitable nearby neighborhoods/towns from recent area-level ambience with honest low-coverage states, not a business-rating leaderboard. **Vibe Trails** are linked, ordered place-based day tours with creator, stop editing/reordering, map preview, story/notes and public detail—never invented route durations or duplicate Places ownership. Each entry, card, sheet, modal, nested action, success/error/expired state, back/gesture and phone/RTL/Telegram path stays in the interaction-tree acceptance inventory. Exact visual layouts/algorithm/route provider are later approved subdecisions; none are implemented by this document.
