import type { PointerEvent as ReactPointerEvent } from 'react';
import type { AttendeeRole } from '../data/mockAttendees';
import './RoleToggle.css';

const OPTIONS: { value: AttendeeRole; label: string }[] = [
  { value: 'required', label: '필수' },
  { value: 'optional', label: '선택' },
];

interface RoleToggleProps {
  value: AttendeeRole;
  onChange: (role: AttendeeRole) => void;
  // 드래그로 여러 행에 같은 값을 퍼뜨리기 위한 훅 — 타이밍/임계값 판단은 부모(useLongPressDrag)가 담당
  onOptionPointerDown?: (role: AttendeeRole, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onOptionPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}

export function RoleToggle({ value, onChange, onOptionPointerDown, onOptionPointerMove }: RoleToggleProps) {
  return (
    <div className="role-toggle" role="radiogroup" aria-label="필수/선택 구분">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`role-toggle__option${value === option.value ? ' role-toggle__option--selected' : ''}`}
          onClick={() => onChange(option.value)}
          onPointerDown={(event) => onOptionPointerDown?.(option.value, event)}
          onPointerMove={onOptionPointerMove}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
