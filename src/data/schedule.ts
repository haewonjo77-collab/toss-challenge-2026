// 화면 ①의 "회의 가능 기간" — 주 단위 오프셋 (0=이번 주, 1=다음 주, 2 이상=직접 선택한 N주 후).
// 달력 피커 대신 세그먼트 토글 + 주 단위 select만으로 유지 (익숙한 패턴, 새 UI 발명 없음)
export const CUSTOM_WEEKS_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

export function weeksAheadLabel(weeksAhead: number): string {
  if (weeksAhead === 0) return '이번 주';
  if (weeksAhead === 1) return '다음 주';
  return `${weeksAhead}주 후`;
}

const WEEKDAY_ORDER = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

// base가 속한 주(월요일 시작)의 월요일에서 weeksAhead주 뒤의 월요일 (자정 기준)
export function mondayOfWeek(base: Date = new Date(), weeksAhead = 0): Date {
  const day = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const dow = (day.getDay() + 6) % 7; // 월=0 … 일=6
  day.setDate(day.getDate() - dow + weeksAhead * 7);
  return day;
}

// "화요일" + weeksAhead → 해당 주의 실제 날짜
export function dateForWeekday(dayName: string, weeksAhead: number, base: Date = new Date()): Date {
  const monday = mondayOfWeek(base, weeksAhead);
  const date = new Date(monday);
  date.setDate(monday.getDate() + Math.max(0, WEEKDAY_ORDER.indexOf(dayName)));
  return date;
}

export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

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
