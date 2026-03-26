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

    // 📡 Real-time listen for unread notifications
    // We fetch for both user-specific and global 'all' notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'all']),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.error('❌ [useUnreadNotifications] Error:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return unreadCount;
};
