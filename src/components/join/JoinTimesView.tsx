import { useRef, useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import { formatClock24Label } from '../../data/time';
import {
  formatMonthDay,
  listRangeDays,
  shortDayLabel,
  slotsForDuration,
  toISODate,
} from '../../data/schedule';
import { useScreenMeasure } from '../../utils/measure';
import './join.css';

interface JoinTimesViewProps {
  onAdvance: () => void;
}

const CALENDAR_PROVIDERS = [
  { id: 'google', label: '구글 캘린더', mark: 'G' },
  { id: 'kakao', label: '카카오 캘린더', mark: 'K' },
  { id: 'apple', label: '애플 캘린더', mark: 'A' },
];

const MOCK_BUSY_EVENTS = [
  { date: '2026-07-13', startMinutes: 10 * 60, endMinutes: 14 * 60, title: '외근' },
  { date: '2026-07-14', startMinutes: 12 * 60, endMinutes: 14 * 60, title: '점심시간 이후라 비선호' },
  { date: '2026-07-17', startMinutes: 14 * 60, endMinutes: 16 * 60, title: 'A팀 미팅' },
];

function slotKey(dayKey: string, slotStart: number): string {
  return `${dayKey}|${slotStart}`;
}

function overlaps(slotStart: number, durationMinutes: number, eventStart: number, eventEnd: number) {
  return slotStart < eventEnd && slotStart + durationMinutes > eventStart;
}

function parseSlotKey(key: string) {
  const [dayKey, slotStart] = key.split('|');
  return { dayKey, slotStart: Number(slotStart) };
}

interface UnavailableInterval {
  dayKey: string;
  startMinutes: number;
  endMinutes: number;
  title?: string;
}

function groupIntervals(keys: string[], durationMinutes: number): UnavailableInterval[] {
  const byDay = new Map<string, number[]>();
  keys.map(parseSlotKey).forEach(({ dayKey, slotStart }) => {
    byDay.set(dayKey, [...(byDay.get(dayKey) ?? []), slotStart]);
  });

  return Array.from(byDay.entries())
    .flatMap(([dayKey, starts]) => {
      const sorted = Array.from(new Set(starts)).sort((a, b) => a - b);
      const intervals: UnavailableInterval[] = [];
      let intervalStart: number | null = null;
      let previous: number | null = null;

      sorted.forEach((slotStart) => {
        if (intervalStart === null) {
          intervalStart = slotStart;
          previous = slotStart;
          return;
        }

        if (previous !== null && slotStart === previous + durationMinutes) {
          previous = slotStart;
          return;
        }

        intervals.push({
          dayKey,
          startMinutes: intervalStart,
          endMinutes: (previous ?? intervalStart) + durationMinutes,
        });
        intervalStart = slotStart;
        previous = slotStart;
      });

      if (intervalStart !== null) {
        intervals.push({
          dayKey,
          startMinutes: intervalStart,
          endMinutes: (previous ?? intervalStart) + durationMinutes,
        });
      }

      return intervals.map((interval) => ({
        ...interval,
        title: MOCK_BUSY_EVENTS.find(
          (event) =>
            event.date === interval.dayKey &&
            event.startMinutes === interval.startMinutes &&
            event.endMinutes === interval.endMinutes,
        )?.title,
      }));
    })
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.startMinutes - b.startMinutes);
}

export function JoinTimesView({ onAdvance }: JoinTimesViewProps) {
  const { settings } = useMeeting();
  const { participantName, unavailable, setUnavailable, clearUnavailable, submitResponse } = useJoin();
  const [calendarState, setCalendarState] = useState<'prompt' | 'imported' | 'skipped'>('prompt');
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [rangeAnchor, setRangeAnchor] = useState<{ dayKey: string; slot: number } | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartSlotRef = useRef<number | null>(null);
  const dragTargetRef = useRef<boolean | null>(null);
  const dragMovedRef = useRef(false);
  const dragLastSlotRef = useRef<number | null>(null);
  useScreenMeasure('보조 플로우 · 안되는 시간 입력');

  // 회의 생성 화면에서 정한 날짜를 한 화면에 표시한다.
  const rangeDays = listRangeDays(
    settings.rangeStart,
    settings.rangeEnd,
    settings.includeWeekends,
    settings.selectedDates,
  );
  const days = rangeDays.map((day) => ({ key: toISODate(day), label: shortDayLabel(day) }));
  const slots = slotsForDuration(
    settings.durationMinutes,
    settings.dayStartMinutes,
    settings.dayEndMinutes,
  );
  const selectedIntervals = groupIntervals(unavailable, settings.durationMinutes);
  const intervalsByDay = new Map<string, UnavailableInterval[]>();
  selectedIntervals.forEach((interval) => {
    intervalsByDay.set(interval.dayKey, [...(intervalsByDay.get(interval.dayKey) ?? []), interval]);
  });
  const activeDayIndex = Math.max(
    0,
    days.findIndex((day) => day.key === activeDayKey),
  );
  const activeDay = days[activeDayIndex] ?? days[0];

  const importCalendar = (provider: string) => {
    setLoadingProvider(provider);
    window.setTimeout(() => {
      const rangeDayKeys = new Set(rangeDays.map(toISODate));
      const mockSlots = MOCK_BUSY_EVENTS.flatMap((event) => {
        if (!rangeDayKeys.has(event.date)) return [];
        return slots
          .filter((slot) =>
            overlaps(slot, settings.durationMinutes, event.startMinutes, event.endMinutes),
          )
          .map((slot) => slotKey(event.date, slot));
      });
      mockSlots.forEach((key) => setUnavailable(key, true));
      setLoadingProvider(null);
      setCalendarState('imported');
      setCalendarSheetOpen(false);
    }, 650);
  };

  const toggleSlot = (slot: number) => {
    if (!activeDay) return;
    const key = slotKey(activeDay.key, slot);
    if (unavailable.includes(key)) {
      setUnavailable(key, false);
      setRangeAnchor(null);
      return;
    }

    if (rangeAnchor?.dayKey === activeDay.key) {
      const startIndex = slots.indexOf(rangeAnchor.slot);
      const endIndex = slots.indexOf(slot);
      if (startIndex >= 0 && endIndex >= 0) {
        const from = Math.min(startIndex, endIndex);
        const to = Math.max(startIndex, endIndex);
        slots.slice(from, to + 1).forEach((targetSlot) => {
          setUnavailable(slotKey(activeDay.key, targetSlot), true);
        });
        setRangeAnchor(null);
        return;
      }
    }

    setUnavailable(key, true);
    setRangeAnchor({ dayKey: activeDay.key, slot });
  };

  const slotFromPoint = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const slotValue = element?.closest<HTMLElement>('[data-time-slot]')?.dataset.timeSlot;
    return slotValue ? Number(slotValue) : null;
  };

  const applyDragToSlot = (slot: number) => {
    if (!activeDay || dragStartSlotRef.current === null || dragLastSlotRef.current === slot) return;

    const target =
      dragTargetRef.current ??
      !unavailable.includes(slotKey(activeDay.key, dragStartSlotRef.current));
    dragTargetRef.current = target;

    const startIndex = slots.indexOf(dragStartSlotRef.current);
    const endIndex = slots.indexOf(slot);
    if (startIndex < 0 || endIndex < 0) return;

    const from = Math.min(startIndex, endIndex);
    const to = Math.max(startIndex, endIndex);
    slots.slice(from, to + 1).forEach((targetSlot) => {
      setUnavailable(slotKey(activeDay.key, targetSlot), target);
    });
    dragLastSlotRef.current = slot;
  };

  const handleSlotPointerDown = (event: React.PointerEvent<HTMLButtonElement>, slot: number) => {
    if (!event.isPrimary) return;
    dragPointerIdRef.current = event.pointerId;
    dragStartSlotRef.current = slot;
    dragTargetRef.current = null;
    dragMovedRef.current = false;
    dragLastSlotRef.current = null;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleSlotPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    const slot = slotFromPoint(event.clientX, event.clientY);
    if (slot === null || slot === dragStartSlotRef.current) return;
    dragMovedRef.current = true;
    setRangeAnchor(null);
    applyDragToSlot(slot);
  };

  const endSlotPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    const startSlot = dragStartSlotRef.current;
    const moved = dragMovedRef.current;
    dragPointerIdRef.current = null;
    dragStartSlotRef.current = null;
    dragTargetRef.current = null;
    dragMovedRef.current = false;
    dragLastSlotRef.current = null;

    if (!moved && startSlot !== null) {
      toggleSlot(startSlot);
    }
  };

  const goNext = () => {
    submitResponse();
    onAdvance();
  };

  return (
    <div className="card">
      <div className="join__date-summary">
        <span className="join__date-summary-label text-caption">회의 후보 기간</span>
        <span className="join__date-summary-value text-body-sm">
          {formatMonthDay(rangeDays[0])} ~ {formatMonthDay(rangeDays[rangeDays.length - 1])}
        </span>
      </div>
      <p className="join__title text-title-md">안 되는 시간을 표시해주세요</p>
      <p className="join__hint text-body-sm">{participantName}님, 안 되는 시간만 눌러주세요</p>

      {calendarState !== 'skipped' && (
        <button
          type="button"
          className="join__calendar-import"
          onClick={() => setCalendarSheetOpen(true)}
        >
          <span className="join__calendar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M7 3v4M17 3v4M5 8h14M5 5h14v16H5z" />
            </svg>
          </span>
          <span className="join__calendar-copy">
            <span className="join__calendar-title text-body-sm">캘린더에서 자동 불러오기</span>
          </span>
          <span className="join__calendar-chevron" aria-hidden="true">
            ›
          </span>
        </button>
      )}

      {calendarState === 'imported' && (
        <p className="join__calendar-imported text-caption">
          캘린더 일정이 표시됐어요. 필요한 시간은 직접 수정할 수 있어요
        </p>
      )}

      <div className="join__inline-picker">
        <div className="join__day-tabs" role="tablist" aria-label="후보 날짜">
          {days.map((day) => {
            const hasUnavailable = (intervalsByDay.get(day.key) ?? []).length > 0;
            return (
              <button
                key={day.key}
                type="button"
                role="tab"
                aria-selected={day.key === activeDay.key}
                className={`join__day-tab text-caption${
                  day.key === activeDay.key ? ' join__day-tab--active' : ''
                }${hasUnavailable ? ' join__day-tab--marked' : ''}`}
                onClick={() => {
                  setActiveDayKey(day.key);
                  setRangeAnchor(null);
                }}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        <div className="join__time-grid" aria-label={`${activeDay.label} 시간대`}>
          {slots.map((slot) => {
            const selected = unavailable.includes(slotKey(activeDay.key, slot));
            return (
              <button
                key={slot}
                type="button"
                data-time-slot={slot}
                className={`join__time-cell${selected ? ' join__time-cell--selected' : ''}`}
                aria-label={`${formatClock24Label(slot)} ${selected ? '안 됨' : '가능'}`}
                aria-pressed={selected}
                onPointerDown={(event) => handleSlotPointerDown(event, slot)}
                onPointerMove={handleSlotPointerMove}
                onPointerUp={endSlotPointer}
                onPointerCancel={endSlotPointer}
              >
                <span className="join__time-cell-label text-caption">{formatClock24Label(slot)}</span>
              </button>
            );
          })}
        </div>

        {unavailable.length > 0 && (
          <button
            type="button"
            className="join__reset join__reset--low text-caption"
            onClick={clearUnavailable}
          >
            선택 초기화
          </button>
        )}
      </div>

      <div className="join__actions">
        <button type="button" className="button button--primary" onClick={goNext}>
          제출하기
        </button>
      </div>

      {calendarSheetOpen && (
        <div className="modal-overlay" onClick={() => setCalendarSheetOpen(false)}>
          <div className="modal-sheet join__calendar-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="join__sheet-handle" aria-hidden="true" />
            <p className="join__sheet-title text-title-md">캘린더를 선택해주세요</p>
            <p className="join__sheet-hint text-body-sm">연결된 일정에서 바쁜 시간만 가져와요</p>
            <div className="join__provider-list">
              {CALENDAR_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="join__provider-button"
                  onClick={() => importCalendar(provider.id)}
                  disabled={loadingProvider !== null}
                >
                  <span className={`join__provider-mark join__provider-mark--${provider.id} text-title-sm`}>
                    {loadingProvider === provider.id ? '' : provider.mark}
                  </span>
                  {loadingProvider === provider.id && <span className="join__spinner" aria-hidden="true" />}
                  <span className="join__provider-copy">
                    <span className="join__provider-name text-body-md">{provider.label}</span>
                    <span className="join__provider-hint text-caption">
                      연결된 일정에서 바쁜 시간만 가져와요
                    </span>
                  </span>
                  <span className="join__provider-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="button button--secondary join__calendar-sheet-skip"
              onClick={() => {
                setCalendarState('skipped');
                setCalendarSheetOpen(false);
              }}
              disabled={loadingProvider !== null}
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
