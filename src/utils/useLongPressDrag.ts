import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const LONG_PRESS_MS = 300;
const MOVE_CANCEL_PX = 10;

// 세로 스크롤 제스처와 드래그-선택 제스처의 충돌을 막기 위한 공용 훅.
// 짧은 탭/클릭은 그대로 두고(onClick이 별도 처리), 300ms 이상 누른 채 크게
// 움직이지 않아야만 드래그 모드로 진입한다. 그 전까지는 touch-action을
// 건드리지 않아 스크롤 제스처가 그대로 통과한다 — 드래그 모드 진입 시에만
// 눌린 요소의 touch-action을 none으로 전환해 스크롤과 명확히 분리한다.
export function useLongPressDrag() {
  const timerRef = useRef<number>();
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const lockedElRef = useRef<HTMLElement | null>(null);
  const onMoveRef = useRef<((event: ReactPointerEvent<HTMLElement>) => void) | null>(null);

  const clearTimer = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
  };

  const releaseLock = () => {
    if (lockedElRef.current) {
      lockedElRef.current.style.touchAction = '';
      lockedElRef.current = null;
    }
  };

  const end = () => {
    clearTimer();
    draggingRef.current = false;
    startPosRef.current = null;
    releaseLock();
  };

  useEffect(() => {
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, []);

  // onBegin: 300ms 임계값 통과 시 1회 호출 — 눌린 지점에 목표값을 적용
  // onMove: 드래그 모드 동안 포인터 이동마다 호출
  const startPress = (
    event: ReactPointerEvent<HTMLElement>,
    onBegin: () => void,
    onMove: (event: ReactPointerEvent<HTMLElement>) => void,
  ) => {
    startPosRef.current = { x: event.clientX, y: event.clientY };
    const el = event.currentTarget;
    onMoveRef.current = onMove;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      draggingRef.current = true;
      lockedElRef.current = el;
      el.style.touchAction = 'none';
      onBegin();
    }, LONG_PRESS_MS);
  };

  const movePress = (event: ReactPointerEvent<HTMLElement>) => {
    if (draggingRef.current) {
      onMoveRef.current?.(event);
      return;
    }
    const start = startPosRef.current;
    if (!start) return;
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (distance > MOVE_CANCEL_PX) {
      // 임계값 전에 크게 움직였다면 스크롤 의도로 보고 드래그 진입을 취소한다
      clearTimer();
    }
  };

  return { startPress, movePress };
}
