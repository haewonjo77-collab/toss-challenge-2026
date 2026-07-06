import { WeekCalendar } from './WeekCalendar';
import './WeekScopeToggle.css';

// 세그먼트 3개: 이번 주(0) / 다음 주(1) / 직접 선택(2 이상 — 아래 주 단위 캘린더로 지정)
const SEGMENTS = [
  { label: '이번 주', isActive: (value: number) => value === 0, select: () => 0 },
  { label: '다음 주', isActive: (value: number) => value === 1, select: () => 1 },
  { label: '직접 선택', isActive: (value: number) => value >= 2, select: () => 2 },
];

interface WeekScopeToggleProps {
  value: number; // weeksAhead
  onChange: (weeksAhead: number) => void;
}

export function WeekScopeToggle({ value, onChange }: WeekScopeToggleProps) {
  return (
    <div className="week-scope">
      <div className="week-scope-toggle" role="radiogroup" aria-label="회의 가능 기간">
        {SEGMENTS.map((segment) => (
          <button
            key={segment.label}
            type="button"
            role="radio"
            aria-checked={segment.isActive(value)}
            className={`week-scope-toggle__option${
              segment.isActive(value) ? ' week-scope-toggle__option--selected' : ''
            }`}
            onClick={() => onChange(segment.select())}
          >
            {segment.label}
          </button>
        ))}
      </div>

      {value >= 2 && <WeekCalendar weeksAhead={value} onSelect={onChange} />}
    </div>
  );
}
