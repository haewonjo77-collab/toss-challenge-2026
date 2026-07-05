export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
];

export function durationLabel(minutes: number): string {
  const preset = DURATION_OPTIONS.find((option) => option.value === minutes);
  if (preset) return preset.label;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

function formatClock(totalMinutes: number): { period: string; text: string } {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = ((hour + 11) % 12) + 1;
  return { period, text: `${hour12}:${String(minute).padStart(2, '0')}` };
}

export function formatClockLabel(totalMinutes: number): string {
  const clock = formatClock(totalMinutes);
  return `${clock.period} ${clock.text}`;
}

export function formatTimeRange(day: string, startMinutes: number, durationMinutes: number): string {
  const start = formatClock(startMinutes);
  const end = formatClock(startMinutes + durationMinutes);
  const endText = end.period === start.period ? end.text : `${end.period} ${end.text}`;
  return `${day} ${start.period} ${start.text} - ${endText}`;
}
