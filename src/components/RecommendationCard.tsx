import { AttendeeRow } from './AttendeeRow';
import type { Attendee } from '../data/mockAttendees';
import './RecommendationCard.css';

interface RecommendationCardProps {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  variant: 'primary' | 'fallback';
  rankLabel?: string; // "추천" 또는 "대안 N" — 정렬 순위에서 파생, 미리보기로 올라와도 자기 순위 유지
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
  onConfirm,
  onRequestRecheck,
}: RecommendationCardProps) {
  const requiredAvailable = countAvailable(requiredAttendees);
  const optionalAvailable = countAvailable(optionalAttendees);
  const missingRequiredNames = getMissingNames(requiredAttendees);

  return (
    <div className="recommendation-card">
      {rankLabel && <span className="recommendation-card__rank text-caption">{rankLabel}</span>}
      <p className="recommendation-card__time text-title-lg">{timeLabel}</p>

      {/* 읽기 전용 요약 — 화면 ①의 세그먼트 토글과 형태가 겹치지 않도록 pill 없이 일반 텍스트 */}
      <p className="recommendation-card__counts text-caption">
        필수 {requiredAvailable}/{requiredAttendees.length} · 선택 {optionalAvailable}/
        {optionalAttendees.length}
      </p>

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
