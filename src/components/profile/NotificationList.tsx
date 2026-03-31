import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit, Timestamp, where } from "firebase/firestore";
import { db } from "@/firebase";
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/useAuthStore";

interface Notification {
    id: string;
    title: string;
    body: string;
    type: 'info' | 'warning' | 'success' | 'system' | 'admin_broadcast' | 'global_broadcast';
    read: boolean;
    createdAt: Timestamp;
}

export const NotificationList = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        let unsubPersonal = () => {};
        let pList: Notification[] = [];
        let gList: Notification[] = [];

        const updateList = () => {
            const combined = [...pList, ...gList]
                .sort((a, b) => {
                    const timeA = a.createdAt?.seconds || new Date(a.createdAt as any).getTime() / 1000 || 0;
                    const timeB = b.createdAt?.seconds || new Date(b.createdAt as any).getTime() / 1000 || 0;
                    return timeB - timeA;
                })
                .slice(0, 30);
            setNotifications(combined);
            setLoading(false);
        };

        // 🛡️ Personal Announcements (Private - Firestore)
        if (user?.uid) {
            const qPersonal = query(
                collection(db, 'notifications'),
                where('userId', '==', user.uid),
                limit(30)
            );
            unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
                pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
                updateList();
            }, (err) => console.error("❌ [NotifList] Personal Query Fail (Rules?):", err));
        }

        // 📢 Public Announcements (Truly Global - API BRIDGE)
        // (Bypasses Firestore "Insufficient Permissions" for unauthenticated or restricted users)
        const fetchGlobalNews = async () => {
            try {
                const res = await fetch('/api/public/news');
                if (!res.ok) throw new Error('API Fail');
                const data = await res.json();
                gList = data.map((item: any) => ({
                    ...item,
                    type: item.type || 'system',
                    createdAt: item.createdAt // Date string from API
                }));
                updateList();
            } catch (err) {
                console.error("❌ [NotifList] Global API Bridge Fail:", err);
            }
        };

        fetchGlobalNews();

        return () => {
            unsubPersonal();
        };
    }, [user?.uid]);

    const markAllAsRead = async () => {
        if (!user?.uid || !db || notifications.length === 0) return;

        try {
            const { writeBatch, doc } = await import("firebase/firestore");
            const batch = writeBatch(db);
            
            // 🛡️ v4.0.0 Billboard Fix: Only mark PRIVATE notifications as read.
            // NEVER update the 'read' status of Global News (userId: 'all') in the central DB,
            // because doing so marks it as read for EVERYONE else too.
            const unreadPrivate = notifications.filter(n => !n.read && (n as any).userId !== 'all' && n.type !== 'system');

            if (unreadPrivate.length === 0) return;

            unreadPrivate.forEach(notif => {
                const docRef = doc(db!, 'notifications', notif.id);
                batch.update(docRef, { read: true });
            });

            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type: string) => {
        if (type === 'system' || type === 'broadcast' || type === 'global_broadcast') 
            return <Bell className="w-5 h-5 text-primary" />;
        
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };


    if (loading) return <div className="p-4 text-center"><span className="loading loading-dots loading-sm"></span></div>;

    if (notifications.length === 0) {
        return (
            <div className="text-center py-8 opacity-60">
                <Bell className="w-8 h-8 mx-auto mb-2 text-base-content/30" />
                <p className="text-sm font-medium">ไม่มีการแจ้งเตือนใหม่</p>
            </div>
        );
    }

    // 🛡️ v4.0.0: Global/System news are always considered "Active" news
    const unreadCount = notifications.filter(n => !n.read || n.type === 'system' || (n as any).userId === 'all').length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {unreadCount > 0 ? `ประกาศใหม่ (${unreadCount})` : 'อ่านครบทั้งหมดแล้ว'}
                </span>
                {unreadCount > 0 && notifications.some(n => !n.read && (n as any).userId !== 'all') && (
                    <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                    >
                        อ่านทั้งหมด
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {notifications.map((notif) => {
                    // 🛡️ v4.0.0 Logic: System news is ALWAYS treated as "Important/Highlighted" 
                    // until we implement client-side local-storage read tracking.
                    const isAlwaysUnread = notif.type === 'system' || (notif as any).userId === 'all';
                    const isNotificationRead = notif.read && !isAlwaysUnread;

                    return (
                        <div
                            key={notif.id}
                            className={cn(
                                "relative pl-11 pr-4 py-4 rounded-2xl border transition-all duration-300",
                                isNotificationRead
                                    ? "border-border bg-card opacity-80"
                                    : "border-primary/20 bg-primary/5 shadow-sm ring-1 ring-primary/5"
                            )}
                        >
                            {/* Unread Indicator Bubble */}
                            {!isNotificationRead && (
                                <div className="absolute top-4 right-4 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-[0_2px_8px_rgba(239,68,68,0.3)] animate-in slide-in-from-right-2 duration-500 uppercase tracking-tighter">
                                    New
                                </div>
                            )}

                            <div className="absolute left-3.5 top-4.5">
                                {getIcon(notif.type)}
                            </div>
                            <div>
                                <h4 className={cn("font-bold text-sm", isNotificationRead ? "text-foreground/80" : "text-foreground")}>
                                    {notif.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.body}</p>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] font-medium text-muted-foreground/60">
                                    <Clock className="w-3 h-3" />
                                    {notif.createdAt && typeof (notif.createdAt as any).seconds === 'number'
                                        ? new Date((notif.createdAt as any).seconds * 1000).toLocaleString('th-TH', {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })
                                        : typeof notif.createdAt === 'string' 
                                            ? new Date(notif.createdAt).toLocaleString('th-TH', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })
                                            : 'เมื่อสักครู่'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
