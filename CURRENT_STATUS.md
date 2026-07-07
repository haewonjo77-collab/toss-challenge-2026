# Toss Challenge 2026 Current Status

Last checked: 2026-07-08, Asia/Seoul

## Project

- React + Vite app for the Toss Product Designer Challenge 2026.
- Main deployed URL: https://toss-challenge-2026.netlify.app
- GitHub repo: https://github.com/haewonjo77-collab/toss-challenge-2026
- Main branch is used for source control.

## Product Direction

- Scenario: A small team schedules a 1-hour meeting within about a week.
- Core hypothesis C: Meeting recommendations should prioritize required attendees first, then optional attendees.
- Supporting hypothesis A: Make response status transparent so the organizer knows who has responded.
- Supporting hypothesis B: Attendees mark only unavailable times, shown in smaller staged chunks instead of one overwhelming grid.

## Implemented Screens / Flows

- Create meeting screen
  - Meeting title input.
  - Meeting duration selection.
  - Start/end date range selection with drag on `RangeCalendar`.
  - Selected meeting dates are stored as a date list, so a range can be adjusted by clicking or dragging days on/off.
  - Meeting availability range uses simple choices: `이번 주`, `다음 주`, `직접 선택`.
  - `이번 주` automatically excludes today and earlier days.
  - Weekend inclusion toggle; when off, the calendar shows Monday-Friday only.
  - Date range choices and time window are separated inside one availability section to avoid duplicate labels.
  - Day time window defaults to compact `09:00-18:00`, editable through a bottom sheet.
  - Attendee list with required/optional role selection.
  - New attendees default to required.
  - Attendee add area is a direct form only: attendee name, optional department/team, and add button.
  - Saved attendee reuse, recent meeting chips, team reuse chips, and contact-like suggestions are hidden from the main flow.
  - Attendee inputs disable browser autocomplete/autocorrect to avoid contact-app-like suggestions.
  - Response notification preference is set before sending the invite link.
  - After tapping `초대 링크 보내기`, the app opens Web Share or copies the invite link before moving to the waiting screen.
  - Static recent-attendee dummy chips and the quick-fill dummy button are removed from the main UI.
  - Required/optional role can be applied by dragging across attendee rows.

- Waiting/status screen
  - Shows attendee response state.
  - Includes nudges for people who have not responded.
  - Invite link sharing uses the Web Share API when available, with clipboard fallback.
  - Simulated response toasts follow the create-screen response notification preference.
  - Simulated responses wait 12 seconds between arrivals so the waiting state is testable.

- Recommendation screen
  - Shows recommended meeting candidates.
  - On desktop organizer views, recommended candidates are shown together for comparison.
  - Alternative candidates cover several cases even when attendees are manually entered: optional gaps, one required gap, and multiple required gaps.
  - Required attendees are prioritized.
  - Required/optional attendees are shown as avatar groups instead of numeric badges.
  - Missing required attendees are surfaced with a danger ring and strikethrough.
  - Recheck request targets are limited to required attendees.

- Confirmed meeting screen
  - Shows the confirmed recommendation result and attendee availability summary.

- Attendee join flow
  - Name/start screen.
  - The invite start screen shows mock organizer profile context: `조해원` / `프로덕트 디자인팀`.
  - Calendar auto-import prompt with Google/Notion/Apple mock buttons.
  - Icon tap shows a spinner, then fills unavailable slots with mock data.
  - Unavailable time marking grid.
  - Unavailable cells show an X glyph.
  - Cells can be marked by dragging across the grid.
  - If no unavailable slots are selected, the flow treats it as all times possible; if every slot is selected, it treats it as all times unavailable.
  - Done/summary screen with a low-remaining-response nudge banner.

## Important Design/Planning Files

- `SPEC.md`: high-level problem, hypotheses, user flow, and feature scope.
- `DESIGN.md`: visual/design system rules and interaction principles.
- `docs/superpowers/specs/2026-07-05-screens-1-2-4-design.md`: create/waiting/confirmed screen design.
- `docs/superpowers/specs/2026-07-05-screen1-recommendation-result-design.md`: recommendation result design.
- `docs/superpowers/specs/2026-07-05-app-routing-design.md`: app routing and state flow.
- `docs/superpowers/specs/2026-07-06-join-times-refinement-design.md`: attendee unavailable-time grid drag behavior.
- `docs/superpowers/specs/2026-07-06-batch-improvements-variant-design.md`: batch improvements including role drag.

## Recent Completed Work

- Continued Claude Code's interrupted implementation and completed the requested priority set.
  - `src/components/RangeCalendar.tsx`
  - `src/components/CreateMeeting.tsx`
  - `src/components/RecommendationCard.tsx`
  - `src/components/WaitingRoom.tsx`
  - `src/components/join/JoinTimesView.tsx`
  - `src/data/favorites.ts`
  - `public/_redirects`

- Verification completed locally.
  - `npm run build` passes.
  - Playwright screenshots were checked at 393x852 for create, time sheet, waiting, recommendation, confirmed, and join import states.

- Latest completed work includes:
  - click-to-toggle meeting dates and compact time labels
  - organizer/participant responsive split: organizer screens expand on desktop, participant join flow stays mobile-first
  - calendar date removal by drag, invite sharing before waiting, 12-second simulated responses, and richer recommendation alternatives
  - participant invite screen organizer context and simplified direct attendee entry

- Recent Git commits include:
  - `fbb9c01 feat: replace custom-week dropdown with week-select calendar`
  - `b8a803e fix: limit missing-attendee notice to required, name recheck targets`
  - `dc481be feat: show actual dates in recommended time labels`
  - `f5c4ab2 feat: mark unavailable cells with X glyph in time grid`
  - `e34fce2 feat: strengthen hypothesis A transparency (nudge + pre-submit status)`

## Current Working Tree

The current working tree contains the organizer-context and simplified attendee-entry refinements and is ready to commit/deploy.

## If Continuing Work

- If deploying after new changes, run `npm run build`, commit, push to `main`, then deploy to Netlify.
