import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface JoinContextValue {
  participantName: string;
  unavailable: string[]; // "요일|시작분" 슬롯 키 목록
  submitted: boolean;
  startJoin: (name: string) => void;
  setUnavailable: (key: string, value: boolean) => void;
  clearUnavailable: () => void;
  submitResponse: () => void;
}

const JoinContext = createContext<JoinContextValue | null>(null);

export function JoinProvider({ children }: { children: ReactNode }) {
  const [participantName, setParticipantName] = useState('');
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const startJoin = (name: string) => {
    setParticipantName(name);
    setUnavailableSlots([]);
    setSubmitted(false);
  };

  // 드래그로 여러 셀을 지나갈 때 토글이 아니라 목표값을 그대로 적용하기 위한 명시적 설정
  const setUnavailable = (key: string, value: boolean) => {
    setUnavailableSlots((prev) => {
      const has = prev.includes(key);
      if (has === value) return prev;
      return value ? [...prev, key] : prev.filter((existing) => existing !== key);
    });
  };

  const clearUnavailable = () => {
    setUnavailableSlots([]);
  };

  const submitResponse = () => {
    setSubmitted(true);
  };

  return (
    <JoinContext.Provider
      value={{
        participantName,
        unavailable: unavailableSlots,
        submitted,
        startJoin,
        setUnavailable,
        clearUnavailable,
        submitResponse,
      }}
    >
      {children}
    </JoinContext.Provider>
  );
}

export function useJoin(): JoinContextValue {
  const context = useContext(JoinContext);
  if (!context) throw new Error('useJoin must be used within JoinProvider');
  return context;
}
