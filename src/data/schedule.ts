// 화면 ①의 "회의 가능 기간" — 시작일~종료일 날짜 범위 (주말 포함 여부는 별도 토글)

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAY_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

// 참석자 그리드 헤더용 짧은 표기: "화 14"
export function shortDayLabel(date: Date): string {
  return `${WEEKDAY_SHORT[date.getDay()]} ${date.getDate()}`;
}

export function fullWeekdayName(date: Date): string {
  return WEEKDAY_FULL[date.getDay()];
}

// base가 속한 주(월요일 시작)의 월요일에서 weeksAhead주 뒤의 월요일 (자정 기준)
export function mondayOfWeek(base: Date = new Date(), weeksAhead = 0): Date {
  const day = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const dow = (day.getDay() + 6) % 7; // 월=0 … 일=6
  day.setDate(day.getDate() - dow + weeksAhead * 7);
  return day;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function endOfWeek(monday: Date, includeWeekends: boolean): Date {
  return addDays(monday, includeWeekends ? 6 : 4);
}

export interface DateRange {
  rangeStart: string;
  rangeEnd: string;
}

export function nextWeekRange(includeWeekends: boolean, base: Date = new Date()): DateRange {
  const monday = mondayOfWeek(base, 1);
  return {
    rangeStart: toISODate(monday),
    rangeEnd: toISODate(endOfWeek(monday, includeWeekends)),
  };
}

// 이번 주는 오늘과 지난 날짜를 제외한다. 남은 날이 없으면 다음 주로 폴백.
export function thisWeekRange(includeWeekends: boolean, base: Date = new Date()): DateRange {
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const monday = mondayOfWeek(today, 0);
  const end = endOfWeek(monday, includeWeekends);
  let start = addDays(today, 1);

  while (start <= end && !includeWeekends && isWeekend(start)) {
    start = addDays(start, 1);
  }

  if (start > end) return nextWeekRange(includeWeekends, base);

  return {
    rangeStart: toISODate(start),
    rangeEnd: toISODate(end),
  };
}

export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 범위 내 날짜 나열 — 주말 미포함이면 토/일 제외. 전부 걸러지면 시작일 하루로 폴백
export function listRangeDays(rangeStart: string, rangeEnd: string, includeWeekends: boolean): Date[] {
  const start = parseISODate(rangeStart);
  const end = parseISODate(rangeEnd);
  const days: Date[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (!includeWeekends && isWeekend(cursor)) continue;
    days.push(new Date(cursor));
  }
  return days.length > 0 ? days : [start];
}

// 참석자 플로우의 단계적 노출 — 한 번에 며칠씩만 (SPEC 가설 B)
export function chunkDays<T>(items: T[], size = 3): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// 화면 ①에서 정한 시간대 안에서 회의 시간 길이만큼 슬롯 단위를 생성
export function slotsForDuration(
  durationMinutes: number,
  dayStartMinutes = 9 * 60,
  dayEndMinutes = 18 * 60,
): number[] {
  const slots: number[] = [];
  for (let start = dayStartMinutes; start + durationMinutes <= dayEndMinutes; start += durationMinutes) {
    slots.push(start);
  }
  return slots;
}
