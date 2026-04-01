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
  const [lastReadId, setLastReadId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !db) return;

    // Load last read ID from storage
    const storedId = localStorage.getItem('youoke_last_read_announcement_id');
    setLastReadId(storedId);

    const timer = setTimeout(() => {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnnouncements(data);

        // Re-read storage on each snapshot to ensure we have the absolute latest state
        const freshStoredId = localStorage.getItem('youoke_last_read_announcement_id');
        if (data.length > 0) {
          const lastReadIndex = data.findIndex(item => item.id === freshStoredId);
          // If the last read ID is still the top one, count is 0
          setUnreadCount(lastReadIndex === -1 ? data.length : lastReadIndex);
        } else {
          setUnreadCount(0);
        }
      }, (err) => console.error('❌ [NotifBell]:', err));

      return () => unsub();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user?.uid]);

  // Don't render for anonymous users
  if (!user?.uid) return null;

  const handleOpenBell = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    
    // Mark everything as read when opening
    if (nextState && announcements.length > 0) {
      const latestId = announcements[0].id;
      localStorage.setItem('youoke_last_read_announcement_id', latestId);
      setLastReadId(latestId);
      setUnreadCount(0); // Force UI update immediately
    }
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

  // Helper to check if an individual item is "new"
  const isNew = (itemId: string) => {
    if (!lastReadId) return true;
    const itemIndex = announcements.findIndex(a => a.id === itemId);
    const lastReadIndex = announcements.findIndex(a => a.id === lastReadId);
    
    if (lastReadIndex === -1) return true; // If stored ID is old/gone, treat based on chronological order
    return itemIndex < lastReadIndex;
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
                  const itemIsNew = isNew(item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer relative ${!itemIsNew ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {itemIsNew && <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0 animate-pulse" />}
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${itemIsNew ? 'text-slate-900' : 'text-slate-500'}`}>{item.title}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary font-bold hover:underline mt-2 inline-block"
                            >
                              อ่านรายละเอียด →
                            </a>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[9px] text-slate-400 font-medium uppercase">{formatDate(item.createdAt)}</span>
                             {itemIsNew && <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-black italic">NEW</span>}
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

            <div className="p-3 bg-slate-100/50 text-center border-t border-slate-100">
              <button className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-tight">ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

