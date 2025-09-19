import React, { createContext, useContext, useCallback, useState } from 'react';
import type { ReactNode } from 'react';

export interface Toast { id: string; kind: 'info' | 'success' | 'error'; message: string; ttl: number; created: number; }

interface ToastContextValue { toasts: Toast[]; push: (kind: Toast['kind'], message: string, ttl?: number) => void; remove: (id: string) => void; }

const ToastContext = createContext<ToastContextValue | undefined>(undefined as any);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), []);
  const push = useCallback((kind: Toast['kind'], message: string, ttl = 4000) => {
    const id = `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    const toast: Toast = { id, kind, message, ttl, created: Date.now() };
    setToasts(t => [...t, toast]);
    setTimeout(() => remove(id), ttl);
  }, [remove]);
  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span style={{ flex:1 }}>{t.message}</span>
            <button type="button" onClick={() => remove(t.id)} aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used within ToastProvider');
  return ctx;
}
