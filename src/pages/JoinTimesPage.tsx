import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { TimeGrid } from '../components/TimeGrid';
import { useMeeting } from '../context/MeetingContext';
import { useJoin } from '../context/JoinContext';
import { JOIN_DAY_STAGES, slotsForDuration } from '../data/schedule';
import './join.css';

function slotKey(day: string, slotStart: number): string {
  return `${day}|${slotStart}`;
}

export function JoinTimesPage() {
  const { durationMinutes } = useMeeting();
  const { participantName, unavailable, toggleUnavailable, submitResponse } = useJoin();
  const navigate = useNavigate();
  const [stageIndex, setStageIndex] = useState(0);

  if (!participantName) return <Navigate to="/join" replace />;

  const days = JOIN_DAY_STAGES[stageIndex];
  const slots = slotsForDuration(durationMinutes);
  const isLast = stageIndex === JOIN_DAY_STAGES.length - 1;

  const goNext = () => {
    if (isLast) {
      submitResponse();
      navigate('/join/done');
      return;
    }
    setStageIndex(stageIndex + 1);
  };

  return (
    <div className="card">
      <p className="join__step text-caption">
        {stageIndex + 1}/{JOIN_DAY_STAGES.length} 단계 · {days.map((day) => day.slice(0, 1)).join('·')}
      </p>
      <p className="join__title text-title-md">안 되는 시간을 표시해주세요</p>
      <p className="join__hint text-body-sm">
        {participantName}님, 되는 시간이 아니라 안 되는 시간만 누르면 돼요
      </p>

      <TimeGrid
        days={days}
        slots={slots}
        isUnavailable={(day, slotStart) => unavailable.includes(slotKey(day, slotStart))}
        onToggle={(day, slotStart) => toggleUnavailable(slotKey(day, slotStart))}
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
          {isLast ? '제출하기' : '다음'}
        </button>
      </div>
    </div>
  );
}
