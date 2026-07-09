import { ResponseList } from './ResponseList';
import type { ResponseStatus } from '../data/mockAttendees';
import './WaitingRoom.css';

interface WaitingRoomProps {
  attendees: ResponseStatus[];
  onViewRecommendation: () => void;
  onShareInvite: () => void;
  onNotifyPending?: () => void;
}

export function WaitingRoom({
  attendees,
  onViewRecommendation,
  onShareInvite,
  onNotifyPending,
}: WaitingRoomProps) {
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

      <div className="waiting-room__tools">
        <button type="button" className="button button--secondary" onClick={onShareInvite}>
          <span aria-hidden="true" className="waiting-room__plus">
            +
          </span>
          참석자 추가
        </button>
      </div>

      <ResponseList responses={attendees} />

      {!allResponded && onNotifyPending && (
        <button
          type="button"
          className="button button--secondary waiting-room__nudge"
          onClick={onNotifyPending}
        >
          미응답자에게 알림 보내기
        </button>
      )}

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
