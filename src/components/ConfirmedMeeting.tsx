import { Badge } from './Badge';
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

      <div className="confirmed-meeting__badges">
        <Badge
          variant="required"
          available={countAvailable(requiredAttendees)}
          total={requiredAttendees.length}
        />
        <Badge
          variant="optional"
          available={countAvailable(optionalAttendees)}
          total={optionalAttendees.length}
        />
      </div>

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
    </div>
  );
}
