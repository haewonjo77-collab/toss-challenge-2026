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
  // 선택 참석자의 불참은 회의 시간 결정에 영향이 없으므로, 상단 안내는 필수 불참만 다룬다
  const missingRequired = requiredAttendees.filter((attendee) => attendee.status === 'none');

  return (
    <div className="recommendation-card">
      <p className="recommendation-card__time text-title-lg">{timeLabel}</p>

      {/* 읽기 전용 요약 — 화면 ①의 세그먼트 토글과 형태가 겹치지 않도록 pill 없이 일반 텍스트 */}
      <p className="recommendation-card__counts text-caption">
        필수 {requiredAvailable}/{requiredAttendees.length} · 선택 {optionalAvailable}/
        {optionalAttendees.length}
      </p>

      {/* 탭 전환 중에도 항상 보이도록 참석자 목록 위에 배치 — 필수 불참만 표시 (선택 불참은 시간 결정에 영향 X) */}
      {missingRequired.length === 0 ? (
        <p className="recommendation-card__notice recommendation-card__notice--calm text-body-sm">
          필수 참석자 전원 참석 가능해요
        </p>
      ) : (
        <p className="recommendation-card__notice text-body-sm">
          {missingRequired.map((attendee) => `${attendee.name}님(필수)`).join(', ')}이 참석하지 못해요
        </p>
      )}

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
