import { Fragment, useEffect, useRef } from 'react';
import { formatClockLabel } from '../data/time';
import './TimeGrid.css';

interface TimeGridProps {
  days: string[];
  slots: number[];
  isUnavailable: (day: string, slotStart: number) => boolean;
  onSetUnavailable: (day: string, slotStart: number, value: boolean) => void;
}

export function TimeGrid({ days, slots, isUnavailable, onSetUnavailable }: TimeGridProps) {
  const draggingRef = useRef(false);
  const dragValueRef = useRef(false);

  useEffect(() => {
    const stopDrag = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    };
  }, []);

  const startDrag = (day: string, slotStart: number) => {
    const target = !isUnavailable(day, slotStart);
    draggingRef.current = true;
    dragValueRef.current = target;
    onSetUnavailable(day, slotStart, target);
  };

  const dragOver = (day: string, slotStart: number) => {
    if (!draggingRef.current) return;
    onSetUnavailable(day, slotStart, dragValueRef.current);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    const touch = event.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const day = target?.dataset.day;
    const slot = target?.dataset.slot;
    if (day && slot) onSetUnavailable(day, Number(slot), dragValueRef.current);
  };

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
                data-day={day}
                data-slot={slot}
                className={`time-grid__cell${unavailable ? ' time-grid__cell--unavailable' : ''}`}
                aria-pressed={unavailable}
                aria-label={`${day} ${formatClockLabel(slot)} ${unavailable ? '안 됨' : '가능'}`}
                onMouseDown={() => startDrag(day, slot)}
                onMouseEnter={() => dragOver(day, slot)}
                onTouchStart={() => startDrag(day, slot)}
                onTouchMove={handleTouchMove}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
