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
  - Weekend inclusion toggle.
  - Day time window summary, default `09:00-18:00`, editable through a bottom sheet.
  - Attendee list with required/optional role selection.
  - New attendees and recent attendees default to required.
  - Recent attendee chips, saved favorite folder chips, and manual attendee add form.
  - Required/optional role can be applied by dragging across attendee rows.

- Waiting/status screen
  - Shows attendee response state.
  - Includes nudges for people who have not responded.
  - Invite link sharing uses the Web Share API when available, with clipboard fallback.
  - After sharing, the organizer can save attendees to localStorage favorite folders.
  - Simulated response toasts can be toggled on/off.

- Recommendation screen
  - Shows recommended meeting candidates.
  - Required attendees are prioritized.
  - Required/optional attendees are shown as avatar groups instead of numeric badges.
  - Missing required attendees are surfaced with a danger ring and strikethrough.
  - Recheck request targets are limited to required attendees.

- Confirmed meeting screen
  - Shows the confirmed recommendation result and attendee availability summary.

- Attendee join flow
  - Name/start screen.
  - Calendar auto-import prompt with Google/Notion/Apple mock buttons.
  - Icon tap shows a spinner, then fills unavailable slots with mock data.
  - Unavailable time marking grid.
  - Unavailable cells show an X glyph.
  - Cells can be marked by dragging across the grid.
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

- Recent Git commits include:
  - `fbb9c01 feat: replace custom-week dropdown with week-select calendar`
  - `b8a803e fix: limit missing-attendee notice to required, name recheck targets`
  - `dc481be feat: show actual dates in recommended time labels`
  - `f5c4ab2 feat: mark unavailable cells with X glyph in time grid`
  - `e34fce2 feat: strengthen hypothesis A transparency (nudge + pre-submit status)`

## Current Working Tree

The current working tree contains the completed continuation work and is ready to commit/deploy after final approval.

## If Continuing Work

- If deploying after new changes, run `npm run build`, commit, push to `main`, then deploy to Netlify.
