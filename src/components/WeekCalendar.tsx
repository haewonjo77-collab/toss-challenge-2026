import { useState } from 'react';
import { formatMonthDay, mondayOfWeek, weeksAheadLabel } from '../data/schedule';
import './WeekCalendar.css';

const WEEKDAY_HEADERS = ['월', '화', '수', '목', '금', '토', '일'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface WeekCalendarProps {
  weeksAhead: number;
  onSelect: (weeksAhead: number) => void;
}

// 주 단위 선택 캘린더 — 날짜가 아니라 "주"가 선택 단위이므로 한 주(행) 전체가 하나의 버튼.
// 지나간 주는 비활성, 이번 주(0)/다음 주(1)를 고르면 세그먼트 하이라이트도 자동으로 따라간다.
export function WeekCalendar({ weeksAhead, onSelect }: WeekCalendarProps) {
  const currentMonday = mondayOfWeek(new Date(), 0);
  const selectedMonday = mondayOfWeek(new Date(), weeksAhead);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedMonday.getFullYear(), selectedMonday.getMonth(), 1),
  );

  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const weeks: Date[][] = [];
  let cursor = mondayOfWeek(viewMonth, 0);
  while (cursor <= monthEnd) {
    const start = cursor;
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
      }),
    );
    cursor = new Date(start);
    cursor.setDate(start.getDate() + 7);
  }

  const moveMonth = (delta: number) => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
  };

  const selectedFriday = new Date(selectedMonday);
  selectedFriday.setDate(selectedMonday.getDate() + 4);
  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  return (
    <div className="week-calendar">
      <div className="week-calendar__header">
        <button type="button" className="week-calendar__nav" aria-label="이전 달" onClick={() => moveMonth(-1)}>
          ‹
        </button>
        <span className="week-calendar__month text-title-sm">
          {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
        </span>
        <button type="button" className="week-calendar__nav" aria-label="다음 달" onClick={() => moveMonth(1)}>
          ›
        </button>
      </div>

      <div className="week-calendar__weekdays">
        {WEEKDAY_HEADERS.map((label) => (
          <span key={label} className="text-caption">
            {label}
          </span>
        ))}
      </div>

      {weeks.map((week) => {
        const weekOffset = Math.round((week[0].getTime() - currentMonday.getTime()) / WEEK_MS);
        const isPast = weekOffset < 0;
        const isSelected = week[0].getTime() === selectedMonday.getTime();
        return (
          <button
            key={week[0].getTime()}
            type="button"
            className={`week-calendar__week${isSelected ? ' week-calendar__week--selected' : ''}`}
            disabled={isPast}
            aria-pressed={isSelected}
            onClick={() => onSelect(weekOffset)}
          >
            {week.map((day) => (
              <span
                key={day.getTime()}
                className={`week-calendar__day${
                  day.getMonth() !== viewMonth.getMonth() ? ' week-calendar__day--outside' : ''
                }${day.getTime() === todayKey ? ' week-calendar__day--today' : ''}`}
              >
                {day.getDate()}
              </span>
            ))}
          </button>
        );
      })}

      <p className="week-calendar__caption text-caption">
        선택한 주: {weeksAheadLabel(weeksAhead)} · {formatMonthDay(selectedMonday)} ~{' '}
        {formatMonthDay(selectedFriday)}
      </p>
    </div>
  );
}
