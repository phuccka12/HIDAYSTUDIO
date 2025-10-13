import React, { createContext, useContext, useState, useCallback } from 'react';

type Toast = { id: string; type?: 'success'|'error'|'info'; message: string };

const ToastContext = createContext<any>(null);

export const ToastProvider: React.FC<any> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast,'id'>) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2,8);
    setToasts((s) => [...s, { id, ...t }]);
    const timer = setTimeout(() => setToasts((s) => s.filter(x => x.id !== id)), 4000);
    // store timer id on the toast by closure (no global state) - removal will clear it
    return () => clearTimeout(timer);
  }, []);
  const remove = useCallback((id: string) => setToasts((s) => s.filter(x => x.id !== id)), []);
  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`rounded-lg px-4 py-2 shadow text-sm flex items-center justify-between ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
            <div className="pr-4">{t.message}</div>
            <button onClick={() => remove(t.id)} className="ml-2 text-sm opacity-90 px-2 py-1 rounded bg-black/20">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  return useContext(ToastContext) || { push: (_: any) => {} };
}

export default ToastProvider;
