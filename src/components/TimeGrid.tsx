import { Fragment } from 'react';
import { formatClockLabel } from '../data/time';
import './TimeGrid.css';

interface TimeGridProps {
  days: string[];
  slots: number[];
  isUnavailable: (day: string, slotStart: number) => boolean;
  onToggle: (day: string, slotStart: number) => void;
}

export function TimeGrid({ days, slots, isUnavailable, onToggle }: TimeGridProps) {
  return (
    <div className="time-grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, 1fr)` }}>
      <span className="time-grid__corner" />
      {days.map((day) => (
        <span key={day} className="time-grid__day text-caption">
          {day.slice(0, 1)}
        </span>
      ))}
      {slots.map((slot) => (
        <Fragment key={slot}>
          <span className="time-grid__time text-caption">{formatClockLabel(slot)}</span>
          {days.map((day) => {
            const unavailable = isUnavailable(day, slot);
            return (
              <button
                key={day}
                type="button"
                className={`time-grid__cell${unavailable ? ' time-grid__cell--unavailable' : ''}`}
                aria-pressed={unavailable}
                aria-label={`${day} ${formatClockLabel(slot)} ${unavailable ? '안 됨' : '가능'}`}
                onClick={() => onToggle(day, slot)}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
