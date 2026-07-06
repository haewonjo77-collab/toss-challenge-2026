import type { AttendeeRole } from '../data/mockAttendees';
import './RoleToggle.css';

const OPTIONS: { value: AttendeeRole; label: string }[] = [
  { value: 'required', label: '필수' },
  { value: 'optional', label: '선택' },
];

interface RoleToggleProps {
  value: AttendeeRole;
  onChange: (role: AttendeeRole) => void;
  // 드래그로 여러 행에 같은 값을 퍼뜨리기 위한 훅 — 누른 세그먼트의 값이 드래그 목표값
  onBeginDrag?: (role: AttendeeRole) => void;
  onDragMove?: (clientX: number, clientY: number) => void;
}

export function RoleToggle({ value, onChange, onBeginDrag, onDragMove }: RoleToggleProps) {
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
          onMouseDown={() => onBeginDrag?.(option.value)}
          onTouchStart={() => onBeginDrag?.(option.value)}
          onTouchMove={(event) => {
            const touch = event.touches[0];
            onDragMove?.(touch.clientX, touch.clientY);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
