import { AttendanceIcon } from './AttendanceIcon';
import type { AttendanceStatus } from '../data/mockAttendees';
import './AttendeeRow.css';

interface AttendeeRowProps {
  name: string;
  status: AttendanceStatus;
}

export function AttendeeRow({ name, status }: AttendeeRowProps) {
  return (
    <div className="attendee-row">
      <AttendanceIcon status={status} />
      <span className="attendee-row__name text-body-md">{name}</span>
    </div>
  );
}
