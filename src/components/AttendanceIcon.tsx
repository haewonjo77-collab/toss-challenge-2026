import type { AttendanceStatus } from '../data/mockAttendees';
import './AttendanceIcon.css';

const ICON_BY_STATUS: Record<AttendanceStatus, string> = {
  full: '●',
  none: '○',
  partial: '▲',
};

const LABEL_BY_STATUS: Record<AttendanceStatus, string> = {
  full: '참석 가능',
  none: '참석 불가',
  partial: '일부 시간만 가능',
};

interface AttendanceIconProps {
  status: AttendanceStatus;
}

export function AttendanceIcon({ status }: AttendanceIconProps) {
  return (
    <span className="attendance-icon" title={LABEL_BY_STATUS[status]} aria-label={LABEL_BY_STATUS[status]}>
      {ICON_BY_STATUS[status]}
    </span>
  );
}
