# Product truth: Platform, Account, Business and Purse

VQ-PRODUCT-TRUTH-002 · source inspection 2026-10-09 · documentation only.

## Authority and evidence notation

Product Owner decisions override all references. **P** = `C:/Users/GrowB/Desktop/ViBeQues-Selection/vibequestbest` (primary UI, dark mode and mechanics). **S** = `C:/Users/GrowB/Desktop/ViBeQues-Selection/vibequest last` (secondary). **T** = `C:/Users/GrowB/Desktop/ViBeQues-Selection/VQ` (third). **N** = current `C:/Users/GrowB/Desktop/Vibequest`. A path prefixed P/S/T/N resolves against that exact root; line numbers identify the source inspected, not deployed behavior.

Only source was inspected for this register. **Runtime verified: no** for every legacy feature below. Provider success, deployed policies, real payments, real recipients, device behavior and production authorization were not exercised. No reference application or financial flow was executed. No secret configuration values were read. The Product Owner explicitly prohibits simulations in the new app. Legacy simulations in this register are rejected defects to replace with genuine authorized records, or leave unavailable until implemented; they are never approved fallback behavior. Source-proven means a reachable code path or declaration is present; it does not mean a deployed service works. Inferred and unknown links are explicitly marked.

The domain analysis workflow was adapted to documentation-only source tracing. No legacy knowledge graph, generated data, app source, provider state or database was changed.

### Record fields and common defaults

Every numbered record supplies exact name/location; source symbols; trigger/prerequisite; mechanics/state/timers; permissions/storage truth; current equivalent/status; distinct preservation flags; owner/dependencies; conflicts; acceptance. **Flags C/P/F/R** mean **Concept preserved / Presentation preserved / Function implemented / Runtime verified in the new rebuild**. Values are yes, partial, no or unverified. `R=unverified` is a statement about this documentation packet, which did not rerun browser tests. Earlier audit evidence is historical, not fresh verification.

For a record that says **missing**, current equivalent is none, C/P/F=no and R=unverified unless explicitly stated otherwise. For a **placeholder**, the concept is represented, F=no, R=unverified; it cannot be counted as functional parity. For actions without device work, permissions=none beyond future application authorization; no timer exists unless listed. Source UI-only role checks are not server enforcement.

Counts: **Platform/navigation 9; Identity/profile 12; Settings/permissions/notifications 10; Business/events 7; Admin 4; Purse/finance/support 18 = 60 stable records.** These are scoped feature/action records, not 60 proven services. Related social/chatroom actions are traced in the companion social/capture register; microphone/notifications are included here as platform contracts.

## Platform/navigation register (9)

### PT-NAV-001 — Home / Explore / Share / Vibe / Crypto

- **Location/evidence:** P `src/components/layout/Shell.tsx:92` `navigationItems`; P `src/App.tsx:213` `renderScreen`. S `src/components/layout/Shell.tsx:96` changes final label to **Purse** and icon to Bitcoin. T has the same screen-family navigation; P uses Coins, cyan, and **Crypto**, with page **Crypto Hub**. The owner locks **HOME → EXPLORE → central-heart SHARE → VIBE → PURSE**: retain PURSE even though primary code says Crypto.
- **Trigger/mechanics:** click sets `activeTab`; local screen switch, no URL routing. No device permission or persistence. Share is third, heart icon, larger controller; source omits the Share text label. No independent Telegram frontend.
- **Rebuild:** N `apps/web/src/components/shell.tsx:23` correct five destinations and locale deep links. Status **partial** (routing implemented, visuals rejected). Flags C=yes/P=partial/F=yes/R=unverified.
- **Owner/dependencies:** shared Application Shell → feature entry components and router; UI tokens; localization; host adapter.
- **Acceptance:** exact five destinations/order; accessible heart name; same feature components from Web/Telegram; approved active states and spacing; keyboard operation; route/back history; no sixth global Profile destination.

### PT-NAV-002 — Cybernetic Smiley / VIBEQUEST / Super App Matrix

- **Evidence:** P Shell:110–124 brand `🤪`, emerald ring, VIBE white/QUEST emerald, small uppercase **Super App Matrix**; click → Home. S Shell:119 uses orange primary and **Gather & Discover**.
- **Mechanics/storage:** local navigation only. Brand facts are source-proven; actual glyph appearance is OS dependent.
- **Rebuild:** playful mark and VIBEQUEST exist, **Gather & Discover** follows S rather than P. **Changed**; C=yes/P=partial/F=yes/R=unverified.
- **Owner/acceptance:** shared Shell + brand assets/localization. Preserve playful identity; owner decision needed on subtitle; do not silently call secondary copy the primary original.

### PT-NAV-003 — Map Pin Indicator

- **Evidence:** P Shell:128 `cityName || 'TUNIS, TUNISIA'`; conditional `hidden xs:flex`, click → Explore. Geo source `GeolocationProvider:16` defaults Tunis. S Shell:134 same Explore navigation with secondary visual changes.
- **Mechanics/permission:** current city from shared location owner; can display fallback city as if local. No independent place selection here.
- **Rebuild:** Explore access/area context exists; primary header city pill differs. **Partial**; C=partial/P=no/F=partial/R=unverified.
- **Owner/acceptance:** Shell consumes Geo capability, not location tracker. Distinguish chosen browse city from actual device location; no invented current city on denied permission; preserve narrow-screen access without crowding header.

### PT-NAV-004 — Open Console Menu / Voyager Console

- **Evidence:** P Shell:140 button → `sidebarOpen`; P `src/components/layout/ProfileSidebar.tsx:82` spring slide-right panel, `w-[82vw]`, close/backdrop; drag closes if offset >80px or velocity >300. Panel heading **Voyager Console**, profile card with identity/tier.
- **Mechanics:** local open/close state; optional Telegram haptic; no server access. Unconditional red pulsing dot P Shell:147 is decorative, not evidence of unread notifications.
- **Rebuild:** account button opens planned Identity dialog (N Shell:120), no menu. **Missing menu**; C=partial/P=no/F=no/R=unverified.
- **Owner/acceptance:** shared Shell/Profile menu consumes Identity, theme and locale; focus trap/restore, Escape/back dismissal, RTL placement, Settings entries and real status. No simulated badges.

### PT-NAV-005 — Facebook-style auto-hide navigation

- **Evidence:** P Shell:57 `handleMainScroll`; S Shell:61. Delta >20px hides on down, shows on up; scrollTop <10 shows; tab change resets scrollTop=0 and visibility. Motion spring damping20/stiffness240; exit y80.
- **Rebuild:** fixed visible navigation; **changed**. C=no/P=no/F=no/R=unverified.
- **Owner/acceptance:** shared Shell only. Decide whether auto-hide is desired in clean navigation; if retained, reduced-motion, keyboard focus, safe area and end-of-page controls remain usable. Source threshold is definite; adoption remains product decision.

### PT-NAV-006 — Main viewport / mobile safe area

- **Evidence:** P Shell:101 `100dvh`, max-width scales md→2xl; main:158 bottom padding `calc(5rem+env(safe-area-inset-bottom))`; bottom nav:183 fixed56px has no explicit bottom inset padding.
- **Rebuild:** responsive page shells and host safe-area capability; **partial**, C=yes/P=partial/F=partial/R=unverified.
- **Owner/acceptance:** shared Shell + host adapter. Preserve scrollable pages and no obscured controls; consume host/device insets centrally; do not copy primary's missing bottom-inset handling.

### PT-NAV-007 — Profile / Admin screen selectors

- **Evidence:** P App:224–230 selects `profile` and `admin`; primary sidebar exposes Admin at:283 but no navigation handler to `profile` was found in that sidebar. Thus profile screen code exists but its normal menu entry is not source-proven. S/T screen router contains additional screens behind local selection.
- **Rebuild:** neither Profile nor Admin route implemented; **missing**, C=no/P=no/F=no/R=unverified.
- **Owner/acceptance:** application routing consumes Identity/Profile and Admin capabilities. Expose intended profile entry in account menu, protect Admin server-side; route restoration/direct access, correct not-authorized state. Do not assume legacy code existence means reachable menu functionality.

### PT-NAV-008 — Messages & DMs global overlay

- **Evidence:** P Sidebar:193 dispatches `open-direct-messages`, closes menu; Shell:42 listens and opens `MessageModal`, removes listener at cleanup; static badge **3 unread** at Sidebar:206. S/T Sidebar:230 has same shortcut family.
- **Mechanics:** browser event coordinates overlay; actual message transport is separate messaging domain; badge is fabricated constant.
- **Rebuild:** no global messaging overlay, **missing**.
- **Owner/acceptance:** Shell owns presentation, Messaging owns conversation/read state; Identity and Media dependencies. Real unread count, keyboard/host back behavior and error/empty states; never preserve constant badge as activity.

### PT-NAV-009 — Telegram haptics / ordinary browser fallback

- **Evidence:** P Shell:26 and Sidebar:38 guard `window.Telegram?.WebApp?.HapticFeedback`; calls impactOccurred light/medium/heavy; catches absence. Other page fallbacks call `navigator.vibrate`.
- **Rebuild:** N `apps/web/src/platform/host.tsx` canonical host adapter; **partial**, C=yes/P=partial/F=partial/R=unverified. Real Telegram runtime unproven.
- **Owner/acceptance:** host adapter, not business components. Capability detection only; no client Telegram ID authentication. Verify actual Telegram haptics/back/insets and ordinary browser absence without duplicated state.

## Identity/profile register (12)

### PT-ID-001 — Link Your Identity / Login Console

- **Evidence:** P `src/App.tsx:18` `LoginConsole`, panes splash/login/register; MainContent:207 returns it only if `!user`. Splash copy **Link Your Identity**, **Simulate Link**, **Sign In**, **Create Profile**, **Establish Google Identity**; custom handle max18.
- **Mechanics:** pane selection; guest path normalizes whitespace/lowercase. P Auth:39 initializes to DEFAULT_USER/PROFILE, so typical fresh start has guest identity and may bypass splash. No authenticated session is established by simulation.
- **Rebuild:** public discovery plus planned account notice, **missing** onboarding; C=partial/P=no/F=no/R=unverified.
- **Owner/acceptance:** Identity + Profile; public entry must stay genuinely public. Real session distinguishes guest/anonymous/account state; accessible translated onboarding; no simulated success or quantum-safe security claims.

### PT-ID-002 — Identify Citizen / Master Key / Password sign-in

- **Evidence:** P `src/components/profile/LoginModal.tsx:19` `handleSubmit`: requires nonempty handle/password; Auth:125 → `vqApi.login`; P `src/lib/vqApi.ts:87` queries profiles by lowercase handle, compares plaintext password only if both supplied/stored, writes random `vq_session_token`; Auth stores simulated user/profile. S Auth:53 and profileRepository use similar handle profile logic.
- **Storage truth:** Supabase query through Firestore-named adapter is a real source-level call, **client-side credential comparison/session simulation**. Profiles schema stores password text. No server credential/session proof.
- **Rebuild:** unavailable Identity notice, **missing**.
- **Owner/acceptance:** Identity authentication, Profile read capability. Preserve sign-in purpose/copy family while replacing insecure mechanics; server verification, hashed password/provider identity, secure session, rate controls, failure and account-linking tests.

### PT-ID-003 — Establish Google Identity

- **Evidence:** P Auth:192 `supabase.auth.signInWithOAuth({provider:'google', redirectTo:origin})`; catch invokes `loginAsGuest` after failure. S Auth:144 calls OAuth; T Auth:242 calls OAuth and surfaces error.
- **Mechanics:** provider redirect real call path, runtime unverified. P silently degrades authenticated intent to guest—not an accepted authenticated result.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Identity → provider adapter. Explicit failed/cancelled state, no silent guest-as-auth fallback; same canonical account as Web/Telegram and secure explicit linking.

### PT-ID-004 — Simulate Link / guest identity

- **Evidence:** P Auth:210 `loginAsGuest`; fixed `guest_node_1337`, hunter,150points, simulated wallet. P DEFAULT_PROFILE:16 starts Voyager1250points/streak6/culturalPassport; S analogous demo data. T Auth:55/63 creates guest with0points and explicit guest role.
- **Mechanics/storage:** localStorage `vq_simulated_user`, `vq_simulated_profile`; guest does not mean individual globally unique account. No device permission.
- **Rebuild:** public anonymous discovery exists without fake guest business activity, **changed**; C=partial/P=no/F=partial/R=unverified.
- **Owner/acceptance:** Identity visitor state only; no dummy shared user in writes, no inherited points or wallet; any demo mode separately labeled and isolated.

### PT-ID-005 — Create Profile / cultural tags

- **Evidence:** P `ProfileView:101` `handleSubmit`: handle/password/displayName mandatory; people3+tags, business1+tag; business category/address required; Oracle/business photoURL and phone required; Oracle bio/location required. Tag toggle:84 normalizes lowercase, custom tag:94 deduplicates. Auth:148 registration inserts profile,500points/streak1/generated wallet fragment.
- **Mechanics/storage:** form → profile row then simulated client session; person/business selection and contact protocol fields. Native HTML requirements on Oracle Telegram/X conflict with UI **Optional** copy at:595/:609. No genuine phone verification shown.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Profile + Identity; Social matching consumes public interests; Media owns validated avatar reference. Preserve meaningful form/interest concepts; server unique handle and approved tag requirements; do not fabricate reward/wallet/verified rank. Resolve optional-contact contradiction.

### PT-ID-006 — Handle availability check

- **Evidence:** P ProfileView:67 debounce 450ms, skips own handle while editing; `vqApi.checkHandle:71` lowercases, queries profiles; error returns true. S profileRepository:76 unique check with local fallback.
- **Mechanics:** available/checking/unavailable state; offline path inaccurately marks available; race protection at DB not proven.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Profile handle registry; Identity registration consumes capability. Debounced hint distinct from authoritative unique constraint; unknown/offline status, stale result cancellation and conflict recovery.

### PT-ID-007 — Edit Profile

- **Evidence:** P ProfileScreen:102 opens ProfileView; submit ProfileView:182 updates `profiles`, optionally `business_profiles`, localStorage/cache; success closes after1500ms. Create success closes after2000ms. Failed second write may leave first committed. Profile editing determined by non-default handle (:25).
- **Rebuild:** **missing**.
- **Owner/acceptance:** Profile owns profile write; Business owns business details via explicit application coordination, Media owns asset lifecycle. Authenticated owner, error recovery and approved consistency; no local cache declaring remote success; existing versus create determined by real canonical ID.

### PT-ID-008 — Oracle Mode / verified human profile

- **Evidence:** P ProfileView:529 toggle copy **Activate to mark a fully verified human profile**; persisted `oracleMode` boolean and business `verified:oracleMode`. `permissions.ts:17` instead derives role from `accountType || role`, not oracleMode.
- **Mechanics:** self-selected flag is neither independent verification nor reliably connected to Oracle access. No external verification call found.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Identity verification/Moderation grants role; Profile displays result. Clarify approval/evidence process and role hierarchy; never let a client toggle grant verified status or protected capabilities.

### PT-ID-009 — Full People Profile / Oracle and Business access

- **Evidence:** P `permissions.ts:42` `canViewFullPeopleProfiles`; `PeopleProfilePage:12` conditionally displays Bio/Interests/Location/Activity/Social/Status; `PersonProfileAccess:25` locked message. Business targets bypass person lock. `profileVisibility.ts:3` also hides person details by viewer.
- **Mechanics:** UI checks mutable client profile; input object may already include hidden data. No server field-level gate in primary schema (public select true).
- **Rebuild:** **missing**.
- **Owner/acceptance:** Profile visibility capability with Identity role, Social consent/blocking. Explicit product decision on role-based exposure; response minimization before rendering, owner/relationship exceptions defined, blocked users cannot fetch precise details.

### PT-ID-010 — Voyager / Upgrade / Elite

- **Evidence:** P ProfileScreen:115 card initially claims **Wallet connected - Marketplace access enabled**; Upgrade:130 toggles local flag, adds 100 points on each false→true transition and alerts rank elevated. Sidebar:162 uses points>800 to call Elite; no authoritative role update. S has related profile upgrade presentation.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Quests/Rewards for approved tier calculation; Identity role separately. Define genuine eligibility, idempotency and role/tier distinction; no repeat-toggle rewards or wallet connection assertions.

### PT-ID-011 — Terminate Node Session / Logout

- **Evidence:** P ProfileScreen:171 and Sidebar:333 call Auth:240: remove simulated user/profile then Supabase signOut; clears local current user/profile after provider handling. T Auth:249 signOut errors remain surfaced.
- **Mechanics/storage:** hybrid local/provider logout; separate `vq_session_token` cleanup is not shown in P logout. No timer.
- **Rebuild:** no authenticated session yet, **missing** action.
- **Owner/acceptance:** Identity session manager; revoke server session, clear relevant cached personal data, preserve theme/locale as appropriate, stop subscriptions, accurate offline/error handling.

### PT-ID-012 — Email login / recovery / resend confirmation

- **Evidence:** P/S handle login has no reset/resend controls found. T `LoginModal:44` `runEmailAction` requires email; T Auth:178 password sign-in, :192 signUp (password min8), :230 confirmation resend, :235 resetPasswordForEmail; Auth session listener/load profile. Source has real Supabase Auth call paths, runtime unverified.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Identity provider/session. Preserve recovery concept added in T without adopting provider structure; choose login identifier UX, confirmation and callback route rules; expired/used links, rate limits and account-takeover-safe linking.

## Settings/permissions/notifications register (10)

### PT-SET-001 — Device Settings / Sync Preferences / Security Protocol / Identity Verification

- **Evidence:** P Sidebar:299 **Device Settings** alert **Sync preferences open.**; P ProfileScreen:20 three sections, click:155 only alerts sector name. S Sidebar:432 same alert behavior.
- **Rebuild:** Settings entry absent; **missing**.
- **Owner/acceptance:** Profile menu/settings composition, domain-owned preference capabilities. Real preference screens and save/error states; preserve named sections only if meaning is defined; no alert-only behavior counted complete.

### PT-SET-002 — Locale (EN ⇄ JA)

- **Evidence:** P Sidebar:265 only alerts **Switching locale: Japanese translation layered.** No catalog switch. S/T `useProfileSettings:6` changes i18n, persisted locale, document direction/event; supported en/ja/fr/ar/es/pt/zh:30; Sidebar:374 actual menu languages.
- **Rebuild:** four real catalogs/defaultEnglish and current header control (N Shell:95); **working implementation, placement changed**. C=yes/P=no/F=yes/R=unverified.
- **Owner/acceptance:** single locale owner, shared Profile menu consumes it; exact first-release English/French/Arabic/Spanish, route preserved, reload preference, RTL, translated validation/date/number copy. Primary faux locale behavior must not be copied. Extra S languages do not expand first-release requirement.

### PT-SET-003 — Cyber Mode / Swarm Mode theme

- **Evidence:** P is hardcoded dark; P index.css:47 body bg-black/text-white; no theme selector in primary sidebar. S/T Sidebar:188 labels **Cyber Mode/Midnight Neon Theme** and **Swarm Mode/Warm Cream Theme**, toggles `useTheme`; S Shell:145 also has top-header theme toggle (duplicate presentation, not necessarily separate state owner).
- **Rebuild:** semantic light/dark/system owner implemented; control wrongly top-level; **changed**, C=yes/P=no/F=yes/R=unverified.
- **Owner/acceptance:** `packages/ui` canonical theme; Profile menu choice and host adapter hints. Single preference state, no initial flash, OS changes honored in System, explicit choice wins. Dark black/zinc identity with restrained accents; clean neutral light. System is explicit owner addition.

### PT-SET-004 — Local Device AI

- **Evidence:** P Sidebar:18 reads `vq_local_ai_enabled`, `vq_local_ai_endpoint` default localhost11434; writes on toggle/input; **Linked Node** means nonempty text, no connectivity test. S/T hook `useLocalDeviceAiSettings:8` uses deviceAiService and localEndpointAiProvider; GET root then `/api/tags` each3500ms; generation POST `/api/generate` timeout15000ms; mixed-content handling in provider.
- **Rebuild:** **missing** optional preference.
- **Owner/acceptance:** optional device capability adapter; domain consumers retain deterministic working core without AI. Explicit opt-in, URL validation/network privacy, truthful test status and failed/disabled state; no default background requests just to render Settings. No model output becomes canonical discovery records without domain validation.

### PT-SET-005 — Oracle Help

- **Evidence:** P Sidebar:315 displays alert version/contact text **VQ Oracle Protocol v1.0.4... Contact @vibequest support**; S changes to Local Guide Support.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Help presentation/content, no business owner mutation. Approved support destinations, localized accessible help and relevant permission recovery; no fictitious contact or delivered support message.

### PT-PERM-001 — Geographic location / refresh / continuous tracking

- **Evidence:** P GeolocationProvider:28 `refreshLocation` highAccuracy true, timeout5000,maxAge10000; effect:55 invokes it on mount then watchPosition lower accuracy, timeout10000,maxAge30000, cleanup clearWatch. `lib/geolocation.ts:34` rounds 4 decimals; :126 capture fallback; `platform/geo.ts:18` native Capacitor/Web switch.
- **Mechanics:** coords/city/accuracy/status/loading state; defaults Tunis; success marks granted; fallback marks denied (unsupported/timeout collapsed). Shared foreground watch exists; browser maxAge is cache allowance, not a guaranteed30second sample interval. Rounding is precision reduction, not proof of differential privacy.
- **Rebuild:** opt-in Explore locate exists, no hidden ongoing tracking; **partial**, C=yes/P=partial/F=partial/R=unverified.
- **Owner/acceptance:** Device host adapter + Geo consent/presence. Contextual explicit request; distinguish denied/unavailable/timeout/prompt/granted; fallback browse area explicitly labeled; precise data minimized; watch starts/stops with consent/feature, foreground/background limits explained. No automatic monitoring copied from primary.

### PT-PERM-002 — Camera permission / live capture

- **Evidence:** P ShareGoodVibesScreen:264 getUserMedia constraints; fallback:277 user camera; native response components also browser mediaDevices calls; native `VibeShotCamera:76` requests native permission. These are different code paths, not proof native files are installed/routed in Web runtime.
- **Rebuild:** capture notices only, **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** camera host capability → Global Media ingest → owning Social Content/challenge domain. Explicit start, denial/unavailable/revocation/stop/retry; secure context; real frames only; stop tracks after exit; retake does not publish; no provider imitation as valid proof. Capture lifecycle details belong companion register.

### PT-PERM-003 — Microphone permission / room voice

- **Evidence:** P PaltalkChatroom:850 `startMicRecording` getUserMedia audio at:883, MIME supported list; MediaRecorder.start250ms, timer stops at10sec; denial/unsupported:925 starts simulation and timer. stop:930 generates WAV if simulated, otherwise Blob/base64; tracks stopped after recording.
- **Storage truth:** real capture source branch plus explicitly synthetic waveform branch, neither verified here. Denial does not reliably present denied status; fabricated audio must not count voice parity.
- **Rebuild:** Soundboard/voice pending, **placeholder**, C=partial/P=no/F=no/R=unverified.
- **Owner/acceptance:** Device capability + Media + Messaging. No automatic recording; permission status accurate; no synthetic substitute presented as user recording; validate10sec requirement separately; cancel/revoke/background/cleanup; real upload/playback across supported hosts.

### PT-PERM-004 — Geographic location / Camera / Microphone access-request panel

- **Evidence:** owner specifies original screenshot of three capabilities. No unified tri-permission panel was found in inspected P App/Profile/Shell or matching source searches across P/S/T. Individual actual API paths are PT-PERM-001–003. The screenshot's origin/version/control behavior remains **unknown**, not invented.
- **Rebuild:** no tri-permission panel, **missing** desired concept.
- **Owner/acceptance:** shared permission settings presentation + host capability adapter, with per-feature consent. Reconstruct approved three-capability panel from supplied screenshot when accessible; truthful statuses, contextual request buttons, Settings re-entry and browser/Telegram instructions. One click must not secretly start capture or monitoring.

### PT-NOT-001 — Notifications / Flash alerts / native push

- **Evidence:** P Sidebar:210 only alert with constant 6 active; Shell always red dot. S/T `lib/pushNotifications.tsx:89` provider settings defaults enabled=true/radius2km/browser=false/sound=true, localStorage key; :138 browser request, :166 in-app/optional browser notification; :205 auto-dismiss10s; :210 Flash radius gate and in-memory ID dedupe; :292 click navigates Explore. Native P `vibeCheckNotifications:15` sends Expo fetch fire-and-forget, catches failure, copy 5 min; :67 tap routes camera before expiresAt else history. P `native/vibeFlashScheduler:24` Notifee permission/scheduling is separate native-only source.
- **Mechanics/truth:** actual browser/Expo/native call declarations, not verified delivery or server fan-out; secondary Flash alerts come from browser vq_flash_event_created and storage(vq_flash_events) listeners, not a proven backend event stream; dedupe marks ID before claimed/radius checks, so later eligibility can be suppressed; settings persistence is local, dedupe clears per provider lifetime. Primary unread badges fake. Browser Notification API alone is not background Web push architecture.
- **Rebuild:** planned notifications dialog, **placeholder**, C=yes/P=no/F=no/R=unverified.
- **Owner/acceptance:** Notifications owns subscriptions/preferences/delivery/read state; Events/challenges emit authorized events; Geo supplies consent-limited eligibility; host delivery adapters. Real unread counts, idempotent delivery, preference opt-out, permission denial, expiry-aware deep links, foreground/background support explicitly proven. Timing conflict remains with challenge domain; no blind 5 min adoption.

## Business/events register (7)

### PT-BIZ-001 — Business Profile / person-business selection

- **Evidence:** P ProfileView:393/:406 selection; :433 category/phone/address; payload entityType business, no role grant. `permissions.ts:11` recognizes business entity; `businessProfiles.ts:19` upserts separate business_profiles by owner; ProfileScreen:26 branches to BusinessProfilePage. S/T lack this primary dedicated BusinessProfilePage source in scoped file inventory; their official events remain supplemental.
- **Storage truth:** real Supabase calls, hybrid two-write state; primary policies business_profiles public CRUD true (schema:372). No independent ownership/verification enforcement.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Business Profile capability separate from Identity role; explicit owner ID, unique account/business link, permissions server enforced, recovery from partially completed registration and clear unverified/pending state.

### PT-BIZ-002 — Overview / verified business statistics

- **Evidence:** P BusinessProfilePage:12 activeSection; fallback name **Verified Business**, hours **Open daily**, posts 24/events 8:17; Verified **Yes** and BadgeCheck appear unconditionally at :45/:72; Overview:99 displays official hub/address/contact-on-file text and publishing capability claim.
- **Mechanics:** renders props with fabricated/default facts; no verification lookup shown.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Business Profile + Events reads; accurate no-data state and real verified flag, actual counts; never show 24/8 or verified by default.

### PT-BIZ-003 — Events / Business Events / Publish Event

- **Evidence:** P BusinessProfilePage:132 mounts the manager. `BusinessEventManager:45` validates title and venue only, calls `createBusinessEvent` with owner/city/dates/status/visibility, resets after await and reloads. `businessEvents:63` inserts `business_events` and a `biz_thread_${Date.now()}` string.
- **Mechanics:** idle → saving → reload or error. Live/upcoming are manually selected; dates optional. No start/end ordering validation, automatic server-clock transition, owner role check or actual thread creation in this command. Primary schema:449 allows public CRUD with true policies.
- **Rebuild:** Live Events pending card only; **placeholder**, C=partial/P=no/F=no/R=unverified.
- **Owner/acceptance:** Events creation + Identity business authorization + Business Profile + Messaging thread creation. Approved timezones, dates, visibility and lifecycle; actual thread; authenticated owner; recovery/idempotency. Generated thread ID is not evidence of created conversation.

### PT-BIZ-004 — Refresh / event Thread / Remove

- **Evidence:** P BusinessEventManager:113 reloads owner events ordered by starts; :171 selects EventThreadPage. **Remove** at :186 is a span inside the clickable event, with no delete handler; clicking it selects the thread.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Events query/delete; Messaging thread capability. Genuine refresh states; deletion needs an authorized separate control and approved lifecycle, attendance and notification effects. Decorative Remove is not working deletion.

### PT-BIZ-005 — Photos / Hours / Contact

- **Evidence:** P BusinessProfilePage:140 Photos says **Photo gallery and promos coming next.** Hours displays a fallback value. Contact states verification-only, hidden Phone/WhatsApp. Primary public-select policy still exposes stored fields; UI hiding is not enforced privacy.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Business Profile public/private fields; Media assets. Actual gallery, editable timezone-aware hours, contact fields excluded from unauthorized payloads/logs. Decide public marketing contacts versus private verification contacts.

### PT-BIZ-006 — Official events / Live Activities eligibility

- **Evidence:** P `permissions.ts:34` permits Oracle or Business live activities; :38 permits Business official events. S/T `features/home/components/LiveEventsPanel.tsx:199` states business-only; :214 local simulated account toggle, :236 gated form, :302 locked message.
- **Mechanics:** mutable client gate; simulated business promotion is a rejected legacy defect, never target authorization.
- **Rebuild:** pending publishing entry; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** Identity authorized role + Events/Activities command. Server capability enforcement; explicit role grants; public discovery remains public. No preview role switch in production.

### PT-BIZ-007 — Ticketmaster / Eventbrite / Business discovery

- **Evidence:** P `eventDiscovery.ts:56` declares Ticketmaster 100km, size20, date ascending; :107 Eventbrite 100km/page20. Calls only when configured. :162 queries public business events by city substring. :82/:137 labels live when absolute distance from start is less than three hours, including future starts. :198 generates fictional music/makers/food events now/+6h/+24h.
- **Truth:** real provider-call declarations, not verified provider compatibility or delivery. Generated fallback events are prohibited in the new product.
- **Rebuild:** **missing** event reader; Places listing does not replace it.
- **Owner/acceptance:** Events ingestion/provenance and canonical records; Geo browsing bounds. Approve live interval, deduplicate source IDs, distinguish empty/error, use no fictional fallback. Credentials belong to server adapters.

## Admin register (4)

### PT-ADM-001 — Admin Dashboard / System

- **Evidence:** P Sidebar:283 exposes Admin without a role gate; App:228 selects it; AdminScreen:14 has no admin gate. S/T AdminConsole:19 checks client role, but :149 `handleSimulateAdminActivation` self-grants admin in localStorage.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Admin Control Room composes bounded capabilities; Identity server roles; Moderation/Audit. Unauthorized direct API/UI access denied; no simulated self-admin path. A developer-only sandbox is not a production grant.

### PT-ADM-002 — Registered Citizens / Daily Active Users / Total Vibes / Refresh

- **Evidence:** P AdminScreen:33 queries counts for profiles/vibes/direct messages; :58 daily active = max(1,floor(users × .65)); :83 synthetic dates/growth; :116 Refresh. S/T AdminConsole:43 uses repository counts and recent24h users, otherwise floor(users × .75 + 3), plus fallback classes/timeline.
- **Truth:** real query paths mixed with fabricated analytics. P :185–188 comments saying charts remain do not implement charts.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Admin analytics read models and Audit. Actual measurements, documented definition/timezone, errors distinct from zero. No interpolated activity presented as observed fact.

### PT-ADM-003 — Metrics / M3 Sandbox / metric drill-down

- **Evidence:** S/T AdminConsole:24 metrics/m3 tabs, :248/:260 selection; :288/:312 users/active drill-down; Material sandbox is a development/design surface. P lacks the sandbox and retained charts despite comments.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Admin Control Room and separate design sandbox. Authorized route, actual drill-downs, no fixtures in production analytics. Decide whether the design sandbox is part of the product.

### PT-ADM-004 — Moderation / account audit boundaries

- **Evidence:** S/T `features/chatroom/components/AdminModerationPanel.tsx` contains moderation UI; detailed actions are registered in the companion social register. T `supabase-setup.sql:266` declares ledger auditing trigger; deployment is unverified. Primary permissive CRUD policies contradict protected admin/financial claims.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Moderation/Audit owns reasoned commands/logs; Messaging, Media, Identity and Commerce expose capabilities. Server roles, attributable logs and approved recovery/appeal policy. Admin never directly mutates another domain's tables.

## Purse/finance/support register (18)

### PT-PUR-001 — Crypto Hub / VQ Wallet / Pulse Trading

- **Evidence:** P `src/screens/CryptoScreen.tsx:110` says **Crypto Hub**, :119 wallet/pulse rail. S/T `features/crypto/components/CryptoDashboard.tsx:260` has wallet/p2p and screen heading Purse. User locks global PURSE; retain primary mechanics evidence without copying its Crypto destination label.
- **Mechanics:** local tab state only, no device permission. Comment **Supabase ready** does not implement an offer reader.
- **Rebuild:** N `apps/web/src/features/purse/purse-page.tsx:21` wallet/p2p tabs; **partial**, C=yes/P=partial/F=partial/R=unverified (tab selection only).
- **Owner/acceptance:** Purse presentation → Commerce capabilities. Decide Pulse Trading versus P2P Trading subnavigation and approved asset copy; no financial rules invented.

### PT-PUR-002 — Your Balance / VQ / shards / asset meaning

- **Evidence:** P Crypto:158 `profile.points || 1250`; default/guest/registration values1250/150/500 in Auth. S/T CryptoDashboard:19 starts with same fallback, then :78 uses exact points. T guest0 can briefly display1250 until the effect. None proves on-chain assets.
- **Rebuild:** **Not connected** placeholder; C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** Quests/Rewards owns approved points; separately authorized Commerce owns financial assets. Decide points/token/currency meaning, transferability, precision and custody. Real zero must display zero. No seeded or fallback balance.

### PT-PUR-003 — Send

- **Evidence:** P Crypto:163 sets `showSendModal`, but JSX is omitted at :272–273. `handleSendTokens:73` exists without its connected form; parseInt positive/within fallback points, deducts points, adds local transaction, claims success, closes after2000ms. No recipient credit.
- **S/T:** CryptoDashboard:92 has actual form/modal at :714; required recipient field, positive integer parsing and balance check; awaits `updateProfilePoints(-amount)`, prepends local ledger, success closes after2s. T Auth:253 rejects nonpositive rewards; identical Purse handler therefore conflicts with T Auth.
- **Rebuild:** planned notice; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** approved Commerce/points transfer command, Identity recipient lookup, atomic ledger and Notifications. Approve semantics first. Actual recipient/balance, idempotency, both ledger effects, failure never claims success. Reconstruct missing primary modal using secondary concept without copying broken transfer logic.

### PT-PUR-004 — Receive

- **Evidence:** P Crypto:170 sets state but omits modal. S/T CryptoDashboard:777 presents a decorative 4×4 grid as QR/traveler code; it does not encode a valid QR payload. :84 copies @handle. Copy :797 claims immediate receipt without incoming transfer integration.
- **Rebuild:** notice; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** Commerce receive identifier/read ledger + Identity. Real valid QR/code, explicitly defined handle/wallet meaning, actual incoming credit; no unsupported instant claim.

### PT-PUR-005 — Solana network Node / Copy wallet / Explorer Share Key

- **Evidence:** P Crypto:178 displays static short address; :67 copies it, ignores clipboard promise; feedback lasts2000ms. S/T copies @handle instead of chain address.
- **Rebuild:** key pending; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** Profile identifier or verified Commerce wallet binding, according to approved meaning; Clipboard host capability. Await copy, surface failure; never fixed/random address or false confirmation.

### PT-PUR-006 — Solana Node Address / simulated reconnect

- **Evidence:** P Sidebar:53 chooses one of three hardcoded strings, updates profile wallet and alerts **Connected simulated Solana Wallet**. S/T Sidebar:51 same family; P Auth:271 profile write/cache is not wallet proof.
- **Rebuild:** **missing**.
- **Owner/acceptance:** separately approved Commerce wallet adapter + Identity proof. Real connect/decline/disconnect and verified public key; no simulation or address randomizer.

### PT-PUR-007 — Solana Provider / Devnet

- **Evidence:** P `lib/solana.tsx:8` Devnet endpoint, wallets=[], autoConnect; App:242 wraps provider. CryptoScreen has no sendTransaction/chain transaction path in the inspected implementation.
- **Rebuild:** **missing**, intentionally unavailable.
- **Owner/acceptance:** optional Commerce provider adapter; approved network/signing policy and actual device/provider verification under a separate financial packet. SDK presence does not prove funds or settlement.

### PT-PUR-008 — Ledger Transaction History / transfers / Mission Node Verification

- **Evidence:** P Crypto:25 seeds +250/+50/-75 memory rows, displays at :195. S/T CryptoDashboard:30 reads `vq_ledger_activities` or seeds three records; :47 persists localStorage; :354 uses Check-In Reward/Inbound Transfer/Outbound Gift titles.
- **Rebuild:** empty ledger; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** Rewards/Commerce each own their actual ledger; Purse consumes an approved view. User records only, correct units/date/status, pagination/empty/error, no demo transactions.

### PT-PUR-009 — Pulse offers / BUY VQ / SELL VQ / Trust Rating

- **Evidence:** P Crypto:34 `fetchOffers` only installs two fixed offers; rates1SOL=450VQ and400VQ=.82SOL, minimum.1SOL/100VQ, trust100/97. No provider fetch. :228 claims automated secure local distributed-ledger trading without corresponding implementation.
- **Rebuild:** empty trade panel; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** Commerce offer query; Moderation/trust capability. Approved asset/rate/network/limit policy; actual offers and trust evidence; no fixture partners/ratings or unsupported security claims.

### PT-PUR-010 — Initiate Ledger Swap

- **Evidence:** P Crypto:255 confirmation → alert **Decrypted negotiation channel started.** → +50 points. No actual room, swap or escrow creation.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Commerce initiation → Messaging conversation; Rewards only if approved and completion proven. One authorized real conversation, truthful failure; no confirmation-only bonus or unsupported encryption claim.

### PT-PUR-011 — P2P Trading / All / Buy / Sell

- **Evidence:** absent in P; S/T CryptoDashboard:51 filter state, :55 three seeded offers; :249 excludes nonactive offers and filters type. Cash/Revolut/Coffee Swap locations, USD prices and trust figures are fixture data.
- **Rebuild:** p2p tab works, no offer/filter flow; **partial**, C=yes/P=partial/F=partial/R=unverified.
- **Owner/acceptance:** Commerce classifieds query, Geo browse area, Moderation. Define relationship to primary Pulse; actual active offers/filter results and no-data/errors; fixtures prohibited.

### PT-PUR-012 — New Offer / Buy or Sell / asset / USD price / Meetup Location

- **Evidence:** absent in P; S/T CryptoDashboard:130 checks positive parseFloat amount/price, sell ≤ VQ balance even if asset SOL; creates100% trust/active local offer. :604 has VQ/SOL asset, Cash default, Anywhere location fallback. No persistence or reserved funds.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Commerce offer creation, authenticated actor, Moderation/Geo. Approved price/payment/location rules, asset-aware amounts, storage/concurrency/spam rules; never compare SOL quantity to VQ points.

### PT-PUR-013 — Meetup Deal / trade chat

- **Evidence:** absent in P; S/T CryptoDashboard:170 opens local offer with fixed partner greeting. `activeEscrowOffer` variable exists, but comment says **without escrow references**. UI :396 says **Meetup Deal**.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Commerce deal state, Messaging actual conversations, Identity membership, Media attachments. Real participant receipt/history/reporting; no impersonated partner or variable-name escrow inference.

### PT-PUR-014 — Send trade message / simulated partner response

- **Evidence:** S/T CryptoDashboard:185 requires active offer/nonempty text; appends message and typing; after1500ms generates canned reply for where/meet/location, payment and ok/cool keywords. No provider or persisted message.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Messaging transport with Commerce membership. Real delivery/read/error/retry/idempotency and actual typing; synthetic partner messages prohibited.

### PT-PUR-015 — Mark Transaction Completed / archive / exit trade chat

- **Evidence:** S/T CryptoDashboard:222 appends informational mock ledger, marks local offer completed, waits800ms then alert/archive/close. No funds held or released. Exit :400 closes after confirm; reopening constructs a new greeting rather than persisted history.
- **Rebuild:** **missing**.
- **Owner/acceptance:** Commerce lifecycle, Messaging history, Audit. Decide physical classifieds versus actual escrow, participant confirmation, dispute/cancel/recovery. Never implement financial escrow from function/variable names.

### PT-PUR-016 — dispatch_tip / points ledger / escrow-type declarations

- **Evidence:** P Crypto has no atomic transfer. S/T `infrastructure/repositories/ledgerRepository.ts:19` calls RPC `dispatch_tip`; catch still creates local completed transaction. T `supabase-setup.sql:99` SECURITY DEFINER function accepts sender/recipient/amount, deducts/credits/logs; no explicit auth.uid=sender, positive amount check or row lock in function. Profile owner-update RLS at :143 does not establish protection of this SECURITY DEFINER path. `LedgerTransaction:3` declares escrow_lock/release/escrowed types, not an escrow implementation.
- **Rebuild:** **missing**.
- **Owner/acceptance:** approved Commerce/points command with Identity actor and Audit. Validated atomic operation, idempotency/concurrency, no completed ledger on failure. Installed function/permissions remain unknown; no legacy security claim copied as proof.

### PT-PUR-017 — points rewards / streak interaction / claim_reward

- **Evidence:** P Auth:255 allows arbitrary client delta/profile write. Registration500, Upgrade100, swap50, donation50 are source behaviors, not approved target formulas. T Auth:253 requires authenticated non-guest positive integer; calls `claim_reward` with reward code/random UUID and uses returned balance. Function definition is not present in inspected T `supabase-setup.sql`; availability unverified. Purse negative calls conflict.
- **SQL supplement:** T SQL:171 `process_check_in_streak`: first1; elapsed≤24h increments; >48h resets1;24–48h maintains. Base20; streak>1 multiplier1+min(1,streak × .1), rounded award, ledger insert. Public insert with check(true) and no same-day dedupe permits repeated increments in declared logic. No deployed SQL runtime proved. Other client quests/streak formulas remain in companion mechanics register.
- **Rebuild:** reward/streak cards pending; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** Quests/Rewards owns approved formula/eligibility/idempotent ledger. Geo/Events/challenges emit proven completion; never direct points writes. Decide competing formulas and VQ meaning; separate transfers from rewards, fail/duplicate actions cannot mint activity.

### PT-PUR-018 — Support the Pulse / SOL / USDC donation

- **Evidence:** P ShareGoodVibesScreen:2162 DonationModal. Defaults SOL.1; presets SOL.05/.1/.5/1 and USDC5/10/25/100. :2172 validates positive parseFloat. Form → transacting → create donations row →1400ms timer → +50 points → completed; error resets form. S/T `useDonationFlow:5` and `donationService:3` have the same extracted logic and are hash-identical. No payment/chain call, debit or receipt proof. Timer failure is outside the outer catch.
- **Rebuild:** Support the Pulse notice; **placeholder**, C=yes/P=partial/F=no/R=unverified.
- **Owner/acceptance:** separately authorized Commerce donation/payment, approved Rewards receipt rule, Identity/Audit/Notifications; Share is presentation. Intent record ≠ paid donation. Genuine provider/server receipt, idempotency, pending/cancel/error/recovery; no simulated payment or timer-based paid success.

## Exact primary visual facts and source conflicts

- P `src/index.css:3` primary accent **#a855f7**, secondary **#ec4899**; body :47 applies **black/white**. The earlier example **#0e0f11/#1e1f22/#2a2b2f/#f1f3f4** values are not this primary's declared global palette. P Shell:101 is black with zinc900 borders, black95% header and3% pink/orange ambient glows. Do not label earlier example values verified primary tokens.
- P bottom navigation:56px black95%, zinc900 border;18px ordinary glyphs/22px heart; uppercase8px heavy tracked labels. Active colors Home **#f97316**, Explore **#3b82f6**, Share **#f43f5e**, Vibe **#a855f7**, Crypto **#06b6d4**; filled rounded control/rings/dot; heart text omitted. These are source facts, not rendered acceptance.
- Primary is mostly neutral but not uniform: Crypto card **#0b0d12**, raised **#121926**, Voyager card **#1f102c**, People Profile **#050816**. Preserve distinctive accents through one semantic theme; do not port every inline value or claim every legacy surface neutral.
- Primary menu is a right slide-out, whereas the rebuild has an account notice. Owner requires Settings/four languages/Light-Dark-System in profile dropdown despite primary language/theme gaps. Secondary adds working locale/theme but also header presentation; that extra header control is not the target.
- Fully functioning light mode is an owner requirement, not verified primary capability. Dark must retain black/zinc identity with restrained accents; light white/lightgrey/dark text; no second Telegram theme state.

## Decision ledger and clean reconstruction boundaries

| Decision ID   | Source conflict or unknown                                           | Required decision                                                               |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| D-PLATFORM-01 | P Crypto/Crypto Hub/Pulse versus S/T Purse/P2P; owner locks PURSE    | Keep global PURSE; approve subtab/asset copy without invented exchange rules    |
| D-PLATFORM-02 | P Super App Matrix versus S Gather & Discover                        | Approve subtitle; real notification presentation; no fixture badges             |
| D-PLATFORM-03 | Oracle boolean versus access role; self-upgrade; business membership | Verification evidence/grants, role versus tier, profile access policy           |
| D-PLATFORM-04 | P handle/password simulated session versus T email Auth/recovery     | Auth identifier/provider UX, callback/recovery/linking policy                   |
| D-PLATFORM-05 | Three-permission screenshot panel not located in inspected code      | Source/version and approved panel copy; truthful contextual permission contract |
| D-PLATFORM-06 | Optional contact copy with required HTML; hidden UI/public rows      | Required fields, public versus private verification contacts and consent        |
| D-FINANCE-01  | VQ points/shards/tokens, SOL exchange, Cash/Revolut listings         | Transferability, actual assets/custody/payment/networks; no assumptions         |
| D-FINANCE-02  | Swap-confirm reward versus physical deal and escrow names            | Distinct offer/deal/escrow concepts, settlement/confirmation/dispute/cancel     |
| D-FINANCE-03  | Static wallet versus @handle share ID                                | Approved receiving identifier and wallet proof                                  |
| D-FINANCE-04  | Arbitrary deltas versus positive claim RPC and SQL streak formula    | Single approved Rewards formula/eligibility; transfers separate                 |
| D-FINANCE-05  | Donation row → timer reward without payment                          | Provider/receipt/reward/idempotency rules; intent never equals payment          |
| D-OPS-01      | Open/self-granted Admin, synthetic analytics, M3 sandbox             | Server role policy; actual analytics; product versus development-only views     |
| D-EVENTS-01   | Manual live status versus abs(start-now)<3h                          | Live interval/timezone/status lifecycle and publishing authorization            |

Dependencies must be public capabilities, never direct cross-domain table writes. Identity owns actors/sessions/roles; Profile owns public/private identity; Geo owns consent/presence; Notifications owns preferences/subscriptions/delivery; Messaging owns conversations/read state; Media owns shared ingest/storage, not all domain images; Business/Events own their records; Quests/Rewards owns approved point eligibility/ledger; Commerce owns separately authorized asset/deal commands; Moderation/Audit owns reviewed actions/logs; Admin composes those capabilities.

No application, schema, provider, finance, permission or runtime changes are authorized here. All legacy simulations are rejected defects. Unimplemented capabilities remain unavailable. Future acceptance requires genuine ordinary Web and actual Telegram runtime proof as relevant; this source investigation makes no new runtime claims.
