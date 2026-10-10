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

EXPLORE retains seven original categories, area/search/nearby map and discovery, venue details/Mayor/Gatherings, Radar/Sonar/Heat Wave, Secrets/Spawn Flash, trails/curation/hidden gems, reviews/favorites/directions and suggestions. Waze reports are additions beside these systems.

SHARE retains capture/Live Vibe Shot, distinct VibeCheck/VibeFlash, Pure Heart/Friendly Spark/Shared Moments, ephemeral nearby feed, discovery compass categories/Echo/Circle, circles/hotspots and Support the Pulse.

VIBE retains the distinctive camera/share/chat capsule, editorial banner, five established primary rail identities, Drift wavelengths, matching/following/followers, additional Local/Pulls access, composers, direct/room messaging, voice/audio/soundboard and moderation. Exact approved placement of extra views remains unresolved.

PURSE retains wallet/P2P identities and original send/receive/key/ledger/offer/trade/support concepts. Primary Crypto Hub/Pulse Trading naming does not override locked PURSE. Never use its simulated exchange reward as settlement.

Detailed action/copy/source requirements are the three active registers, not just this page summary.

## Verified source palette versus required target

Primary src/index.css:44–49 applies bg-black/text-white to body. Primary components/layout/Shell.tsx:114 onward uses bg-black, zinc-950/zinc-900 surfaces/borders, white/zinc text. VibeCenterView uses near-black and gold capsule treatment. Primary Home includes individual navy, green, amber and pink cards; therefore the source is not uniformly neutral. Preserve feature expression without copying every tinted surface globally.

The packet's earlier #0e0f11 / #1e1f22 / #2a2b2f / #f1f3f4 examples are SOURCE-PROVEN in **secondary** src/index.css:35–40, not primary global tokens. Later secondary mappings/overrides and screen CSS also exist, so these are declarations, not a measured universal computed palette. VQ declares #0C0B0E / #141217. Current rebuild packages/ui/src/tokens.css declares navy #0b1020 / #151d31 / #1e2941; this global treatment is rejected.

Required target: one semantic near-black/charcoal/dark-grey surface hierarchy, neutral borders and light-grey/white text; restrained orange/blue/pink/purple/gold accents scoped by feature. Exact new token values must be approved in the design packet. Light uses white surfaces, neutral light-grey background, readable dark text and shared component hierarchy. Do not reproduce secondary !important remapping or create independent page theme owners.

Primary font identity includes system UI plus Montserrat, Inter, Lato and expressive script fonts. Preserve deliberate capsule/banner personality; resolve typography in one shared system with Arabic coverage and readable localized labels. Remote font/artwork availability and licensing were not verified. Original quote attribution/copy is an explicit decision; current replacement is not silently accepted.

## Header, profile and navigation target

Keep playful face/wordmark, meaningful area context and profile access. Primary tagline is Super App Matrix; secondary/current Gather & Discover: copy decision tracked. Do not show invented city, user, notification dot or unread count.

Profile dropdown must contain Settings, Light/Dark/System, English/French/Arabic/Spanish and related preferences. It presents existing theme/localization state; it never owns a second theme or locale. Guest users can change presentation preferences without fake login.

Primary Shell has Lucide Home/Compass/Heart/Users/Coins; secondary has Bitcoin for Purse. Use a coherent clean futuristic icon treatment, preserving central-heart identity. Purse icon selection needs visual approval, not a new financial interpretation. Existing rounded nav-icon containers, filled broad bar and tiny labels are unaccepted; define spacing, typography, active indicators and localized widths in the correction packet.

Primary nav auto-hides after scroll delta >20px, reappears near top <10px and on destination change; source behavior, not a mandatory new algorithm. Owner must decide whether to retain auto-hide versus accessible persistent navigation. Safe-area clearance must have one shell owner; all content and controls remain reachable, including rails, dialogs and Arabic navigation.

## Acceptance

Prove phone/tablet/wide layouts in both themes, all four locales/RTL, scroll and keyboard/focus/menu behaviors, correct active route, one central heart and one preference authority. Review actual rendered empty/error/denied states and owner-provided visual references. Screenshots/build success never constitute product-owner acceptance. Actual Telegram launch, SDK capabilities and device capture require real-host/device checks; ordinary-browser operation cannot establish genuine Telegram-host acceptance. No host simulation is an acceptance method.
