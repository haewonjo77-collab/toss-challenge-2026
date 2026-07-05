import './Avatar.css';

interface AvatarProps {
  name: string;
}

export function Avatar({ name }: AvatarProps) {
  const initial = name.trim().charAt(0);
  return (
    <span className="avatar" aria-hidden="true">
      {initial}
    </span>
  );
}
