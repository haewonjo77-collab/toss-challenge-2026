# 검색 결과 강조 표시 설계

## 배경

`CreateMeeting.tsx`(회의 만들기의 참석자 검색)와 `ResponseList.tsx`(응답 현황판의 참석자 추가 검색)는 모두 `memberMatchesQuery`(`src/utils/koreanSearch.ts`)로 조직 멤버를 검색해 목록으로 보여준다. 두 화면 모두 결과 목록에 이름과 부서만 텍스트로 보여줄 뿐, 어떤 부분이 검색어와 일치해서 그 사람이 나왔는지는 표시하지 않는다. 사용자가 무엇을 검색했고 그 결과가 왜 나왔는지 목록에서 바로 구분할 수 있도록 일치 부분을 강조 표시한다.

## 범위

- `CreateMeeting.tsx`와 `ResponseList.tsx`의 검색 결과 목록 — 이름(`*__member-name`), 부서(`*__member-meta`) 텍스트
- 두 화면은 검색 로직과 결과 목록 UI 구조가 사실상 동일하므로 함께 적용한다. 한쪽만 바꾸면 두 화면의 동작이 달라져 일관성이 깨진다.
- 프로젝트명(`OrganizationMember.project`)은 현재도 결과 목록에 노출되지 않으며, 이번 작업에서도 노출하지 않는다. 검색어가 프로젝트명에만 일치해 결과가 나온 경우, 강조 표시 없이 결과만 보여준다 (기존과 동일한 동작, 회귀 없음).

## 강조 방식

일치하는 글자 구간을 **굵게(font-weight) + 브랜드 색상**으로 표시한다. `<mark>` 요소에 커스텀 스타일을 입혀 사용하고, 배경색은 넣지 않는다(볼드+색상만). 색상은 기존 `src/styles/tokens.css`의 `--color-accent`(#2f6fed) 토큰을 사용해 다른 강조 UI와 톤을 맞춘다.

## 매칭 위치 계산

`koreanSearch.ts`의 기존 매칭 우선순위(`matchesPrefix`)를 따라, 아래 순서로 첫 번째로 성공하는 전략의 구간을 사용한다. 문자 인덱스는 원본 텍스트(공백 포함, 원래 표기) 기준.

1. **일반 부분일치**: `text.toLowerCase().indexOf(query)` — 대소문자 무시 부분 문자열. 대부분의 실사용 케이스(이름 전체/일부, 부서명 일부 타이핑)를 커버한다.
2. **공백 무시 일치**: 텍스트에서 공백을 제거한 문자열(`compact`)에서 `query`를 찾고, compact 인덱스를 원본 인덱스로 역매핑한다(공백만 제거했으므로 원본 문자를 순서대로 훑으며 공백을 건너뛰는 매핑 배열로 계산). 예: 부서명 "프로덕트 디자인"에 "프로덕트디자인"으로 검색해도 해당 글자 구간이 강조된다.
3. **초성 검색**: 텍스트의 초성 문자열(`initials(text)`, 원본과 1:1 대응)에서 초성화된 query(`initials(query)`)를 찾는다. 인덱스가 원본 텍스트 인덱스와 1:1 대응이므로 그대로 사용한다. 예: "ㄱㅎㅇ"으로 검색 시 "조해원" 전체가 강조된다.
4. **자모 분해 매칭**(위 세 전략이 모두 실패했지만 `memberMatchesQuery`가 이 전략으로 이미 매치를 찾은 경우): 정밀한 위치 계산을 생략하고 강조 없이 결과만 표시한다. 타이핑 도중 완성되지 않은 자모를 입력하는 드문 경우이며, 조합이 끝나면 위 1~3번 전략으로 자연스럽게 강조된다.

모든 전략이 실패해도(이론상 프로젝트명 전용 매치 등) 결과 표시 자체는 정상 동작하며 강조만 없다 — 강조는 부가 기능이지 검색 결과 필터링에 영향을 주지 않는다.

## 구현 구조

- **`src/utils/koreanSearch.ts`**: `findHighlightRange(query: string, text: string): { start: number; end: number } | null` 함수 추가. 위 우선순위 로직을 그대로 구현한다. 기존 `matchesPrefix`/`memberMatchesQuery`는 수정하지 않는다(순수 추가).
- **`src/components/HighlightedText.tsx`** (신설): `{ text: string; query: string }` props를 받아 `findHighlightRange`로 구간을 계산하고, 일치 구간을 `<mark className="highlighted-text__match">`로 감싸 렌더링하는 작은 프레젠테이션 컴포넌트. 구간이 없으면 원본 텍스트를 그대로 렌더링.
  - 스타일(`font-weight`, 색상)은 이 컴포넌트 전용 CSS 파일(`HighlightedText.css`) 또는 기존 전역 스타일 중 적절한 곳에 추가.
- **`CreateMeeting.tsx`**: `create-meeting__member-name`/`create-meeting__member-meta` 안의 `{member.name}`/`{member.team}` 텍스트를 `<HighlightedText text={member.name} query={normalizedMemberQuery} />` 형태로 교체.
- **`ResponseList.tsx`**: 동일하게 `response-list__member-name`/`response-list__member-meta` 부분을 `HighlightedText`로 교체.

## 테스트 관점

- 이름 부분일치, 부서 부분일치 각각 강조 구간이 올바른지
- 공백 무시 매치(부서명처럼 공백이 있는 필드)에서 인덱스 역매핑이 정확한지
- 초성 검색 시 전체 이름이 강조되는지
- 일치 항목이 없는 필드(예: 이름만 일치, 부서는 무관)는 강조 없이 원문 그대로 렌더링되는지
- 검색어를 지우면(빈 문자열) 강조 없이 정상 렌더링되는지

## 비범위 (Out of scope)

- 프로젝트명 표시/강조 (사용자 확인: 처리하지 않음)
- 자모 분해 매칭 케이스의 정밀 강조 (드물고 일시적 — 강조 생략으로 충분)
- 검색 인풋 자체에 대한 강조/스타일 변경 (요청은 결과 "목록"에 대한 강조)
