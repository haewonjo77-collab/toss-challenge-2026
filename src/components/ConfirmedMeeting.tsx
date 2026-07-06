import { AttendeeRow } from './AttendeeRow';
import type { Attendee } from '../data/mockAttendees';
import './ConfirmedMeeting.css';

interface ConfirmedMeetingProps {
  meetingTitle: string;
  timeLabel: string;
  durationText: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  onShare: () => void;
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
  onShare,
  onNewMeeting,
}: ConfirmedMeetingProps) {
  return (
    <div className="confirmed-meeting">
      <div className="confirmed-meeting__check" aria-hidden="true">
        ✓
      </div>
      <p className="confirmed-meeting__message text-title-md">회의가 확정되었어요</p>
      <p className="confirmed-meeting__time text-title-lg">{timeLabel}</p>
      <p className="confirmed-meeting__summary text-body-sm">
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

      <button type="button" className="button button--secondary confirmed-meeting__cta" onClick={onShare}>
        참석자에게 공유하기
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
