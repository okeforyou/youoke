import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuthStore } from "@/modules/auth/useAuthStore";

export const useNotificationCount = () => {
    const { user } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.uid || !db) {
            setUnreadCount(0);
            return;
        }

        // 🛡️ v3.7.8 Zero-Index Strategy: Split queries for 100% reliability
        const qPersonal = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
        );

        const qGlobal = query(
            collection(db, 'notifications'),
            where('userId', '==', 'all'),
            where('read', '==', false)
        );

        let pCount = 0;
        let gCount = 0;

        const unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
            pCount = snapshot.size;
            setUnreadCount(pCount + gCount);
        });

        const unsubGlobal = onSnapshot(qGlobal, (snapshot) => {
            gCount = snapshot.size;
            setUnreadCount(pCount + gCount);
        });

        return () => {
            unsubPersonal();
            unsubGlobal();
        };
    }, [user?.uid]);

    return unreadCount;
};
