import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { collection, query, where, orderBy, limit, onSnapshot, getFirestore } from 'firebase/firestore';
import { app } from '@/firebase';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import clsx from 'clsx';

const db = app ? getFirestore(app) : null;

export const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid || !db) return;

    // Listen to real-time in-app notifications in Firestore
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'all']),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setNotifications(docs);
      // Simple unread count: assuming we have a 'read' field
      setUnreadCount(docs.filter(d => !d.read).length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors relative"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 border border-white rounded-full flex items-center justify-center z-10 animate-in zoom-in-50 duration-500">
            <span className="text-[10px] font-black text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu - Standard YouOke patterns */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-100 z-40 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ข่าวสารและประกาศ</h3>
              {unreadCount > 0 && (
                <button className="text-[10px] font-bold text-primary hover:underline">ทำเป็นอ่านแล้วทั้งหมด</button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={clsx(
                      "p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                      !notif.read && "bg-blue-50/30"
                    )}
                  >
                    <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{notif.body}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {notif.createdAt?.toDate().toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <BellIcon className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ไม่มีประกาศใหม่</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 text-center border-t border-slate-50">
              <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-tight">อ่านข่าวทั้งหมด</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
