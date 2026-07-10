import { Fragment, useRef } from 'react';
import { formatClockLabel } from '../data/time';
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

interface GridCell {
  dayKey: string;
  slotStart: number;
}

export function TimeGrid({ days, slots, isUnavailable, onSetUnavailable }: TimeGridProps) {
  const pointerIdRef = useRef<number | null>(null);
  const dragAnchorRef = useRef<(GridCell & { target: boolean }) | null>(null);
  const clickAnchorRef = useRef<(GridCell & { target: boolean }) | null>(null);
  const dragBaseRef = useRef<Map<string, boolean>>(new Map());
  const changedByDragRef = useRef(false);
  const lastTargetRef = useRef<string | null>(null);

  const cellKey = (dayKey: string, slotStart: number) => `${dayKey}|${slotStart}`;

  const captureBaseState = () => {
    const snapshot = new Map<string, boolean>();
    days.forEach((day) => {
      slots.forEach((slot) => {
        snapshot.set(cellKey(day.key, slot), isUnavailable(day.key, slot));
      });
    });
    dragBaseRef.current = snapshot;
  };

  const cellsBetween = (from: GridCell, to: GridCell) => {
    const fromDayIndex = days.findIndex((day) => day.key === from.dayKey);
    const toDayIndex = days.findIndex((day) => day.key === to.dayKey);
    const fromSlotIndex = slots.indexOf(from.slotStart);
    const toSlotIndex = slots.indexOf(to.slotStart);
    if (fromDayIndex < 0 || toDayIndex < 0 || fromSlotIndex < 0 || toSlotIndex < 0) return [];

    const dayStart = Math.min(fromDayIndex, toDayIndex);
    const dayEnd = Math.max(fromDayIndex, toDayIndex);
    const slotStart = Math.min(fromSlotIndex, toSlotIndex);
    const slotEnd = Math.max(fromSlotIndex, toSlotIndex);
    const cells: GridCell[] = [];

    for (let dayIndex = dayStart; dayIndex <= dayEnd; dayIndex += 1) {
      for (let slotIndex = slotStart; slotIndex <= slotEnd; slotIndex += 1) {
        cells.push({ dayKey: days[dayIndex].key, slotStart: slots[slotIndex] });
      }
    }

    return cells;
  };

  const targetCellFromPoint = (clientX: number, clientY: number): GridCell | null => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const cell = el?.closest('[data-day]') as HTMLElement | null;
    const dayKey = cell?.dataset.day;
    const slotStart = cell?.dataset.slot;
    if (!dayKey || !slotStart) return null;
    return { dayKey, slotStart: Number(slotStart) };
  };

  const applyDragRange = (targetCell: GridCell) => {
    const anchor = dragAnchorRef.current;
    if (!anchor) return;

    const targetKey = cellKey(targetCell.dayKey, targetCell.slotStart);
    if (lastTargetRef.current === targetKey) return;

    const rangeKeys = new Set(
      cellsBetween(anchor, targetCell).map((cell) => cellKey(cell.dayKey, cell.slotStart)),
    );

    days.forEach((day) => {
      slots.forEach((slot) => {
        const key = cellKey(day.key, slot);
        const value = rangeKeys.has(key) ? anchor.target : dragBaseRef.current.get(key) ?? false;
        onSetUnavailable(day.key, slot, value);
      });
    });

    changedByDragRef.current = true;
    lastTargetRef.current = targetKey;
  };

  const applyClickRange = (targetCell: GridCell) => {
    const anchor = clickAnchorRef.current;
    if (
      !anchor ||
      anchor.target !== !isUnavailable(targetCell.dayKey, targetCell.slotStart) ||
      (anchor.dayKey === targetCell.dayKey && anchor.slotStart === targetCell.slotStart)
    ) {
      const target = !isUnavailable(targetCell.dayKey, targetCell.slotStart);
      onSetUnavailable(targetCell.dayKey, targetCell.slotStart, target);
      clickAnchorRef.current = { ...targetCell, target };
      return;
    }

    cellsBetween(anchor, targetCell).forEach((cell) => {
      onSetUnavailable(cell.dayKey, cell.slotStart, anchor.target);
    });
    clickAnchorRef.current = null;
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    day: string,
    slotStart: number,
  ) => {
    if (!event.isPrimary) return;
    const target = !isUnavailable(day, slotStart);
    const cell = { dayKey: day, slotStart };
    pointerIdRef.current = event.pointerId;
    dragAnchorRef.current = { ...cell, target };
    changedByDragRef.current = false;
    lastTargetRef.current = cellKey(day, slotStart);
    captureBaseState();
    applyClickRange(cell);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const targetCell = targetCellFromPoint(event.clientX, event.clientY);
    if (targetCell) applyDragRange(targetCell);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const targetCell = targetCellFromPoint(event.clientX, event.clientY);
    if (targetCell && changedByDragRef.current) {
      applyDragRange(targetCell);
      clickAnchorRef.current = null;
    }
    pointerIdRef.current = null;
    dragAnchorRef.current = null;
    lastTargetRef.current = null;
    changedByDragRef.current = false;
  };

  const handlePointerCancel = () => {
    pointerIdRef.current = null;
    dragAnchorRef.current = null;
    lastTargetRef.current = null;
    changedByDragRef.current = false;
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
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
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
