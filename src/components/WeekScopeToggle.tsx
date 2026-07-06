import type { WeekScope } from '../data/schedule';
import { WEEK_SCOPE_LABEL } from '../data/schedule';
import './WeekScopeToggle.css';

const OPTIONS: WeekScope[] = ['this', 'next'];

interface WeekScopeToggleProps {
  value: WeekScope;
  onChange: (scope: WeekScope) => void;
}

export function WeekScopeToggle({ value, onChange }: WeekScopeToggleProps) {
  return (
    <div className="week-scope-toggle" role="radiogroup" aria-label="회의 가능 기간">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={`week-scope-toggle__option${value === option ? ' week-scope-toggle__option--selected' : ''}`}
          onClick={() => onChange(option)}
        >
          {WEEK_SCOPE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
