import { useState } from 'react';
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
  { id: 'google', label: '구글 캘린더' },
  { id: 'kakao', label: '카카오 캘린더' },
  { id: 'apple', label: '애플 캘린더' },
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

function formatIntervalSummary(intervals: UnavailableInterval[]) {
  if (intervals.length === 0) return '모든 시간 가능';

  return intervals
    .map(
      (interval) =>
        `${formatClock24Label(interval.startMinutes)} - ${formatClock24Label(interval.endMinutes)}`,
    )
    .join(', ');
}

function CalendarProviderLogo({ providerId }: { providerId: string }) {
  if (providerId === 'google') {
    return (
      <svg className="join__provider-logo" viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        <path
          fill="#4285f4"
          d="M29.2 16.3c0-1-.1-1.8-.3-2.6H16v5h7.4a6.3 6.3 0 0 1-2.7 4.1v3.4h4.4c2.6-2.4 4.1-5.9 4.1-9.9Z"
        />
        <path
          fill="#34a853"
          d="M16 29.6c3.7 0 6.8-1.2 9.1-3.4l-4.4-3.4c-1.2.8-2.8 1.3-4.7 1.3-3.6 0-6.6-2.4-7.7-5.6H3.8V22c2.3 4.5 7 7.6 12.2 7.6Z"
        />
        <path
          fill="#fbbc05"
          d="M8.3 18.5a8.2 8.2 0 0 1 0-5.1V9.9H3.8a13.6 13.6 0 0 0 0 12.1l4.5-3.5Z"
        />
        <path
          fill="#ea4335"
          d="M16 7.8c2 0 3.8.7 5.2 2l3.9-3.9C22.8 3.7 19.7 2.4 16 2.4c-5.2 0-9.9 3-12.2 7.5l4.5 3.5c1.1-3.2 4.1-5.6 7.7-5.6Z"
        />
      </svg>
    );
  }

  if (providerId === 'kakao') {
    return (
      <svg className="join__provider-logo" viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#fee500" />
        <path
          fill="#111111"
          d="M16 8.2c-5 0-9 3.2-9 7.1 0 2.5 1.7 4.7 4.2 6l-.7 2.6c-.1.4.3.7.6.5l3.1-2.1c.6.1 1.2.1 1.8.1 5 0 9-3.2 9-7.1s-4-7.1-9-7.1Z"
        />
      </svg>
    );
  }

  return (
    <svg className="join__provider-logo" viewBox="0 0 32 32" focusable="false" aria-hidden="true">
      <path
        fill="#111111"
        d="M21.6 17.1c0-3.1 2.5-4.6 2.6-4.7-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1s-2.4-1.1-4-1.1c-2 0-3.9 1.2-4.9 3-2.1 3.6-.5 9 1.5 11.9 1 1.4 2.2 3 3.7 2.9 1.5-.1 2.1-1 3.9-1s2.3 1 4 1c1.6 0 2.7-1.4 3.7-2.9 1.1-1.6 1.6-3.2 1.6-3.3-.1-.1-3.1-1.3-3.1-4.5ZM18.6 8c.8-1 1.4-2.4 1.2-3.8-1.2 0-2.6.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.7 1.3.1 2.7-.7 3.6-1.7Z"
      />
    </svg>
  );
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

export function JoinTimesView({ onAdvance: _onAdvance }: JoinTimesViewProps) {
  const { title, attendees, responses, settings } = useMeeting();
  const { participantName, unavailable, setUnavailable, clearUnavailable, submitResponse } = useJoin();
  const [calendarState, setCalendarState] = useState<'prompt' | 'imported' | 'skipped'>('prompt');
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [importedProviderLabel, setImportedProviderLabel] = useState<string | null>(null);
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const [rangeAnchor, setRangeAnchor] = useState<{ dayKey: string; slot: number } | null>(null);
  const [sheetDragStartY, setSheetDragStartY] = useState<number | null>(null);
  const [submitSheetOpen, setSubmitSheetOpen] = useState(false);
  const [submitSheetClosing, setSubmitSheetClosing] = useState(false);
  useScreenMeasure('보조 플로우 · 안되는 시간 입력');
  void _onAdvance;

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
  const openDayKey = expandedDayKey ?? days[0]?.key;
  const meetingTitle = title || '디자인팀 회의';
  const visibleAttendees = attendees.slice(0, 6);
  const hiddenAttendeeCount = Math.max(0, attendees.length - visibleAttendees.length);
  // 실시간 응답 현황 — 0명일 땐 부정적 사회적 증거를 피하려 카운트 자체를 숨긴다
  const respondedCount = responses.filter((response) => response.responded).length;

  const importCalendar = (provider: string) => {
    const providerLabel = CALENDAR_PROVIDERS.find((item) => item.id === provider)?.label ?? '캘린더';
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
      setImportedProviderLabel(providerLabel);
      setCalendarSheetOpen(false);
    }, 650);
  };

  const dismissCalendarSheet = () => {
    if (loadingProvider !== null) return;
    setCalendarState('skipped');
    setCalendarSheetOpen(false);
    setSheetDragStartY(null);
  };

  const toggleSlot = (dayKey: string, slot: number) => {
    const key = slotKey(dayKey, slot);
    if (unavailable.includes(key)) {
      setUnavailable(key, false);
      setRangeAnchor(null);
      return;
    }

    if (rangeAnchor?.dayKey === dayKey) {
      const startIndex = slots.indexOf(rangeAnchor.slot);
      const endIndex = slots.indexOf(slot);
      if (startIndex >= 0 && endIndex >= 0) {
        const from = Math.min(startIndex, endIndex);
        const to = Math.max(startIndex, endIndex);
        slots.slice(from, to + 1).forEach((targetSlot) => {
          setUnavailable(slotKey(dayKey, targetSlot), true);
        });
        setRangeAnchor(null);
        return;
      }
    }

    setUnavailable(key, true);
    setRangeAnchor({ dayKey, slot });
  };

  const goNext = () => {
    submitResponse();
    setSubmitSheetClosing(false);
    setSubmitSheetOpen(true);
  };

  const closeSubmitSheet = () => {
    setSubmitSheetClosing(true);
    window.setTimeout(() => {
      setSubmitSheetOpen(false);
      setSubmitSheetClosing(false);
    }, 300);
  };

  return (
    <div className="card">
      <section className="join__meeting-info" aria-label="회의 정보">
        <p className="join__meeting-copy text-body-md">
          <strong>조해원님</strong>이 <strong>&apos;{meetingTitle}&apos;</strong> 시간을 맞추고
          있어요
        </p>
        {respondedCount > 0 && (
          <p className="join__meeting-progress text-caption">
            {attendees.length}명 중 {respondedCount}명 이미 응답했어요
          </p>
        )}
        <div className="join__meeting-roster" aria-label={`참석자 ${attendees.length}명`}>
          {visibleAttendees.length > 0 && (
            <div className="join__meeting-roster-list">
              {visibleAttendees.map((attendee) => (
                <span key={attendee.id} className="join__meeting-attendee text-caption">
                  {attendee.name}
                </span>
              ))}
              {hiddenAttendeeCount > 0 && (
                <span className="join__meeting-attendee text-caption">+{hiddenAttendeeCount}</span>
              )}
            </div>
          )}
        </div>

        <hr className="join__meeting-divider" />

        <div className="join__date-summary">
          <span className="join__date-summary-label text-caption">후보 날짜</span>
          <span className="join__date-summary-value text-body-sm">
            {formatMonthDay(rangeDays[0])} ~ {formatMonthDay(rangeDays[rangeDays.length - 1])}
          </span>
        </div>
      </section>
      <p className="join__title text-title-lg">안 되는 시간을 골라주세요</p>
      <p className="join__hint text-body-md">{participantName}님, 안 되는 시간만 눌러주세요</p>

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
            <span className="join__calendar-title text-body-sm">
              {calendarState === 'imported' && importedProviderLabel
                ? `${importedProviderLabel}에서 불러왔어요 · 다시 불러오기`
                : '캘린더에서 바쁜 시간 불러오기'}
            </span>
          </span>
          <span className="join__calendar-chevron" aria-hidden="true">
            ›
          </span>
        </button>
      )}

      <div className="join__inline-picker">
        <div className="join__day-accordion" aria-label="후보 날짜별 시간대">
          {days.map((day) => {
            const intervals = intervalsByDay.get(day.key) ?? [];
            const expanded = day.key === openDayKey;
            return (
              <div key={day.key} className="join__day-panel">
                <button
                  type="button"
                  className={`join__day-panel-head${expanded ? ' join__day-panel-head--open' : ''}`}
                  aria-expanded={expanded}
                  onClick={() => {
                    setExpandedDayKey(expanded ? null : day.key);
                    setRangeAnchor(null);
                  }}
                >
                  <span className="join__day-panel-label text-body-sm">{day.label}</span>
                  <span className="join__day-panel-summary text-caption">
                    {formatIntervalSummary(intervals)}
                  </span>
                  <span className="join__day-panel-chevron" aria-hidden="true">
                    {expanded ? '⌃' : '⌄'}
                  </span>
                </button>
                {expanded && (
                  <div className="join__time-grid" aria-label={`${day.label} 시간대`}>
                    {slots.map((slot) => {
                      const selected = unavailable.includes(slotKey(day.key, slot));
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`join__time-cell${selected ? ' join__time-cell--selected' : ''}`}
                          aria-label={`${formatClock24Label(slot)} ${selected ? '안 됨' : '가능'}`}
                          aria-pressed={selected}
                          onClick={() => toggleSlot(day.key, slot)}
                        >
                          <span className="join__time-cell-label text-caption">
                            {formatClock24Label(slot)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {unavailable.length > 0 && (
          <button
            type="button"
            className="join__reset join__reset--low text-caption"
            onClick={clearUnavailable}
          >
            모두 지우기
          </button>
        )}
      </div>

      <div className="join__actions">
        <button type="button" className="button button--primary" onClick={goNext}>
          응답 제출하기
        </button>
      </div>

      {calendarSheetOpen && (
        <div className="modal-overlay" onClick={dismissCalendarSheet}>
          <div
            className="modal-sheet join__calendar-sheet"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => setSheetDragStartY(event.clientY)}
            onPointerUp={(event) => {
              if (sheetDragStartY !== null && event.clientY - sheetDragStartY > 48) {
                dismissCalendarSheet();
                return;
              }
              setSheetDragStartY(null);
            }}
            onPointerCancel={() => setSheetDragStartY(null)}
          >
            <div className="join__sheet-handle" aria-hidden="true" />
            <p className="join__sheet-title text-title-md">어떤 캘린더에서 불러올까요?</p>
            <p className="join__sheet-hint text-body-md">바쁜 시간만 자동으로 표시해요</p>
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
                    {loadingProvider === provider.id ? '' : <CalendarProviderLogo providerId={provider.id} />}
                  </span>
                  {loadingProvider === provider.id && <span className="join__spinner" aria-hidden="true" />}
                  <span className="join__provider-copy">
                    <span className="join__provider-name text-body-md">{provider.label}</span>
                  </span>
                  <span className="join__provider-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {submitSheetOpen && (
        <div
          className={`join__submit-overlay${submitSheetClosing ? ' join__submit-overlay--closing' : ''}`}
          role="presentation"
        >
          <div
            className={`join__submit-sheet${submitSheetClosing ? ' join__submit-sheet--closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-submit-title"
          >
            <span className="join__submit-check" aria-hidden="true">
              ✓
            </span>
            <p id="join-submit-title" className="join__submit-title text-title-md">
              응답이 제출됐어요
            </p>
            <p className="join__submit-hint text-body-md">
              모두 응답하면 주최자가 회의 시간을 확정해요
            </p>
            <button
              type="button"
              className="button button--primary join__submit-confirm"
              onClick={closeSubmitSheet}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
