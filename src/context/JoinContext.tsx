import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface JoinContextValue {
  participantName: string;
  unavailable: string[]; // "요일|시작분" 슬롯 키 목록
  submitted: boolean;
  startJoin: (name: string) => void;
  toggleUnavailable: (key: string) => void;
  submitResponse: () => void;
}

const JoinContext = createContext<JoinContextValue | null>(null);

export function JoinProvider({ children }: { children: ReactNode }) {
  const [participantName, setParticipantName] = useState('');
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const startJoin = (name: string) => {
    setParticipantName(name);
    setUnavailable([]);
    setSubmitted(false);
  };

  const toggleUnavailable = (key: string) => {
    setUnavailable((prev) =>
      prev.includes(key) ? prev.filter((existing) => existing !== key) : [...prev, key],
    );
  };

  const submitResponse = () => {
    setSubmitted(true);
  };

  return (
    <JoinContext.Provider
      value={{ participantName, unavailable, submitted, startJoin, toggleUnavailable, submitResponse }}
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
