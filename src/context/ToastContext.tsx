import React, { createContext, ReactNode, useContext, useState } from 'react'

interface Toast {
  id: string;
  message: string;
}

interface ToastContextProps {
  addToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts([...toasts, { id, message }]);

    setTimeout(() => {
      setToasts((toasts) => toasts.filter((toast) => toast.id !== id));
    }, 3000); // Toast disappears after 3 seconds
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        style={{ zIndex: 300, bottom: "1rem" }}
        className="absolute right-2 space-y-2 "
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
