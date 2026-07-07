import { useRef, useState } from 'react';
import {
  formatMonthDay,
  isWeekend,
  listRangeDays,
  mondayOfWeek,
  parseISODate,
  selectedDatesForRange,
  toISODate,
} from '../data/schedule';
import { useLongPressDrag } from '../utils/useLongPressDrag';
import './RangeCalendar.css';

const WEEKDAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일'];

interface RangeCalendarProps {
  rangeStart: string; // 'YYYY-MM-DD'
  rangeEnd: string;
  selectedDates: string[];
  includeWeekends: boolean;
  onChange: (rangeStart: string, rangeEnd: string, selectedDates: string[]) => void;
}

// 시작일~종료일 드래그 범위 선택 캘린더 — TimeGrid와 동일한 즉시 드래그 모델
// (pointer capture + elementFromPoint, useLongPressDrag 재사용). 탭 한 번 = 하루짜리 범위.
export function RangeCalendar({
  rangeStart,
  rangeEnd,
  selectedDates,
  includeWeekends,
  onChange,
}: RangeCalendarProps) {
  const drag = useLongPressDrag();
  const anchorRef = useRef<string | null>(null);
  const baseSelectionRef = useRef<string[]>([]);
  const suppressClickRef = useRef(false);
  const start = parseISODate(rangeStart);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(start.getFullYear(), start.getMonth(), 1),
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = todayStart.getTime();

  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const weekdayHeaders = includeWeekends ? WEEKDAY_HEADERS : WEEKDAY_HEADERS.slice(0, 5);
  const weeks: Date[][] = [];
  let cursor = mondayOfWeek(viewMonth, 0);
  while (cursor <= monthEnd) {
    const weekStart = cursor;
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        return day;
      }),
    );
    cursor = new Date(weekStart);
    cursor.setDate(weekStart.getDate() + 7);
  }

  const isDisabled = (day: Date) => day < todayStart || (!includeWeekends && isWeekend(day));
  const selectedSet = new Set(selectedDates);

  const emitDates = (dates: string[]) => {
    const nextDates = Array.from(new Set(dates))
      .filter((iso) => includeWeekends || !isWeekend(parseISODate(iso)))
      .sort();
    if (nextDates.length === 0) return;
    onChange(nextDates[0], nextDates[nextDates.length - 1], nextDates);
  };

  const datesBetween = (a: string, b: string) => {
    const startISO = a <= b ? a : b;
    const endISO = a <= b ? b : a;
    return selectedDatesForRange(startISO, endISO, includeWeekends);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, day: Date) => {
    if (isDisabled(day)) return;
    const iso = toISODate(day);
    drag.startPress(
      event,
      () => {
        anchorRef.current = iso;
        baseSelectionRef.current = selectedDates;
        suppressClickRef.current = false;
      },
      (moveEvent) => {
        const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement | null;
        const cell = el?.closest('[data-date]') as HTMLElement | null;
        const targetISO = cell?.dataset.date;
        if (!targetISO || !anchorRef.current) return;
        if (isDisabled(parseISODate(targetISO))) return;
        suppressClickRef.current = true;
        emitDates([...baseSelectionRef.current, ...datesBetween(anchorRef.current, targetISO)]);
      },
    );
  };

  const handleClick = (day: Date) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (isDisabled(day)) return;
    const iso = toISODate(day);
    if (selectedSet.has(iso)) {
      emitDates(selectedDates.filter((date) => date !== iso));
      return;
    }
    emitDates([...selectedDates, iso]);
  };

  const moveMonth = (delta: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
  };

  const rangeDayCount = listRangeDays(rangeStart, rangeEnd, includeWeekends, selectedDates).length;

  return (
    <div className={`range-calendar${includeWeekends ? '' : ' range-calendar--weekdays'}`}>
      <div className="range-calendar__header">
        <button type="button" className="range-calendar__nav" aria-label="이전 달" onClick={() => moveMonth(-1)}>
          ‹
        </button>
        <span className="range-calendar__month text-title-sm">
          {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
        </span>
        <button type="button" className="range-calendar__nav" aria-label="다음 달" onClick={() => moveMonth(1)}>
          ›
        </button>
      </div>

      <div className="range-calendar__weekdays">
        {weekdayHeaders.map((label) => (
          <span key={label} className="text-caption">
            {label}
          </span>
        ))}
      </div>

      {weeks.map((week) => (
        <div key={week[0].getTime()} className="range-calendar__grid">
          {(includeWeekends ? week : week.filter((day) => !isWeekend(day))).map((day) => {
            const iso = toISODate(day);
            const selected = selectedSet.has(iso) && !isDisabled(day);
            return (
              <button
                key={iso}
                type="button"
                data-date={iso}
                disabled={isDisabled(day)}
                aria-pressed={selected}
                className={`range-calendar__day${selected ? ' range-calendar__day--selected' : ''}${
                  day.getMonth() !== viewMonth.getMonth() ? ' range-calendar__day--outside' : ''
                }${day.getTime() === todayKey ? ' range-calendar__day--today' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, day)}
                onPointerMove={drag.movePress}
                onClick={() => handleClick(day)}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      ))}

      <p className="range-calendar__caption text-caption">
        {formatMonthDay(parseISODate(rangeStart))} ~ {formatMonthDay(parseISODate(rangeEnd))} ·{' '}
        {rangeDayCount}일
      </p>
    </div>
  );
}
