// 화면 ①의 "회의 가능 기간" 선택 — 달력 피커 대신 간단한 세그먼트 토글로 이번 주/다음 주만 구분
export type WeekScope = 'this' | 'next';

export const WEEK_SCOPE_LABEL: Record<WeekScope, string> = {
  this: '이번 주',
  next: '다음 주',
};

// 업무 회의 맥락상 월~금만 노출하고, 한 번에 다 보여주지 않고 며칠씩 나눠 단계적으로 노출 (SPEC 가설 B)
export const JOIN_DAY_STAGES: string[][] = [
  ['월요일', '화요일', '수요일'],
  ['목요일', '금요일'],
];

const DAY_START = 9 * 60;
const DAY_END = 18 * 60;

// 화면 ①에서 정한 회의 시간 길이만큼 슬롯 단위를 생성 (09:00~18:00)
export function slotsForDuration(durationMinutes: number): number[] {
  const slots: number[] = [];
  for (let start = DAY_START; start + durationMinutes <= DAY_END; start += durationMinutes) {
    slots.push(start);
  }
  return slots;
}
