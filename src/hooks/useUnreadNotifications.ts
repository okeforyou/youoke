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
    let countIndividual = 0;
    let countGlobal = 0;

    const updateCount = () => setUnreadCount(countIndividual + countGlobal);

    // Individual Unread
    const qIndiv = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    // Global Unread
    const qGlobal = query(
      collection(db, 'notifications'),
      where('userId', '==', 'all'),
      where('read', '==', false)
    );

    const unsubIndiv = onSnapshot(qIndiv, (snap) => {
      countIndividual = snap.size;
      updateCount();
    }, (error) => {
      console.error('❌ [useUnreadNotifications] Error fetching individual notifications:', error);
    });

    const unsubGlobal = onSnapshot(qGlobal, (snap) => {
      countGlobal = snap.size;
      updateCount();
    }, (error) => {
      console.error('❌ [useUnreadNotifications] Error fetching global notifications:', error);
    });

    return () => {
      unsubIndiv();
      unsubGlobal();
    };
  }, [user?.uid]);

  return unreadCount;
};
