import { useEffect } from 'react';
import { useVariant } from '../context/VariantContext';

// 사용성 테스트 측정 보조 — 화면 체류 시간과 구간 클릭 수를 variant와 함께 콘솔에 기록.
// 수동 스톱워치 측정을 대체하지 않는 편의 기능이며, 화면 내 타이머 표시는 목업 UI를 해쳐 넣지 않음.
export function useScreenMeasure(screen: string) {
  const { variant } = useVariant();

  useEffect(() => {
    const start = performance.now();
    let clicks = 0;
    const countClick = () => {
      clicks += 1;
    };
    document.addEventListener('click', countClick, true);
    console.log(`[측정] ${screen} (${variant.toUpperCase()}) 진입`);
    return () => {
      document.removeEventListener('click', countClick, true);
      const seconds = ((performance.now() - start) / 1000).toFixed(1);
      console.log(`[측정] ${screen} (${variant.toUpperCase()}) 종료 — ${seconds}s, 클릭 ${clicks}회`);
    };
  }, [screen, variant]);
}
