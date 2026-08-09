import React, { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import { Info, CheckCircle, AlertCircle, Search, Mic, Smartphone, User, Star, X } from 'lucide-react';
import clsx from 'clsx';

interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'search' | 'voice' | 'remote' | 'user' | 'premium';
}

interface ToastContextProps {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);

    // Prevent showing duplicate messages at the same time
    setToasts((prev) => {
      if (prev.some(t => t.message === message)) return prev;
      return [...prev, { id, message, type }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* 🏝️ DYNAMIC ISLAND STYLE TOAST NOTIFICATIONS (Top-Center) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-3 pointer-events-none w-full max-w-[90vw] md:max-w-md">
        {toasts.map((toast) => {
          // Smart Icon Detection
          let icon = <Info size={14} />;
          let iconColor = "text-blue-400";
          let glowColor = "rgba(59, 130, 246, 0.2)";

          const msg = toast.message.toLowerCase();

          if (toast.type === 'success' || msg.includes('สำเร็จ') || msg.includes('success')) {
            icon = <CheckCircle size={14} />;
            iconColor = "text-green-400";
            glowColor = "rgba(74, 222, 128, 0.2)";
          } else if (toast.type === 'error' || msg.includes('ไม่สามารถ') || msg.includes('ล้มเหลว') || msg.includes('เตือน') || msg.includes('⚠️')) {
            icon = <AlertCircle size={14} />;
            iconColor = "text-red-400";
            glowColor = "rgba(248, 113, 113, 0.2)";
          } else if (toast.type === 'search' || msg.includes('🔍') || msg.includes('ค้นหา')) {
            icon = <Search size={14} />;
            iconColor = "text-red-500";
            glowColor = "rgba(229, 9, 20, 0.2)";
          } else if (toast.type === 'voice' || msg.includes('🎙️') || msg.includes('เสียง')) {
            icon = <Mic size={14} className="animate-pulse" />;
            iconColor = "text-red-500";
            glowColor = "rgba(229, 9, 20, 0.3)";
          } else if (toast.type === 'remote' || msg.includes('📱') || msg.includes('รีโมท')) {
            icon = <Smartphone size={14} />;
            iconColor = "text-blue-400";
            glowColor = "rgba(59, 130, 246, 0.2)";
          } else if (toast.type === 'user') {
            icon = <User size={14} />;
            iconColor = "text-purple-400";
            glowColor = "rgba(192, 132, 252, 0.2)";
          } else if (toast.type === 'premium') {
            icon = <Star size={14} className="fill-current" />;
            iconColor = "text-amber-400";
            glowColor = "rgba(251, 191, 36, 0.2)";
          }

          const cleanMessage = toast.message
            .replace(/[🔍⚠️🎙️📱✅✨🛡️🎬▶️📻📺]/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

          return (
            <div
              key={toast.id}
              className={clsx(
                "relative flex items-center gap-3 bg-black/85 backdrop-blur-2xl rounded-full py-2 px-5 shadow-2xl transition-all duration-700 pointer-events-auto cursor-default",
                "animate-in slide-in-from-top-6 fade-in",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <div className={clsx(
                "flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/5",
                iconColor
              )}>
                {icon}
              </div>

              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[13px] font-black text-white whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                  {cleanMessage}
                </span>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="ml-1 p-1 rounded-full text-white/20 hover:text-white/40 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
