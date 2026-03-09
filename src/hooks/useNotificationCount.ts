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

        const q = query(
            collection(db, `users/${user.uid}/notifications`),
            where("read", "==", false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        }, (error) => {
            console.error("Error listening to unread notifications:", error);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    return unreadCount;
};
