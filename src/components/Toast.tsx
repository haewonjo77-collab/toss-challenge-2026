import { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import './Toast.css';

const ToastContext = createContext<{ show: (message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number>();

  const show = (next: string) => {
    setMessage(next);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(null), 2000);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div className="toast text-caption" role="status">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
