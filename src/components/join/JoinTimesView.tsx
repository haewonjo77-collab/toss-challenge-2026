import { useState } from 'react';
import { TimeGrid } from '../TimeGrid';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import { JOIN_DAY_STAGES, slotsForDuration } from '../../data/schedule';
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
  const { durationMinutes } = useMeeting();
  const { participantName, unavailable, setUnavailable, submitResponse } = useJoin();
  const [stageIndex, setStageIndex] = useState(0);

  const days = JOIN_DAY_STAGES[stageIndex];
  const slots = slotsForDuration(durationMinutes);
  const isLast = stageIndex === JOIN_DAY_STAGES.length - 1;
  const nextDays = isLast ? null : JOIN_DAY_STAGES[stageIndex + 1];

  const goNext = () => {
    if (isLast) {
      submitResponse();
      onAdvance();
      return;
    }
    setStageIndex(stageIndex + 1);
  };

  return (
    <div className="card">
      <div className="join__stage-dots" aria-hidden="true">
        {JOIN_DAY_STAGES.map((_, index) => (
          <span
            key={index}
            className={`join__stage-dot${index === stageIndex ? ' join__stage-dot--active' : ''}`}
          >
            {index === stageIndex ? '●' : '○'}
          </span>
        ))}
      </div>
      <p className="join__step text-caption">
        {stageIndex + 1}/{JOIN_DAY_STAGES.length} 단계 · 이번 주 {TOTAL_DAYS}일 중 {abbreviate(days)}
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
        {stageIndex > 0 && (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setStageIndex(stageIndex - 1)}
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
