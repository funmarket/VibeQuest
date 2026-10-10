# Historical reference — superseded preservation conclusions

The original catalog body is retained unchanged for source discovery. Its previous foundation/parity conclusions are superseded by VQ-PRODUCT-TRUTH-002. Current authority is vibequestbest, then vibequest last, then VQ, subject to explicit owner requirements. Use the current product-truth registers for the reconstruction contract.

---

# VQ product parity reference audit

Source root: `C:\Users\GrowB\Desktop\ViBeQues-Selection\VQ`. Date: 2026-10-09. Authority: `VIBEQUEST_FOUNDATION_001_V2_PRODUCT_PARITY_CLEAN_REBUILD.md`, explicitly adopted by the product owner. This audit is source inspection only: no reference service was installed, started, contacted or modified; no `.env` was read. A source path below is relative to this root; line numbers refer to inspected files, not an unversioned graph or generated distribution.

## Classification and preservation contract

WORKING means an implemented local presentation mechanism can be followed in source; it is **not runtime verification**. UI-ONLY means presentation, alert or local state without the claimed service. SIMULATED identifies invented/seeded records, client-owned business persistence, synthetic camera/audio proofs or fake partner activity. BROKEN identifies a concrete source contradiction or invalid dependency. UNVERIFIED means a real service call exists but backend, credentials, authorization and runtime results were not executed. Mixed classifications are deliberate.

All capabilities below are PRESERVE or ENHANCE except unresolved mechanics marked NEEDS PRODUCT DECISION. Every row is a roadmap obligation. FOUNDATION means rendered/navigation/empty/unavailable only, except the new published Places read; production behavior waits for the listed owner/stage. Proposed future routes use `/:locale` with `/telegram` as host entry, not a second route owner. No legacy code should be imported.

## Navigation and page crosswalk

| Evidence                                                                            | Legacy destination / copy                                         | Observed behavior                                                          | New route / owner / stage                                                                                                                       |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/Shell.tsx:97`                                                | HOME / Lucide Home, orange                                        | In-memory tab selection, reset scroll on destination change                | `/home`; shared Shell FOUNDATION; PRESERVE                                                                                                      |
| `src/components/layout/Shell.tsx:98`                                                | EXPLORE / Compass, blue                                           | Same tab dispatcher                                                        | `/explore`; Places FOUNDATION; PRESERVE                                                                                                         |
| `src/components/layout/Shell.tsx:99`                                                | SHARE / elevated central Heart, rose                              | Opens ShareGoodVibesScreen; no visible text below heart in reference       | `/share`; Share presentation FOUNDATION; accessible Share label required; PRESERVE                                                              |
| `src/components/layout/Shell.tsx:100`                                               | VIBE / Users, purple                                              | Renders VibeCenterView                                                     | `/vibe`; Vibe presentation FOUNDATION; PRESERVE                                                                                                 |
| `src/components/layout/Shell.tsx:101`                                               | PURSE / Bitcoin, orange; internal id `crypto`                     | CryptoScreen wraps CryptoDashboard                                         | `/purse`; Purse FOUNDATION, Rewards/Commerce later; PRESERVE                                                                                    |
| `src/app/routes/ScreenRouter.tsx:31`                                                | All screen ids                                                    | useState router has no URL/history/deep links. Login gate precedes app     | ENHANCE to one shared URL router and public shell                                                                                               |
| `src/components/layout/Shell.tsx:112`                                               | Round 🤪 brand mark, VIBEQUEST (QUEST emerald), GATHER & DISCOVER | Wordmark opens Home; location opens Explore; theme button; profile sidebar | Shared header FOUNDATION; PRESERVE composition; eliminate fake badge                                                                            |
| `src/components/layout/Shell.tsx:150`                                               | Theme sun/moon                                                    | Calls one toggle; hardcoded red account dot always shown                   | Shared Theme FOUNDATION; explicit light/dark/system; notification later                                                                         |
| `src/screens/ProfileScreen.tsx:18`, `src/components/profile/ProfileSidebar.tsx:105` | Profile / Profile & Settings / Voyager console                    | Sidebar, ProfileView editing, profile screen reachable by router id        | `/profile`, `/settings` Profile/Identity later; header honest unavailable access now                                                            |
| `src/components/profile/LoginConsole.tsx:11`                                        | Splash / Sign In / Create Profile / Google / Guest                | Internal panes and Supabase auth calls                                     | `/sign-in`, `/register`, `/recover` Identity later; public FOUNDATION does not inherit login gate                                               |
| `src/screens/AdminScreen.tsx:1`                                                     | Admin Dashboard / Administration Console                          | Wraps AdminConsole with client role check                                  | `/admin` Admin/Audit/Moderation later; catalog only                                                                                             |
| `src/components/chat/VibeCenterView.tsx:248`                                        | Vibe Share / camera and chat circles / Rumi banner                | Composer button opens social composer; quote above horizontal rail         | `/vibe` FOUNDATION presentation; PRESERVE black/gold dial composition                                                                           |
| `src/components/explore/VibeHubTabs.tsx:23`                                         | GOSSIP, DRIFT, VIBES, ORBIT, ECHO, PULLS                          | **Six** internal tabs, matching content cases                              | Foundation first five in authoritative order. `/vibe/pulls` future challenge inbox; no silent deletion; NEEDS PRODUCT DECISION about later rail |
| `src/features/crypto/components/CryptoDashboard.tsx:260`                            | VQ WALLET / P2P TRADING                                           | Two in-memory tabs                                                         | `/purse?view=wallet`, `/purse?view=p2p` FOUNDATION honest presentation; PRESERVE                                                                |

Mobile/Telegram: retain five primary positions, central heart accessible name, horizontally scrollable Vibe rail and two Purse tabs. Replace reference fixed max-width phone frame and multiple overlapping modal owners with shared shell safe areas, content clearance and semantic tokens. Source shell auto-hides navigation on scroll (`Shell.tsx:59`) and fixes h=100vh/max-w-md (`:105`); this is implementation to improve, not a product permission to hide destinations.

## Home feature catalog

| ID / evidence                                                                                                                            | Labels and intended user goal                                                                                                             | Actual source behavior / data                                                                                                                                                            | Owner, target, stage, preservation                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| VQ-H01 `src/screens/HomeScreen.tsx:201`                                                                                                  | Location row, search, profile pill                                                                                                        | Explore navigation; profile name fallback Sarah J. and status dot fabricated; browser location provider / manual area                                                                    | Profile + Places; Home FOUNDATION contextual area with no fake user; ENHANCE                                              |
| VQ-H02 `src/features/home/components/VibeCheckInsScroll.tsx:33`, `hooks/useHomeCheckInFeed.ts:8`, `src/services/venueCheckInStore.ts:15` | VIBE CHECK-INS / CURRENT VIBE, visitor facepile, venue cards; find connected activity                                                     | Locally seeded check-ins filtered with local following/matches; polls store. current-user identity fallback; SIMULATED                                                                   | Geo Presence + Social Graph; Home FOUNDATION headings, no invented check-ins; PRESERVE                                    |
| VQ-H03 `components/HomeActiveAlertBanner.tsx:1`, `hooks/useHomeFlashEvents.ts:5` under `src/features/home`                               | Flash Event Alert! / HUNT NOW! / CREATE FLASH; hunt nearby secrets                                                                        | Default Secret Pop-up Gallery, Alex Rivera and attendees are seeded; `vq_flash_events` countdown persisted locally every second; SIMULATED                                               | Events + Quests; Home FOUNDATION card unavailable; `/events/flashes` later; PRESERVE                                      |
| VQ-H04 `src/features/home/components/HomeFlashListModal.tsx:64`                                                                          | LIVE SECRETS BOARD, list/grid expansion and secret selection                                                                              | Array cards open hunt modal; test warehouse and sunset-rave spawn fixtures; local only                                                                                                   | Events/Quests; future flash list; PRESERVE                                                                                |
| VQ-H05 `src/features/home/components/HomeEventAlertModal.tsx:73`                                                                         | Hunt stages, map/directions, proximity, claim, Interested / Going, rules, access, transport, photos                                       | Computes client distance, local RSVPs, claim points through auth RPC and inserts local Purse ledger; no canonical attendance/proof; SIMULATED/UNVERIFIED                                 | Events + Attendance + Geo Presence + Rewards; future detail; NEEDS PRODUCT DECISION for geofence/privacy/rewards          |
| VQ-H06 `src/features/home/components/HomeCreateFlashModal.tsx:88`, `hooks/useHomeFlashEvents.ts:121`                                     | Secret Flash creation, title/description/rules/extra comment/photos/duration/location/reward/free or paid entry/parking/transport         | Local array insert + browser CustomEvent; duration 30m/1h/2h/4h/8h/24h; directional offsets to 10km; fabricated fallback coordinates. No real publishing                                 | Events/Quests, Media before images, Commerce before paid entry; FOUNDATION explanatory entry only; NEEDS PRODUCT DECISION |
| VQ-H07 `src/features/home/components/LiveActivitiesPanel.tsx:41`, `hooks/useHomeActivityFeed.ts:1`, `data/homeHelpers.ts:29`             | Live Activities / Upcoming Neighborhood Loops; find neighborhood activities                                                               | City-specific editorial arrays presented live, random ticker; upcoming seed list + localStorage; SIMULATED                                                                               | Events + Social Content; Home FOUNDATION sections empty; PRESERVE                                                         |
| VQ-H08 `src/features/home/components/LiveActivitiesPanel.tsx:191`                                                                        | Add activity / profile and verification steps / title, location, date, emoji / expand / resonance / ratings / short evaluation / reminder | Profile completion and activity writing are local state; local star/review storage, resonance increments. Reminder merely says alert 15m before, no scheduling (`:499`)                  | Profile, Events, Social Content, Notifications; later `/activities/:id`; PRESERVE; reminder UI-ONLY                       |
| VQ-H09 `src/features/home/components/LiveEventsPanel.tsx:238`, `hooks/useHomePersistence.ts:7`                                           | Live Events & Happenings / Upcoming Events / Host New Live or Upcoming Event / organizer name / category / RSVP / ratings and reviews     | Seed events spanning Tunis/SF/Oakland; localStorage event creation + RSVP + reviews. No organizer authorization or server attendance                                                     | Events + Organizers + Attendance; Home FOUNDATION modules; future `/events/:id`; PRESERVE                                 |
| VQ-H10 `src/features/home/components/DailyStreakQuest.tsx:1`, `hooks/useHomeStreak.ts:39`                                                | Daily Streak Quest / check in / reward / day progress                                                                                     | Claim adds **5** to streak each day and +20 via reward RPC; browser date/localStorage authority; SIMULATED; incompatible with real consecutive-day streak                                | Rewards + Geo Presence; Home FOUNDATION unavailable; NEEDS PRODUCT DECISION for consecutive-day policy                    |
| VQ-H11 `src/features/home/components/DiscoveryRadarPanel.tsx:43`, `hooks/useHomeRadar.ts:73`                                             | Discovery Radar / Radar Standby / PING / hidden/trending/legendary / browse results                                                       | Google Places nearby attempt 10km, max20, assigns reward rarity; if unavailable generates GPS-offset fictional businesses and reviews, awards scan points; SIMULATED/UNVERIFIED provider | Places public read FOUNDATION real list; Rewards later; preserve radar module; ENHANCE truthful failure                   |
| VQ-H12 `src/features/home/components/CompassModal.tsx:1`, `src/shared/browser/openExternalMap.ts:1`                                      | Navigation Compass / spot list / external map                                                                                             | Opens external map URL; provider execution unverified                                                                                                                                    | Places + browser host; future map detail; PRESERVE                                                                        |
| VQ-H13 `src/features/home/components/HomeFeedTabs.tsx:45`, `hooks/useHomePersistence.ts:68`, `data/homeHelpers.ts:129`                   | My Network / Local Vibes / For You; post text/images, like, comment, local labels                                                         | Seed posts mixed with local custom posts and vqApi cloud polling 6s; likes local React state, comments browser storage; posts carry invented votes/nearby context                        | Social Content + Graph; Home FOUNDATION empty feed; `/home?feed=` later; PRESERVE                                         |
| VQ-H14 `src/features/home/hooks/useHomeFeedActions.ts:19`                                                                                | Tip VQ / liked vibe signals                                                                                                               | Tip changes component tally and success toast; no actual debit or recipient credit; SIMULATED (helper not necessarily used by current feed)                                              | Rewards/Commerce later, financial authorization needed; NEEDS PRODUCT DECISION                                            |
| VQ-H15 `src/features/home/components/HomeCuratedCoordinates.tsx:1`, `data/homeHelpers.ts:22`, `hooks/useHomePersistence.ts:197`          | Curated Heritage Coordinates / discover/claim Bardo Gate, Clarion Vinyl Vault, Telegraph Sanctum                                          | Fixed editorial points/location descriptions and local claims; no presence enforcement                                                                                                   | Places + Quests/Rewards; Home FOUNDATION section; PRESERVE curation concept, no fixture as live record                    |
| VQ-H16 `src/screens/HomeScreen.tsx:340`                                                                                                  | Local Gems; favorites, expanded venue descriptions, ratings/reviews and directions                                                        | Fixed venueDescriptions/image mapping merged with seeded check-in venues; favorite flags localStorage                                                                                    | Places + Social Content; Home FOUNDATION empty Local Gems; future `/places/:id`; PRESERVE                                 |
| VQ-H17 `src/features/home/components/PlaceDetailModal.tsx:56`                                                                            | Place details, Google/community reviews, write review, respond as business, website/phone/map                                             | Firestore review query/write with local fallback; local business replies; no verified business authority; SIMULATED/UNVERIFIED                                                           | Places read + Social Content/Moderation + Organizers; later place detail; PRESERVE                                        |
| VQ-H18 `src/screens/HomeScreen.tsx:470`, `src/features/home/components/CommunityHandbookModal.tsx:31`                                    | VIBE Guide / Establish Daily Streak / Charge Vibe Radar / Tip Neighborhood Culture                                                        | Informational modal and alert entry points                                                                                                                                               | Profile/help + domain concepts; Home FOUNDATION meaningful explanation; PRESERVE                                          |
| VQ-H19 `src/screens/HomeScreen.tsx:490`, `hooks/useHomeScrollBanner.ts:1`                                                                | Live Feed System / Open Vibe Feed / F key quick toggle                                                                                    | Local feed overlay, scroll banner + keyboard state; no separate canonical feed owner                                                                                                     | Social Content; preserve feed entry later; ENHANCE accessible keyboard/shell ownership                                    |
| VQ-H20 `src/features/home/components/DiscoveryAdderModal.tsx:1`                                                                          | Discovery Portal: profile name/bio/vibe, add live activity, experience verification                                                       | Updates simulated profile/local feed and confirms via alerts; no real verification                                                                                                       | Profile + Events + Geo Presence; future `/activities/new`; PRESERVE, mechanics decision                                   |
| VQ-H21 `src/screens/HomeScreen.tsx:524`, `src/lib/pushNotifications.tsx:98`                                                              | Flash alert settings: enabled, radius, sound, browser permission                                                                          | Local prefs; browser Notification permission on action; CustomEvent and storage notifications, no server push delivery                                                                   | Notifications + host; later `/settings/notifications`; PRESERVE                                                           |

## Explore feature catalog

| ID / evidence                                                                                                               | Labels / goal                                                                                                                                   | Actual behavior / classification                                                                                                                                              | New owner / stage / preservation                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| VQ-E01 `src/screens/ExploreScreen.tsx:439`                                                                                  | Explore Local / Discover amazing local businesses and hidden gems in {city}; Community First / Small Business                                   | Rich original discovery hierarchy                                                                                                                                             | Places; FOUNDATION title/chips preserved with real public reader; PRESERVE                                                         |
| VQ-E02 `src/screens/ExploreScreen.tsx:549`, `src/features/explore/hooks/useVenueSearch.ts:34`                               | Search regional vibes (Google & Mapbox powered), suggestions, category chips All/Food/cafés/Culture/Art/Venues/Hidden                           | Debounced Overpass query for text>=3; client filters; source label overstates providers. Credentials/runtime unknown                                                          | Places; FOUNDATION canonical search/filter only if real; ENHANCE                                                                   |
| VQ-E03 `src/features/explore/hooks/useExploreRadar.ts:172`                                                                  | Category discovery Food & Drink / Music & Arts / Culture / Nightlife / Cafés / Shopping                                                         | Overpass OSM browser calls radius3km/10km/25km; empty/error replaced with fictional names/GPS offsets; fake stable ratings/visitors generated at `:148`; SIMULATED/UNVERIFIED | Places owns canonical reads; FOUNDATION public PostGIS slice, truthful empty/error; ENHANCE                                        |
| VQ-E04 `src/components/explore/ExploreHeatmap.tsx:413`, `src/features/explore/components/VenueHeatmap.tsx:1`                | HEAT WAVE / SONAR SWEEP / continuous thermal scan / PEAK, STEADY, etc.; hide/reveal/zoom/calibrate/LOCATE                                       | Custom canvas projects coordinates, thermal score based on fake ratings/visitors, flash markers, tooltips and refresh callbacks. No real street basemap                       | Places presentation + Geo Presence; FOUNDATION map/list additive, honest tile unavailable; preserve radar personality; ENHANCE     |
| VQ-E05 `src/screens/ExploreScreen.tsx:842`, `src/features/explore/components/VenueCard.tsx:1`                               | Categories / venue cards: picture, name, category, distance, rating, visitors, confidence, rarity/reward                                        | Image chosen by name/category, statistical confidence derived from rating/local confidence and visitors. Not independent confirmation count                                   | Places + later Presence/Rewards; FOUNDATION only actual published Place fields; PRESERVE cards, ENHANCE truth                      |
| VQ-E06 `src/features/explore/hooks/useExploreRadar.ts:367`                                                                  | Discovery Radar / Charge % / PING for Discoveries                                                                                               | 5% recharge/10s, ping creates named fictional legendary spot, 500 points hint; SIMULATED                                                                                      | Quests + Places; FOUNDATION radar unavailable; NEEDS PRODUCT DECISION for charge/reward mechanics                                  |
| VQ-E07 `src/screens/ExploreScreen.tsx:429`, `src/features/explore/hooks/useExploreRadar.ts:110`                             | SPAWN FLASH / Flash Event Alert / Live Secrets Board / HUNT NOW                                                                                 | Random template, 1h timer, fake creator/attendees; same local key as Home                                                                                                     | Events/Quests; FOUNDATION entries/explanation, no creation; PRESERVE                                                               |
| VQ-E08 `src/features/explore/components/FlashListModal.tsx:62`, `ActiveFlashModal.tsx:197`                                  | Secret list; detect/hunt/verify/claim; free/paid, rules/comments/photos/parking/transport                                                       | Local arrays, browser proximity/camera modes and reward actions. Fixture spawn; no server canonical flash                                                                     | Events + Quests + Presence + Media; later flash routes; preserve, privacy/timer/reward decision                                    |
| VQ-E09 `src/features/explore/components/VenueDetailSheet.tsx:135`                                                           | Details / Mayor / Gatherings; AI Vibe Match Score / Match Relevance Breakdown                                                                   | Client heuristic score includes assumed interests/activity, local check-ins/favorites/communities/time. Not model verified match                                              | Places read + matching/Profile; future `/places/:id`; PRESERVE; heuristic product decision                                         |
| VQ-E10 `src/features/explore/components/VenueDetailSheet.tsx:267`, `src/features/share-good-vibes/utils/gamification.ts:24` | VENUE MAYOR OF THE SPOT / STREAKS & VIBE BADGES                                                                                                 | Count local check-ins with seeded competitor or ghost_scout fallback; no canonical leaderboard                                                                                | Rewards + Geo Presence; later place achievements; PRESERVE concept, no fake mayor                                                  |
| VQ-E11 `src/features/share-good-vibes/utils/gamification.ts:126`                                                            | Caffeine Fiend (3 cozy), Gourmet Scout (2 chilled), Night Mayor (2 hype), Culture Vulture (2 culture), Vibe Vanguard (5 scans)                  | Badges computed from local labels and scanned-key count; threshold and ownership unverified                                                                                   | Rewards; future `/profile/badges`; NEEDS PRODUCT DECISION thresholds                                                               |
| VQ-E12 `src/features/explore/components/VenueDetailSheet.tsx:346`, `src/services/vibeGatheringStore.ts:21`                  | POP-UP GATHERINGS (MEETUPS) / Launch Pop-up / Publish / Join/Leave; 15m/30m/1h/live; 2h gatherings                                              | Local seeded gathering store, RSVP capacity locally enforced, no cross-client membership                                                                                      | Events + Attendance; later `/places/:id/gatherings`; PRESERVE                                                                      |
| VQ-E13 `src/screens/ExploreScreen.tsx:277`, `src/features/explore/components/VenueDetailSheet.tsx:491`                      | Check-in to Gain PTS / Verified state                                                                                                           | Client scanned flags and local venueCheckInStore + repository writes; points via auth RPC; claiming can fail/misrepresent                                                     | Geo Presence + Rewards; future check-in; FOUNDATION unavailable; NEEDS PRODUCT DECISION                                            |
| VQ-E14 `src/features/explore/components/ProximityValidator.tsx:127`                                                         | ARE YOU HERE RIGHT NOW? / Yes/No/Not Here / Vibe Validate Spot (Waze-style) / required <=200m                                                   | Prior local check-in OR client distance permits; Yes adds15 confidence + reward; No minus25 confidence +10 reward; claim municipal synchronization unsupported; SIMULATED     | Place Contributions distinct from Places; FOUNDATION pre-submission panels, new Suggest/Report/Ask additive; ENHANCE               |
| VQ-E15 `src/features/explore/components/VenueDetailSheet.tsx:524`                                                           | View Map & Directions / Close Spot Details                                                                                                      | Opens OSM URL with coordinates in new tab; genuine code path but external runtime not verified                                                                                | browser host/Places; later detail; PRESERVE                                                                                        |
| VQ-E16 `src/features/explore/components/VibeTrailsSection.tsx:238`, `hooks/useVibeTrails.ts:69`                             | Vibe Trails / Curate a Spot / Cultural Passport / save, category/search/detail                                                                  | Firestore query, auto-writes seed trails when empty, offline seed fallback; saves via arrayUnion/arrayRemove. Real call + simulation; UNVERIFIED/SIMULATED                    | Places curated read + Contributions + Profile bookmarks; FOUNDATION module; `/explore/trails`, `/profile/passport` later; PRESERVE |
| VQ-E17 `src/features/explore/components/VibeTrailsSection.tsx:393`                                                          | New trail name/address/story/category/tags/photo presets/map pin/Google search; Secret Spot/Viewpoint/Café/Nature/Art Space/Nightlife/Speakeasy | Form writes Firestore; random SF coordinates fallback if missing; image presets remote Unsplash                                                                               | Contributions, Media before uploads; future `/explore/trails/new`; PRESERVE, no unsafe fallback                                    |
| VQ-E18 `src/screens/ExploreScreen.tsx:892`, `src/shared/services/ai/deviceAiService.ts:6`                                   | Vibe suggestions active / Vibe Suggestions / Local Matching privacy check                                                                       | Native bridge, local Ollama endpoint, Chrome built-in, server /api/ai, or offline rule text; UI privacy alert overstates proof. No server implementation found for API routes | Profile preferences + matching; future settings/Explore suggestions; PRESERVE AI optionality; claims need verification             |
| VQ-E19 `src/screens/ExploreScreen.tsx:380`, `src/lib/GeolocationProvider.tsx:172`                                           | Area selector / GPS reset / manual location / resolved coordinate debug                                                                         | Nominatim reverse geocode + browser storage manual/last-known location; device watcher may run globally; debug teleport helpers substitute position                           | host + Places browsing prefs separate from proof; FOUNDATION opt-in/manual city; ENHANCE privacy                                   |

## Share Good Vibes and presence media catalog

| ID / evidence                                                                                                                          | Labels / goal                                                                                                                                                                         | Actual behavior / classification                                                                                                                                                                     | Owner / route / stage / status                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| VQ-S01 `src/screens/ShareGoodVibesScreen.tsx:546`                                                                                      | SHARE GOOD VIBES; “Share the moment. Feel the city together. Right now.”; warm authentic human presence                                                                               | Hero + three feature cards and large share CTA                                                                                                                                                       | Share FOUNDATION; PRESERVE opening, truthful unavailable state                                                                 |
| VQ-S02 `src/components/share/LiveCameraFeatures.tsx:81`                                                                                | Live Vibe Shot / Camera only — no uploads; VibeCheck / 5-min live response; Vibe Flash / 3-min window                                                                                 | Entry opens camera/challenge/flash, cards do not reflect underlying durations (33s/60s)                                                                                                              | Quests + Media; `/share` FOUNDATION entries, NEEDS PRODUCT DECISION timers/proof                                               |
| VQ-S03 `src/features/share-good-vibes/components/ShareVibeModal.tsx:106`, `hooks/useShareCamera.ts:139`                                | Viewfinder -> Preview -> Details -> publish; dual shot, retake, drag front inset, GPS stamp, expiry test accelerator                                                                  | Requests real cameras on modal opening, sequential dual capture; on failure canvas mock + emoji selfie, manual GPS fallback; SIMULATED/UNVERIFIED hardware                                           | Media + Geo Presence + Social Content; future `/share/capture`; no FOUNDATION camera requests; NEEDS PRODUCT DECISION          |
| VQ-S04 `src/components/share/VibePhotoCapture.tsx:385`                                                                                 | Photo Mode / Video Mode (10s) / lens flip / shutter / preview / retake / use shot; maritime/urban/forest style                                                                        | Real getUserMedia/canvas or silent simulator; allows permission as true on failure; video may record simulated canvas; local Blob/data URLs                                                          | Shared Media entity references owned by posts/checks; future capture; preserve UI, rebuild truthful permission/format handling |
| VQ-S05 `src/components/share/LiveCameraModule.tsx:144`                                                                                 | Live camera publish                                                                                                                                                                   | vqApi social_posts create; fabricated success possible on network/table failure                                                                                                                      | Social Content + Media; later; PRESERVE capture concept                                                                        |
| VQ-S06 `src/hooks/useVibePhotoCapture.ts:2`, `src/features/share-good-vibes/utils/moodFilters.ts:1`                                    | Mood filters / intensity / theme-sensitive default / Amber Aura / Neon Dawn / Obsidian Glow concepts                                                                                  | Hook imports MOOD_FILTERS/MoodFilter from VibePhotoCapture which does not export them; BROKEN source dependency. Separate filter utility exists with local-time/solar logic                          | Media presentation; future filter contract; PRESERVE names, no legacy import                                                   |
| VQ-S07 `src/screens/ShareGoodVibesScreen.tsx:589`                                                                                      | Pure Heart / Friendly Spark / Shared Moments; Nearby Vibes / Communities / Create Community                                                                                           | Filter state, GPS sort, scroll and modal toggles                                                                                                                                                     | Communities + Presence; Share FOUNDATION modules; PRESERVE                                                                     |
| VQ-S08 `src/features/share-good-vibes/hooks/useLiveVibeFeed.ts:45`, `src/screens/ShareGoodVibesScreen.tsx:675`                         | Nearby Ephemeral Vibe Feed / join / edit / delete / note/tag/location/emoji/media                                                                                                     | Seed activity + random simulated ticker each11s, static compatibility/distance; writes browser Home post store plus vqApi social_posts, local edit/delete only; claims verified vicinity and rewards | Social Content + Geo Presence + Media; Share FOUNDATION empty feed; PRESERVE, timing/visibility decision                       |
| VQ-S09 `src/screens/ShareGoodVibesScreen.tsx:313`, `components/EchoConnectionModal.tsx:51` under share-good-vibes                      | Echo / alignment / note / creator accept/reject / connection request                                                                                                                  | Static seeded echoes with match%; sends DM repository record or vqApi while adds local request state and reward alert; actual delivery unverified                                                    | Social Graph + Messaging + Communities; later `/share/connections`; PRESERVE                                                   |
| VQ-S10 `src/screens/ShareGoodVibesScreen.tsx:431`, `components/JoinVibeModal.tsx:49` under share-good-vibes                            | Join Vibe / nearby connection note / photo                                                                                                                                            | Connection request messages with fallback; fabricated +15 reward claims                                                                                                                              | Messaging + Social Graph + Media; later join flow; PRESERVE                                                                    |
| VQ-S11 `src/screens/ShareGoodVibesScreen.tsx:852`, `data/vibeData.ts:66` under share-good-vibes                                        | Aesthetic Discovery Compass; Vibe Matching, Spontaneous Gatherings, Daily Journeys, Sanctuary Shares                                                                                  | Four groups with12 static themed subideas and fake match percentages/echo actors                                                                                                                     | Communities/Events/Places; Share FOUNDATION categories; PRESERVE names; omit invented match stats                              |
| VQ-S12 `src/features/share-good-vibes/data/vibeData.ts:66`                                                                             | Interest Circles, Spontaneous Coffee, Shared Flow; Pop-up Meetups, Group Walks, Outdoor Sessions; Coffee Walks, Local Trails, Sunset Pulse; Quiet Nooks, Roof Terraces, Inner Gardens | Category cards prefill create-community form and connection modal; static examples not activity                                                                                                      | Communities + Events + Places; preserve all12 in roadmap and meaningful shells; future subroutes                               |
| VQ-S13 `src/features/share-good-vibes/components/VibeCirclesPanel.tsx:1`, `hooks/useCommunityDirectory.ts:17`                          | Vibe Circles & Hotspots / All Communities / Join/Leave / members/chat                                                                                                                 | Empty list triggers creation of3 seeded communities via vqApi; join writes membership then local counts/reward; leave does **not delete persisted membership**                                       | Communities owns lifecycle; `/circles`, `/circles/:id`; later; PRESERVE, BROKEN leave parity                                   |
| VQ-S14 `src/features/share-good-vibes/components/CreateCommunityModal.tsx:74`, `hooks/useCommunityCreationFlow.ts:83`                  | Create Vibe Circle: name/unique handle/emoji/description/tag/category/custom/private/map point/address                                                                                | Client uniqueness against current list, creates vqApi community, autojoins guest fallback id, awards25; fake id possible.11 categories + custom; map/UI actual coordinate source                     | Communities + Places context; later create circle; PRESERVE                                                                    |
| VQ-S15 `src/features/share-good-vibes/components/VibeCircleMembersModal.tsx:41`                                                        | Circle member list / connection/chat                                                                                                                                                  | Queries membership/profiles then opens actions, source-backed cloud attempts but no proven authoritative membership                                                                                  | Communities + Graph + Messaging; future members; PRESERVE                                                                      |
| VQ-S16 `src/features/share-good-vibes/components/DonationModal.tsx:56`, `hooks/useDonationFlow.ts:17`, `services/donationService.ts:5` | Vibe Backing / SOL or USDC amounts / Confirm Donation / Writing ledger coordinates / Vibe Circle Supported                                                                            | Creates generic donation record, waits1400ms awards50 points and completed. **No blockchain transfer**                                                                                               | Commerce + Rewards, separate explicit financial contract; `/circles/:id/backing` later; NEEDS PRODUCT DECISION                 |
| VQ-S17 `src/native/VibeCheckComposer.tsx:104`, `vibeCheckService.ts:60`                                                                | Fire VibeCheck / presets or<=60-character prompt / Incoming VibeCheck / Ignore / Prove It                                                                                             | Fixed `current_user`, demo target in card; repository attempts + local fallback;33s deadline; request service can confirm without capture                                                            | Quests/VibeCheck + Identity + Messaging; future `/vibe/checks/:id`; preserve flow, NEEDS PRODUCT DECISION                      |
| VQ-S18 `src/native/VibeShotResponse.tsx:132`, `VibeCheckReveal.tsx:186`, `VibeCheckHistoryCard.tsx:36`                                 | Challenge capture/send / reveal dual image, draggable inset / fire-cap-vibing reactions / pending/responded/confirmed/ghosted history                                                 | Fake camera fallbacks claim SECURE VERIFIED; local/GPS and Supabase hybrid; expiry server update uses timestamp as id (`vibeCheckService.ts:190`)                                                    | Quests + Presence + Media; later; BROKEN/SIMULATED/UNVERIFIED; retain states, discard fake proof                               |
| VQ-S19 `src/native/vibeFlashService.ts:16`, `useVibeFlashWindow.ts:125`, `VibeFlashShotResponse.tsx:130`                               | VibeFlash spontaneous window / Capture Now / Not Now / response                                                                                                                       | 60s, direct browser records; missing/file:// photo replaced with remote mock; real sensor claim contradicted                                                                                         | Quests/VibeFlash + Notifications + Media; future `/share/flash`; NEEDS PRODUCT DECISION                                        |
| VQ-S20 `src/features/native-vibes/vibeFlashScheduler.ts:10`, `VibeShotCamera.tsx:55`, `VibeShotPreview.tsx:26`                         | Native random notifications 1–8h / 20h reschedule; front/back proof, flash modes, preview<5m                                                                                          | React Native/Notifee/VisionCamera source separate from Web entry imports; no proved shipped integration. Same five-minute image-age distinct from capture challenge window                           | Notifications + host + Media; future native concepts catalog only; UNVERIFIED/disconnected; preserve ideas                     |

## Vibe, social and conversations catalog

| ID / evidence                                                                                                                                                        | Preserved feature identity                                                                                                                             | Actual behavior / classification                                                                                                                                                                 | Owner / future route / stage / status                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| VQ-V01 `src/components/chat/VibeCenterView.tsx:248`                                                                                                                  | Vibe Share gold outlined pill with camera left/chat right; Rumi field quote                                                                            | Opens composer; static quote banner                                                                                                                                                              | Vibe FOUNDATION faithful presentation; PRESERVE                                                                    |
| VQ-V02 `src/components/chat/VibeCenterView.tsx:150`                                                                                                                  | GOSSIP connected feed; “No connected vibes yet” / Drift & Discover                                                                                     | Poll vqApi posts5s, filter following/mutual/self using seeded store; fallback mock post                                                                                                          | Social Content + Graph; `/vibe?tab=gossip`; FOUNDATION pending identity/feed; PRESERVE                             |
| VQ-V03 `src/components/chat/DriftView.tsx:33`                                                                                                                        | DRIFT / Shared Wavelengths / Back to Drift Frequency List / Drifting Active / drifters / follow / prompt                                               | 12 categories; match filter forcibly includes chill users, cyber_voyager/analog_lens; local follows,33s challenges; SIMULATED                                                                    | matching/Profile + Social Graph + Quests; `/vibe?tab=drift`; FOUNDATION category explanation; PRESERVE             |
| VQ-V04 `src/components/chat/DriftView.tsx:33`                                                                                                                        | Chill Vibes, Sweat Vibes, Lounge Vibes, Brain Vibes, Sunset Vibes, Mellow Vibes, Echo Vibes, Zen Vibes, Groove Vibes, Pixel Vibes, Quest Vibes, Wander | Each category selection exposes its description and match list; no independent canonical match engine                                                                                            | Profile matching; preserve all12 category identities in roadmap; later approved matching                           |
| VQ-V05 `src/components/chat/VibeCenterView.tsx:393`                                                                                                                  | VIBES / Match Box is Clear / Your Mutual Matches / Find Matches / VibeCheck                                                                            | Confirmed challenge requests treated as mutual match; seeded/local engines                                                                                                                       | Social Graph + Quests; FOUNDATION honest matching unavailable; PRESERVE                                            |
| VQ-V06 `src/components/chat/VibeCenterView.tsx:441`                                                                                                                  | ORBIT / You are Following / Orbit People                                                                                                               | Following list; follow/unfollow localStorage                                                                                                                                                     | Social Graph; FOUNDATION no fabricated follows; PRESERVE                                                           |
| VQ-V07 `src/components/chat/VibeCenterView.tsx:485`                                                                                                                  | ECHO / Your Followers List / No followers yet                                                                                                          | Followers list; local graph, follow-back                                                                                                                                                         | Social Graph; FOUNDATION unavailable; PRESERVE                                                                     |
| VQ-V08 `src/components/chat/VibeCenterView.tsx:534`, `src/components/common/VibeRequestCard.tsx:1`                                                                   | PULLS / Vibe Inbox / Incoming Vibe Challenges / Accept / Ignore                                                                                        | Sixth rail case; accept confirms immediately, ignore ghosted; seeded request to current_user                                                                                                     | Quests + Messaging/Graph; future `/vibe/pulls`; preserve capability, defer rail decision                           |
| VQ-V09 `src/components/chat/VibeComposer.tsx:51`                                                                                                                     | EXPLORER COMPOSER / LOCAL FEED CHANNEL / 280-character post / emoji / photo10s video / locality presets/custom                                         | Generic vqApi create social_posts, no userId in payload; fabricated success fallback, local data URI                                                                                             | Social Content + Media; `/vibe/compose` later; FOUNDATION CTA explanation; PRESERVE                                |
| VQ-V10 `src/components/chat/VibeCard.tsx:1`, `src/components/common/VibeGem.tsx:1`, `VibeMatchRow.tsx:1`, `src/components/profile/FollowRow.tsx:1`                   | Post card / match score / online/unread / timestamp/photo / follow rows / check action                                                                 | Prop rendering; ratings/85 match score fallback not authentic signals                                                                                                                            | Social Content + Graph + Presence; preserve presentation later; no fake live metadata                              |
| VQ-V11 `src/components/explore/DiscoverCard.tsx:1`                                                                                                                   | Discovery profile, interests/activity/likes/dislikes, friendship/colleagues/romance, score/gauge/prompt                                                | UI callbacks + sent timer; not mounted as a visible Discover rail in current VibeCenterView; catalog disconnected concept                                                                        | Profile + Graph; later `/vibe/discover`; PRESERVE, no invented runtime reachability                                |
| VQ-V12 `src/components/chat/VibeChatThread.tsx:29`                                                                                                                   | Inline matched chat / Active Connection / Say something / photo zoom                                                                                   | Seed opening messages; vqApi chat_messages sender='me'; automatic “That's a vibe” reply after timeout. No actual receiver subscription                                                           | Messaging; future `/messages/:id`; SIMULATED; PRESERVE chat identity, no fake replies                              |
| VQ-V13 `src/features/profile/messages/MessageModal.tsx:48`, `src/infrastructure/repositories/messageRepository.ts:1`                                                 | Pulse DMs / Cozy Direct Messages / Messages and Settings / thread/reply / SENT/RECEIVED                                                                | Supabase subscription/list plus local fallback; send writes generic API and also local record, triggers synthetic storage event; no canonical delivery guarantee                                 | Messaging; later `/messages`; PRESERVE                                                                             |
| VQ-V14 `src/features/profile/messages/MessageModal.tsx:626`                                                                                                          | Restrict Intake follow-only / Min Vibe Filter (0–100) / Save Vibe Rules                                                                                | Browser prefs and generic profile update, no send/read enforcement visible                                                                                                                       | Messaging policy + Graph; `/settings/privacy` later; PRESERVE, UNVERIFIED enforcement                              |
| VQ-V15 `src/components/chat/PaltalkChatroom.tsx:1`, `src/features/chatroom/services/chatroomService.ts:70`                                                           | Paltalk/Paltalk-style Circle chatroom, room header, message stream, local status, members, voice, soundboard                                           | Firestore community doc/messages, while Circles create via Supabase vqApi. Competing stores; realtime backend unverified                                                                         | Messaging + Communities; `/circles/:id/chat`; PRESERVE, ENHANCE one authority                                      |
| VQ-V16 `src/features/chatroom/hooks/useChatPresence.ts:15`, `services/presenceService.ts:1`, `components/LiveMembersSidebar.tsx:1`, `LiveMembersHorizontalBar.tsx:1` | online/idle/offline / Active Cohort / creator/aids/member presentation                                                                                 | Firestore presence set/delete and listener; no freshness expiry contract proven                                                                                                                  | Geo Presence + Messaging/Communities; future circle presence; PRESERVE                                             |
| VQ-V17 `src/features/chatroom/hooks/useVoiceControls.ts:55`, `components/VoiceActiveControls.tsx:1`                                                                  | Local Voice Chat / 10-second memo / preview/discard/send / waveform                                                                                    | MediaRecorder attempts microphone, failure generates simulated WAV; waveform random; memo Base64 in Firestore message                                                                            | Media + Messaging; preserve opt-in voice flow later; SIMULATED/UNVERIFIED capture                                  |
| VQ-V18 `src/features/chat/constants/sounds.ts:1`, `chatroom/hooks/useSoundboard.ts:1`, `services/chatroomService.ts:106`                                             | Vibe Soundboard; airhorn, applause/cheer, cash register, guitar lick, buzzer/chime and other keys                                                      | Browser Audio/synth playback + Firestore soundboard token; shared volume states; runtime audio unavailable to static audit                                                                       | Messaging presentation + host audio; later soundboard; PRESERVE                                                    |
| VQ-V19 `src/features/chatroom/components/ChatMessagesStream.tsx:1`, `hooks/useChatComposer.ts:25`                                                                    | Text/memo/sound messages / send / poll votes / announcement                                                                                            | Writes Firestore message with client creator/aids flags; polls set per-user field; no server membership proof                                                                                    | Messaging + Moderation + Communities; later; PRESERVE with authorization rebuild                                   |
| VQ-V20 `src/features/chatroom/hooks/useChatModeration.ts:36`, `components/AdminModerationPanel.tsx:1`                                                                | Room Guide / Room Moderation: settings/members/invite/bans/poll, creator(CC), community aid(CA), pinned notice                                         | Edit name/emoji/category/address/private, invite adds membership directly; ban/evict, unban/re-add, clear logs, toggle aids, create poll; destructive Firestore writes governed by client checks | Communities + Moderation + Audit; `/circles/:id/manage`; PRESERVE legitimate capabilities, rebuild server policies |

## Purse, Profile, preferences and administration

| ID / evidence                                                                                                       | Labels / goal                                                                                                                                                         | Actual behavior / classification                                                                                                                                                      | Owner / target / stage / preservation                                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| VQ-P01 `src/features/crypto/components/CryptoDashboard.tsx:19`                                                      | VQ WALLET / Available Balance / VQ / Send / Receive / My Explorer Share Key / Ledger Activity / REALTIME                                                              | Default1250, three seeded receipts, browser ledger. Fixed displayed key differs from copied handle; fake patterned QR                                                                 | Rewards + future Commerce; `/purse` FOUNDATION not connected, no numeric balance; PRESERVE                                       |
| VQ-P02 `CryptoDashboard.tsx:92` under crypto components                                                             | Send VQ Tokens / recipient/amount / Share VQ / success                                                                                                                | Calls updateProfilePoints(-amount) but auth rejects<=0; source-known BROKEN. If no function, changes local balance. No recipient credit                                               | Rewards/Commerce explicit packet; future transfers; NEEDS PRODUCT DECISION                                                       |
| VQ-P03 `CryptoDashboard.tsx:50`, `:131`                                                                             | P2P TRADING / All Offers / Buying / Selling / New Offer; VQ/SOL/USDC, amount, USD price, payment, place, trust rating                                                 | Seed offers in component; local creation assigns100% trust. Does not reserve/transfer assets                                                                                          | Commerce/Purse, regulatory/security/product decision; FOUNDATION honest empty board; preserve labels                             |
| VQ-P04 `CryptoDashboard.tsx:174`, `:225`                                                                            | Send Trade Request / P2P DIRECT MEETUP / public-place warning / meetup chat / MARK DEAL AS COMPLETED                                                                  | Initial fabricated partner message, keyword synthetic reply, local ledger receipt and local archive; no escrow execution or peer consent                                              | Commerce + Messaging; future `/purse/trades/:id`; NEEDS PRODUCT DECISION escrow vs classifieds; SIMULATED                        |
| VQ-P05 `src/components/profile/ProfileSidebar.tsx:51`, `src/lib/solana.tsx:1`                                       | Discovery Badge Key / Explorer Key / simulated Solana key connector                                                                                                   | Chooses one of3 fixed fake keys then stores wallet via auth API. solana provider is empty pass-through and useWallet returns disconnected                                             | Profile/Rewards vs authentic wallet Identity/Commerce; separate decision; no FOUNDATION key generation                           |
| VQ-I01 `src/components/profile/LoginConsole.tsx:54`                                                                 | Warm Event Discovery & Vibrant Communities / Sign In / Create Profile / Join with Google Account / Guest / Built with Love by Neighbors & Friends                     | Email/Supabase OAuth and local guest state implemented in auth source; external verification absent                                                                                   | Identity; future auth packet; PRESERVE onboarding copy/entry concepts                                                            |
| VQ-I02 `src/components/profile/LoginModal.tsx:19`, `src/lib/auth.tsx:180`                                           | Email/password, resend confirmation, reset password                                                                                                                   | Real Supabase auth calls, recognizable legacy “Decryption” labels; errors surfaced. vqApi separate login still insecure mock JWT                                                      | Identity; `/sign-in`, `/recover`; UNVERIFIED actual backend, do not copy competing auth                                          |
| VQ-I03 `src/components/profile/ProfileView.tsx:13`, `:98`                                                           | Avatar image URL / handle / email / master password / display name / >=3 tags / custom tags / bio / locality / Telegram,X,email contact / Cozy Diary mode             | New registration real Supabase, editing generic vqApi sends password in profile payload + local simulated profile. Handle available errors accepted. Bonus500 claimed UI not verified | Profile + Identity + Media; `/profile/edit`; preserve profile scope; unsafe payload must be rebuilt                              |
| VQ-I04 `src/screens/ProfileScreen.tsx:18`, `:98`                                                                    | Voyager status / Elite Voyager / Sync Preferences / Security Protocol / Identity Verification / +100 loyalty shards                                                   | Rank action invokes reward and alert; menu actions alerts; data tiers arbitrary defaults                                                                                              | Profile + Rewards/Identity; future profile/security; PRESERVE concept, tier/reward needs decision                                |
| VQ-I05 `src/components/profile/ProfileSidebar.tsx:105`                                                              | Profile & Settings, Level, VQ Points, Explorer Tier, Messages & DMs, Notifications, Local Device AI, Locale, Admin Dashboard, App Settings, Local Guide Help, Log Out | Defaults hannibal/1250/6 streak/3 unread/6 active; notification/preferences/help alerts; logout real auth call. Client admin shortcut                                                 | Profile/Identity/Notifications; FOUNDATION header honest anonymous; catalog all menus; PRESERVE without fake status              |
| VQ-I06 `src/lib/theme.tsx:3`, `src/index.css:1`                                                                     | Swarm Mode/Warm Cream Theme vs Cyber Mode/Midnight Neon                                                                                                               | Only light/dark; dark default, localStorage root classes; massive global per-class/light specificity overrides and hardcoded dark panels; no system                                   | Shared UI FOUNDATION semantic light/dark/system; ENHANCE preserve warm/neon personality                                          |
| VQ-I07 `src/features/profile/hooks/useProfileSettings.ts:30`, `src/i18n/index.ts:1`                                 | English/Japanese/French/Arabic/Spanish/Portuguese/Chinese dropdown                                                                                                    | Catalogs7 languages, document lang/dir update local pref. Many component literal English and missing `vibe.*` keys                                                                    | localization FOUNDATION four approved en/fr/ar/es complete; extra3 preserved as future language decision, not launch requirement |
| VQ-I08 `src/features/profile/hooks/useLocalDeviceAiSettings.ts:1`, `src/shared/services/ai/deviceAiService.ts:6`    | Local Device AI toggle, Ollama endpoint/test, detected provider                                                                                                       | Browser-stored settings; endpoint health/tags/generate network call, native bridge/browser model/server fallback/offline rules. Sanitizes long-decimal coordinates only               | Profile settings/AI optional future; PRESERVE, no automatic local/remote AI access FOUNDATION                                    |
| VQ-I09 `src/shared/services/translation/userContentTranslationService.ts:26`                                        | Translate user content / detect language                                                                                                                              | Pass-through placeholder and always en; BROKEN as real translation                                                                                                                    | Social Content translation future explicit scope; PRESERVE capability, no fake translation claims                                |
| VQ-A01 `src/features/admin/components/AdminConsole.tsx:20`, `:147`                                                  | Access Gated / Requires Administrator Role / Elevate Simulated Role to Admin                                                                                          | Client role/accountType check, button directly mutates local profile to admin; no authoritative gating                                                                                | Admin + Identity/Audit; future `/admin`; PRESERVE authorized console, discard elevation mechanism                                |
| VQ-A02 `src/features/admin/components/AdminConsole.tsx:43`, `src/infrastructure/repositories/adminRepository.ts:16` | Platform users/DAU/communities/messages/listings metrics, refresh/detail, growth timeline, points pie/listing bars                                                    | Generic Supabase table reads with swallowed errors; substitutes36 users/5 communities/120 messages/16 listings, fabricated history dates/proportions                                  | Admin read capabilities each owner; future metrics; PRESERVE with actual evidence                                                |
| VQ-A03 `src/components/common/MaterialYou.tsx:1`, `src/features/admin/components/AdminConsole.tsx:24`               | Material3 Playground, buttons/loading/switches/chips/forms/dialog/slider/snackbar cards                                                                               | Component local state demo, delayed loading; design sandbox, not production domain                                                                                                    | UI tooling/Admin future; PRESERVE separate sandbox concept, no foundation surface required                                       |

## Evidence conflicts and stop-safe choices

1. **VibeCheck** card says five minutes (`LiveCameraFeatures.tsx:101`), native composer/service use33seconds (`native/VibeCheckComposer.tsx:104`, `native/vibeCheckService.ts:61`), default social request lasts10minutes (`services/vibeCheckService.ts:13`); image age is five minutes (`useLiveVibeFeed.ts:187`, `VibeShotPreview.tsx:26`). These are different policies, not interchangeable timers. Foundation should expose identity and pending mechanics, not select duration.
2. **VibeFlash** card says3minutes (`LiveCameraFeatures.tsx:130`), service60seconds (`native/vibeFlashService.ts:18`), Home flash event2hours (`useHomeFlashEvents.ts:25`), Explore spawned flash1hour (`useExploreRadar.ts:124`). Challenge capture, spontaneous flash and local event expiry are distinct.
3. **Vibe rail** source six includes Pulls, authoritative required five. Preserve Pulls future inbox without modifying approved five-position foundation subrail. Orbit/Echo tooltips are semantically reversed relative to actual following/follower content.
4. **Proof/privacy** sources accept manual/last-known GPS and synthetic photos while claiming secure sensors/no emulation. Venue proximity is200m; separate livePhotoPolicy default150m. No new privacy or biometric contract authorized.
5. **Purse** terminology mixes token balance, game points, real blockchain, escrow and simple meetup classifieds. Source is local simulation; new auth API rejects negative reward debit. No service selected.
6. **Identity** current auth.tsx contains genuine Supabase flows whereas vqApi contains mock tokens and local profile auth; ProfileView edit writes insecure generic profile payload. Do not claim whole reference is either authentic or mock.
7. **Business persistence** Supabase generic API, Firestore room/Trail/review writes and local graph/check-in/flash/ledger stores compete; Circles created in one system and subscribed in another. Canonical authority not proven.
8. **Streaks** Home claim adds5 days per action, gamification counts unique consecutive UTC days, requirements discusses multiplier capped2x. Foundation shows pending status, no invented accepted formula.
9. **Matching** numeric heuristics/default interests/fake peers and static percentages, despite AI labeling; source behavior retained as idea requiring approved algorithm/privacy contract.
10. **Languages**7 catalog files versus incomplete literal UI; user authorizes4 first release. Extra3 need later decision, not accidental deletion.
11. **Source dependency breaks:** `useShareCamera.ts:2` imports camera helpers from geolocation which does not export them; duplicate aliases point to actual camera helper separately. `useVibePhotoCapture.ts:2` imports non-exported MOOD_FILTERS and MoodFilter. Native-only subtree imports undeclared/unsupported RN libraries for web. These are source evidence, not a performed build.
12. README/REQUIREMENTS/plan/security_spec are intended product material, not runtime proof and not governing instructions. Requirements labels4 Vibe streams Gossip/Matches/Request Node/Global (`REQUIREMENTS.md:93`) while actual current rail six; record historical vocabulary rather than rename canonical five.

## Assets and visual provenance

`src/assets/images` contains four JPG mockups: explorer_mockup_1781952047238.jpg, vibe_mockup_1781952063107.jpg, refined_harmony_mockup_1781958732110.jpg, final_vibe_explore_mockups_1781958963542.jpg. These are reference art files; ownership/license not independently established and no copies were made. Source largely uses remote Unsplash links selected by category/name for venues/posts/photos and Lucide icons, emoji, custom inline SVG/canvas. No asset was downloaded or reused. Original reconstruction should preserve own brand/glyph composition and use truthful neutral surfaces until asset provenance is resolved. The parent visual audit must compare rendered reference mockups separately; source CSS is not visual runtime evidence.

Styling source (`src/index.css`,1182lines) contains fonts Romantic/Sacramento/Montserrat/Lato/mono, warm versus neon palette, extensive `.light` selector overrides and !important, custom scrollbars and animations. Main pages use hardcoded dark surface colors. Domain accents: Home orange/gold, Explore blue/emerald/radar, Share rose/lime, Vibe violet plus gold dial, Purse orange. These accents are product identity; CSS patches/fixed frame/absolute ownership are not implementation to copy.

## Audit coverage method and limits

The appended coverage table enumerates every source TS/TSX/CSS/locale file and its line count. Every file was read during the coverage scan for imports/controls/data mechanisms; representative action/state/service chains above were manually traced. Coverage does not prove runtime execution, translated copy quality, authorization, external provider availability or deployed behavior. Generated dist/minified bundles, node_modules, secrets, Git internals and runtime logs were excluded as nonauthoritative implementation artifacts. Requirements/design/security/structure/plan/package/config/SQL/rules are supporting intent/configuration; cloud rules and databases were not executed. No old data becomes a production fixture.

The coverage table and line-indexed supporting contracts are locators, not an assertion that every callback is functional or every potential component is mounted. Unmounted DiscoverCard, native-vibes subtree, standalone PlaceDetail and Material3 demo remain cataloged with reachability caveats.

Additional verified source contradictions and preserved detail:

- Chat cohort is mixed real/simulated: `src/features/chatroom/hooks/useRoomMembers.ts:60` inserts a creator fallback, and `:92` injects six simulated members (SATOSHI_SF, LUNA_SCRIBE, AERO_SOLE, TRIBESMAN, ANALOG_LENS, COOKIE_HERO). Presence presentation must be preserved, but counts and membership must come from authorized server data. VQ-V16 classification includes SIMULATED alongside UNVERIFIED Firestore presence.
- Exact current soundboard copy in `src/features/chat/constants/sounds.ts:5` through `:65`: Welcome Chime, Real Claps, Funny Laugh, Spectator Wow, Meme Airhorn, Truck Fanfare, Bruh Moment, Sad Trombone, Suspense Roll, Awkward Silence, Funny Fart, Meme Scream, Wiou Rabye Bouden (Tunisian Wiiw Meme). Preserve the recognizable soundboard catalog/interaction; earlier intent/synth keys differ. Third-party MP3 playback/license was not verified.
- `src/lib/dualCameraUtils.ts:90` can generate a back-camera fallback canvas; `:126` substitutes the back image when front capture fails. It performs sequential camera capture with 250/300ms waits (`:113`), which does not prove advertised certified timing. Do not carry these proofs into VibeCheck identity or persistence.
- VQ-P06: `src/infrastructure/repositories/checkInRepository.ts:24` writes check-ins to Supabase, but backend failure returns `success: true` with the error at `:55` after local fallback. `:85` reads Solana audit receipts from `solana_audits`, falling back to `vq_simulated_solana_audits` at `:97`. Preserve check-in history/audit receipt visibility as Rewards + Audit future capability; classify current cloud behavior UNVERIFIED and fallback SIMULATED. Financial signatures/settlement remain NEEDS PRODUCT DECISION, outside foundation.

## Complete source file coverage

| Source path                                                         | Lines read | Review area / source-only disposition                            |
| ------------------------------------------------------------------- | ---------: | ---------------------------------------------------------------- |
| src/App.tsx                                                         |         11 | Shared composition/navigation/theme                              |
| src/app/providers/AppProviders.tsx                                  |         29 | Shared composition/navigation/theme                              |
| src/app/routes/ScreenRouter.tsx                                     |        104 | Shared composition/navigation/theme                              |
| src/components/chat/DriftView.tsx                                   |        283 | Vibe / social / messaging                                        |
| src/components/chat/PaltalkChatroom.tsx                             |        479 | Vibe / social / messaging                                        |
| src/components/chat/VibeCard.tsx                                    |        115 | Vibe / social / messaging                                        |
| src/components/chat/VibeCenterView.tsx                              |        600 | Vibe / social / messaging                                        |
| src/components/chat/VibeChatThread.tsx                              |        261 | Vibe / social / messaging                                        |
| src/components/chat/VibeComposer.tsx                                |        338 | Vibe / social / messaging                                        |
| src/components/common/MaterialYou.tsx                               |        527 | Admin/sandbox; client controls and invented metrics              |
| src/components/common/SkeletonCard.tsx                              |         36 | Supporting dependency; exports/device/service mechanisms scanned |
| src/components/common/VibeGem.tsx                                   |         47 | Supporting dependency; exports/device/service mechanisms scanned |
| src/components/common/VibeMatchRow.tsx                              |         65 | Supporting dependency; exports/device/service mechanisms scanned |
| src/components/common/VibeRequestCard.tsx                           |         71 | Supporting dependency; exports/device/service mechanisms scanned |
| src/components/explore/DiscoverCard.tsx                             |        279 | Explore discovery, spatial UI, trails                            |
| src/components/explore/ExploreHeatmap.tsx                           |        809 | Explore discovery, spatial UI, trails                            |
| src/components/explore/VibeHubTabs.tsx                              |        125 | Explore discovery, spatial UI, trails                            |
| src/components/layout/ModalWrapper.tsx                              |        117 | Shared composition/navigation/theme                              |
| src/components/layout/Shell.tsx                                     |        286 | Shared composition/navigation/theme                              |
| src/components/profile/FollowRow.tsx                                |         71 | Identity/profile/settings; real auth and local fallback          |
| src/components/profile/LoginConsole.tsx                             |        139 | Identity/profile/settings; real auth and local fallback          |
| src/components/profile/LoginModal.tsx                               |        151 | Identity/profile/settings; real auth and local fallback          |
| src/components/profile/ProfileSidebar.tsx                           |        482 | Identity/profile/settings; real auth and local fallback          |
| src/components/profile/ProfileView.tsx                              |        520 | Identity/profile/settings; real auth and local fallback          |
| src/components/share/LiveCameraFeatures.tsx                         |        264 | Share/media/challenge; mixed simulator/real device calls         |
| src/components/share/LiveCameraModule.tsx                           |        318 | Share/media/challenge; mixed simulator/real device calls         |
| src/components/share/VibePhotoCapture.tsx                           |        746 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/admin/components/AdminConsole.tsx                      |        559 | Admin/sandbox; client controls and invented metrics              |
| src/features/admin/index.ts                                         |          1 | Admin/sandbox; client controls and invented metrics              |
| src/features/chat/constants/sounds.ts                               |         67 | Vibe / social / messaging                                        |
| src/features/chat/utils/audioSynthesis.ts                           |        347 | Vibe / social / messaging                                        |
| src/features/chatroom/components/AdminModerationPanel.tsx           |        667 | Vibe / social / messaging                                        |
| src/features/chatroom/components/ChatComposerBar.tsx                |         63 | Vibe / social / messaging                                        |
| src/features/chatroom/components/ChatMessagesStream.tsx             |        339 | Vibe / social / messaging                                        |
| src/features/chatroom/components/LiveMembersHorizontalBar.tsx       |         96 | Vibe / social / messaging                                        |
| src/features/chatroom/components/LiveMembersSidebar.tsx             |        113 | Vibe / social / messaging                                        |
| src/features/chatroom/components/SoundboardGrid.tsx                 |         96 | Vibe / social / messaging                                        |
| src/features/chatroom/components/VoiceActiveControls.tsx            |        150 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useChatComposer.ts                      |         63 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useChatModeration.ts                    |        279 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useChatPresence.ts                      |         45 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useChatScroll.ts                        |         24 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useRoomMembers.ts                       |        123 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useRoomMessages.ts                      |         37 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useSoundboard.ts                        |         74 | Vibe / social / messaging                                        |
| src/features/chatroom/hooks/useVoiceControls.ts                     |        185 | Vibe / social / messaging                                        |
| src/features/chatroom/services/chatroomService.ts                   |        169 | Vibe / social / messaging                                        |
| src/features/chatroom/services/moderationService.ts                 |        176 | Vibe / social / messaging                                        |
| src/features/chatroom/services/presenceService.ts                   |         60 | Vibe / social / messaging                                        |
| src/features/chatroom/services/soundboardService.ts                 |         72 | Vibe / social / messaging                                        |
| src/features/chatroom/types/chatroomTypes.ts                        |         47 | Vibe / social / messaging                                        |
| src/features/chatroom/utils/chatMessageFormatters.ts                |         31 | Vibe / social / messaging                                        |
| src/features/chatroom/utils/soundKeys.ts                            |         12 | Vibe / social / messaging                                        |
| src/features/crypto/components/CryptoDashboard.tsx                  |        812 | Purse/rewards; simulated or external service unverified          |
| src/features/crypto/index.ts                                        |          2 | Purse/rewards; simulated or external service unverified          |
| src/features/crypto/types.ts                                        |         36 | Purse/rewards; simulated or external service unverified          |
| src/features/explore/components/ActiveFlashModal.tsx                |        465 | Explore discovery, spatial UI, trails                            |
| src/features/explore/components/FlashListModal.tsx                  |        320 | Explore discovery, spatial UI, trails                            |
| src/features/explore/components/ProximityValidator.tsx              |        302 | Explore discovery, spatial UI, trails                            |
| src/features/explore/components/VenueCard.tsx                       |        131 | Explore discovery, spatial UI, trails                            |
| src/features/explore/components/VenueDetailSheet.tsx                |        553 | Explore discovery, spatial UI, trails                            |
| src/features/explore/components/VenueHeatmap.tsx                    |         43 | Explore discovery, spatial UI, trails                            |
| src/features/explore/components/VibeTrailsSection.tsx               |        715 | Explore discovery, spatial UI, trails                            |
| src/features/explore/hooks/useExploreRadar.ts                       |        418 | Explore discovery, spatial UI, trails                            |
| src/features/explore/hooks/useVenueSearch.ts                        |        141 | Explore discovery, spatial UI, trails                            |
| src/features/explore/hooks/useVibeTrails.ts                         |        251 | Explore discovery, spatial UI, trails                            |
| src/features/explore/types.ts                                       |         32 | Explore discovery, spatial UI, trails                            |
| src/features/explore/utils/exploreHelpers.ts                        |        236 | Explore discovery, spatial UI, trails                            |
| src/features/home/components/CommunityHandbookModal.tsx             |         92 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/CompassModal.tsx                       |         61 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/DailyStreakQuest.tsx                   |         42 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/DiscoveryAdderModal.tsx                |        221 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/DiscoveryRadarPanel.tsx                |        155 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/HomeActiveAlertBanner.tsx              |        110 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/HomeCreateFlashModal.tsx               |        426 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/HomeCuratedCoordinates.tsx             |         98 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/HomeEventAlertModal.tsx                |        431 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/HomeFeedTabs.tsx                       |        264 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/HomeFlashListModal.tsx                 |        352 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/LiveActivitiesPanel.tsx                |        545 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/LiveEventsPanel.tsx                    |        557 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/PlaceDetailModal.tsx                   |        512 | Home presentation, hooks and local/cloud data                    |
| src/features/home/components/VibeCheckInsScroll.tsx                 |        102 | Home presentation, hooks and local/cloud data                    |
| src/features/home/data/homeHelpers.ts                               |        204 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useDeviceLocation.ts                        |         72 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeActivityFeed.ts                      |         59 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeCheckInFeed.ts                       |         59 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeFeedActions.ts                       |         38 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeFeedback.ts                          |         28 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeFlashEvents.ts                       |        297 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomePersistence.ts                       |        258 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeRadar.ts                             |        245 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeScrollBanner.ts                      |         43 | Home presentation, hooks and local/cloud data                    |
| src/features/home/hooks/useHomeStreak.ts                            |         62 | Home presentation, hooks and local/cloud data                    |
| src/features/home/services/homeStorage.ts                           |         63 | Home presentation, hooks and local/cloud data                    |
| src/features/home/utils/coordinateHelpers.ts                        |         25 | Home presentation, hooks and local/cloud data                    |
| src/features/home/utils/homeAssets.ts                               |         49 | Home presentation, hooks and local/cloud data                    |
| src/features/home/utils/homeCityActivities.ts                       |         46 | Home presentation, hooks and local/cloud data                    |
| src/features/home/utils/homeRatings.ts                              |          6 | Home presentation, hooks and local/cloud data                    |
| src/features/native-vibes/VibeFlashBanner.tsx                       |        187 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/native-vibes/VibeFlashCard.tsx                         |        221 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/native-vibes/vibeFlashScheduler.ts                     |        136 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/native-vibes/VibeShotCamera.tsx                        |        495 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/native-vibes/VibeShotPreview.tsx                       |        314 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/profile/hooks/useLocalDeviceAiSettings.ts              |         73 | Identity/profile/settings; real auth and local fallback          |
| src/features/profile/hooks/useProfileSettings.ts                    |         64 | Identity/profile/settings; real auth and local fallback          |
| src/features/profile/messages/MessageModal.tsx                      |        692 | Identity/profile/settings; real auth and local fallback          |
| src/features/profile/services/profileStorage.ts                     |         43 | Identity/profile/settings; real auth and local fallback          |
| src/features/profile/types/profileTypes.ts                          |         12 | Identity/profile/settings; real auth and local fallback          |
| src/features/share-good-vibes/components/CreateCommunityModal.tsx   |        296 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/components/DonationModal.tsx          |        182 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/components/EchoConnectionModal.tsx    |        153 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/components/EditVibeModal.tsx          |        132 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/components/JoinVibeModal.tsx          |        161 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/components/ShareVibeModal.tsx         |        394 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/components/VibeCircleMembersModal.tsx |        156 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/components/VibeCirclesPanel.tsx       |        162 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/data/vibeData.ts                      |        120 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useCommunityCreationFlow.ts     |        170 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useCommunityDirectory.ts        |        118 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useDonationFlow.ts              |         56 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useLiveVibeFeed.ts              |        279 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useShareCamera.ts               |        277 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useShareScrollVisibility.ts     |         42 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useUserGeoLocation.ts           |         38 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/hooks/useVibeChallenges.ts            |         29 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/services/communityService.ts          |         34 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/services/donationService.ts           |         11 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/services/vibeChallengeService.ts      |          7 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/services/vibeStreamService.ts         |         31 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/types/shareGoodVibesTypes.ts          |         39 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/utils/gamification.ts                 |        245 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/utils/geoDistance.ts                  |          5 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/utils/moodFilters.ts                  |        204 | Share/media/challenge; mixed simulator/real device calls         |
| src/features/share-good-vibes/utils/scrollVisibilityStyles.ts       |         21 | Share/media/challenge; mixed simulator/real device calls         |
| src/hooks/useGeolocation.ts                                         |         23 | Supporting dependency; exports/device/service mechanisms scanned |
| src/hooks/useSocialGraph.ts                                         |         79 | Vibe / social / messaging                                        |
| src/hooks/useVibeCheck.ts                                           |         65 | Supporting dependency; exports/device/service mechanisms scanned |
| src/hooks/useVibePhotoCapture.ts                                    |         66 | Share/media/challenge; mixed simulator/real device calls         |
| src/i18n/index.ts                                                   |         67 | Localization catalogs/preference; runtime quality unverified     |
| src/i18n/locales/ar/common.json                                     |        179 | Localization catalogs/preference; runtime quality unverified     |
| src/i18n/locales/en/common.json                                     |        179 | Localization catalogs/preference; runtime quality unverified     |
| src/i18n/locales/es/common.json                                     |        179 | Localization catalogs/preference; runtime quality unverified     |
| src/i18n/locales/fr/common.json                                     |        179 | Localization catalogs/preference; runtime quality unverified     |
| src/i18n/locales/ja/common.json                                     |        179 | Localization catalogs/preference; runtime quality unverified     |
| src/i18n/locales/pt/common.json                                     |        179 | Localization catalogs/preference; runtime quality unverified     |
| src/i18n/locales/zh/common.json                                     |        179 | Localization catalogs/preference; runtime quality unverified     |
| src/index.css                                                       |       1182 | Shared composition/navigation/theme                              |
| src/infrastructure/env/clientEnv.ts                                 |         11 | Supporting dependency; exports/device/service mechanisms scanned |
| src/infrastructure/firebase/firebaseClient.ts                       |         62 | Supporting dependency; exports/device/service mechanisms scanned |
| src/infrastructure/repositories/adminRepository.ts                  |         63 | Admin/sandbox; client controls and invented metrics              |
| src/infrastructure/repositories/checkInRepository.ts                |        104 | Supporting dependency; exports/device/service mechanisms scanned |
| src/infrastructure/repositories/communityRepository.ts              |         66 | Supporting dependency; exports/device/service mechanisms scanned |
| src/infrastructure/repositories/flashEventRepository.ts             |        217 | Supporting dependency; exports/device/service mechanisms scanned |
| src/infrastructure/repositories/ledgerRepository.ts                 |         80 | Purse/rewards; simulated or external service unverified          |
| src/infrastructure/repositories/messageRepository.ts                |        165 | Supporting dependency; exports/device/service mechanisms scanned |
| src/infrastructure/repositories/profileRepository.ts                |        180 | Identity/profile/settings; real auth and local fallback          |
| src/infrastructure/repositories/vibePostRepository.ts               |        110 | Supporting dependency; exports/device/service mechanisms scanned |
| src/infrastructure/supabase/supabaseClient.ts                       |         11 | Supporting dependency; exports/device/service mechanisms scanned |
| src/lib/auth.tsx                                                    |        278 | Identity/profile/settings; real auth and local fallback          |
| src/lib/dualCameraUtils.ts                                          |        153 | Share/media/challenge; mixed simulator/real device calls         |
| src/lib/firebase.ts                                                 |          7 | Supporting dependency; exports/device/service mechanisms scanned |
| src/lib/geolocation.ts                                              |        182 | Supporting dependency; exports/device/service mechanisms scanned |
| src/lib/GeolocationProvider.tsx                                     |        371 | Supporting dependency; exports/device/service mechanisms scanned |
| src/lib/livePhotoPolicy.ts                                          |         40 | Share/media/challenge; mixed simulator/real device calls         |
| src/lib/pushNotifications.tsx                                       |        397 | Supporting dependency; exports/device/service mechanisms scanned |
| src/lib/solana.tsx                                                  |         19 | Purse/rewards; simulated or external service unverified          |
| src/lib/supabase.ts                                                 |          1 | Supporting dependency; exports/device/service mechanisms scanned |
| src/lib/theme.tsx                                                   |         65 | Shared composition/navigation/theme                              |
| src/lib/utils.ts                                                    |          5 | Supporting dependency; exports/device/service mechanisms scanned |
| src/lib/vqApi.ts                                                    |        202 | Supporting dependency; exports/device/service mechanisms scanned |
| src/main.tsx                                                        |          9 | Shared composition/navigation/theme                              |
| src/native/useVibeCheck.ts                                          |        146 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/useVibeFlashWindow.ts                                    |        193 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/VibeCheckBanner.tsx                                      |        171 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/VibeCheckComposer.tsx                                    |        184 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/VibeCheckHistoryCard.tsx                                 |        140 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/vibeCheckNotifications.ts                                |         79 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/VibeCheckReveal.tsx                                      |        246 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/vibeCheckService.ts                                      |        302 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/vibeFlashService.ts                                      |         99 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/VibeFlashShotResponse.tsx                                |        465 | Share/media/challenge; mixed simulator/real device calls         |
| src/native/VibeShotResponse.tsx                                     |        491 | Share/media/challenge; mixed simulator/real device calls         |
| src/platform/geo.ts                                                 |         65 | Supporting dependency; exports/device/service mechanisms scanned |
| src/screens/AdminScreen.tsx                                         |         12 | Admin/sandbox; client controls and invented metrics              |
| src/screens/CryptoScreen.tsx                                        |         22 | Purse/rewards; simulated or external service unverified          |
| src/screens/ExploreScreen.tsx                                       |       1221 | Explore discovery, spatial UI, trails                            |
| src/screens/homeHelpers.ts                                          |         10 | Home presentation, hooks and local/cloud data                    |
| src/screens/HomeScreen.tsx                                          |        815 | Home presentation, hooks and local/cloud data                    |
| src/screens/ProfileScreen.tsx                                       |        162 | Identity/profile/settings; real auth and local fallback          |
| src/screens/ShareGoodVibesScreen.tsx                                |       1154 | Share/media/challenge; mixed simulator/real device calls         |
| src/screens/VibeScreen.tsx                                          |          9 | Supporting dependency; exports/device/service mechanisms scanned |
| src/services/socialGraphStore.ts                                    |        177 | Vibe / social / messaging                                        |
| src/services/venueCheckInStore.ts                                   |        121 | Supporting dependency; exports/device/service mechanisms scanned |
| src/services/vibeCheckService.ts                                    |        137 | Supporting dependency; exports/device/service mechanisms scanned |
| src/services/vibeGatheringStore.ts                                  |        140 | Supporting dependency; exports/device/service mechanisms scanned |
| src/shared/browser/openExternalMap.ts                               |         14 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/browser/scrollToElement.ts                               |         15 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/hooks/useDebouncedValue.ts                               |         21 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/hooks/useInterval.ts                                     |         20 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/hooks/useTimeout.ts                                      |         20 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/ai/aiTypes.ts                                   |         18 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/ai/chromeBuiltInAiProvider.ts                   |         36 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/ai/deviceAiService.ts                           |        133 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/ai/localEndpointAiProvider.ts                   |         87 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/ai/serverAiProvider.ts                          |         32 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/device/audio.ts                                 |         35 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/device/camera.ts                                |         24 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/device/geolocation.ts                           |        150 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/device/haptics.ts                               |         23 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/storage/safeLocalStorage.ts                     |         24 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/services/translation/userContentTranslationService.ts    |         39 | Share/media/challenge; mixed simulator/real device calls         |
| src/shared/utils/distance.ts                                        |         16 | Share/media/challenge; mixed simulator/real device calls         |
| src/types/native.ts                                                 |          7 | Share/media/challenge; mixed simulator/real device calls         |
| src/types/socialGraph.ts                                            |         38 | Vibe / social / messaging                                        |

## Supporting intent and data contracts

### REQUIREMENTS.md (107 lines read)

- 1: # VibeQuest — Comprehensive Product & Design Requirements Spec (PRD/DRD)
- 2: ## Production Launch & Client Delivery Specification (Supabase Blueprint)
- 6: ## 🧭 1. Executive Summary & Vision Statement
- 8: **VibeQuest** turns physical neighborhood exploration, real-world socialization, and spontaneous sharing into a highly engaging, gamified social arena. The platform connects nearby users through interactive HTML5 sweeping radars, real-time localized chats ("Gossip" & "Match Nodes"), and dual-lens camera captures ("Vibe Check captures"). To motivate exploration, users earn utility tokens (VQ) mapped to simulated Solana wallet keys (Sol Shards).
- 14: ## 🎨 2. Design System & User Experience Guidelines
- 16: ### 2.1 The "Midnight Obsidian" Aesthetic
- 27: ### 2.2 Fluid Layout & Framing
- 33: ## ⚙️ 3. Complete Page-by-Page Functional Requirements
- 35: ### 3.1 Account Onboarding & Crypto Link Pane (`App.tsx` / `LoginConsole.tsx`)
- 36: * **User Goal**: Quickly choose a public handle and hook up a cryptographic wallet to hold their scoring ledgers.
- 39: * **Solana Shard Simulation System**: When a user binds, simulate a 44-character base-58 cryptographic public key identifier representing a Sol Shard Ledger. This binds directly to the active user row in the `profiles` table.
- 42: ### 3.2 Command Dashboard & Streak Tracker (`HomeScreen.tsx`)
- 50: ### 3.3 Overpass-Backed Spatial Hotspots (`ExploreScreen.tsx` / `ExploreHeatmap.tsx`)
- 62: * Includes a Proximity Teleport Helper (cheat button) for testing sandbox coordinate locations.
- 64: ### 3.4 Presence Media Shutter Engine (`ShareGoodVibesScreen.tsx`)
- 67: * **Synchronous Dual-Camera Viewfinder**: Renders stacked viewfinders simulating simultaneous shutter releases.
- 71: ### 3.5 Spontaneous Localized Gossip Channels (`VibeScreen.tsx` / `VibeCenterView.tsx`)
- 79: ### 3.6 Profile & Verification Hub (`ProfileScreen.tsx`)
- 84: ### 3.7 Wallet Ledger & P2P Crypto Exchange (`CryptoScreen.tsx`)
- 90: ### 3.8 Admin Analytics Cockpit (`AdminScreen.tsx`)
- 99: ## 👮 4. Non-Functional, Security & Performance Requirements
- 101: ### 4.1 Geo-Privacy & Data Integrity
- 103: * **Row-Level Security (RLS)**: Enforced across all Supabase database tables to block unauthorized modification or cross-tenant reads.
- 105: ### 4.2 High Frame Rates & Responsiveness

### security_spec.md (141 lines read)

- 1: # VibeQuest Security Specification
- 3: ## 1. Data Invariants
- 10: - Points cannot be arbitrarily inflated (must only allow specific increments or require verification).
- 63: ## 2. The "Dirty Dozen" Hostile Payloads
- 66: ### Attack 1: Profile Spoofing
- 72: ### Attack 2: Self-Promoted Tier Elevation
- 78: ### Attack 3: Listing Identity Spoofing
- 84: ### Attack 4: Shadow Field Injection in Listing
- 90: ### Attack 5: Rate and Value Poisoning in Crypto Offer
- 94: - **Reason**: Denial-of-wallet resource exhaustion attack with excessively long string payloads.
- 96: ### Attack 6: Shared Vibe Deletion Hijack
- 102: ### Attack 7: Inventory Items Placement
- 108: ### Attack 8: Community Deletion Hijack
- 114: ### Attack 9: Message Forgery in Community Chat
- 120: ### Attack 10: Presence Spoofing
- 126: ### Attack 11: Unauthenticated Activity Appends
- 132: ### Attack 12: Vibe Check Challenge Hijack
- 140: ## 3. Test Runner Outline (Conceptual Spec)

### plan.md (137 lines read)

- 1: # VibeQuest — Pro Production Migration & Engineering Plan
- 2: ## System Roadmap: From Simulation to Production-Grade Supabase Architecture
- 4: This plan establishes the precise engineering steps to transition VibeQuest from its current simulation layer to a highly scalable, enterprise-grade architecture using **React, Vite, TypeScript, and Supabase**.
- 10: ## 📅 Roadmap Overview
- 14: │ PHASE 1: Supabase Spatial Database Setup & RLS [COMPLETED] │
- 18: │ PHASE 2: Supabase Auth & Storage Migration [COMPLETED] │
- 30: │ PHASE 5: Cryptographic Wallet, Streaks & Gami [COMPLETED] │
- 40: ## 🛠️ Phase-by-Phase Technical Execution
- 42: ### PHASE 1: Supabase Spatial Database Setup & Row-Level Security
- 50: - Create tables with strict relational integrity, foreign key cascades, and check constraints (detailed in `structure.md`).
- 64: ### PHASE 2: Supabase Authentication & Storage Engine Migration
- 65: We replace mock/guest credential loops with Supabase Auth and construct zero-trust object storage buckets for sequential front-and-back photographic captures.
- 67: 1. **Supabase Auth Hook Integration**:
- 72: 2. **Supabase Storage Infrastructure**:
- 73: - Construct two buckets: `avatars` (user profiles) and `dual-cam-bursts` (the dual-camera sequential capture files).
- 79: ### PHASE 3: Domain-Driven Refactoring & Directory Reorganization — [COMPLETED]
- 95: ### PHASE 4: Real-Time Spatial Queries, Chats, & Tip Ledgers — [COMPLETED]
- 96: We deployed high-performance PostgreSQL functions, integrated Supabase REALTIME message listeners, and established atomic tip transactions.
- 99: - Created and stored a production-ready PostgreSQL function `get_nearby_nodes_cascading` inside `supabase-setup.sql` at the root.
- 102: 2. **Supabase Realtime Chat Streaming**:
- 111: ### PHASE 5: Cryptographic Wallet Shards, Streaks, & Gamification — [COMPLETED]
- 115: - Created the `check_ins` PostgreSQL schema table with full RLS support in `supabase-setup.sql`.
- 126: ### PHASE 6: End-to-End System Auditing, Performance Tuning, & Delivery [COMPLETED]
- 135: - Hardened local sandbox simulations (localStorage caches and store dispatches) to ensure full offline-first functionality when server connections are absent.

### structure.md (236 lines read)

- 1: # VibeQuest — Directory Structure & Database Schema Specification
- 2: ## High-Fidelity Domain-Driven Codebase Blueprint
- 8: ## 📂 1. Core Directory Structure (Domain-Driven Design)
- 37: │ │ ├── CryptoScreen.tsx # Wallet ledger & P2P Crypto Exchange (Escrows, ledger logs)
- 66: │ │ ├── supabase/
- 67: │ │ │ └── supabaseClient.ts # Initializer for secure database & storage connections
- 68: │ │ ├── firebase/
- 69: │ │ │ └── firebaseClient.ts # Encapsulated Firestore DB setup, Auth handlers, and standard error translators
- 75: │ │ ├── ledgerRepository.ts # Wallet transactions, ledger registries, and tipping history audits
- 83: │ │ │ │ ├── deviceAiService.ts # Orchestrator for native, Chrome built-in, local, or server fallback AIs
- 91: │ │ │ │ └── camera.ts # Encapsulated media and device camera stream controller
- 114: ## 💾 2. Perfect PostgreSQL Schema Design (Supabase Spec)
- 124: -- Handles credentials synced via Supabase Auth and logs metadata coordinate states.
- 125: CREATE TABLE public.profiles (
- 146: CREATE TABLE public.check_in_streaks (
- 155: -- 3. PHOTO CAPTURES TABLE (DUAL-CAMERA BURSTS)
- 157: CREATE TABLE public.photo_captures (
- 175: CREATE TABLE public.chat_channels (
- 188: CREATE TABLE public.chat_messages (
- 203: CREATE TABLE public.points_ledger (
- 209: tx_signature VARCHAR(44), -- Real/Simulated Solana blockchain asset signature hashes
- 215: CREATE TABLE public.spatial_radar_logs (
- 227: CREATE TABLE public.experience_evaluations (

### README.md (251 lines read)

- 1: # VibeQuest — Spatial Discovery, Community Proximity & Local Event Ledger
- 2: ## 🧭 EXECUTIVE VISION: THE INVESTOR PITCH & INVESTMENT HYPOTHESIS
- 10: ## ⚡ WHY VIBEQUEST LEADS THE COMPETITION (COMPETITIVE ADVANTAGE)
- 22: ### The Competitive Moat:
- 23: 1. **The Anti-Spoofing Shutter Proof**: By checking both GPS proximity (<200m) and enforcing a rapid 5-minute media upload timeline on dual-camera captures, VibeQuest guarantees that reviews, posts, and validations represent **active physical presence**. No gallery uploads, pre-rendered stock photos, or remote coordinate spoofing are permitted.
- 29: ## 📱 PAGE-BY-PAGE, FEATURE-BY-FEATURE TECHNICAL ARCHITECTURE
- 51: [ 7. Wallet Ledger & Escrows ]
- 57: ### 1. Onboarding Gate & Voyager Console (`LoginConsole.tsx`)
- 71: ### 2. The Command Center Dashboard (`HomeScreen.tsx`)
- 88: ### 3. Spatial Landmark Exploration (`ExploreScreen.tsx` / `ExploreHeatmap.tsx`)
- 103: ### 4. Spontaneous Dual-Lens Shutter (`ShareGoodVibesScreen.tsx`)
- 107: * Displays stacked camera viewfinders simulating front/back perspectives.
- 115: ### 5. Gossip Channels & Tipping Console (`VibeScreen.tsx`)
- 128: ### 6. Profile & Verification Hub (`ProfileScreen.tsx`)
- 139: ### 7. Wallet Ledger & P2P Crypto Exchange (`CryptoScreen.tsx`)
- 154: ### 8. Admin Analytics Cockpit (`AdminScreen.tsx` / `AdminConsole.tsx`)
- 168: ## ⚡ PERFORMANCE IN DEPTH: THE PHASE 10 UPDATE
- 173: * All heavy screens (including the complex, visualization-heavy `AdminScreen` and crypto-wallet integration screen `CryptoScreen`) are separated into standalone code chunks.
- 177: * Libraries such as `recharts` (used in the Admin Cockpit) and complex on-device hardware components (like cameras, Canvas layers, and Web3 Solana adapters) are excluded from the main initial JavaScript bundle. They are requested and evaluated only when the user navigates to those specific tabs.
- 185: ## 🔮 THE COLD CLOUD STRATEGY: 100% FREE ON-DEVICE AI IN 2026
- 208: [ Real-Time UI Render Native Frame ]
- 213: 3. **Hybrid Tool Calls**: When searching for spots, the local model outputs a clean structured tool call. The app executes the lookup against local coordinate databases and displays the results in a beautiful native card.
- 217: ## 🏗️ DIRECTORY STRUCTURE & TECHNICAL FLOWS
- 224: * **`src/shared/services/device/`**: Hardware Abstraction Layer (HAL) isolating on-device features (Haptics, Geolocation, Camera, Audio) for easy future porting to native platforms.
- 228: ## 📊 FULL PHASE-BY-PHASE ENGINEERING REPORT (HONEST SELF-ASSESSMENT)
- 235: * _Details_: Configured Firebase Firestore schemas and designed a robust relational Supabase SQL plan with PostGIS geofencing logic.
- 241: * _Details_: Constructed simulated front/rear viewport layers with astronomical sunlight scheduling overlays and 5-minute timeout checks.
- 246: * **Phase 8: Wallet Ledger & P2P Escrows** — **SUCCESS**
- 247: * _Details_: Developed the crypto wallet interface, transaction history feed, local trades marketplace, and interactive escrow chat simulation with partner dialogue engine.
- 251: * _Details_: Implemented route splitting with `React.lazy` and Suspense fallbacks. Deferred heavy charting/camera packages, and added windowed pagination to long chat streams.

### package.json (52 lines read)

- 17: "@solana/wallet-adapter-base": "^0.9.23",
- 18: "@solana/wallet-adapter-react": "^0.15.35",
- 19: "@solana/wallet-adapter-react-ui": "^0.9.35",
- 21: "@supabase/supabase-js": "^2.108.1",
- 29: "firebase": "^11.3.1",

### supabase-setup.sql (295 lines read)

- 2: -- VIBEQUEST: PRODUCTION SUPABASE SETUP SCRIPT
- 12: CREATE TABLE IF NOT EXISTS public.profiles (
- 19: wallet TEXT,
- 27: CREATE TABLE IF NOT EXISTS public.points_ledger (
- 36: CREATE TABLE IF NOT EXISTS public.direct_messages (
- 50: CREATE OR REPLACE FUNCTION public.get_nearby_nodes_cascading(
- 98: CREATE OR REPLACE FUNCTION public.dispatch_tip(
- 139: CREATE POLICY IF NOT EXISTS "Allow public read access to profiles"
- 142: CREATE POLICY IF NOT EXISTS "Allow owners to update profiles"
- 145: CREATE POLICY IF NOT EXISTS "Allow users to view direct messages involving them"
- 153: CREATE TABLE IF NOT EXISTS public.check_ins (
- 165: CREATE POLICY IF NOT EXISTS "Allow public read access to check_ins"
- 168: CREATE POLICY IF NOT EXISTS "Allow authenticated users to log check_ins"
- 172: CREATE OR REPLACE FUNCTION public.process_check_in_streak()
- 252: CREATE TABLE IF NOT EXISTS public.solana_audits (
- 263: CREATE POLICY IF NOT EXISTS "Allow reading solana audits"
- 266: -- Background Auditor process simulation trigger on point ledger records
- 267: CREATE OR REPLACE FUNCTION public.audit_points_ledger_record()
- 270: simulated_signature TEXT;
- 271: simulated_block INT;
- 276: simulated_signature := encode(sha256(concat(NEW.id::text, NEW.amount::text)::bytea), 'hex');
- 277: simulated_block := 154000000 + floor(random() * 1000000)::int;
- 282: simulated_signature,
- 283: simulated_block,

### firestore.rules (346 lines read)

- 3: match /databases/{database}/documents {
- 6: match /{document=**} {
- 7: allow read, write: if false;
- 26: match /profiles/{userId} {
- 32: (!('wallet' in data) || data.wallet is string) &&
- 38: allow read: if isSignedIn();
- 39: allow create: if isSignedIn() && isOwner(userId) && isValidId(userId) && isValidProfile(incoming());
- 40: allow update: if isSignedIn() && (isOwner(userId) || isAdmin()) && isValidId(userId) && isValidProfile(incoming()) && (
- 47: allow delete: if isSignedIn() && isAdmin();
- 51: match /listings/{listingId} {
- 62: allow read: if isSignedIn();
- 63: allow create: if isSignedIn() && isValidId(listingId) && isValidListing(incoming());
- 64: allow update: if isSignedIn() && isValidId(listingId) && (isOwner(existing().authorId) || isAdmin()) && isValidListing(incoming()) && incoming().authorId == existing().authorId;
- 65: allow delete: if isSignedIn() && isValidId(listingId) && (isOwner(existing().authorId) || isAdmin());
- 69: match /activity/{activityId} {
- 77: allow read: if isSignedIn();
- 78: allow create: if isSignedIn() && isValidId(activityId) && isValidActivity(incoming());
- 79: allow update, delete: if false; // Logs are immutable and append-only
- 83: match /crypto_offers/{offerId} {
- 94: allow read: if isSignedIn();
- 95: allow create: if isSignedIn() && isValidId(offerId) && isValidOffer(incoming());
- 96: allow update: if isSignedIn() && isValidId(offerId) && (isOwner(existing().authorId) || isAdmin()) && isValidOffer(incoming()) && incoming().authorId == existing().authorId;
- 97: allow delete: if isSignedIn() && isValidId(offerId) && (isOwner(existing().authorId) || isAdmin());
- 101: match /shared_vibes/{vibeId} {
- 111: allow read: if isSignedIn();
- 112: allow create: if isSignedIn() && isValidId(vibeId) && isValidVibe(incoming());
- 113: allow update: if isSignedIn() && isValidId(vibeId) && (isOwner(existing().authorId) || isAdmin()) && isValidVibe(incoming()) && incoming().authorId == existing().authorId;
- 114: allow delete: if isSignedIn() && isValidId(vibeId) && (isOwner(existing().authorId) || isAdmin());
- 118: match /purchased_items/{itemId} {
- 127: allow read: if isSignedIn() && (isOwner(existing().userId) || isAdmin());
- 128: allow create: if isSignedIn() && isValidId(itemId) && isValidPurchase(incoming());
- 129: allow update: if false; // Immutable purchase records
- 130: allow delete: if isSignedIn() && isValidId(itemId) && (isOwner(existing().userId) || isAdmin());
- 134: match /communities/{communityId} {
- 147: allow read: if true;
- 148: allow create: if isValidId(communityId) && isValidCommunity(incoming());
- 149: allow update: if isValidId(communityId) && isValidCommunity(incoming());
- 150: allow delete: if isValidId(communityId);
- 154: match /community_members/{memberId} {
- 161: allow read: if true;
- 162: allow create: if isValidId(memberId) && isValidMember(incoming());
- 163: allow update: if false; // Membership map is immutable
- 164: allow delete: if isValidId(memberId);
- 168: match /community_messages/{messageId} {
- 180: allow read: if true;
- 181: allow create: if isValidId(messageId) && isValidMessage(incoming());
- 182: allow update: if isValidId(messageId) && (
- 186: allow delete: if isValidId(messageId);
- 190: match /community_presence/{presenceId} {
- 200: allow read: if true;
- 201: allow create: if isValidId(presenceId) && isValidPresence(incoming());
- 202: allow update: if isValidId(presenceId) && isValidPresence(incoming());
- 203: allow delete: if isValidId(presenceId);
- 207: match /social_posts/{postId} {
- 218: allow read: if isSignedIn();
- 219: allow create: if isSignedIn() && isValidId(postId) && isValidSocialPost(incoming());
- 220: allow update: if isSignedIn() && isValidId(postId) && (isOwner(existing().userId) || isAdmin()) && isValidSocialPost(incoming()) && incoming().userId == existing().userId;
- 221: allow delete: if isSignedIn() && isValidId(postId) && (isOwner(existing().userId) || isAdmin());
- 225: match /vibe_trails/{trailId} {
- 234: allow read: if true;
- 235: allow create: if isValidId(trailId) && isValidVibeTrail(incoming());
- 236: allow update: if isValidId(trailId) && isValidVibeTrail(incoming()) && (
- 246: allow delete: if isValidId(trailId) && (existing().authorId is string || isAdmin());
- 250: match /chat_requests/{requestId} {
- 258: allow read: if isSignedIn();
- 259: allow create: if isSignedIn() && isValidId(requestId) && isValidChatRequest(incoming());
- 260: allow update, delete: if isSignedIn() && isValidId(requestId);
- 264: match /chat_messages/{messageId} {
- 273: allow read: if isSignedIn();
- 274: allow create: if isSignedIn() && isValidId(messageId) && isValidChatMessage(incoming());
- 275: allow update, delete: if isSignedIn() && isValidId(messageId) && (existing().userId == request.auth.uid || existing().sender == request.auth.uid || isAdmin());
- 279: match /donations/{donationId} {
- 287: allow read: if isSignedIn();
- 288: allow create: if isSignedIn() && isValidId(donationId) && isValidDonation(incoming());
- 289: allow update, delete: if false; // Donations are immutable logs
- 293: match /vibe_checks/{vibeCheckId} {
- 304: allow read: if isSignedIn() && (resource.data.challenger_id == request.auth.uid || resource.data.challenged_id == request.auth.uid || isAdmin());
- 305: allow create: if isSignedIn() && isValidId(vibeCheckId) && (incoming().challenger_id == request.auth.uid) && isValidVibeCheck(incoming());
- 306: allow update: if isSignedIn() && isValidId(vibeCheckId) && (existing().challenger_id == request.auth.uid || existing().challenged_id == request.auth.uid || isAdmin()) && isValidVibeCheck(incoming());
- 307: allow delete: if isSignedIn() && isValidId(vibeCheckId) && (existing().challenger_id == request.auth.uid || isAdmin());
- 311: match /vibe_flashes/{vibeFlashId} {
- 321: allow read: if isSignedIn();
- 322: allow create: if isSignedIn() && isValidId(vibeFlashId) && isValidVibeFlash(incoming());
- 323: allow update: if isSignedIn() && isValidId(vibeFlashId) && (isOwner(existing().user_id) || isAdmin()) && isValidVibeFlash(incoming());
- 324: allow delete: if isSignedIn() && isValidId(vibeFlashId) && (isOwner(existing().user_id) || isAdmin());
- 328: match /place_reviews/{reviewId} {
- 340: allow read: if true;
- 341: allow create: if isSignedIn() && isValidId(reviewId) && isValidPlaceReview(incoming());
- 342: allow update: if isSignedIn() && isValidId(reviewId) && (existing().authorId == request.auth.uid || isAdmin()) && isValidPlaceReview(incoming()) && incoming().authorId == existing().authorId;
- 343: allow delete: if isSignedIn() && isValidId(reviewId) && (existing().authorId == request.auth.uid || isAdmin());

### src/features/native-vibes/INTEGRATION_GUIDE.md (274 lines read)

- 1: # 🗺️ VibeQuest Mobile Integration & Diagnostic Manual
- 7: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 8: ## Section 1 — Installation Commands & Native Manifests
- 9: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 11: To configure the device-level capabilities required for camera and high-accuracy geo-referencing, execute the following commands in the workspace root:
- 14: # Core Device Camera Framework (VisionCamera V5+)
- 15: npm install react-native-vision-camera@latest
- 16: npm install react-native-nitro-modules
- 18: # Background Local Alarm Scheduling Engine
- 19: npm install @notifee/react-native
- 21: # High-Precision Location Geo-Referencer (Non-Stale)
- 22: npm install react-native-geolocation-service
- 24: # Persistent Storage & State Caching Utilities
- 25: npm install @react-native-async-storage/async-storage
- 27: # Re-link native binaries inside iOS sandbox
- 31: ### [A] Android Manifest Setup (`android/app/src/main/AndroidManifest.xml`)
- 38: <!-- Enforce Camera Access Gating Only -->
- 39: <uses-permission android:name="android.permission.CAMERA" />
- 45: <!-- Notifee Time-Sensitive Alarms -->
- 53: <receiver android:name="io.invertase.notifee.RebootReceiver" android:exported="true">
- 63: ### [B] iOS Configuration Setup (`ios/VibeQuest/Info.plist`)
- 65: Insert the appropriate keys detailing our physical camera constraints inside the root `<dict>` element:
- 72: <!-- Live-Only Camera capture explanation -->
- 73: <key>NSCameraUsageDescription</key>
- 74: <string>VibeQuest requires physical camera access for verified live-only captures. Device photo library sharing is completely disabled.</string>
- 91: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 92: ## Section 8 — Wiring VibeShot Into a "Share Place" Screen
- 93: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 95: Below is the implementation blueprint showing how to connect `VibeShotCamera` and `VibeShotPreview` into a user interface designed to capture live proof-of-visit reviews without gallery cheating:
- 99: import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
- 100: import { VibeShotCamera } from '../native/VibeShotCamera';
- 101: import { VibeShotPreview } from '../native/VibeShotPreview';
- 104: const [isCameraActive, setIsCameraActive] = useState(false);
- 113: if (isCameraActive) {
- 115: <VibeShotCamera
- 119: setIsCameraActive(false);
- 121: onCancel={() => setIsCameraActive(false)}
- 136: setIsCameraActive(true);
- 146: {/* Live enforcement capture card placeholder */}
- 148: style={styles.cameraTriggerBox}
- 149: onPress={() => setIsCameraActive(true)}
- 157: placeholder="Describe the aesthetic vibe..."
- 160: placeholderTextColor="#636366"
- 169: cameraTriggerBox: {
- 187: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 188: ## Section 9 — Mounting VibeFlashBanner in Tab Outlines
- 189: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 195: import { StyleSheet, View } from 'react-native';
- 196: import { VibeFlashBanner } from '../native/VibeFlashBanner';
- 197: import { VibeShotCamera } from '../native/VibeShotCamera';
- 198: import { VibeShotPreview } from '../native/VibeShotPreview';
- 201: const [activeVibeFlashCamera, setActiveVibeFlashCamera] = useState(false);
- 214: <VibeFlashBanner onCapturePress={() => setActiveVibeFlashCamera(true)} />
- 219: {activeVibeFlashCamera && (
- 220: <VibeShotCamera
- 224: setActiveVibeFlashCamera(false);
- 226: onCancel={() => setActiveVibeFlashCamera(false)}
- 237: setActiveVibeFlashCamera(true);
- 252: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 253: ## Section 10 — Device Compatibility Matrices & Fallbacks
- 254: ## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 256: Simultaneous multi-cam capture represents a major physical constraint on many mid-tier and high-end hardware chipsets due to system bus and camera ISP throughput limitations.
- 258: ### Dual-Cam Silicon Capability Baseline
- 260: | OEM Brand | Support Matrix Coverage | Multi-Camera Simultaneous Session Capability |
- 263: | **Samsung** | Galaxy S20 Ultra, S21, S22, S23, S24 (Snapdragon 8 Gen 1+) | **SUPPORTED** under Limited Camera2 Multi-Stream API parameters. |
- 264: | **Google** | Pixel 6 Pro, Pixel 7, Pixel 8, Pixel 9 | **SUPPORTED** on primary wide and front facing camera arrays. |
- 267: ### The Sequential Fallback Experience (≤ 400ms Offset)
- 269: If `useCameraDevices()` indicates lack of dual-active streams, our `VibeShotCamera.tsx` gracefully executes sequential capture protocol:
- 271: 1. **Phase A (Back Main)**: Back camera captures instantly upon shutter click. Timestamp is strictly indexed (`Date.now()`).
- 272: 2. **Phase B (Front Flip)**: Back stream is paused, system waits exactly **150ms** for general hardware state resets, and initiates capturing via Front lens on a separate Camera component instance under **400ms total elapsed time**.
