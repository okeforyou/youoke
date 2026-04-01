import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { collection, onSnapshot, orderBy, query, limit, getFirestore } from 'firebase/firestore';
import { app } from '@/firebase';
import { useAuthStore } from '@/modules/auth/useAuthStore';

const db = app ? getFirestore(app) : null;

export const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid || !db) return;

    // 🛡️ v4.1.2 Optimization: Wait 2s before starting listener
    // This allows the main AuthStore to finish fetching the User Profile (Membership etc.)
    // without competing for Firestore connection/quota during the critical login moment.
    const timer = setTimeout(() => {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(data);
        setUnreadCount(data.length);
      }, (err) => console.error('❌ [NotifBell]:', err));

      return () => unsub();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user?.uid]);

  // Don't render for anonymous users
  if (!user?.uid) return null;

  const formatDate = (createdAt: any) => {
    if (!createdAt) return 'เมื่อสักครู่';
    if (typeof createdAt === 'string') {
      return new Date(createdAt).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (createdAt?.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return 'เมื่อสักครู่';
  };

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

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-100 z-40 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ข่าวสารและประกาศ</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {announcements.length > 0 ? (
                announcements.map((item) => (
                  <div key={item.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.body}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary font-bold hover:underline mt-2 block"
                      >
                        อ่านเพิ่มเติม →
                      </a>
                    )}
                    <span className="text-[10px] text-slate-400 mt-2 block">{formatDate(item.createdAt)}</span>
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

