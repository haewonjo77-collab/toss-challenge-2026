import './Badge.css';

interface BadgeProps {
  variant: 'required' | 'optional';
  available: number;
  total: number;
}

const LABEL_BY_VARIANT: Record<BadgeProps['variant'], string> = {
  required: '필수',
  optional: '선택',
};

export function Badge({ variant, available, total }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>
      {LABEL_BY_VARIANT[variant]} {available}/{total}
    </span>
  );
}
