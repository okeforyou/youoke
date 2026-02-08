import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/modules/auth/useAuthStore";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'system';
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
            collection(db, `users/${user.uid}/notifications`),
            orderBy("createdAt", "desc"),
            limit(10)
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

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-success" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
            case 'system': return <Bell className="w-5 h-5 text-primary" />;
            default: return <Info className="w-5 h-5 text-info" />;
        }
    };

    if (!user) return null;

    if (loading) return <div className="p-4 text-center"><span className="loading loading-dots loading-sm"></span></div>;

    if (notifications.length === 0) {
        return (
            <div className="text-center py-8 opacity-60">
                <Bell className="w-8 h-8 mx-auto mb-2 text-base-content/30" />
                <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {notifications.map((notif) => (
                <div key={notif.id} className="relative pl-10 pr-4 py-4 rounded-lg border border-border bg-card transition-all hover:bg-muted/50">
                    <div className="absolute left-3 top-4">
                        {getIcon(notif.type)}
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground">{notif.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/60">
                            <Clock className="w-3 h-3" />
                            {notif.createdAt?.seconds
                                ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString('th-TH', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })
                                : 'เมื่อสักครู่'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
