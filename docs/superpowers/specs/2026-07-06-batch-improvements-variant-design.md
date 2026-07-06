# 종합 개선 + AS-IS/TO-BE 비교 버전 — 설계 문서

날짜: 2026-07-06
대상: 화면 종합 개선(세그먼트 드래그, 추가 영역 재구성, 순위 배지) + 가설 A/B/C 검증용
AS-IS/TO-BE variant 시스템 + GitHub push.

**요청 항목 4(가능 기간 토글)·5(미리보기 모달)·6(빈 화면 시작)은 직전 커밋들
(0a75b8e, 6cce89f, c03ac4e)에서 이미 완료 — 이번 배치에서는 1·2·3·7·8만 신규 작업.**

## 1. 필수/선택 세그먼트 드래그

- TimeGrid 드래그 패턴 재사용: mousedown 시점에 드래그 목표값을 ref에 고정, 지나가는
  참석자 행마다 동일 값 일괄 적용, window mouseup/touchend로 종료.
- **판단**: "mousedown한 세그먼트의 반대쪽 값" 문구는 이진 토글에서 해석이 갈리는데,
  "누른 세그먼트의 값 = 드래그 목표값"으로 구현한다. 이 해석만이 단일 클릭 동작(누른
  쪽이 선택됨)을 완전히 보존하면서, 이미 선택된 쪽을 눌러 드래그하면 그 값을 다른
  행에 퍼뜨리는 자연스러운 제스처가 된다. (행이 '선택'일 때 '필수'를 누르면 반대값
  적용과 결과가 동일 — 차이는 이미 선택된 쪽을 눌렀을 때뿐이며, 그 경우 행 값을
  뒤집으면 라디오 관행이 깨진다.)
- changeRole을 함수형 setState로 전환 (드래그 중 연속 이벤트가 리렌더보다 빠를 때
  이전 변경이 유실되는 것 방지). 행에 `data-attendee-id` 부여, 터치는 elementFromPoint
  → `closest('[data-attendee-id]')`. 토글 버튼에 touch-action: none.

## 2. 참석자 추가 영역 재구성

- 세로 스택: 이름 입력(전체 너비) → 부서/팀(기본 숨김, "+ 부서/팀 추가" 텍스트 버튼으로
  펼침) → "추가" 버튼(전체 너비, secondary).
- 부서/팀 필드는 한 번 펼치면 세션 동안 유지 (여러 명 연속 입력 시 매번 다시 펼치지
  않도록). 최근 참석자 칩과 직접 입력 사이 여백을 lg로 확대해 시각 분리.

## 3. 화면 ③ 순위 배지

- 순위는 정렬된 추천 리스트의 위치에서 파생: 1위 "추천", 이하 "대안 1/2/3".
- 대안을 미리보기(최상단 교체)하면 그 카드는 자기 순위 라벨("대안 2" 등)을 그대로
  들고 올라간다 — 자리가 아니라 순위를 라벨링해야 정직한 표시.
- 스타일: "추천"은 badge-required 톤(surface-strong/ink/700), "대안 N"은 badge-optional
  톤(surface-soft/muted/500) — 기존 배지와 시각 문법 통일, 전부 그레이스케일 pill.

## 7. AS-IS/TO-BE variant 시스템

- `VariantContext`: `'as-is' | 'to-be'`, 초기값은 URL `?variant=as-is` 파라미터에서 1회
  읽고 이후 Context 상태로만 관리 (라우트 이동 시 쿼리 유지에 의존하지 않음 — 테스트
  진행자 토글이 주 전환 수단).
- 우측 상단(BackBar 오른쪽)에 진행자용 AS-IS/TO-BE 미니 세그먼트 스위치. 실사용자 UI가
  아님을 코드 주석으로 명시.
- **가설 A (화면 ②)**: AS-IS는 헤드라인 "응답 진행 중..." + 이름 목록만(응답완료/대기중
  라벨 숨김) + 카운트 힌트 제거. 게이팅 자체(전원 응답 시 버튼 활성화)는 유지 — 시스템은
  알고 있지만 주최자에게 공개하지 않는 것이 AS-IS의 요점. `WaitingRoom`에
  `revealResponses` prop, `ResponseList`에 `showStatus` prop 추가.
- **가설 B (보조 플로우)**: AS-IS는 `JOIN_DAY_STAGES.flat()`으로 5일을 한 그리드에 노출
  (셀이 좁아지는 부담 자체가 AS-IS 문제의 시각화). 단계 점·이전/다음 없음, CTA 제출하기.
- **가설 C (화면 ③)**: `recommendTimes`에 `mode: 'priority' | 'headcount'` 추가.
  headcount는 필수/선택 무시하고 전체 참석 가능 수로만 정렬, isFallback 항상 false
  (차선책 개념 자체가 TO-BE 기능). 카드는 필수/선택 배지·섹션 대신 "참석 가능 n/m" 배지
  + 단일 "참석자" 섹션. 화면 ①의 태그 지정 UI는 그대로 둠 — 가설 C는 "태그가 추천에
  반영되지 않는다"는 것이므로 태그 존재 자체는 양쪽 동일.
- **측정**: `useScreenMeasure(screenName)` 훅 — 진입/이탈 시각과 체류 시간, 구간 클릭
  수를 variant와 함께 console.log. 화면 내 타이머 표시는 목업 UI를 해치므로 콘솔로만
  (요청상 편의 기능이라 판단).

## 8. GitHub push

- `tsconfig.tsbuildinfo`(tsc -b 부산물)를 .gitignore에 추가 후
  `origin = https://github.com/haewonjo77-collab/toss-challenge-2026.git`으로 push.
  Netlify 연결은 사용자가 웹에서 직접 진행 예정이므로 push까지만.
