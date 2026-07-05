# 화면 1: 추천 결과 확인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SPEC.md 유저플로우 ③ "추천 결과 확인"의 CASE 1(필수 전원가능)/CASE 2(차선책) 두 상태를
React 컴포넌트로 구현하고, mock 데이터 6명(필수 4, 선택 3)으로 두 상태 모두 렌더링한다.

**Architecture:** Vite + React + TypeScript. 순수 CSS + CSS 변수로 DESIGN.md 토큰을 이식한다.
컴포넌트는 작은 단위(AttendanceIcon, Avatar, AttendeeRow, Badge)를 조합해 RecommendationCard를
만들고, App.tsx에서 mock 데이터로 CASE1/CASE2 두 인스턴스를 렌더링한다.

**Tech Stack:** React 18, TypeScript(비엄격, `strict: false`), Vite 5, 순수 CSS(전역 변수 +
컴포넌트별 co-located CSS 파일). 별도 UI 라이브러리/CSS 프레임워크 없음.

## Global Constraints

- 타입은 강제하지 않음 (`tsconfig.json`의 `strict: false`) — 인터페이스는 문서화 목적으로만 사용
- accent(`#2f6fed`)는 카드 하나당 CTA 버튼 1개에만 사용 — 배지/시간 텍스트/아이콘에는 색을 넣지 않음
- 필수/선택, 됨/안됨/부분참석 구분은 색이 아니라 텍스트("필수"/"선택")와 형태(●/○/▲)로만 표현
- 카드 radius는 `--radius-lg`(12px), 버튼/배지는 각각 `--radius-md`(8px)/`--radius-pill` 사용
- 자동화 테스트 프레임워크는 도입하지 않음 — 각 태스크의 검증은 `npx tsc --noEmit` 통과 +
  (App.tsx가 준비된 이후) `npm run dev`로 브라우저 육안 확인으로 대체한다 (설계 문서에 합의된 범위)
- 참고 문서: `SPEC.md`, `DESIGN.md`, `docs/superpowers/specs/2026-07-05-screen1-recommendation-result-design.md`

---

### Task 1: Vite + React + TypeScript 프로젝트 스캐폴딩

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Interfaces:**
- Produces: `App` — `src/App.tsx`에서 `export function App()`로 노출, `src/main.tsx`가 이를
  렌더링. 이후 태스크들은 이 `App` 함수 본문을 채워 나간다.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "toss-challenge-2026",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}
```

- [ ] **Step 2: vite.config.ts 작성**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: tsconfig.json 작성 (타입 비강제)**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false
  },
  "include": ["src"]
}
```

- [ ] **Step 4: index.html 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>추천 결과 확인</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: .gitignore 작성**

```
node_modules
dist
```

- [ ] **Step 6: src/App.tsx 최소 버전 작성**

```tsx
export function App() {
  return <main className="app">추천 결과 확인 화면 준비 중</main>;
}
```

- [ ] **Step 7: src/main.tsx 작성**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: 의존성 설치**

Run: `npm install`
Expected: `node_modules/` 생성, 에러 없이 종료

- [ ] **Step 9: 개발 서버 기동 확인**

Run: `npm run dev -- --port 5173 &` 후 `curl -s http://localhost:5173 | head -20`으로 HTML 응답 확인,
확인 후 `kill %1`로 서버 종료
Expected: `<div id="root">`가 포함된 HTML 응답

- [ ] **Step 10: Commit**

```bash
git add package.json vite.config.ts tsconfig.json index.html .gitignore src/main.tsx src/App.tsx
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: 디자인 토큰 & 전역 스타일

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Modify: `src/main.tsx` (스타일 import 추가)

**Interfaces:**
- Produces: CSS 커스텀 프로퍼티 — `--color-*`, `--space-*`, `--radius-*`, `--font-family` (전부
  `:root`에 정의). 텍스트 유틸리티 클래스 — `.text-title-lg`, `.text-title-md`, `.text-title-sm`,
  `.text-body-md`, `.text-body-sm`, `.text-caption`, `.text-button`. 버튼 클래스 — `.button`,
  `.button--primary`, `.button--secondary`. 이후 모든 컴포넌트가 이 변수/클래스명을 그대로 사용한다.

- [ ] **Step 1: tokens.css 작성 (DESIGN.md 색상/타이포/스페이싱/radius)**

```css
:root {
  /* Colors */
  --color-ink: #111111;
  --color-body: #4b5563;
  --color-muted: #8a8a8a;
  --color-hairline: #e5e7eb;
  --color-hairline-soft: #f3f4f6;
  --color-canvas: #ffffff;
  --color-surface-soft: #f7f7f8;
  --color-surface-strong: #eceef0;
  --color-accent: #2f6fed;
  --color-accent-active: #1f4fc4;
  --color-accent-disabled: #c7d6f9;
  --color-on-accent: #ffffff;
  --color-danger: #ef4444;

  /* Typography */
  --font-family: -apple-system, 'Apple SD Gothic Neo', 'Segoe UI', Roboto, sans-serif;

  /* Spacing (8pt) */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;

  /* Rounded */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;
  --radius-full: 9999px;
}

.text-title-lg {
  font-family: var(--font-family);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}

.text-title-md {
  font-family: var(--font-family);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}

.text-title-sm {
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.text-body-md {
  font-family: var(--font-family);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.5;
}

.text-body-sm {
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
}

.text-caption {
  font-family: var(--font-family);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.text-button {
  font-family: var(--font-family);
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
}
```

- [ ] **Step 2: global.css 작성 (리셋 + 버튼)**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-family);
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  border: none;
  cursor: pointer;
}

.button--primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.button--primary:active {
  background: var(--color-accent-active);
}

.button--secondary {
  background: var(--color-canvas);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline);
}
```

- [ ] **Step 3: main.tsx에 스타일 import 추가**

`src/main.tsx`에서 `import { App } from './App';` 아래에 두 줄 추가:

```tsx
import './styles/tokens.css';
import './styles/global.css';
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료 (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css src/main.tsx
git commit -m "feat: add design tokens and global styles from DESIGN.md"
```

---

### Task 3: Mock 참석자 데이터

**Files:**
- Create: `src/data/mockAttendees.ts`

**Interfaces:**
- Consumes: 없음 (독립 데이터 모듈)
- Produces: `type AttendanceStatus = 'full' | 'none' | 'partial'`, `interface Attendee { id: string;
  name: string; status: AttendanceStatus }`, 그리고 `case1RequiredAttendees`,
  `case1OptionalAttendees`, `case2RequiredAttendees`, `case2OptionalAttendees` (모두
  `Attendee[]`). 이후 태스크(AttendanceIcon, RecommendationCard, App)가 이 타입/이름을 그대로
  가져다 쓴다.

- [ ] **Step 1: mockAttendees.ts 작성**

```ts
export type AttendanceStatus = 'full' | 'none' | 'partial';

export interface Attendee {
  id: string;
  name: string;
  status: AttendanceStatus;
}

export const case1RequiredAttendees: Attendee[] = [
  { id: 'req-1', name: '김도윤', status: 'full' },
  { id: 'req-2', name: '박서연', status: 'full' },
  { id: 'req-3', name: '이준호', status: 'full' },
  { id: 'req-4', name: '최민아', status: 'full' },
];

export const case1OptionalAttendees: Attendee[] = [
  { id: 'opt-1', name: '정하늘', status: 'full' },
  { id: 'opt-2', name: '강지훈', status: 'partial' },
  { id: 'opt-3', name: '오예린', status: 'none' },
];

export const case2RequiredAttendees: Attendee[] = [
  { id: 'req-1', name: '김도윤', status: 'full' },
  { id: 'req-2', name: '박서연', status: 'full' },
  { id: 'req-3', name: '이준호', status: 'full' },
  { id: 'req-4', name: '최민아', status: 'none' },
];

export const case2OptionalAttendees: Attendee[] = [
  { id: 'opt-1', name: '정하늘', status: 'full' },
  { id: 'opt-2', name: '강지훈', status: 'none' },
  { id: 'opt-3', name: '오예린', status: 'none' },
];
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료

- [ ] **Step 3: Commit**

```bash
git add src/data/mockAttendees.ts
git commit -m "feat: add mock attendee data for CASE1/CASE2"
```

---

### Task 4: AttendanceIcon 컴포넌트 (●/○/▲)

**Files:**
- Create: `src/components/AttendanceIcon.tsx`
- Create: `src/components/AttendanceIcon.css`

**Interfaces:**
- Consumes: `AttendanceStatus` 타입 — Task 3의 `src/data/mockAttendees.ts`에서 export됨
- Produces: `AttendanceIcon` — `{ status: AttendanceStatus }`를 props로 받는 컴포넌트. Task 6
  (AttendeeRow)에서 사용.

- [ ] **Step 1: AttendanceIcon.tsx 작성**

```tsx
import type { AttendanceStatus } from '../data/mockAttendees';
import './AttendanceIcon.css';

const ICON_BY_STATUS: Record<AttendanceStatus, string> = {
  full: '●',
  none: '○',
  partial: '▲',
};

const LABEL_BY_STATUS: Record<AttendanceStatus, string> = {
  full: '참석 가능',
  none: '참석 불가',
  partial: '일부 시간만 가능',
};

interface AttendanceIconProps {
  status: AttendanceStatus;
}

export function AttendanceIcon({ status }: AttendanceIconProps) {
  return (
    <span className="attendance-icon" title={LABEL_BY_STATUS[status]} aria-label={LABEL_BY_STATUS[status]}>
      {ICON_BY_STATUS[status]}
    </span>
  );
}
```

- [ ] **Step 2: AttendanceIcon.css 작성**

```css
.attendance-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  font-size: 14px;
  line-height: 1;
  color: var(--color-ink);
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료

- [ ] **Step 4: Commit**

```bash
git add src/components/AttendanceIcon.tsx src/components/AttendanceIcon.css
git commit -m "feat: add AttendanceIcon component for full/none/partial status"
```

---

### Task 5: Avatar 컴포넌트

**Files:**
- Create: `src/components/Avatar.tsx`
- Create: `src/components/Avatar.css`

**Interfaces:**
- Consumes: 없음
- Produces: `Avatar` — `{ name: string }`를 props로 받는 컴포넌트. Task 6(AttendeeRow)에서 사용.

- [ ] **Step 1: Avatar.tsx 작성**

```tsx
import './Avatar.css';

interface AvatarProps {
  name: string;
}

export function Avatar({ name }: AvatarProps) {
  const initial = name.trim().charAt(0);
  return (
    <span className="avatar" aria-hidden="true">
      {initial}
    </span>
  );
}
```

- [ ] **Step 2: Avatar.css 작성**

```css
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-surface-soft);
  color: var(--color-ink);
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료

- [ ] **Step 4: Commit**

```bash
git add src/components/Avatar.tsx src/components/Avatar.css
git commit -m "feat: add Avatar component"
```

---

### Task 6: AttendeeRow 컴포넌트

**Files:**
- Create: `src/components/AttendeeRow.tsx`
- Create: `src/components/AttendeeRow.css`

**Interfaces:**
- Consumes: `Avatar` (Task 5, props `{ name: string }`), `AttendanceIcon` (Task 4, props
  `{ status: AttendanceStatus }`), `AttendanceStatus` (Task 3)
- Produces: `AttendeeRow` — `{ name: string; status: AttendanceStatus }`를 props로 받는 컴포넌트.
  Task 8(RecommendationCard)에서 사용.

- [ ] **Step 1: AttendeeRow.tsx 작성**

```tsx
import { Avatar } from './Avatar';
import { AttendanceIcon } from './AttendanceIcon';
import type { AttendanceStatus } from '../data/mockAttendees';
import './AttendeeRow.css';

interface AttendeeRowProps {
  name: string;
  status: AttendanceStatus;
}

export function AttendeeRow({ name, status }: AttendeeRowProps) {
  return (
    <div className="attendee-row">
      <Avatar name={name} />
      <span className="attendee-row__name text-body-md">{name}</span>
      <AttendanceIcon status={status} />
    </div>
  );
}
```

- [ ] **Step 2: AttendeeRow.css 작성**

```css
.attendee-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}

.attendee-row__name {
  flex: 1;
  color: var(--color-ink);
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료

- [ ] **Step 4: Commit**

```bash
git add src/components/AttendeeRow.tsx src/components/AttendeeRow.css
git commit -m "feat: add AttendeeRow component"
```

---

### Task 7: Badge 컴포넌트 (필수/선택 pill)

**Files:**
- Create: `src/components/Badge.tsx`
- Create: `src/components/Badge.css`

**Interfaces:**
- Consumes: 없음
- Produces: `Badge` — `{ variant: 'required' | 'optional'; available: number; total: number }`를
  props로 받는 컴포넌트. Task 8(RecommendationCard)에서 사용.

- [ ] **Step 1: Badge.tsx 작성**

```tsx
import './Badge.css';

interface BadgeProps {
  variant: 'required' | 'optional';
  available: number;
  total: number;
}

const LABEL_BY_VARIANT: Record<BadgeProps['variant'], string> = {
  required: '필수',
  optional: '선택',
};

export function Badge({ variant, available, total }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>
      {LABEL_BY_VARIANT[variant]} {available}/{total}
    </span>
  );
}
```

- [ ] **Step 2: Badge.css 작성**

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-family);
  font-size: 12px;
  line-height: 1.4;
}

.badge--required {
  background: var(--color-surface-strong);
  color: var(--color-ink);
  font-weight: 700;
}

.badge--optional {
  background: var(--color-surface-soft);
  color: var(--color-muted);
  font-weight: 500;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료

- [ ] **Step 4: Commit**

```bash
git add src/components/Badge.tsx src/components/Badge.css
git commit -m "feat: add Badge component for required/optional counts"
```

---

### Task 8: RecommendationCard 컴포넌트 (CASE1/CASE2 분기)

**Files:**
- Create: `src/components/RecommendationCard.tsx`
- Create: `src/components/RecommendationCard.css`

**Interfaces:**
- Consumes: `Badge` (Task 7), `AttendeeRow` (Task 6), `Attendee` 타입 (Task 3, `{ id: string;
  name: string; status: AttendanceStatus }`)
- Produces: `RecommendationCard` — 아래 props를 받는 컴포넌트. Task 9(App.tsx)에서 사용.

```ts
interface RecommendationCardProps {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  variant: 'primary' | 'fallback';
  onConfirm: () => void;
  onRequestRecheck?: () => void;
}
```

- [ ] **Step 1: RecommendationCard.tsx 작성**

```tsx
import { Badge } from './Badge';
import { AttendeeRow } from './AttendeeRow';
import type { Attendee } from '../data/mockAttendees';
import './RecommendationCard.css';

interface RecommendationCardProps {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  variant: 'primary' | 'fallback';
  onConfirm: () => void;
  onRequestRecheck?: () => void;
}

function countAvailable(attendees: Attendee[]): number {
  return attendees.filter((attendee) => attendee.status === 'full').length;
}

function getMissingNames(attendees: Attendee[]): string[] {
  return attendees.filter((attendee) => attendee.status === 'none').map((attendee) => attendee.name);
}

export function RecommendationCard({
  timeLabel,
  requiredAttendees,
  optionalAttendees,
  variant,
  onConfirm,
  onRequestRecheck,
}: RecommendationCardProps) {
  const requiredAvailable = countAvailable(requiredAttendees);
  const optionalAvailable = countAvailable(optionalAttendees);
  const missingRequiredNames = getMissingNames(requiredAttendees);

  return (
    <div className="recommendation-card">
      <p className="recommendation-card__time text-title-lg">{timeLabel}</p>

      <div className="recommendation-card__badges">
        <Badge variant="required" available={requiredAvailable} total={requiredAttendees.length} />
        <Badge variant="optional" available={optionalAvailable} total={optionalAttendees.length} />
      </div>

      <div className="recommendation-card__section">
        <p className="recommendation-card__section-title text-title-sm">필수 참석자</p>
        {requiredAttendees.map((attendee) => (
          <AttendeeRow key={attendee.id} name={attendee.name} status={attendee.status} />
        ))}
      </div>

      <hr className="recommendation-card__divider" />

      <div className="recommendation-card__section">
        <p className="recommendation-card__section-title text-title-sm">선택 참석자</p>
        {optionalAttendees.map((attendee) => (
          <AttendeeRow key={attendee.id} name={attendee.name} status={attendee.status} />
        ))}
      </div>

      {variant === 'fallback' && (
        <p className="recommendation-card__notice text-body-sm">
          {missingRequiredNames.join(', ')}님이 참석하지 못해요
        </p>
      )}

      <div className="recommendation-card__actions">
        {variant === 'fallback' && (
          <button type="button" className="button button--secondary" onClick={onRequestRecheck}>
            재확인 요청
          </button>
        )}
        <button type="button" className="button button--primary" onClick={onConfirm}>
          {variant === 'fallback' ? '이대로 확정' : '이 시간으로 확정하기'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: RecommendationCard.css 작성**

```css
.recommendation-card {
  width: 100%;
  max-width: 361px;
  padding: var(--space-lg);
  background: var(--color-canvas);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-lg);
  box-sizing: border-box;
}

.recommendation-card__time {
  color: var(--color-ink);
  margin: 0 0 var(--space-sm);
}

.recommendation-card__badges {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}

.recommendation-card__section-title {
  color: var(--color-ink);
  margin: 0 0 var(--space-xs);
}

.recommendation-card__divider {
  border: none;
  border-top: 1px solid var(--color-hairline);
  margin: var(--space-md) 0;
}

.recommendation-card__notice {
  color: var(--color-danger);
  margin: var(--space-md) 0 0;
}

.recommendation-card__actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.recommendation-card__actions .button {
  flex: 1;
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료

- [ ] **Step 4: Commit**

```bash
git add src/components/RecommendationCard.tsx src/components/RecommendationCard.css
git commit -m "feat: add RecommendationCard with CASE1/CASE2 variants"
```

---

### Task 9: App.tsx에 CASE1/CASE2 조립 및 시각 검증

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.css`

**Interfaces:**
- Consumes: `RecommendationCard` (Task 8), `case1RequiredAttendees`, `case1OptionalAttendees`,
  `case2RequiredAttendees`, `case2OptionalAttendees` (Task 3)
- Produces: 없음 (최종 화면 조립, 이후 태스크 없음)

- [ ] **Step 1: App.tsx를 아래 내용으로 교체**

```tsx
import { RecommendationCard } from './components/RecommendationCard';
import {
  case1RequiredAttendees,
  case1OptionalAttendees,
  case2RequiredAttendees,
  case2OptionalAttendees,
} from './data/mockAttendees';
import './App.css';

export function App() {
  return (
    <main className="app">
      <section className="app__screen">
        <p className="app__label text-caption">CASE 1 — 필수 전원가능</p>
        <RecommendationCard
          timeLabel="화요일 오후 2:00 - 3:00"
          requiredAttendees={case1RequiredAttendees}
          optionalAttendees={case1OptionalAttendees}
          variant="primary"
          onConfirm={() => alert('확정되었습니다')}
        />
      </section>

      <section className="app__screen">
        <p className="app__label text-caption">CASE 2 — 차선책</p>
        <RecommendationCard
          timeLabel="목요일 오전 10:00 - 11:00"
          requiredAttendees={case2RequiredAttendees}
          optionalAttendees={case2OptionalAttendees}
          variant="fallback"
          onConfirm={() => alert('이대로 확정되었습니다')}
          onRequestRecheck={() => alert('재확인 요청을 보냈습니다')}
        />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: App.css 작성**

```css
.app {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
  padding: var(--space-xl);
  background: var(--color-surface-soft);
  min-height: 100vh;
}

.app__screen {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.app__label {
  color: var(--color-muted);
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: `dist/` 생성, 에러 없이 종료

- [ ] **Step 4: 개발 서버로 시각 확인**

Run: `npm run dev -- --port 5173 &` 후 브라우저(또는 `curl`)로 `http://localhost:5173` 접속,
아래 항목을 육안으로 확인한 뒤 `kill %1`로 서버 종료:
- CASE 1 카드: 배지 "필수 4/4", "선택 2/3", CTA 버튼 1개("이 시간으로 확정하기")만 accent 색
- CASE 2 카드: 배지 "필수 3/4", "선택 1/3", 안내문 "최민아님이 참석하지 못해요", 버튼 2개
  (재확인 요청은 그레이스케일, 이대로 확정만 accent)
- 필수/선택 섹션의 상태 아이콘이 ●/○/▲ 형태로만 구분되고 색이 없는지

Expected: 위 항목이 모두 스펙과 일치

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: assemble CASE1/CASE2 recommendation screens with mock data"
```
