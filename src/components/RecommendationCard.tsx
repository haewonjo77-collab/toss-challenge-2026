import { Badge } from './Badge';
import { AttendeeRow } from './AttendeeRow';
import type { Attendee } from '../data/mockAttendees';
import type { RecommendMode } from '../data/recommendation';
import './RecommendationCard.css';

interface RecommendationCardProps {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  variant: 'primary' | 'fallback';
  rankLabel?: string; // "추천" 또는 "대안 N" — 정렬 순위에서 파생, 미리보기로 올라와도 자기 순위 유지
  // headcount = AS-IS(가설 C 비교군): 필수/선택 구분 없이 전체 인원수만 표시
  mode?: RecommendMode;
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
  rankLabel,
  mode = 'priority',
  onConfirm,
  onRequestRecheck,
}: RecommendationCardProps) {
  const requiredAvailable = countAvailable(requiredAttendees);
  const optionalAvailable = countAvailable(optionalAttendees);
  const missingRequiredNames = getMissingNames(requiredAttendees);
  const allAttendees = [...requiredAttendees, ...optionalAttendees];

  return (
    <div className="recommendation-card">
      {rankLabel && <span className="recommendation-card__rank text-caption">{rankLabel}</span>}
      <p className="recommendation-card__time text-title-lg">{timeLabel}</p>

      {mode === 'headcount' ? (
        <>
          <div className="recommendation-card__badges">
            <span className="recommendation-card__headcount text-caption">
              참석 가능 {countAvailable(allAttendees)}/{allAttendees.length}
            </span>
          </div>

          <div className="recommendation-card__section">
            <p className="recommendation-card__section-title text-title-sm">참석자</p>
            {allAttendees.map((attendee) => (
              <AttendeeRow key={attendee.id} name={attendee.name} status={attendee.status} />
            ))}
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

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
