import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query, limit, getFirestore } from "firebase/firestore";
import { app } from "@/firebase";
import { Bell, Clock } from "lucide-react";
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

    useEffect(() => {
        if (!user?.uid || !db) {
            setLoading(false);
            return;
        }

        // 🛡️ v4.1.2 Optimization: Low-latency UI entry
        // Allow the profile drawer/dashboard core elements to render FIRST
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

    return (
        <div className="space-y-3">
            {announcements.map((item) => (
                <div
                    key={item.id}
                    className="relative pl-11 pr-4 py-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm"
                >
                    <div className="absolute left-3.5 top-4">
                        <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
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
                        <div className="flex items-center gap-1.5 mt-3 text-[10px] font-medium text-muted-foreground/60">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.createdAt)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
