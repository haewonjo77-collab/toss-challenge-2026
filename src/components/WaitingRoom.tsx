import { ResponseList } from './ResponseList';
import type { ResponseStatus } from '../data/mockAttendees';
import './WaitingRoom.css';

interface WaitingRoomProps {
  attendees: ResponseStatus[];
  onViewRecommendation: () => void;
  // AS-IS(가설 A 비교군): 응답 현황을 서로 공개하지 않음 — 게이팅은 유지하되 진행 정보만 숨긴다
  revealResponses?: boolean;
}

export function WaitingRoom({ attendees, onViewRecommendation, revealResponses = true }: WaitingRoomProps) {
  const respondedCount = attendees.filter((attendee) => attendee.responded).length;
  const remainingCount = attendees.length - respondedCount;
  const allResponded = remainingCount === 0;

  const headline = revealResponses
    ? `${attendees.length}명 중 ${respondedCount}명 응답완료`
    : allResponded
      ? '응답이 모두 끝났어요'
      : '응답 진행 중...';
  const hint = revealResponses
    ? allResponded
      ? '모든 참석자가 응답했어요'
      : `${remainingCount}명이 응답하면 추천 시간을 볼 수 있어요`
    : '모든 참석자가 응답하면 추천 시간을 볼 수 있어요';

  return (
    <div className="waiting-room">
      <p className="waiting-room__count text-title-lg">{headline}</p>
      <p className="waiting-room__hint text-body-sm">{hint}</p>

      <ResponseList responses={attendees} showStatus={revealResponses} />

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
