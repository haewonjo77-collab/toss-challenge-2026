# Project Memory

Last updated: 2026-07-09, Asia/Seoul

## Current Product Decisions

- Meeting creation should stay focused on the core scheduling flow: direct attendee entry, required/optional roles, invite link, response collection, and recommendation.
- Attendee reuse, saved groups, recent-meeting chips, and contact-like suggestions are intentionally hidden from the main flow.
- Same-team quick chips are allowed because they reuse only departments already typed in the current meeting and speed up direct entry without implying contact management.
- Invite sending uses a confirmation sheet before OS share/copy, so users understand they are sharing an invite link.
- Copy and share are separate actions. Copy shows `초대 링크가 복사됐어요`; share shows `초대 링크가 공유됐어요`.
- Waiting rows show `대기중` for non-responders. The separate bottom action is `미응답자에게 알림 보내기`.
- Simulated response updates appear as top notification banners with remaining-count context, e.g. `김도윤님 응답 완료 · 1명 남았어요`.
- Simulated responses arrive every 7 seconds for testability.
- Recommendation cards must distinguish full/partial/unavailable states with text labels, not color alone.
- Required attendees use stronger accent treatment; optional attendees stay lower-emphasis in gray tones.

## Latest Implemented Changes

- Restored same-team quick attendee chips based on departments already added in the current meeting.
- Separated pending response status from the nudge action.
- Replaced in-card response banner with iPhone-style top notification.
- Shortened mock response wait time from 12 seconds to 7 seconds.
- Added explicit `일부 가능` / `참석 불가` labels and availability summaries in recommendation cards.
- Added unavailable-time `선택 초기화`.
- Moved same-team chips above attendee inputs and placed attendee name/team fields side by side.
- Changed waiting-screen add action to `+ 참석자 추가`.
- Converted recommendation attendee status display from avatar grid to list rows.

## Verification Notes

- Run `npm run build` after each meaningful UI/logic change.
- Before deploy, push commits to `origin/main`.
- Netlify production URL: https://toss-challenge-2026.netlify.app
