import { Fragment, useRef } from 'react';
import { formatClockLabel } from '../data/time';
import { useLongPressDrag } from '../utils/useLongPressDrag';
import './TimeGrid.css';

interface TimeGridProps {
  days: string[];
  slots: number[];
  isUnavailable: (day: string, slotStart: number) => boolean;
  onSetUnavailable: (day: string, slotStart: number, value: boolean) => void;
}

export function TimeGrid({ days, slots, isUnavailable, onSetUnavailable }: TimeGridProps) {
  const drag = useLongPressDrag();
  // 드래그로 값이 적용된 직후의 click은 무시 — 아니면 클릭 토글이 드래그 결과를 다시 뒤집는다
  const suppressClickRef = useRef(false);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    day: string,
    slotStart: number,
  ) => {
    const target = !isUnavailable(day, slotStart);
    drag.startPress(
      event,
      () => {
        suppressClickRef.current = true;
        onSetUnavailable(day, slotStart, target);
      },
      (moveEvent) => {
        const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement | null;
        const cell = el?.closest('[data-day]') as HTMLElement | null;
        const d = cell?.dataset.day;
        const s = cell?.dataset.slot;
        if (d && s) onSetUnavailable(d, Number(s), target);
      },
    );
  };

  const handleClick = (day: string, slotStart: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSetUnavailable(day, slotStart, !isUnavailable(day, slotStart));
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
                onPointerDown={(event) => handlePointerDown(event, day, slot)}
                onPointerMove={drag.movePress}
                onClick={() => handleClick(day, slot)}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
