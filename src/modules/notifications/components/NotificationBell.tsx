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
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.uid || !db) return;

    // Load read IDs from storage
    const stored = localStorage.getItem('youoke_read_ids');
    if (stored) {
      try {
        setReadIds(JSON.parse(stored));
      } catch (e) {
        setReadIds([]);
      }
    }

    const timer = setTimeout(() => {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
      
      const updateCount = (data: any[]) => {
        const freshStored = localStorage.getItem('youoke_read_ids');
        let currentReadIds: string[] = [];
        try {
          currentReadIds = freshStored ? JSON.parse(freshStored) : [];
          setReadIds(currentReadIds);
        } catch (e) {}

        const unreadItems = data.filter(item => !currentReadIds.includes(item.id));
        setUnreadCount(unreadItems.length);
      };

      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(data);
        updateCount(data);
      }, (err) => console.error('❌ [NotifBell]:', err));

      // 🛡️ v4.1.9 Cross-component Sync
      const handleSync = () => {
        updateCount(announcements);
      };
      window.addEventListener('youoke_notifications_updated', handleSync);

      return () => {
        unsub();
        window.removeEventListener('youoke_notifications_updated', handleSync);
      };
    }, 2000);


    return () => clearTimeout(timer);
  }, [user?.uid]);

  // Don't render for anonymous users
  if (!user?.uid) return null;

  const handleOpenBell = () => {
    setIsOpen(!isOpen);
    // 🛡️ v4.1.7 Policy: Opening the bell NO LONGER marks everything as read.
    // User must click individual items or the "Mark All" button.
  };

  const markRead = (id: string) => {
    const newReadIds = Array.from(new Set([...readIds, id]));
    setReadIds(newReadIds);
    localStorage.setItem('youoke_read_ids', JSON.stringify(newReadIds));
    
    // Immediate count update
    const count = announcements.filter(a => !newReadIds.includes(a.id)).length;
    setUnreadCount(count);
  };

  const markAllAsRead = () => {
    const allIds = announcements.map(a => a.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    localStorage.setItem('youoke_read_ids', JSON.stringify(newReadIds));
    setUnreadCount(0);
  };

  const formatDate = (createdAt: any) => {
    if (!createdAt) return 'เมื่อสักครู่';
    
    try {
      let date: Date;
      if (createdAt instanceof Date) {
        date = createdAt;
      } else if (typeof createdAt?.toDate === 'function') {
        date = createdAt.toDate();
      } else if (typeof createdAt?.seconds === 'number') {
        date = new Date(createdAt.seconds * 1000);
      } else {
        date = new Date(createdAt);
      }

      if (isNaN(date.getTime())) return 'เมื่อสักครู่';

      return date.toLocaleString('th-TH', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'เมื่อสักครู่';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpenBell}
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
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-100 z-40 shadow-2xl flex flex-col overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ข่าวสารและประกาศ</h3>
              {unreadCount > 0 && <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">ใหม่ {unreadCount}</span>}
            </div>
            
            <div className="max-h-96 overflow-y-auto no-scrollbar">
              {announcements.length > 0 ? (
                announcements.map((item) => {
                  const itemIsNew = !readIds.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => markRead(item.id)}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer relative ${!itemIsNew ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {itemIsNew && <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0 animate-pulse" />}
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${itemIsNew ? 'text-slate-900' : 'text-slate-500'}`}>{item.title}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                          <div className="flex items-center justify-between mt-2">
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-400 font-medium uppercase">{formatDate(item.createdAt)}</span>
                                {itemIsNew && <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-black italic">NEW</span>}
                             </div>
                             {itemIsNew ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); markRead(item.id); }}
                                  className="text-[9px] font-bold text-primary hover:underline uppercase"
                                >
                                  อ่านแล้ว
                                </button>
                             ) : (
                                <span className="text-[9px] font-bold text-slate-300 uppercase">อ่านแล้ว</span>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BellIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ยังไม่มีข่าวสารในขณะนี้</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-100/50 text-center border-t border-slate-100 px-4">
              <button 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-primary disabled:opacity-30 disabled:hover:text-slate-400 transition-colors uppercase tracking-tight"
              >
                ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


