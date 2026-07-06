import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// 가설 A/B/C 사용성 테스트용 AS-IS/TO-BE 전환.
// 초기값은 URL ?variant=as-is 파라미터에서 1회 읽고, 이후에는 상단 토글(Context 상태)로만 전환한다
// — 라우트 이동 시 쿼리 유지에 의존하지 않기 위함.
export type Variant = 'as-is' | 'to-be';

function initialVariant(): Variant {
  return new URLSearchParams(window.location.search).get('variant') === 'as-is' ? 'as-is' : 'to-be';
}

interface VariantContextValue {
  variant: Variant;
  setVariant: (variant: Variant) => void;
}

const VariantContext = createContext<VariantContextValue | null>(null);

export function VariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<Variant>(initialVariant);
  return <VariantContext.Provider value={{ variant, setVariant }}>{children}</VariantContext.Provider>;
}

export function useVariant(): VariantContextValue {
  const context = useContext(VariantContext);
  if (!context) throw new Error('useVariant must be used within VariantProvider');
  return context;
}
