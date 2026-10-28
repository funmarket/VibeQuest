# Home presentation reconciliation — 28 October 2026

This is the independently authorized Home presentation slice of the R10 packet. It does **not** complete R10 discovery or the Local/For You Content readers.

## Verified sources and scope

Starting foundation: `0d923f70c53401e7d2c56e36b15c3d3e55b88860`. No open PRs at preflight. The current master plan, canonical agent contract and existing Home, Profile, Content, Graph, Geo and Activities/Events contracts were inspected.

The supplied `Downloads/vibequest.zip` contains 350 entries. The extracted `DriftView.tsx`, `HomeFeedTabs.tsx`, `LiveActivitiesPanel.tsx` and `LiveEventsPanel.tsx` match their ZIP entries byte-for-byte. The supplied page-by-page reference dated 2026-10-28 was also inspected. The separately mentioned three-tab screenshot was unavailable; no screenshot-exact parity is claimed.

## Behavior

- Move the existing single social feed immediately below the unchanged Flash banner, before Activities and Events. Remaining Home sections retain their relative order.
- Replace the feed's shared scrollable boxed rail with a dedicated three-column, transparent, flat tablist. All three translated tabs remain visible together; preserve existing selection, route, keyboard/RTL handler, tab roles and panel association.
- Use source gold `#eab308` for the active underline and dark-theme text. Light-theme active text uses readable gold `#8a6500` (5.33:1 on white).
- Calibrate the existing green Activities and blue Events presentation to the Gemini source: 20px section padding, 12px/14px thumbnail gaps and 16px Event card corners. Allow long translated Activity expand/collapse labels to wrap within the card. Restore the Event title/status badge hierarchy, category/Going metadata, readable gold rating and source-proven circular expansion tray while retaining accessible expand/collapse text.

No new feed/card owner, public API, persistence, migration, dependency, synthetic production content, privilege or device/provider behavior is added. Existing thumbnails, details, hosting, publishing, RSVP, saves, reviews, edit/cancel and Media authorization retain their original handlers and domains. The affected panels are currently used only by Home. This reconstructs the available source-proven Home card hierarchy using genuine existing facts; it does not claim pixel-exact original-runtime parity.

## R10 policy boundary

The approved hybrid model remains binding: quarterly complementary Romance/Polar automatic matches; monthly similarity/activity-based Social automatic matches; ongoing broader Drift suggestions without automatic relationships; separate invitation → Pulls → Accept/Ignore → Vibes manual matching. Ordinary discovery filters do not enroll users in automatic programs. Scheduled matching, behavioral reports and Messaging remain later work.

The current D03 record explicitly leaves ordinary filter compatibility, deterministic relevance/tie-breakers, enumeration/request/repeated-action thresholds, coarse Local-area/post provenance and no-GPS fallback, For You relevance/no-interests behavior and permitted cross-user Geo comparison unresolved. The legacy Drift keyword/fallback profiles and fixture feed arrays are not approved production rules. This slice leaves the existing unavailable reader state intact rather than fabricating results or defining these policies.

## Verification boundary

The focused Chrome suite explicitly distinguishes layout fixtures from genuine API-backed regressions. Its matrix covers 320/360/375/390/393/412/430/768/1280 CSS pixels, EN/FR/ES/AR, light/dark, RTL, expanded cards, guest restrictions, section order, balanced flat tabs and keyboard selection. Current test/CI results and final source revisions are recorded in the existing master plan after integration.

No Railway deployment, hosted migration, physical-device/Telegram acceptance or original-runtime pixel comparison is implied. The existing pinned Next.js advisory is unchanged and outside this slice. The next work remains the unresolved R10 readers, not R11.
