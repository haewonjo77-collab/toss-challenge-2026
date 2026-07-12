import { useState } from 'react';
import { AttendanceIcon } from './AttendanceIcon';
import { Badge } from './Badge';
import type { Attendee } from '../data/mockAttendees';
import './RecommendationCard.css';

interface RecommendationCardProps {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  variant: 'primary' | 'fallback';
  onConfirm: () => void;
}

function availabilitySummary(attendees: Attendee[]): string {
  const full = attendees.filter((attendee) => attendee.status === 'full').length;
  const partial = attendees.filter((attendee) => attendee.status === 'partial').length;
  const none = attendees.filter((attendee) => attendee.status === 'none').length;
  const details = [`${full} 가능`];
  if (partial > 0) details.push(`${partial} 일부`);
  if (none > 0) details.push(`${none} 불가`);
  return details.join(' · ');
}

function roleText(role: 'required' | 'optional'): string {
  return role === 'required' ? '필수' : '선택';
}

function statusText(status: Attendee['status']): string {
  if (status === 'full') return '가능';
  if (status === 'partial') return '일부 가능';
  return '불가';
}

function shouldShowStatusBadge(status: Attendee['status']): boolean {
  return status === 'partial';
}

function AttendeeList({
  attendees,
  role,
}: {
  attendees: Attendee[];
  role: 'required' | 'optional';
}) {
  return (
    <div className={`recommendation-card__list recommendation-card__list--${role}`}>
      {attendees.map((attendee) => {
        const unavailableRequired = role === 'required' && attendee.status === 'none';
        const statusClass =
          attendee.status !== 'full' ? ` recommendation-card__avatar-item--${attendee.status}` : '';
        return (
          <div
            key={attendee.id}
            className={`recommendation-card__avatar-item${
              unavailableRequired ? ' recommendation-card__avatar-item--danger' : ''
            }${statusClass}`}
            aria-label={`${attendee.name} ${roleText(role)} ${statusText(attendee.status)}`}
          >
            <AttendanceIcon status={attendee.status} />
            <span className="recommendation-card__avatar-copy">
              <span className="recommendation-card__avatar-name text-body-md">{attendee.name}</span>
              {attendee.team && (
                <span className="recommendation-card__avatar-team text-caption">
                  {attendee.team}
                </span>
              )}
            </span>
            {shouldShowStatusBadge(attendee.status) && (
              <span
                className={`recommendation-card__avatar-status recommendation-card__avatar-status--${attendee.status} text-caption`}
              >
                {statusText(attendee.status)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RecommendationCard({
  timeLabel,
  requiredAttendees,
  optionalAttendees,
  variant,
  onConfirm,
}: RecommendationCardProps) {
  const [optionalExpanded, setOptionalExpanded] = useState(false);
  // 선택 참석자의 불참은 회의 시간 결정에 영향이 없으므로, 상단 안내는 필수 불참만 다룬다
  const missingRequired = requiredAttendees.filter((attendee) => attendee.status === 'none');
  const optionalAvailableCount = optionalAttendees.filter(
    (attendee) => attendee.status === 'full',
  ).length;

  return (
    <div className="recommendation-card">
      <p className="recommendation-card__time text-title-lg">{timeLabel}</p>

      {/* 탭 전환 중에도 항상 보이도록 참석자 목록 위에 배치 — 필수 불참만 표시 (선택 불참은 시간 결정에 영향 X) */}
      {missingRequired.length === 0 ? (
        <p className="recommendation-card__notice recommendation-card__notice--calm text-body-md">
          필수 참석자 모두 가능한 시간이에요
        </p>
      ) : (
        <p className="recommendation-card__notice recommendation-card__notice--strong text-body-md">
          {missingRequired.map((attendee) => `${attendee.name}님`).join(', ')}은 이 시간이 어려워요
        </p>
      )}

      <div className="recommendation-card__section">
        <div className="recommendation-card__section-head">
          <Badge variant="required" />
          <span className="recommendation-card__section-count text-caption">
            {availabilitySummary(requiredAttendees)}
          </span>
        </div>
        <AttendeeList attendees={requiredAttendees} role="required" />
      </div>

      <hr className="recommendation-card__divider" />

      <div className="recommendation-card__section">
        <button
          type="button"
          className="recommendation-card__section-head recommendation-card__section-toggle"
          aria-expanded={optionalExpanded}
          onClick={() => setOptionalExpanded((expanded) => !expanded)}
        >
          <Badge variant="optional" />
          <span className="recommendation-card__section-count text-caption">
            {optionalExpanded
              ? availabilitySummary(optionalAttendees)
              : `선택 ${optionalAvailableCount}가능 · 보기`}
          </span>
        </button>
        {optionalExpanded && <AttendeeList attendees={optionalAttendees} role="optional" />}
      </div>

      <div className="recommendation-card__actions">
        <button type="button" className="button button--primary" onClick={onConfirm}>
          이 시간으로 확정하기
        </button>
      </div>
    </div>
  );
}
