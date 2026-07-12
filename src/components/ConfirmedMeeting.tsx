import { AttendeeRow } from './AttendeeRow';
import type { Attendee } from '../data/mockAttendees';
import './ConfirmedMeeting.css';

interface ConfirmedMeetingProps {
  meetingTitle: string;
  timeLabel: string;
  durationText: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  showConfirmationNotice?: boolean;
  onNotifyAgain: () => void;
  onNewMeeting: () => void;
}

function countAvailable(attendees: Attendee[]): number {
  return attendees.filter((attendee) => attendee.status === 'full').length;
}

export function ConfirmedMeeting({
  meetingTitle,
  timeLabel,
  durationText,
  requiredAttendees,
  optionalAttendees,
  showConfirmationNotice = false,
  onNotifyAgain,
  onNewMeeting,
}: ConfirmedMeetingProps) {
  return (
    <div className="confirmed-meeting">
      {showConfirmationNotice && (
        <div className="confirmed-meeting__alert" role="status">
          <span className="confirmed-meeting__alert-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>
          <span className="confirmed-meeting__alert-copy">
            <span className="confirmed-meeting__alert-title text-body-md">
              회의 시간이 확정됐어요
            </span>
            <span className="confirmed-meeting__alert-message text-caption">
              참석자에게 확정 알림을 보냈어요
            </span>
          </span>
        </div>
      )}
      <div className="confirmed-meeting__check" aria-hidden="true">
        ✓
      </div>
      <p className="confirmed-meeting__message text-title-lg">회의 시간이 확정됐어요</p>
      <p className="confirmed-meeting__time text-title-md">{timeLabel}</p>
      <p className="confirmed-meeting__summary text-body-md">
        {meetingTitle} · {durationText}
      </p>

      {/* 읽기 전용 요약 — 화면 ①의 세그먼트 토글과 형태가 겹치지 않도록 pill 없이 일반 텍스트 */}
      <p className="confirmed-meeting__counts text-caption">
        필수 {countAvailable(requiredAttendees)}/{requiredAttendees.length} · 선택{' '}
        {countAvailable(optionalAttendees)}/{optionalAttendees.length}
      </p>

      <div className="confirmed-meeting__section">
        <p className="confirmed-meeting__section-title text-title-sm">필수 참석자</p>
        {requiredAttendees.map((attendee) => (
          <AttendeeRow key={attendee.id} name={attendee.name} status={attendee.status} />
        ))}
      </div>

      <hr className="confirmed-meeting__divider" />

      <div className="confirmed-meeting__section">
        <p className="confirmed-meeting__section-title text-title-sm">선택 참석자</p>
        {optionalAttendees.map((attendee) => (
          <AttendeeRow key={attendee.id} name={attendee.name} status={attendee.status} />
        ))}
      </div>

      <button type="button" className="button button--secondary confirmed-meeting__cta" onClick={onNotifyAgain}>
        확정 알림 재요청
      </button>
      {/* accent는 상단 확정 체크 마커 1군데 유지 — 새 플로우 진입 버튼도 secondary */}
      <button
        type="button"
        className="button button--secondary confirmed-meeting__new"
        onClick={onNewMeeting}
      >
        새 회의 만들기
      </button>
    </div>
  );
}
