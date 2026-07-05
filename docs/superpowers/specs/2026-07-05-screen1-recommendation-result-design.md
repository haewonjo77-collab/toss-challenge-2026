# 화면 1: 추천 결과 확인 — 설계 문서

날짜: 2026-07-05
대상: 토스 프로덕트 디자이너 챌린지 2026 — SPEC.md 유저플로우 ③ "추천 결과 확인" (CASE 1 / CASE 2)

## 배경

SPEC.md의 핵심 가설 C(필수/선택 기반 추천)를 화면으로 구현한다. 주최자가 추천된 회의 시간을
확인하고, 필수 참석자 전원 가능 여부에 따라 두 가지 상태(CASE 1: 최선책 / CASE 2: 차선책)를
본다. DESIGN.md의 그레이스케일 + accent 1군데 원칙, ●/○/▲ 형태 기반 상태 표기를 그대로 적용한다.

## 기술 스택

- React + Vite + TypeScript (Vite 스캐폴드, 최소 의존성)
- 스타일링: 순수 CSS + CSS 변수 (DESIGN.md 토큰을 `src/styles/tokens.css`에 그대로 이식)
- 타입은 강제하지 않음 — 인터페이스는 있지만 엄격한 타입 체크/빌드 실패를 목표로 하지 않음

## 파일 구조

```
src/
  styles/
    tokens.css              # DESIGN.md 색상/타이포/스페이싱/radius → CSS 변수
  components/
    AttendanceIcon.tsx      # status → ●/○/▲ 매핑만 담당
    Avatar.tsx               # 이니셜 원형 아바타
    AttendeeRow.tsx           # 아바타 + 이름 + AttendanceIcon
    Badge.tsx                 # 필수/선택 pill 배지
    RecommendationCard.tsx    # 화면1 핵심 컴포넌트 (variant로 CASE1/CASE2 분기)
  data/
    mockAttendees.ts          # 참석자 mock 데이터 (6명) + 타입 정의
  App.tsx                     # CASE1, CASE2 나란히 렌더링해서 비교 확인
```

## 데이터 모델

```ts
type AttendeeRole = 'required' | 'optional';
type AttendanceStatus = 'full' | 'none' | 'partial'; // partial은 optional에서만 사용

interface Attendee {
  id: string;
  name: string;
  role: AttendeeRole;
  status: AttendanceStatus;
}

interface RecommendationCardProps {
  timeLabel: string;                // 예: "화요일 오후 2:00 - 3:00"
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  variant: 'primary' | 'fallback';  // CASE1 / CASE2
  onConfirm: () => void;
  onRequestRecheck?: () => void;    // fallback(CASE2)에서만 사용
}
```

파생 값 (별도 prop으로 받지 않고 배열에서 계산):
- 필수/선택 카운트("필수 4/4, 선택 2/3")는 각 배열의 `status === 'full'` 개수
- CASE2 안내 배너 문구("OO님이 참석하지 못해요")는 `requiredAttendees` 중 `status === 'none'`인
  이름에서 파생
- 필수 섹션도 `status`가 `full`/`none`을 모두 가질 수 있음 — CASE2에서 빠지는 필수 참석자는
  ○로 표시된다. 레이아웃 스펙의 "필수 참석자 섹션(●)" 표기는 필수 섹션에서 주로 쓰이는 기호
  예시로 해석한다.

## 컴포넌트 레이아웃 (카드 내부 순서)

1. 추천 시간 텍스트 — DESIGN.md `title-lg` (22px/700) 토큰 그대로 사용 (요청받은 "24px/500"은
   기존 토큰과 통일하기로 사용자와 합의됨)
2. 필수·선택 배지 (pill, 그레이스케일) — `badge-required`/`badge-optional` 토큰 그대로
3. "필수 참석자" 섹션 — `AttendeeRow` 리스트, 상태 아이콘 ●/○
4. 구분선 (`hairline`)
5. "선택 참석자" 섹션 — `AttendeeRow` 리스트, 상태 아이콘 ●/○/▲
6. CTA 영역
   - CASE 1(primary): 버튼 1개 "이 시간으로 확정하기" (accent, `button-primary`)
   - CASE 2(fallback): 안내 배너 "OO님이 참석하지 못해요" + 버튼 2개
     - "재확인 요청" (`button-secondary`, 그레이스케일)
     - "이대로 확정" (`button-primary`, accent) ← 화면당 accent는 이 버튼 하나

## Mock 데이터

- 필수(4): 김도윤, 박서연, 이준호, 최민아
- 선택(3): 정하늘, 강지훈, 오예린

**CASE 1 (primary)** — "화요일 오후 2:00 - 3:00", 배지 "필수 4/4 · 선택 2/3"
- 필수: 전원 ●
- 선택: 정하늘 ●, 강지훈 ▲, 오예린 ○

**CASE 2 (fallback)** — "목요일 오전 10:00 - 11:00", 배지 "필수 3/4 · 선택 1/3"
- 필수: 김도윤 ●, 박서연 ●, 이준호 ●, 최민아 ○ (빠짐)
- 선택: 정하늘 ●, 강지훈 ○, 오예린 ○
- 배너: "최민아님이 참석하지 못해요"

## Do / Don't (DESIGN.md 적용 확인)

- accent는 카드당 CTA 버튼 하나에만 사용 — 배지, 시간 텍스트, 아이콘엔 색 없음
- 필수/선택, 됨/안됨/부분참석 구분은 색이 아니라 텍스트("필수"/"선택")와 형태(●/○/▲)로만
- 카드 radius 12px(`rounded.lg`), 버튼/배지는 각각 8px/pill 토큰 사용
- CASE2 배너의 danger 컬러는 텍스트에 제한적으로만 사용 (DESIGN.md 정의된 용도 그대로)
- hover 상태 별도 설계 없음, 그라디언트/브랜드 컬러 없음

## 테스트/검증 범위

- 별도 자동화 테스트는 작성하지 않음 (목업 UI, 로직 없음)
- `npm run dev`로 브라우저에서 CASE1/CASE2 두 카드가 레이아웃 스펙대로 렌더링되는지 육안 확인
- CASE2에서 배지 값(3/4, 1/3)과 배너 텍스트가 mock 데이터와 일치하는지 확인
