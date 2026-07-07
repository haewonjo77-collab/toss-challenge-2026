import { Fragment, useRef } from 'react';
import { formatClockLabel } from '../data/time';
import { useLongPressDrag } from '../utils/useLongPressDrag';
import './TimeGrid.css';

export interface TimeGridDay {
  key: string; // 'YYYY-MM-DD' — 슬롯 키의 날짜 부분
  label: string; // 헤더 표기 "화 14"
}

interface TimeGridProps {
  days: TimeGridDay[];
  slots: number[];
  isUnavailable: (dayKey: string, slotStart: number) => boolean;
  onSetUnavailable: (dayKey: string, slotStart: number, value: boolean) => void;
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
        <span key={day.key} className="time-grid__day text-caption">
          {day.label}
        </span>
      ))}
      {slots.map((slot) => (
        <Fragment key={slot}>
          <span className="time-grid__time text-caption">{formatClockLabel(slot)}</span>
          {days.map((day) => {
            const unavailable = isUnavailable(day.key, slot);
            return (
              <button
                key={day.key}
                type="button"
                data-day={day.key}
                data-slot={slot}
                className={`time-grid__cell${unavailable ? ' time-grid__cell--unavailable' : ''}`}
                aria-pressed={unavailable}
                aria-label={`${day.label} ${formatClockLabel(slot)} ${unavailable ? '안 됨' : '가능'}`}
                onPointerDown={(event) => handlePointerDown(event, day.key, slot)}
                onPointerMove={drag.movePress}
                onClick={() => handleClick(day.key, slot)}
              >
                {/* "선택 = 되는 시간" 습관과의 혼동을 막기 위해 형태(✕)로 '안 됨'을 명시 */}
                {unavailable ? '✕' : ''}
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
