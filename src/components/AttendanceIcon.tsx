import type { AttendanceStatus } from '../data/mockAttendees';
import './AttendanceIcon.css';

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
    <span
      className={`attendance-icon attendance-icon--${status}`}
      title={LABEL_BY_STATUS[status]}
      aria-label={LABEL_BY_STATUS[status]}
    >
      <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        <circle className="attendance-icon__circle" cx="16" cy="16" r="12" />
        {status === 'full' && <path className="attendance-icon__mark" d="M9.5 16.5 14 21l8.5-10" />}
        {status === 'none' && (
          <>
            <path className="attendance-icon__mark" d="m11 11 10 10" />
            <path className="attendance-icon__mark" d="m21 11-10 10" />
          </>
        )}
        {status === 'partial' && (
          <path className="attendance-icon__pie" d="M16 16V5a11 11 0 0 1 11 11Z" />
        )}
      </svg>
    </span>
  );
}
