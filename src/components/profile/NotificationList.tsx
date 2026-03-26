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
        if (!user?.uid || !db) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', 'in', [user.uid, 'all']),
            orderBy("createdAt", "desc"),
            limit(30)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
            setNotifications(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const markAllAsRead = async () => {
        if (!user?.uid || !db || notifications.length === 0) return;

        try {
            const { writeBatch, doc } = await import("firebase/firestore");
            const batch = writeBatch(db);
            const unread = notifications.filter(n => !n.read);

            if (unread.length === 0) return;

            unread.forEach(notif => {
                const docRef = doc(db!, 'notifications', notif.id);
                batch.update(docRef, { read: true });
            });

            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'system': return <Bell className="w-5 h-5 text-primary" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    if (!user) return null;

    if (loading) return <div className="p-4 text-center"><span className="loading loading-dots loading-sm"></span></div>;

    if (notifications.length === 0) {
        return (
            <div className="text-center py-8 opacity-60">
                <Bell className="w-8 h-8 mx-auto mb-2 text-base-content/30" />
                <p className="text-sm font-medium">ไม่มีการแจ้งเตือนใหม่</p>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {unreadCount > 0 ? `มี ${unreadCount} รายการที่ยังไม่อ่าน` : 'อ่านครบทั้งหมดแล้ว'}
                </span>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                    >
                        อ่านทั้งหมด
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={cn(
                            "relative pl-11 pr-4 py-4 rounded-2xl border transition-all duration-300",
                            notif.read
                                ? "border-border bg-card opacity-80"
                                : "border-primary/20 bg-primary/5 shadow-sm ring-1 ring-primary/5"
                        )}
                    >
                        {/* Unread Indicator Dot */}
                        {!notif.read && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        )}

                        <div className="absolute left-3.5 top-4.5">
                            {getIcon(notif.type)}
                        </div>
                        <div>
                            <h4 className={cn("font-bold text-sm", notif.read ? "text-foreground/80" : "text-foreground")}>
                                {notif.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.body}</p>
                            <div className="flex items-center gap-1.5 mt-3 text-[10px] font-medium text-muted-foreground/60">
                                <Clock className="w-3 h-3" />
                                {notif.createdAt?.seconds
                                    ? new Date(notif.createdAt.seconds * 1000).toLocaleString('th-TH', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })
                                    : 'เมื่อสักครู่'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
