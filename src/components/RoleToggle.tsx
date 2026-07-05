import type { AttendeeRole } from '../data/mockAttendees';
import './RoleToggle.css';

const OPTIONS: { value: AttendeeRole; label: string }[] = [
  { value: 'required', label: '필수' },
  { value: 'optional', label: '선택' },
];

interface RoleToggleProps {
  value: AttendeeRole;
  onChange: (role: AttendeeRole) => void;
}

export function RoleToggle({ value, onChange }: RoleToggleProps) {
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
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
