import React, { useState, useEffect } from 'react';
import { X, Bell, Info } from 'lucide-react';
import { useRouter } from 'next/router';
import { notificationService } from '../../../services/notificationService';
import { cn } from '../../../utils/cn';
import { useAuthStore } from '../../../modules/auth/useAuthStore';
import { db } from '../../../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface ToastData {
  id: string;
  title: string;
  body: string;
  type?: 'info' | 'success' | 'warning';
}

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // 🔔 Listen for foreground messages (FCM)
    const unsubscribeFCM = notificationService.listenForMessages((payload) => {
      const { notification, data } = payload;
      addToastUI(notification?.title || 'แจ้งเตือนใหม่', notification?.body || '', data?.type === 'success' ? 'success' : 'info');
    });

    // 📡 Real-time Firestore Listener for In-app Toasts
    let isInitialLoad = true;
    let unsubFirestore = () => {};

    if (user?.uid && db) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', [user.uid, 'all']),
        limit(5)
      );

      unsubFirestore = onSnapshot(q, (snapshot) => {
        if (isInitialLoad) {
          isInitialLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            addToastUI(data.title || 'แจ้งเตือนใหม่', data.body || '', data.type === 'success' ? 'success' : 'info');
          }
        });
      }, (err) => console.warn("⚠️ Notification Toast Listener Error:", err));
    }

    return () => {
      unsubscribeFCM();
      unsubFirestore();
    };
  }, [user?.uid]);

  const addToastUI = (title: string, body: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newToast: ToastData = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      type
    };

    setToasts((prev: ToastData[]) => [...prev, newToast]);

    // Auto remove after 6 seconds
    setTimeout(() => {
      removeToast(newToast.id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev: ToastData[]) => prev.filter((t: ToastData) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-4 p-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 animate-in slide-in-from-right duration-300 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 active:scale-[0.98] transition-all",
            toast.type === 'success' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-primary'
          )}
          onClick={() => {
            router.push('/profile/notifications');
            removeToast(toast.id);
          }}
        >
          <div className={cn(
            "p-2 rounded-xl shrink-0",
            toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-primary/10 text-primary'
          )}>
            {toast.type === 'success' ? <Bell className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 line-clamp-1">{toast.title}</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">{toast.body}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
