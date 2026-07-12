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

// 참석자 날짜 선택용 짧은 표기: "14 화"
export function shortDayLabel(date: Date): string {
  return `${date.getDate()} ${WEEKDAY_SHORT[date.getDay()]}`;
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

export interface DateRange {
  rangeStart: string;
  rangeEnd: string;
  selectedDates: string[];
}

export function selectedDatesForRange(
  rangeStart: string,
  rangeEnd: string,
  includeWeekends: boolean,
): string[] {
  const start = parseISODate(rangeStart);
  const end = parseISODate(rangeEnd);
  const dates: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (!includeWeekends && isWeekend(cursor)) continue;
    dates.push(toISODate(cursor));
  }
  return dates;
}

// 이번 주/다음 주는 "오늘부터 해당 주(월요일 시작) 끝(일요일)까지"를 뜻한다 — 롤링 7일 범위가 아니다.
// rangeStart/rangeEnd는 표시용 경계이므로 주말 제외 시 실제 후보일(selectedDates) 양끝에 맞춰 줄어들어야
// 한다 — 그렇지 않으면 주말 포함 체크박스를 꺼도 날짜 범위 텍스트(예: 7/12~7/19)가 그대로 남는 버그가 있었다.
export function thisWeekRange(includeWeekends: boolean, base: Date = new Date()): DateRange {
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = addDays(mondayOfWeek(base, 0), 6);
  const selectedDates = selectedDatesForRange(toISODate(today), toISODate(end), includeWeekends);
  return {
    rangeStart: selectedDates[0] ?? toISODate(today),
    rangeEnd: selectedDates[selectedDates.length - 1] ?? toISODate(end),
    selectedDates,
  };
}

export function nextWeekRange(includeWeekends: boolean, base: Date = new Date()): DateRange {
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = addDays(mondayOfWeek(base, 1), 6);
  const selectedDates = selectedDatesForRange(toISODate(today), toISODate(end), includeWeekends);
  return {
    rangeStart: selectedDates[0] ?? toISODate(today),
    rangeEnd: selectedDates[selectedDates.length - 1] ?? toISODate(end),
    selectedDates,
  };
}

export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 범위 내 날짜 나열 — 주말 미포함이면 토/일 제외. 전부 걸러지면 시작일 하루로 폴백
export function listRangeDays(
  rangeStart: string,
  rangeEnd: string,
  includeWeekends: boolean,
  selectedDates?: string[],
): Date[] {
  const dateKeys =
    selectedDates && selectedDates.length > 0
      ? selectedDates.filter((iso) => includeWeekends || !isWeekend(parseISODate(iso)))
      : selectedDatesForRange(rangeStart, rangeEnd, includeWeekends);
  const sortedKeys = Array.from(new Set(dateKeys)).sort();
  return sortedKeys.length > 0 ? sortedKeys.map(parseISODate) : [parseISODate(rangeStart)];
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
