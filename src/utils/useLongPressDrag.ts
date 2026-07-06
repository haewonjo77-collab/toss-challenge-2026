import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

// 누른 채 지나가는 항목에 같은 값을 적용하기 위한 공용 훅.
// 일반 클릭은 각 컴포넌트의 onClick으로 유지하고, 포인터 입력은 pointerdown에서
// 즉시 시작해 모바일/데스크톱 모두 "누르고 쭉" 드래그할 수 있게 한다.
export function useLongPressDrag() {
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const onMoveRef = useRef<((event: ReactPointerEvent<HTMLElement>) => void) | null>(null);

  const end = () => {
    draggingRef.current = false;
    pointerIdRef.current = null;
    onMoveRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, []);

  // onBegin: 포인터를 누른 지점에 목표값을 적용
  // onMove: 드래그 모드 동안 포인터 이동마다 호출
  const startPress = (
    event: ReactPointerEvent<HTMLElement>,
    onBegin: () => void,
    onMove: (event: ReactPointerEvent<HTMLElement>) => void,
  ) => {
    if (!event.isPrimary) return;

    pointerIdRef.current = event.pointerId;
    onMoveRef.current = onMove;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onBegin();
  };

  const movePress = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return;
    onMoveRef.current?.(event);
  };

  return { startPress, movePress };
}
