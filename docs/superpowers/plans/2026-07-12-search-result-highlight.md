# 검색 결과 강조 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 참석자 검색 결과 목록(이름/부서)에서 검색어와 일치한 글자 구간을 굵게+색상으로 강조해, 사용자가 어떤 결과가 왜 나왔는지 바로 알 수 있게 한다.

**Architecture:** `koreanSearch.ts`에 순수 함수 `findHighlightRange(query, text)`를 추가해 일치 구간(문자 인덱스)을 계산하고, 이를 사용하는 작은 프레젠테이션 컴포넌트 `HighlightedText`를 만들어 `CreateMeeting.tsx`와 `ResponseList.tsx`의 결과 목록에 재사용한다.

**Tech Stack:** React + TypeScript (기존), Vite, 신규 도입: Vitest (순수 로직 유닛 테스트용, devDependency만 추가, 프로덕션 번들에는 영향 없음)

## Global Constraints

- 강조 대상은 결과 목록의 **이름**과 **부서** 텍스트만. 프로젝트명(`OrganizationMember.project`)은 화면에 노출하지 않고, 관련 강조도 구현하지 않는다.
- 강조 스타일: 굵게(font-weight) + `src/styles/tokens.css`의 `--color-accent`(#2f6fed) 색상. 배경색은 넣지 않는다.
- 매칭 위치 계산 우선순위: (1) 일반 부분일치 → (2) 공백 무시 일치 → (3) 초성 검색. 자모 분해 매칭으로만 찾은 케이스는 강조를 생략한다(결과 자체는 정상 표시).
- `CreateMeeting.tsx`와 `ResponseList.tsx` 양쪽 모두에 동일하게 적용한다.
- 기존 `matchesPrefix`/`memberMatchesQuery`(검색 필터링 로직)는 수정하지 않는다 — 순수 추가만 한다.

---

### Task 1: `findHighlightRange` 순수 함수 구현 (Vitest 셋업 포함)

**Files:**
- Modify: `package.json` (devDependency 추가, `test` 스크립트 추가)
- Create: `vitest.config.ts`
- Modify: `src/utils/koreanSearch.ts:1` (파일 하단에 `findHighlightRange` 및 헬퍼 추가)
- Test: `src/utils/koreanSearch.test.ts`

**Interfaces:**
- Produces: `export interface HighlightRange { start: number; end: number }`, `export function findHighlightRange(query: string, text: string): HighlightRange | null` — Task 2가 이 함수를 `HighlightedText` 컴포넌트에서 가져다 쓴다.

- [ ] **Step 1: Vitest 설치**

Run: `npm install -D vitest@^3.2.7`

- [ ] **Step 2: `test` 스크립트 추가**

`package.json`의 `scripts`에 추가:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: `vitest.config.ts` 생성**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: 실패하는 테스트 작성**

Create `src/utils/koreanSearch.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { findHighlightRange } from './koreanSearch';

describe('findHighlightRange', () => {
  it('일반 부분일치 구간을 찾는다', () => {
    expect(findHighlightRange('서연', '박서연')).toEqual({ start: 1, end: 3 });
  });

  it('대소문자를 구분하지 않는다', () => {
    expect(findHighlightRange('ABC', 'abcdef')).toEqual({ start: 0, end: 3 });
  });

  it('공백을 무시하고 매치한 구간을 원본 인덱스로 되돌린다', () => {
    expect(findHighlightRange('프로덕트디자인', '프로덕트 디자인')).toEqual({ start: 0, end: 8 });
  });

  it('초성 검색 시 대응하는 원본 글자 구간을 찾는다', () => {
    expect(findHighlightRange('ㅈㅎㅇ', '조해원')).toEqual({ start: 0, end: 3 });
  });

  it('일치하는 부분이 없으면 null을 반환한다', () => {
    expect(findHighlightRange('없음', '조해원')).toBeNull();
  });

  it('검색어가 비어 있으면 null을 반환한다', () => {
    expect(findHighlightRange('', '조해원')).toBeNull();
  });
});
```

- [ ] **Step 5: 테스트 실행 → 실패 확인**

Run: `npx vitest run src/utils/koreanSearch.test.ts`
Expected: FAIL — `findHighlightRange`가 `koreanSearch.ts`에 없어서 import 에러 또는 `findHighlightRange is not a function` 에러

- [ ] **Step 6: `findHighlightRange` 구현**

`src/utils/koreanSearch.ts` 파일 맨 끝(`memberMatchesQuery` 함수 뒤)에 추가:

```ts
export interface HighlightRange {
  start: number;
  end: number;
}

function findRawSubstringRange(query: string, text: string): HighlightRange | null {
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return null;
  return { start: index, end: index + query.length };
}

function findCompactRange(query: string, text: string): HighlightRange | null {
  const compact = text.toLowerCase().replace(/\s+/g, '');
  const index = compact.indexOf(query);
  if (index === -1) return null;

  const originalIndices: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    if (!/\s/.test(text[i])) originalIndices.push(i);
  }
  const startOriginal = originalIndices[index];
  const endOriginal = originalIndices[index + query.length - 1];
  if (startOriginal === undefined || endOriginal === undefined) return null;
  return { start: startOriginal, end: endOriginal + 1 };
}

function findInitialsRange(query: string, text: string): HighlightRange | null {
  const queryInitials = initials(query);
  if (!queryInitials) return null;
  const textInitials = initials(text);
  const index = textInitials.indexOf(queryInitials);
  if (index === -1) return null;
  return { start: index, end: index + queryInitials.length };
}

export function findHighlightRange(query: string, text: string): HighlightRange | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery || !text) return null;

  return (
    findRawSubstringRange(normalizedQuery, text) ??
    findCompactRange(normalizedQuery, text) ??
    findInitialsRange(normalizedQuery, text)
  );
}
```

- [ ] **Step 7: 테스트 실행 → 통과 확인**

Run: `npx vitest run src/utils/koreanSearch.test.ts`
Expected: PASS (6개 테스트 모두 통과)

- [ ] **Step 8: 커밋**

```bash
git add package.json package-lock.json vitest.config.ts src/utils/koreanSearch.ts src/utils/koreanSearch.test.ts
git commit -m "$(cat <<'EOF'
Add findHighlightRange for search match highlighting

Pure function that locates the matched character range in a name/team
string, following the same priority as the existing search matcher
(raw substring, whitespace-ignoring, choseong-initials). Adds vitest
as the project's first unit test runner.
EOF
)"
```

---

### Task 2: `HighlightedText` 컴포넌트 생성 및 `CreateMeeting.tsx` 적용

**Files:**
- Create: `src/components/HighlightedText.tsx`
- Create: `src/components/HighlightedText.css`
- Modify: `src/components/CreateMeeting.tsx:341-348` (검색 결과 목록의 이름/부서 렌더링)

**Interfaces:**
- Consumes: `findHighlightRange(query: string, text: string): HighlightRange | null` (Task 1, `src/utils/koreanSearch.ts`)
- Produces: `export function HighlightedText({ text, query }: { text: string; query: string }): JSX.Element` — Task 3이 `ResponseList.tsx`에서 동일하게 가져다 쓴다.

- [ ] **Step 1: `HighlightedText.css` 작성**

Create `src/components/HighlightedText.css`:

```css
.highlighted-text__match {
  background: none;
  color: var(--color-accent);
  font-weight: 700;
}
```

- [ ] **Step 2: `HighlightedText.tsx` 작성**

Create `src/components/HighlightedText.tsx`:

```tsx
import { findHighlightRange } from '../utils/koreanSearch';
import './HighlightedText.css';

interface HighlightedTextProps {
  text: string;
  query: string;
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const range = findHighlightRange(query, text);
  if (!range) return <>{text}</>;

  return (
    <>
      {text.slice(0, range.start)}
      <mark className="highlighted-text__match">{text.slice(range.start, range.end)}</mark>
      {text.slice(range.end)}
    </>
  );
}
```

- [ ] **Step 3: `CreateMeeting.tsx`에 적용**

`src/components/CreateMeeting.tsx` 상단 import에 추가 (`import './CreateMeeting.css';` 위):

```tsx
import { HighlightedText } from './HighlightedText';
```

`src/components/CreateMeeting.tsx:341-348`의 아래 블록을:

```tsx
                      <span className="create-meeting__member-copy">
                        <span className="create-meeting__member-name text-body-sm">
                          {member.name}
                        </span>
                        <span className="create-meeting__member-meta text-caption">
                          {member.team}
                        </span>
                      </span>
```

다음으로 교체:

```tsx
                      <span className="create-meeting__member-copy">
                        <span className="create-meeting__member-name text-body-sm">
                          <HighlightedText text={member.name} query={normalizedMemberQuery} />
                        </span>
                        <span className="create-meeting__member-meta text-caption">
                          <HighlightedText text={member.team} query={normalizedMemberQuery} />
                        </span>
                      </span>
```

- [ ] **Step 4: 타입체크**

Run: `npx tsc -b --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 브라우저에서 수동 검증**

Run: `npm run dev`

브라우저에서 회의 만들기 화면(참석자 검색)을 열고 다음을 확인:
- "서연" 입력 → "박서연" 결과의 "서연" 부분이 굵게 파란색으로 표시되는지
- "프로덕트디자인" (공백 없이) 입력 → 부서가 "프로덕트 디자인"인 사람의 부서 텍스트 전체가 강조되는지
- 이름의 초성만 입력(예: "ㅈㅎㅇ") → "조해원"의 이름 전체가 강조되는지
- 이름에만 일치하고 부서에는 일치하지 않는 검색어(예: 사람 이름 일부) 입력 시, 이름만 강조되고 부서는 강조 없이 원문 그대로 보이는지
- 검색어를 지우면 결과 목록이 사라지고, 다시 입력하면 강조가 정상적으로 다시 나타나는지

- [ ] **Step 6: 커밋**

```bash
git add src/components/HighlightedText.tsx src/components/HighlightedText.css src/components/CreateMeeting.tsx
git commit -m "$(cat <<'EOF'
Highlight matched text in create-meeting attendee search results

Adds a reusable HighlightedText component so users can see which part
of a name/team matched their search query.
EOF
)"
```

---

### Task 3: `ResponseList.tsx`에 적용 및 최종 검증

**Files:**
- Modify: `src/components/ResponseList.tsx:188-195` (검색 결과 목록의 이름/부서 렌더링)

**Interfaces:**
- Consumes: `HighlightedText` (Task 2, `src/components/HighlightedText.tsx`)

- [ ] **Step 1: `ResponseList.tsx`에 적용**

`src/components/ResponseList.tsx` 상단 import에 추가 (`import './ResponseList.css';` 위):

```tsx
import { HighlightedText } from './HighlightedText';
```

`src/components/ResponseList.tsx:188-195`의 아래 블록을:

```tsx
                        <span className="response-list__member-copy">
                          <span className="response-list__member-name text-body-sm">
                            {member.name}
                          </span>
                          <span className="response-list__member-meta text-caption">
                            {member.team}
                          </span>
                        </span>
```

다음으로 교체:

```tsx
                        <span className="response-list__member-copy">
                          <span className="response-list__member-name text-body-sm">
                            <HighlightedText text={member.name} query={normalizedMemberQuery} />
                          </span>
                          <span className="response-list__member-meta text-caption">
                            <HighlightedText text={member.team} query={normalizedMemberQuery} />
                          </span>
                        </span>
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc -b --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 브라우저에서 수동 검증**

Run: `npm run dev` (이미 실행 중이 아니라면)

브라우저에서 응답 현황판 화면 → "참석자 추가" 버튼 클릭 후 검색창에서 Task 2와 동일한 케이스(부분일치/공백무시/초성)를 확인. 두 화면의 강조 동작이 일치하는지 비교.

- [ ] **Step 4: 전체 테스트 스위트 실행**

Run: `npm test`
Expected: PASS (Task 1의 6개 테스트 모두 통과)

- [ ] **Step 5: 전체 빌드 검증**

Run: `npm run build`
Expected: 타입 에러 및 빌드 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/components/ResponseList.tsx
git commit -m "$(cat <<'EOF'
Highlight matched text in response-list attendee search results

Reuses HighlightedText so both attendee search entry points show
consistent match highlighting.
EOF
)"
```
