import { useState } from 'react';
import type { Attendee } from '../data/mockAttendees';
import type { Recommendation, RecommendMode } from '../data/recommendation';
import './AlternativeTimes.css';

export interface AlternativeOption extends Recommendation {
  rankLabel: string; // 정렬 순위에서 파생 ("대안 1", "대안 2", …)
}

interface AlternativeTimesProps {
  options: AlternativeOption[];
  // 확정이 아니라 이 카드를 최상단 자리로 올려 세부 내역을 먼저 보여주기 위한 콜백
  onPreview: (option: AlternativeOption) => void;
  // headcount = AS-IS(가설 C 비교군): 필수/선택 카운트 대신 전체 인원수만
  mode?: RecommendMode;
}

function countFull(attendees: Attendee[]): number {
  return attendees.filter((attendee) => attendee.status === 'full').length;
}

export function AlternativeTimes({ options, onPreview, mode = 'priority' }: AlternativeTimesProps) {
  const [open, setOpen] = useState(false);

  if (options.length === 0) return null;

  return (
    <div className="alternative-times">
      <button
        type="button"
        className="button button--secondary alternative-times__toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? '다른 시간 접기' : `다른 시간 보기 (${options.length})`}
      </button>

      {open &&
        options.map((option) => (
          <button
            key={option.timeLabel}
            type="button"
            className="alternative-times__option"
            onClick={() => onPreview(option)}
          >
            <span className="alternative-times__rank text-caption">{option.rankLabel}</span>
            <span className="alternative-times__time text-title-sm">{option.timeLabel}</span>
            <span className="alternative-times__counts text-caption">
              {mode === 'headcount'
                ? `참석 가능 ${countFull([...option.requiredAttendees, ...option.optionalAttendees])}/${
                    option.requiredAttendees.length + option.optionalAttendees.length
                  }`
                : `필수 ${countFull(option.requiredAttendees)}/${option.requiredAttendees.length} · 선택 ${countFull(option.optionalAttendees)}/${option.optionalAttendees.length}`}
            </span>
          </button>
        ))}
    </div>
  );
}
