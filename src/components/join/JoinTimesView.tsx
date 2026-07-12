import { useEffect, useMemo, useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import type { AttendeeRole } from '../../data/mockAttendees';
import { formatClock24Label } from '../../data/time';
import {
  formatMonthDay,
  listRangeDays,
  mondayOfWeek,
  shortDayLabel,
  slotsForDuration,
  toISODate,
} from '../../data/schedule';
import { useScreenMeasure } from '../../utils/measure';
import './join.css';

interface JoinTimesViewProps {
  onAdvance: () => void;
  advanceOnConfirm?: boolean;
  participantRole?: AttendeeRole;
}

const CALENDAR_PROVIDERS = [
  { id: 'google', label: '구글 캘린더' },
  { id: 'kakao', label: '카카오 캘린더' },
  { id: 'apple', label: '애플 캘린더' },
];

type BusyEvent = {
  date: string;
  startMinutes: number;
  endMinutes: number;
  title: string;
};

const PERSONAL_BUSY_EVENTS = [
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

function slotsFromEvents(
  events: BusyEvent[],
  rangeDays: Date[],
  slots: number[],
  durationMinutes: number,
) {
  const rangeDayKeys = new Set(rangeDays.map(toISODate));
  return events.flatMap((event) => {
    if (!rangeDayKeys.has(event.date)) return [];
    return slots
      .filter((slot) => overlaps(slot, durationMinutes, event.startMinutes, event.endMinutes))
      .map((slot) => slotKey(event.date, slot));
    });
}

// 요일마다 돌아가며 적용하는 사내 일정 패턴 — 실제 회사 캘린더처럼 대부분의 날짜에 무언가
// 걸려 있어야, 후보 기간이 길어질 때 "모든 시간 가능"인 빈 날짜가 과도하게 노출되지 않는다.
const DAILY_INTERNAL_PATTERNS: Array<Pick<BusyEvent, 'startMinutes' | 'endMinutes' | 'title'>> = [
  { startMinutes: 9 * 60, endMinutes: 10 * 60, title: '데일리 스탠드업' },
  { startMinutes: 13 * 60, endMinutes: 15 * 60, title: '다른 미팅' },
  { startMinutes: 10 * 60, endMinutes: 11 * 60, title: '집중근무시간' },
  { startMinutes: 16 * 60, endMinutes: 18 * 60, title: '휴가' },
  { startMinutes: 11 * 60, endMinutes: 12 * 60, title: '주간 회의' },
];

function internalBusyEventsForRange(rangeDays: Date[]): BusyEvent[] {
  return rangeDays.map((day, index) => {
    const pattern = DAILY_INTERNAL_PATTERNS[index % DAILY_INTERNAL_PATTERNS.length];
    return { date: toISODate(day), ...pattern };
  });
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

function formatPendingProgress(
  attendees: Array<{ id: string; name: string; role?: AttendeeRole }>,
  responses: Array<{ id: string; responded: boolean }>,
) {
  const responseById = new Map(responses.map((response) => [response.id, response.responded]));
  const pending = attendees.filter((attendee) => responseById.get(attendee.id) !== true);
  if (pending.length === 0) return '모든 참석자가 응답했어요';

  const requiredPending = pending.filter((attendee) => attendee.role === 'required');
  const target = requiredPending[0] ?? pending[0];
  const remainingCount = (requiredPending.length > 0 ? requiredPending.length : pending.length) - 1;
  const suffix = remainingCount > 0 ? ` 외 ${remainingCount}명` : '';
  const prefix = requiredPending.length > 0 ? '필수 참석자 ' : '';
  return `${prefix}${target.name}님${suffix} 응답 대기 중`;
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
        title: PERSONAL_BUSY_EVENTS.find(
          (event) =>
            event.date === interval.dayKey &&
            event.startMinutes === interval.startMinutes &&
            event.endMinutes === interval.endMinutes,
        )?.title,
      }));
    })
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.startMinutes - b.startMinutes);
}

export function JoinTimesView({
  onAdvance,
  advanceOnConfirm = false,
  participantRole,
}: JoinTimesViewProps) {
  const { title, attendees, responses, settings } = useMeeting();
  const { participantName, unavailable, setUnavailable, clearUnavailable, submitResponse } = useJoin();
  const [calendarState, setCalendarState] = useState<'prompt' | 'imported' | 'skipped'>('prompt');
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [importedProviderLabel, setImportedProviderLabel] = useState<string | null>(null);
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [rangeAnchor, setRangeAnchor] = useState<{ dayKey: string; slot: number } | null>(null);
  const [sheetDragStartY, setSheetDragStartY] = useState<number | null>(null);
  const [submitSheetOpen, setSubmitSheetOpen] = useState(false);
  const [submitSheetClosing, setSubmitSheetClosing] = useState(false);
  const [internalCalendarApplied, setInternalCalendarApplied] = useState(false);
  const [revealedInternalDays, setRevealedInternalDays] = useState<string[]>([]);
  useScreenMeasure('보조 플로우 · 안되는 시간 입력');

  // 회의 생성 화면에서 정한 날짜를 한 화면에 표시한다.
  const rangeDays = listRangeDays(
    settings.rangeStart,
    settings.rangeEnd,
    settings.includeWeekends,
    settings.selectedDates,
  );
  const days = rangeDays.map((day) => ({ key: toISODate(day), label: shortDayLabel(day) }));
  // 후보 날짜가 여러 주에 걸치면 한 화면에 다 쌓여 스크롤이 길어지므로, 주(월요일 시작) 단위로
  // 끊어 한 번에 한 주만 노출하고 나머지 주는 주 전환 네비게이션으로 이동한다.
  const weeks = useMemo(() => {
    const byWeek = new Map<string, { key: string; label: string; date: Date }[]>();
    rangeDays.forEach((date) => {
      const weekStart = toISODate(mondayOfWeek(date, 0));
      const list = byWeek.get(weekStart) ?? [];
      list.push({ key: toISODate(date), label: shortDayLabel(date), date });
      byWeek.set(weekStart, list);
    });
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, weekDays]) => ({ weekStart, days: weekDays }));
  }, [rangeDays]);
  const safeWeekIndex = Math.min(currentWeekIndex, Math.max(0, weeks.length - 1));
  const visibleDays = weeks[safeWeekIndex]?.days ?? days.map((day) => ({ ...day, date: new Date() }));
  const slots = slotsForDuration(
    settings.durationMinutes,
    settings.dayStartMinutes,
    settings.dayEndMinutes,
  );
  const internalBusyEvents = internalBusyEventsForRange(rangeDays);
  const internalSlotKeys = new Set(
    slotsFromEvents(internalBusyEvents, rangeDays, slots, settings.durationMinutes),
  );
  // 사내 일정 슬롯이 그리드에서 숨겨져 있어도(revealedInternalDays 밖) 실제로는 이미
  // unavailable 처리돼 있으므로, 요약 텍스트("모든 시간 가능" 등)는 항상 전체 unavailable
  // 기준으로 계산해야 "사내 일정은 이미 반영했어요" 문구와 모순되지 않는다.
  const selectedIntervals = groupIntervals(unavailable, settings.durationMinutes);
  const intervalsByDay = new Map<string, UnavailableInterval[]>();
  selectedIntervals.forEach((interval) => {
    intervalsByDay.set(interval.dayKey, [...(intervalsByDay.get(interval.dayKey) ?? []), interval]);
  });
  // 펼쳐진 날짜가 현재 보이는 주에 속할 때만 유지하고, 아니면 그 주의 첫날을 기본으로 펼친다.
  const openDayKey =
    expandedDayKey && visibleDays.some((day) => day.key === expandedDayKey)
      ? expandedDayKey
      : visibleDays[0]?.key;
  const goToWeek = (nextIndex: number) => {
    setCurrentWeekIndex(Math.min(Math.max(0, nextIndex), weeks.length - 1));
    setExpandedDayKey(null);
    setRangeAnchor(null);
  };
  const meetingTitle = title || '디자인팀 회의';
  const visibleAttendees = attendees.slice(0, 6);
  const hiddenAttendeeCount = Math.max(0, attendees.length - visibleAttendees.length);
  // 실시간 응답 현황 — 0명일 땐 부정적 사회적 증거를 피하려 카운트 자체를 숨긴다
  const respondedCount = responses.filter((response) => response.responded).length;
  const pendingProgressText = formatPendingProgress(attendees, responses);
  const resolvedRole =
    participantRole ??
    attendees.find((attendee) => attendee.name === participantName)?.role ??
    'required';

  useEffect(() => {
    if (internalCalendarApplied || rangeDays.length === 0 || slots.length === 0) return;
    slotsFromEvents(internalBusyEvents, rangeDays, slots, settings.durationMinutes).forEach((key) => {
      setUnavailable(key, true);
    });
    setInternalCalendarApplied(true);
  }, [
    internalBusyEvents,
    internalCalendarApplied,
    rangeDays,
    slots,
    settings.durationMinutes,
    setUnavailable,
  ]);

  const importCalendar = (provider: string) => {
    const providerLabel = CALENDAR_PROVIDERS.find((item) => item.id === provider)?.label ?? '캘린더';
    setLoadingProvider(provider);
    window.setTimeout(() => {
      slotsFromEvents(PERSONAL_BUSY_EVENTS, rangeDays, slots, settings.durationMinutes).forEach(
        (key) => setUnavailable(key, true),
      );
      setLoadingProvider(null);
      setCalendarState('imported');
      setImportedProviderLabel(providerLabel);
      setCalendarSheetOpen(false);
    }, 650);
  };

  const dismissCalendarSheet = () => {
    if (loadingProvider !== null) return;
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
      if (advanceOnConfirm) onAdvance();
    }, 300);
  };

  return (
    <div className="join join--times">
      <section className="join__meeting-info" aria-label="회의 정보">
        <p className="join__meeting-copy text-body-md">
          <strong>조해원님</strong>이 <strong>&apos;{meetingTitle}&apos;</strong> 시간을 맞추고
          있어요
        </p>
        {respondedCount > 0 && (
          <p className="join__meeting-progress text-caption">
            {pendingProgressText}
          </p>
        )}
        <p className="join__meeting-role text-caption">
          {resolvedRole === 'required' ? '필수 참석자로 초대됐어요' : '선택 참석자로 초대됐어요'}
        </p>
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
        <div className="join__calendar-block">
          <p className="join__calendar-note text-caption">사내 일정은 이미 반영했어요</p>
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
                  ? `${importedProviderLabel}까지 반영했어요 · 다시 불러오기`
                  : '다른 캘린더도 불러오기'}
              </span>
            </span>
            <span className="join__calendar-chevron" aria-hidden="true">
              ›
            </span>
          </button>
        </div>
      )}

      <div className="join__inline-picker">
        {weeks.length > 1 && (
          <div className="join__week-nav" role="group" aria-label="주 단위 이동">
            <button
              type="button"
              className="join__week-nav-btn"
              aria-label="이전 주"
              disabled={safeWeekIndex === 0}
              onClick={() => goToWeek(safeWeekIndex - 1)}
            >
              ‹
            </button>
            <span className="join__week-nav-label">
              <span className="join__week-nav-range text-body-sm">
                {formatMonthDay(visibleDays[0].date)} ~ {formatMonthDay(visibleDays[visibleDays.length - 1].date)}
              </span>
              <span className="join__week-nav-count text-caption">
                {weeks.length}주 중 {safeWeekIndex + 1}주차
              </span>
            </span>
            <button
              type="button"
              className="join__week-nav-btn"
              aria-label="다음 주"
              disabled={safeWeekIndex === weeks.length - 1}
              onClick={() => goToWeek(safeWeekIndex + 1)}
            >
              ›
            </button>
          </div>
        )}
        <div className="join__day-accordion" aria-label="후보 날짜별 시간대">
          {visibleDays.map((day) => {
            const intervals = intervalsByDay.get(day.key) ?? [];
            const expanded = day.key === openDayKey;
            const internalSlotsForDay = slots.filter((slot) =>
              internalSlotKeys.has(slotKey(day.key, slot)),
            );
            const visibleSlots = slots.filter((slot) => !internalSlotKeys.has(slotKey(day.key, slot)));
            const isInternalRevealed = revealedInternalDays.includes(day.key);
            const internalIntervalCount = groupIntervals(
              internalSlotsForDay.map((slot) => slotKey(day.key, slot)),
              settings.durationMinutes,
            ).length;
            const renderedSlots = isInternalRevealed ? slots : visibleSlots;
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
                  <>
                    <div className="join__time-grid" aria-label={`${day.label} 시간대`}>
                      {renderedSlots.map((slot) => {
                        const key = slotKey(day.key, slot);
                        const selected = unavailable.includes(key);
                        const isInternalSlot = internalSlotKeys.has(key);
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`join__time-cell${selected ? ' join__time-cell--selected' : ''}${
                              isInternalSlot ? ' join__time-cell--internal' : ''
                            }`}
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
                    {internalIntervalCount > 0 && (
                      <button
                        type="button"
                        className="join__internal-toggle text-caption"
                        onClick={() =>
                          setRevealedInternalDays((prev) =>
                            prev.includes(day.key)
                              ? prev.filter((key) => key !== day.key)
                              : [...prev, day.key],
                          )
                        }
                      >
                        사내 일정 {internalIntervalCount}개 {isInternalRevealed ? '표시 중 · 숨기기' : '숨겨짐 · 보기'}
                      </button>
                    )}
                  </>
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
            <p className="join__sheet-title text-title-md">추가로 불러올 캘린더를 선택해주세요</p>
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
