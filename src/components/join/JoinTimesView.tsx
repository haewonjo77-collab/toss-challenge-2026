import { useState } from 'react';
import { TimeGrid } from '../TimeGrid';
import type { TimeGridDay } from '../TimeGrid';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import {
  chunkDays,
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
  { id: 'google', label: 'Google', mark: 'G' },
  { id: 'notion', label: 'Notion', mark: 'N' },
  { id: 'apple', label: 'Apple', mark: 'A' },
];

function slotKey(dayKey: string, slotStart: number): string {
  return `${dayKey}|${slotStart}`;
}

// "화 14" → "화" — 단계 안내·다음 버튼의 요일 축약 표기
function abbreviate(days: TimeGridDay[]): string {
  return days.map((day) => day.label.charAt(0)).join('·');
}

export function JoinTimesView({ onAdvance }: JoinTimesViewProps) {
  const { settings } = useMeeting();
  const { participantName, unavailable, setUnavailable, submitResponse } = useJoin();
  const [stageIndex, setStageIndex] = useState(0);
  const [calendarState, setCalendarState] = useState<'prompt' | 'imported' | 'skipped'>('prompt');
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  useScreenMeasure('보조 플로우 · 안되는 시간 입력');

  // 화면 ①에서 정한 기간·주말 여부에서 날짜를 파생, 3일씩 단계적 노출 (SPEC 가설 B)
  const rangeDays = listRangeDays(
    settings.rangeStart,
    settings.rangeEnd,
    settings.includeWeekends,
    settings.selectedDates,
  );
  const stages = chunkDays(
    rangeDays.map((day) => ({ key: toISODate(day), label: shortDayLabel(day) })),
    3,
  );
  const safeStageIndex = Math.min(stageIndex, stages.length - 1);
  const days = stages[safeStageIndex];
  const slots = slotsForDuration(
    settings.durationMinutes,
    settings.dayStartMinutes,
    settings.dayEndMinutes,
  );
  const isLast = safeStageIndex === stages.length - 1;
  const nextDays = isLast ? null : stages[safeStageIndex + 1];
  const totalSlotCount = rangeDays.length * slots.length;
  const availabilityCountText =
    unavailable.length === 0
      ? '모든 시간이 가능해요'
      : unavailable.length >= totalSlotCount
        ? '모든 시간이 안 돼요'
        : `안 되는 시간 ${unavailable.length}개 표시됨`;

  const importCalendar = (provider: string) => {
    setLoadingProvider(provider);
    window.setTimeout(() => {
      const mockSlots = [
        days[0] && slots[1] !== undefined ? slotKey(days[0].key, slots[1]) : null,
        days[1] && slots[3] !== undefined ? slotKey(days[1].key, slots[3]) : null,
        days[2] && slots[5] !== undefined ? slotKey(days[2].key, slots[5]) : null,
      ].filter((key): key is string => Boolean(key));
      mockSlots.forEach((key) => setUnavailable(key, true));
      setLoadingProvider(null);
      setCalendarState('imported');
    }, 650);
  };

  const goNext = () => {
    if (isLast) {
      submitResponse();
      onAdvance();
      return;
    }
    setStageIndex(safeStageIndex + 1);
  };

  return (
    <div className="card">
      {stages.length > 1 && (
        <div className="join__stage-dots" aria-hidden="true">
          {stages.map((_, index) => (
            <span
              key={index}
              className={`join__stage-dot${index === safeStageIndex ? ' join__stage-dot--active' : ''}`}
            >
              {index === safeStageIndex ? '●' : '○'}
            </span>
          ))}
        </div>
      )}
      <p className="join__step text-caption">
        {stages.length > 1 ? `${safeStageIndex + 1}/${stages.length} 단계 · ` : ''}
        {formatMonthDay(rangeDays[0])} ~ {formatMonthDay(rangeDays[rangeDays.length - 1])}{' '}
        {rangeDays.length}일 중 {abbreviate(days)}
      </p>
      <p className="join__title text-title-md">안 되는 시간을 표시해주세요</p>
      <p className="join__hint text-body-sm">{participantName}님, 안 되는 시간만 눌러주세요</p>

      {calendarState === 'prompt' && (
        <div className="join__calendar-import">
          <p className="join__calendar-title text-body-sm">캘린더에서 안되는 일정을 자동으로 불러올까요?</p>
          <div className="join__calendar-actions">
            {CALENDAR_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                className="join__calendar-button"
                aria-label={`${provider.label} 캘린더 불러오기`}
                onClick={() => importCalendar(provider.id)}
                disabled={loadingProvider !== null}
              >
                <span className="join__calendar-mark text-caption">
                  {loadingProvider === provider.id ? '' : provider.mark}
                </span>
                {loadingProvider === provider.id && <span className="join__spinner" aria-hidden="true" />}
              </button>
            ))}
            <button
              type="button"
              className="join__calendar-skip text-caption"
              onClick={() => setCalendarState('skipped')}
              disabled={loadingProvider !== null}
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}

      {calendarState === 'imported' && (
        <p className="join__calendar-imported text-caption">
          캘린더 일정이 표시됐어요. 필요한 시간은 직접 수정할 수 있어요
        </p>
      )}

      <TimeGrid
        days={days}
        slots={slots}
        isUnavailable={(dayKey, slotStart) => unavailable.includes(slotKey(dayKey, slotStart))}
        onSetUnavailable={(dayKey, slotStart, value) => setUnavailable(slotKey(dayKey, slotStart), value)}
      />

      <p className="join__count text-caption">{availabilityCountText}</p>

      <div className="join__actions">
        {safeStageIndex > 0 && (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setStageIndex(safeStageIndex - 1)}
          >
            이전
          </button>
        )}
        <button type="button" className="button button--primary" onClick={goNext}>
          {isLast ? '제출하기' : `다음 (${abbreviate(nextDays!)})`}
        </button>
      </div>
    </div>
  );
}
