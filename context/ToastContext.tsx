import React, { createContext, ReactNode, useContext, useState } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  addToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000); // Toast disappears after 4 seconds
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message: string) => addToast(message, 'success');
  const error = (message: string) => addToast(message, 'error');
  const warning = (message: string) => addToast(message, 'warning');
  const info = (message: string) => addToast(message, 'info');

  const getToastStyles = (type: ToastType) => {
    const baseStyles = 'alert shadow-lg';
    switch (type) {
      case 'success':
        return `${baseStyles} alert-success`;
      case 'error':
        return `${baseStyles} alert-error`;
      case 'warning':
        return `${baseStyles} alert-warning`;
      case 'info':
        return `${baseStyles} alert-info`;
      default:
        return baseStyles;
    }
  };

  const getIcon = (type: ToastType) => {
    const iconClass = 'w-6 h-6 flex-shrink-0';
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={iconClass} />;
      case 'error':
        return <XCircleIcon className={iconClass} />;
      case 'warning':
        return <ExclamationCircleIcon className={iconClass} />;
      case 'info':
        return <InformationCircleIcon className={iconClass} />;
      default:
        return <InformationCircleIcon className={iconClass} />;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
      {children}
      <div className="toast toast-top toast-end z-[9999]">
        {toasts.map((toast) => (
          <div key={toast.id} className={getToastStyles(toast.type)}>
            <div className="flex items-center gap-2">
              {getIcon(toast.type)}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn btn-sm btn-ghost btn-circle"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
