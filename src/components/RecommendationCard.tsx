import { Badge } from './Badge';
import { AttendeeRow } from './AttendeeRow';
import type { Attendee } from '../data/mockAttendees';
import './RecommendationCard.css';

interface RecommendationCardProps {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  variant: 'primary' | 'fallback';
  onConfirm: () => void;
  onRequestRecheck?: () => void;
}

function countAvailable(attendees: Attendee[]): number {
  return attendees.filter((attendee) => attendee.status === 'full').length;
}

function getMissingNames(attendees: Attendee[]): string[] {
  return attendees.filter((attendee) => attendee.status === 'none').map((attendee) => attendee.name);
}

export function RecommendationCard({
  timeLabel,
  requiredAttendees,
  optionalAttendees,
  variant,
  onConfirm,
  onRequestRecheck,
}: RecommendationCardProps) {
  const requiredAvailable = countAvailable(requiredAttendees);
  const optionalAvailable = countAvailable(optionalAttendees);
  const missingRequiredNames = getMissingNames(requiredAttendees);

  return (
    <div className="recommendation-card">
      <p className="recommendation-card__time text-title-lg">{timeLabel}</p>

      <div className="recommendation-card__badges">
        <Badge variant="required" available={requiredAvailable} total={requiredAttendees.length} />
        <Badge variant="optional" available={optionalAvailable} total={optionalAttendees.length} />
      </div>

      <div className="recommendation-card__section">
        <p className="recommendation-card__section-title text-title-sm">필수 참석자</p>
        {requiredAttendees.map((attendee) => (
          <AttendeeRow key={attendee.id} name={attendee.name} status={attendee.status} />
        ))}
      </div>

      <hr className="recommendation-card__divider" />

      <div className="recommendation-card__section">
        <p className="recommendation-card__section-title text-title-sm">선택 참석자</p>
        {optionalAttendees.map((attendee) => (
          <AttendeeRow key={attendee.id} name={attendee.name} status={attendee.status} />
        ))}
      </div>

      {variant === 'fallback' && (
        <p className="recommendation-card__notice text-body-sm">
          {missingRequiredNames.join(', ')}님이 참석하지 못해요
        </p>
      )}

      <div className="recommendation-card__actions">
        {variant === 'fallback' && (
          <button type="button" className="button button--secondary" onClick={onRequestRecheck}>
            재확인 요청
          </button>
        )}
        <button type="button" className="button button--primary" onClick={onConfirm}>
          {variant === 'fallback' ? '이대로 확정' : '이 시간으로 확정하기'}
        </button>
      </div>
    </div>
  );
}
