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
  onRegisterHostTime?: () => void;
  onNotifyPending?: () => void | Promise<void>;
  hideRosterEditing?: boolean;
}

export function WaitingRoom({
  attendees,
  onChangeRole,
  onAddAttendee,
  onViewRecommendation,
  onRegisterHostTime,
  onNotifyPending,
  hideRosterEditing = false,
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
      <div className="waiting-room__summary">
        {canViewRecommendation ? (
          <p className="waiting-room__summary-row waiting-room__summary-row--done text-body-md">
            필수 참석자가 모두 응답했어요
          </p>
        ) : (
          <p className="waiting-room__summary-row waiting-room__summary-row--pending text-body-md">
            필수 참석자 {pendingRequiredCount}명이 더 응답하면 추천 시간을 볼 수 있어요
          </p>
        )}
        {canViewRecommendation && pendingOptionalCount > 0 && (
          <p className="waiting-room__summary-row waiting-room__summary-row--pending text-body-md">
            선택 참석자 {pendingOptionalCount}명은 아직 응답 전이에요
          </p>
        )}
      </div>

      <ResponseList
        responses={attendees}
        onChangeRole={hideRosterEditing ? undefined : onChangeRole}
        onAddAttendee={hideRosterEditing ? undefined : onAddAttendee}
      />

      {onRegisterHostTime && (
        <button
          type="button"
          className="button button--secondary waiting-room__host-time"
          onClick={onRegisterHostTime}
        >
          <span className="waiting-room__host-time-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M7 3v4M17 3v4M5 8h14M5 5h14v16H5z" />
            </svg>
          </span>
          내 일정 등록하기
        </button>
      )}

      {remainingCount > 0 && onNotifyPending && (
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
        disabled={!canViewRecommendation}
        onClick={onViewRecommendation}
      >
        추천 시간 확인하기
      </button>
    </div>
  );
}
