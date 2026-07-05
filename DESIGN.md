---
name: toss-challenge-2026-design
description: >
  6인 회의 일정 잡기 UX 설계(토스 프로덕트 디자이너 챌린지 2026)를 위한 디자인 토큰/컴포넌트 규칙.
  브랜딩·비주얼 컨셉은 평가 대상이 아니므로, 그레이스케일 기반에 포인트 컬러 1개만 두고
  익숙한 UI 패턴(체크박스·배지·캘린더 그리드)을 맥락에 맞게 다듬어 쓴다. 새 패턴은 발명하지 않는다.
  구조적 수치 체계(spacing/radius/상태 정의 방식)는 Cal.com 공개 디자인 시스템에서
  마케팅 전용 요소(커스텀 폰트, 브랜드 컬러, 히어로/가격표 컴포넌트)를 제외하고 채택했다.
---

## 색상 (Colors)

그레이스케일 기본 + 포인트 컬러 1개. 액션(버튼, 링크, 선택된 상태)에만 포인트 컬러를 쓰고,
정보 구분(필수/선택, 됨/안됨)에는 색 대신 텍스트·형태로 구분한다.

```yaml
colors:
  ink: "#111111"           # 기본 텍스트, 제목
  body: "#4b5563"          # 본문 텍스트
  muted: "#8a8a8a"         # 보조 설명, 캡션
  hairline: "#e5e7eb"      # 구분선, 인풋 보더
  hairline-soft: "#f3f4f6" # 옅은 구분선
  canvas: "#ffffff"        # 배경 기본
  surface-soft: "#f7f7f8"  # 카드/섹션 배경 (옅은 회색)
  surface-strong: "#eceef0" # 비활성/음영 처리 (안되는 시간 슬롯)
  accent: "#2f6fed"        # 포인트 컬러 — 주요 CTA, 선택된 상태, 진행 표시에만 사용
  accent-active: "#1f4fc4" # accent 눌렸을 때
  accent-disabled: "#c7d6f9"
  on-accent: "#ffffff"
  danger: "#ef4444"        # 필수 참석자 빠짐 등 경고 상황에만 제한적으로 사용
```

**원칙**: `accent`는 화면당 1군데(주요 CTA)에만 강조로 쓴다. 필수/선택 구분, 됨/안됨 구분에는
색을 쓰지 않는다 — 텍스트 배지와 형태(삼각형 기호 등)로 구분해 색약 등 접근성 문제를 피한다.

## 타이포그래피 (Typography)

시스템 폰트 1종, 굵기 3단만 사용. 커스텀 디스플레이 폰트 없음.

```yaml
typography:
  fontFamily: "-apple-system, 'Apple SD Gothic Neo', 'Segoe UI', Roboto, sans-serif"
  title-lg:   { fontSize: 22px, fontWeight: 700, lineHeight: 1.3 }   # 화면 제목
  title-md:   { fontSize: 18px, fontWeight: 700, lineHeight: 1.4 }   # 카드 제목, 추천 시간
  title-sm:   { fontSize: 16px, fontWeight: 600, lineHeight: 1.4 }   # 섹션 제목
  body-md:    { fontSize: 15px, fontWeight: 400, lineHeight: 1.5 }   # 본문
  body-sm:    { fontSize: 13px, fontWeight: 400, lineHeight: 1.5 }   # 보조 설명
  caption:    { fontSize: 12px, fontWeight: 500, lineHeight: 1.4 }   # 배지, 타임스탬프
  button:     { fontSize: 15px, fontWeight: 600, lineHeight: 1 }
```

**원칙**: Bold는 title-lg/md에서만. 나머지는 Regular/Medium으로 위계 차등 — 폰트 종류로
장식하지 않고 크기·굵기로만 위계를 만든다.

## 스페이싱 (Spacing) — 8pt 기준

```yaml
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
```

## 모서리 반경 (Rounded)

```yaml
rounded:
  xs: 4px      # 배지 텍스트 태그의 작은 강조
  sm: 6px      # 작은 인라인 버튼, 체크박스
  md: 8px      # 기본 버튼, 인풋, 캘린더 셀
  lg: 12px     # 카드(추천 결과 카드, 대기 화면 카드)
  pill: 9999px # 필수/선택 배지, 아바타 배경 필
  full: 9999px # 아바타 원형
```

## 컴포넌트 (Components)

### 버튼

```yaml
button-primary:
  background: "{colors.accent}"
  color: "{colors.on-accent}"
  typography: "{typography.button}"
  padding: "12px 20px"
  height: 44px          # 모바일 터치 타겟 44px 확보 (Cal.com의 40px보다 여유 둠)
  rounded: "{rounded.md}"
button-primary-active:
  background: "{colors.accent-active}"
button-primary-disabled:
  background: "{colors.accent-disabled}"
button-secondary:
  background: "{colors.canvas}"
  border: "1px solid {colors.hairline}"
  color: "{colors.ink}"
  # 나머지 속성은 button-primary와 동일
```

**상태 정의는 배경색 단계 변화만으로** — hover는 별도 정의하지 않음(모바일 터치 환경이라 불필요).

### 인풋 / 체크박스 / 토글

```yaml
text-input:
  height: 44px
  padding: "10px 14px"
  border: "1px solid {colors.hairline}"
  rounded: "{rounded.md}"
text-input-focused:
  border: "1px solid {colors.ink}"

checkbox: # 참석자 됨/안됨 표시 — 표준 패턴, 새로 만들지 않음
  size: 20px
  rounded: "{rounded.sm}"
  checked-background: "{colors.accent}"
```

### 필수/선택 배지 — 핵심 컴포넌트 (가설 C)

```yaml
badge-required:
  text: "필수"
  background: "{colors.surface-strong}"
  color: "{colors.ink}"
  fontWeight: 700          # 필수는 선택보다 굵게 — 형태 강조
  typography: "{typography.caption}"
  padding: "4px 10px"
  rounded: "{rounded.pill}"
badge-optional:
  text: "선택"
  background: "{colors.surface-soft}"
  color: "{colors.muted}"
  fontWeight: 500
  typography: "{typography.caption}"
  padding: "4px 10px"
  rounded: "{rounded.pill}"
```

**적용 위치**: 추천 결과 카드 최상단에 "필수 6/6, 선택 2/3" 형태로, `title-md` 크기로 노출해
클릭 전에 판단 정보가 가장 먼저 보이게 한다 (실무서 4-3 "크기를 이용한 강조" 적용).

### 참석 상태 아이콘 — 삼각형 기호 (독자적 설계)

```yaml
attendance-icon:
  full:    "●"  # 됨 (필수/선택 공통)
  none:    "○"  # 안됨
  partial: "▲"  # 선택 참석자가 시간 일부만 가능 — O/X 이진 대신 형태로 "부분성"을 표현
```

### 아바타

```yaml
avatar-circle:
  size: 36px
  rounded: "{rounded.full}"
  fallback: "이니셜 텍스트 + surface-soft 배경"
```

### 캘린더 그리드 (됨/안됨 입력, 추천 결과 표시)

```yaml
calendar-cell:
  default: { background: "{colors.canvas}", border: "1px solid {colors.hairline-soft}" }
  unavailable: { background: "{colors.surface-strong}" }   # 안되는 시간만 음영
  recommended: { background: "{colors.accent}", color: "{colors.on-accent}" }  # 추천 슬롯
  rounded: "{rounded.md}"
```

**원칙**: 카카오톡 캘린더류의 표준 그리드 패턴을 그대로 쓴다. 새로운 그리드 UI를 발명하지 않는다
(Day 1 리서치에서 4개 도구 비교 후 확인된 방향).

## Do / Don't

### Do
- 액션(버튼, 진행 표시)에만 accent 컬러 사용, 그 외엔 그레이스케일 유지
- 필수/선택, 됨/안됨 구분은 색이 아니라 텍스트·형태(●○▲)로
- 카드 radius는 12px, 버튼/인풋은 8px로 일관 — 두 단계만 씀
- 추천 카드는 클릭 시 즉시 확정, 재확인 모달 없음 (SPEC의 "클릭 수 최소화" 원칙)

### Don't
- 그라디언트, 일러스트, 커스텀 아이콘 세트 쓰지 않기
- hover 상태 별도 설계하지 않기 (모바일 우선, 터치 환경)
- 브랜드 컬러/로고 요소 삽입하지 않기 (평가 대상 아님)
- 새로운 캘린더 그리드 패턴 발명하지 않기 — 표준 패턴 재사용

## 반응형 기준

기본 사이즈 393×852(모바일). 이 프로젝트는 모바일 단일 사이즈 목업이 우선이며,
데스크톱 대응은 핵심 플로우 완성 후 시간이 남으면 검토(SPEC "범위 밖" 항목과 동일한 우선순위 원칙).
