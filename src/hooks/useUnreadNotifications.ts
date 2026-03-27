import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../modules/auth/useAuthStore';

export const useUnreadNotifications = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid || !db) {
      setUnreadCount(0);
      return;
    }
    if (!db || !user?.uid) return;

    // 📡 Unified query for both individual and global unread notifications
    const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', [user.uid, 'all']),
        where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.size);
    }, (err) => {
        console.warn("⚠️ Unified Unread Query Error (likely index):", err);
    });

    return () => unsubscribe();
}, [user?.uid]);

  return unreadCount;
};
