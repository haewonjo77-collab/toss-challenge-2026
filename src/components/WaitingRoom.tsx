import { Avatar } from './Avatar';
import type { ResponseStatus } from '../data/mockAttendees';
import './WaitingRoom.css';

interface WaitingRoomProps {
  attendees: ResponseStatus[];
  onViewRecommendation: () => void;
}

export function WaitingRoom({ attendees, onViewRecommendation }: WaitingRoomProps) {
  const respondedCount = attendees.filter((attendee) => attendee.responded).length;
  const remainingCount = attendees.length - respondedCount;
  const allResponded = remainingCount === 0;

  return (
    <div className="waiting-room">
      <p className="waiting-room__count text-title-lg">
        {attendees.length}명 중 {respondedCount}명 응답완료
      </p>
      <p className="waiting-room__hint text-body-sm">
        {allResponded
          ? '모든 참석자가 응답했어요'
          : `${remainingCount}명이 응답하면 추천 시간을 볼 수 있어요`}
      </p>

      <div className="waiting-room__list">
        {attendees.map((attendee) => (
          <div key={attendee.id} className="waiting-room__row">
            <Avatar name={attendee.name} />
            <span className="waiting-room__name text-body-md">{attendee.name}</span>
            <span
              className={`waiting-room__status text-caption${
                attendee.responded ? '' : ' waiting-room__status--pending'
              }`}
            >
              {attendee.responded ? '응답완료' : '대기중'}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="button button--primary waiting-room__cta"
        disabled={!allResponded}
        onClick={onViewRecommendation}
      >
        추천 시간 보기
      </button>
    </div>
  );
}
