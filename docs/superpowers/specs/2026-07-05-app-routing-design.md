# 2단계: 주최자 플로우 라우팅 연결 — 설계 문서

날짜: 2026-07-05
대상: 독립 컴포넌트로 완성된 화면 ①②③④를 393×852 프레임 하나에서 실제 클릭으로
이어지는 앱으로 연결. 참석자 보조 플로우는 이번 범위 밖.

## 라우팅 (react-router-dom v6)

| 경로 | 화면 | 진입 가드 |
|---|---|---|
| `/` | ① 회의 만들기 | — |
| `/waiting` | ② 대기 | 회의 미생성 시 `/`로 리다이렉트 |
| `/recommendation` | ③ 추천 결과 | 회의 미생성 시 `/`로 리다이렉트 |
| `/confirmed` | ④ 확정 | 확정 결과 없으면 `/`로 리다이렉트 |

기존 화면 컴포넌트는 프레젠테이션 전용으로 유지하고, `src/pages/*Page.tsx` 래퍼가
컨텍스트 연결·네비게이션·가드를 담당한다. `App.tsx`의 쇼케이스 나열은 제거(히스토리에 보존).

## 상태 관리 — MeetingContext

`src/context/MeetingContext.tsx`, useState 기반 Context 하나로 충분 (외부 상태 라이브러리 불필요).

- `title`, `attendees: InvitedAttendee[]` — 화면 ①의 `createMeeting(title, attendees)`로 저장.
  필수/선택 태그 편집 결과가 이후 모든 화면의 데이터 소스.
- `responses: ResponseStatus[]` — 회의 생성 시 참석자로부터 초기화.
  **응답 시뮬레이션**: 참석자 흐름이 범위 밖이므로, 마지막 2명을 미응답 상태로 시작하고
  화면 ②에서 1.4초 간격으로 한 명씩 응답 도착을 시뮬레이션. 게이팅 상태 변화
  (카운트·안내문·disabled 버튼)가 실제로 눈앞에서 전환되는 것을 보여주기 위함.
- `confirmed: { timeLabel, requiredAttendees, optionalAttendees } | null` — 화면 ③에서
  CASE1 확정이든 CASE2 "이대로 확정"이든 **확정 시점의 추천 결과 그대로** 저장,
  화면 ④는 이것만 읽는다 (④가 항상 CASE1을 보여주는 문제 방지).

## 추천 로직 mock — `src/data/recommendation.ts`

실제 가용시간 수집이 없으므로 후보 슬롯 2개에 인물별 참석 상태를 고정한 mock 테이블로
가설 C의 로직을 재현한다:

- 슬롯 A "화요일 오후 2:00 - 3:00": 강지훈 partial, 오예린 none, 나머지 full
- 슬롯 B "목요일 오전 10:00 - 11:00": 최민아·강지훈·오예린 none, 나머지 full
- 테이블에 없는 인물(화면 ①에서 새로 추가된 참석자)은 full로 간주

선택 규칙 (SPEC 가설 C): ① 필수 전원 full인 슬롯 우선 → ② 필수 full 수 → ③ 선택 full 수.
전원 가능 슬롯이 있으면 CASE1(primary), 없으면 가장 가까운 슬롯을 CASE2(fallback)로.

- 기본 태그 구성이면 슬롯 A가 필수 4/4로 CASE1 경로.
- 화면 ①에서 강지훈/오예린을 필수로 올리면 CASE2 경로가 나온다 — 태그 지정이 추천을
  바꾸는 것 자체가 가설 C의 시연.
- **필수 참석자의 partial은 none으로 간주**: SPEC상 ▲(부분참석)는 선택 참석자 전용이고,
  필수는 1시간 전체 참석이 전제이므로 부분 가능은 불참으로 처리.

## Toast — `src/components/Toast.tsx`

alert를 전부 대체하는 최소 반응 장치. ToastProvider(Context) + 프레임 하단 고정 pill
(ink 배경 + canvas 텍스트, 2초 후 자동 사라짐, 그레이스케일 — accent 원칙 유지).
사용처: ④ "참석자에게 공유하기" → "참석자에게 보낼 링크가 복사됐어요",
③ CASE2 "재확인 요청" → "재확인 요청을 보냈어요".

## 393×852 프레임

`App.css`: 페이지 중앙에 393×852 고정 프레임(surface-soft 배경, hairline 보더,
radius-lg), 내부 스크롤. 카드 max-width 361 = 393 − 좌우 패딩 16×2로 기존 카드가
그대로 꽉 차게 들어맞는다. 바깥 배경은 surface-strong으로 프레임과 구분.

## 정리되는 것

`mockAttendees.ts`의 쇼케이스용 정적 배열(case1/case2/responses*)은 실데이터 파생으로
대체되어 제거. 타입(Attendee, AttendanceStatus, ResponseStatus 등)과
`initialInvitedAttendees`(화면 ① 초기값)는 유지.
