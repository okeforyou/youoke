import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import clsx from 'clsx'

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextProps {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* iOS Island Style Toasts Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex flex-col items-center gap-3 pointer-events-none w-full max-w-xs sm:max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-xl transition-all duration-500 animate-in fade-in slide-in-from-top-4",
              "bg-black/90 text-white border-white/10"
            )}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />}
              {toast.type === 'error' && <AlertCircle className="w-4.5 h-4.5 text-red-400" />}
              {toast.type === 'info' && <Info className="w-4.5 h-4.5 text-primary" />}
            </div>
            <p className="text-[13px] font-bold leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {toast.message}
            </p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-1 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) return { addToast: () => { } };
  return context;
};
