import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query, limit, getFirestore } from "firebase/firestore";
import { app } from "@/firebase";
import { Bell, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/useAuthStore";

const db = app ? getFirestore(app) : null;

interface Announcement {
    id: string;
    title: string;
    body: string;
    link?: string;
    createdAt: any;
}

export const NotificationList = () => {
    const { user } = useAuthStore();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [readIds, setReadIds] = useState<string[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid || !db) {
            setLoading(false);
            return;
        }

        // Load read IDs from storage
        const stored = localStorage.getItem('youoke_read_ids');
        if (stored) {
            try {
                setReadIds(JSON.parse(stored));
            } catch (e) {
                setReadIds([]);
            }
        }

        // 🛡️ v4.1.2 Optimization: Low-latency UI entry
        const timer = setTimeout(() => {
            const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(30));
            const unsub = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Announcement[];
                setAnnouncements(data);
                setLoading(false);
            }, (err) => {
                console.error('❌ [NotifList]:', err);
                setLoading(false);
            });

            return () => unsub();
        }, 500);

        return () => clearTimeout(timer);
    }, [user?.uid]);

    const markRead = (id: string) => {
        const newReadIds = Array.from(new Set([...readIds, id]));
        setReadIds(newReadIds);
        localStorage.setItem('youoke_read_ids', JSON.stringify(newReadIds));
        
        // Trigger a custom event to notify NotificationBell to update its count
        window.dispatchEvent(new Event('youoke_notifications_updated'));
    };

    const markAllAsRead = () => {
        const allIds = announcements.map(a => a.id);
        const newReadIds = Array.from(new Set([...readIds, ...allIds]));
        setReadIds(newReadIds);
        localStorage.setItem('youoke_read_ids', JSON.stringify(newReadIds));
        window.dispatchEvent(new Event('youoke_notifications_updated'));
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

    if (loading) return <div className="p-4 text-center"><span className="loading loading-dots loading-sm"></span></div>;

    if (announcements.length === 0) {
        return (
            <div className="text-center py-8 opacity-60">
                <Bell className="w-8 h-8 mx-auto mb-2 text-base-content/30" />
                <p className="text-sm font-medium">ไม่มีประกาศในขณะนี้</p>
            </div>
        );
    }

    const unreadCount = announcements.filter(a => !readIds.includes(a.id)).length;

    return (
        <div className="space-y-4">
            {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="w-full text-center text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest border border-primary/10 py-2 rounded-xl bg-primary/5 transition-all dark:bg-primary/20 dark:text-indigo-300"
                >
                  ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว ({unreadCount})
                </button>
            )}

            <div className="space-y-3">
                {announcements.map((item) => {
                    const itemIsNew = !readIds.includes(item.id);
                    return (
                        <div
                            key={item.id}
                            onClick={() => {
                                if (itemIsNew) markRead(item.id);
                                setExpandedId(expandedId === item.id ? null : item.id);
                            }}
                            className={cn(
                                "relative pl-11 pr-4 py-4 rounded-2xl transition-all cursor-pointer overflow-hidden",
                                itemIsNew 
                                    ? "border border-primary/30 bg-primary/10 shadow-sm dark:bg-primary/20 dark:border-primary/40" 
                                    : "border border-slate-200 bg-white dark:bg-zinc-900/50 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80"
                            )}
                        >
                            <div className="absolute left-3.5 top-4">
                                {itemIsNew ? (
                                    <div className="relative">
                                        <Bell className="w-5 h-5 text-primary" />
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                                    </div>
                                ) : (
                                    <Bell className="w-5 h-5 text-slate-300 dark:text-zinc-500" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={cn("font-bold text-sm", itemIsNew ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-zinc-500")}>
                                        {item.title}
                                    </h4>
                                    {itemIsNew && (
                                        <span className="text-[8px] bg-primary/10 dark:bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-black italic">NEW</span>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-[13px] leading-relaxed mt-2 transition-all duration-300", 
                                    itemIsNew ? "text-slate-700 dark:text-zinc-200" : "text-slate-500 dark:text-zinc-400",
                                    expandedId === item.id ? "whitespace-pre-wrap block" : "line-clamp-2"
                                )}>
                                    {item.body}
                                </p>
                                
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDate(item.createdAt)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {itemIsNew && (
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); markRead(item.id); }}
                                              className="text-[10px] font-black text-primary dark:text-indigo-400 hover:text-primary/80 transition-colors uppercase tracking-widest"
                                            >
                                              อ่านแล้ว
                                            </button>
                                        )}
                                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", expandedId === item.id ? "rotate-180" : "")} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
