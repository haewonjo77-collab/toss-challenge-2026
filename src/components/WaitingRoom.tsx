import { ResponseList } from './ResponseList';
import type { AttendeeRole, ResponseStatus } from '../data/mockAttendees';
import './WaitingRoom.css';

export interface WaitingAttendee extends ResponseStatus {
  role: AttendeeRole;
}

interface WaitingRoomProps {
  attendees: WaitingAttendee[];
  onChangeRole: (id: string, role: AttendeeRole) => void;
  onAddAttendee: (name: string, team?: string) => void | Promise<void>;
  onViewRecommendation: () => void;
  onNotifyPending?: () => void | Promise<void>;
}

export function WaitingRoom({
  attendees,
  onChangeRole,
  onAddAttendee,
  onViewRecommendation,
  onNotifyPending,
}: WaitingRoomProps) {
  const respondedCount = attendees.filter((attendee) => attendee.responded).length;
  const remainingCount = attendees.length - respondedCount;
  const requiredAttendees = attendees.filter((attendee) => attendee.role === 'required');
  const pendingRequiredCount = requiredAttendees.filter((attendee) => !attendee.responded).length;
  const pendingOptionalCount = attendees.filter(
    (attendee) => attendee.role === 'optional' && !attendee.responded,
  ).length;
  const canViewRecommendation = pendingRequiredCount === 0;

  return (
    <div className="waiting-room">
      <p className="waiting-room__count text-title-lg">
        {attendees.length}명 중 {respondedCount}명이 응답했어요
      </p>
      <p className="waiting-room__hint text-body-md">
        {canViewRecommendation
          ? '필수 참석자가 모두 응답했어요'
          : `필수 참석자 ${pendingRequiredCount}명이 더 응답하면 추천 시간을 볼 수 있어요`}
      </p>
      {canViewRecommendation && pendingOptionalCount > 0 && (
        <p className="waiting-room__optional-note text-caption">
          선택 참석자 {pendingOptionalCount}명은 아직 응답 전이에요
        </p>
      )}

      <ResponseList responses={attendees} onChangeRole={onChangeRole} onAddAttendee={onAddAttendee} />

      {remainingCount > 0 && onNotifyPending && (
        <button
          type="button"
          className="button button--secondary waiting-room__nudge"
          onClick={onNotifyPending}
        >
          미응답자에게 다시 알리기
        </button>
      )}

      <button
        type="button"
        className="button button--primary waiting-room__cta"
        disabled={!canViewRecommendation}
        onClick={onViewRecommendation}
      >
        추천 시간 확인하기
      </button>
    </div>
  );
}
