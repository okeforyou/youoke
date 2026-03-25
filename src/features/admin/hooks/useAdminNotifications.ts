import { useState, useEffect } from 'react';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    orderBy,
    limit 
} from 'firebase/firestore';
import { db } from '@/firebase';

export interface AdminNotification {
    id: string;
    type: 'payment_pending' | 'system_alert';
    title: string;
    message: string;
    timestamp: any;
    link: string;
    read: boolean;
}

export function useAdminNotifications() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;

        // 📡 Listen for Pending Payments
        const q = query(
            collection(db, 'payments'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const paymentNotifs: AdminNotification[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: 'payment_pending',
                    title: 'รายการชำระเงินใหม่',
                    message: `คุณ ${data.userName || 'ลูกค้า'} แจ้งชำระเงิน ฿${data.amount?.toLocaleString() || '0'}`,
                    timestamp: data.createdAt,
                    link: '/admin/payments',
                    read: false
                };
            });

            setNotifications(paymentNotifs);
            setLoading(false);
        }, (error) => {
            console.error("❌ Notification Listener Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const unreadCount = notifications.length;

    return {
        notifications,
        unreadCount,
        loading
    };
}
