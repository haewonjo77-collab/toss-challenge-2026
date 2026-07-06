import { useState } from 'react';
import { TimeGrid } from '../TimeGrid';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import { useVariant } from '../../context/VariantContext';
import { JOIN_DAY_STAGES, WEEK_SCOPE_LABEL, slotsForDuration } from '../../data/schedule';
import { useScreenMeasure } from '../../utils/measure';
import './join.css';

interface JoinTimesViewProps {
  onAdvance: () => void;
}

function slotKey(day: string, slotStart: number): string {
  return `${day}|${slotStart}`;
}

function abbreviate(days: string[]): string {
  return days.map((day) => day.slice(0, 1)).join('·');
}

const TOTAL_DAYS = JOIN_DAY_STAGES.reduce((sum, stage) => sum + stage.length, 0);

export function JoinTimesView({ onAdvance }: JoinTimesViewProps) {
  const { durationMinutes, weekScope } = useMeeting();
  const { participantName, unavailable, setUnavailable, submitResponse } = useJoin();
  const { variant } = useVariant();
  const [stageIndex, setStageIndex] = useState(0);
  useScreenMeasure('보조 플로우 · 안되는 시간 입력');

  // AS-IS(가설 B 비교군): 5일 전체를 한 그리드에 노출 — 단계적 노출 없는 기존 도구 재현
  const stages = variant === 'as-is' ? [JOIN_DAY_STAGES.flat()] : JOIN_DAY_STAGES;
  const safeStageIndex = Math.min(stageIndex, stages.length - 1);
  const days = stages[safeStageIndex];
  const slots = slotsForDuration(durationMinutes);
  const isLast = safeStageIndex === stages.length - 1;
  const nextDays = isLast ? null : stages[safeStageIndex + 1];
  const staged = stages.length > 1;

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
      {staged && (
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
        {staged
          ? `${safeStageIndex + 1}/${stages.length} 단계 · ${WEEK_SCOPE_LABEL[weekScope]} ${TOTAL_DAYS}일 중 ${abbreviate(days)}`
          : `${WEEK_SCOPE_LABEL[weekScope]} ${TOTAL_DAYS}일 전체`}
      </p>
      <p className="join__title text-title-md">안 되는 시간을 표시해주세요</p>
      <p className="join__hint text-body-sm">
        {participantName}님, 되는 시간이 아니라 안 되는 시간만 누르면 돼요 (드래그로 여러 칸 한번에 선택 가능)
      </p>

      <TimeGrid
        days={days}
        slots={slots}
        isUnavailable={(day, slotStart) => unavailable.includes(slotKey(day, slotStart))}
        onSetUnavailable={(day, slotStart, value) => setUnavailable(slotKey(day, slotStart), value)}
      />

      <p className="join__count text-caption">안 되는 시간 {unavailable.length}개 표시됨</p>

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
