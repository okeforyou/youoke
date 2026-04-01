import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getFirestore } from 'firebase/firestore';
import { app } from '../firebase';

const db = app ? getFirestore(app) : null;

export const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!db) return;

    const handleSync = () => {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const readIds = JSON.parse(localStorage.getItem('youoke_read_ids') || '[]');
        const unreadItems = snapshot.docs.filter(doc => !readIds.includes(doc.id));
        setUnreadCount(unreadItems.length);
      });

      return unsubscribe;
    };

    // Initial sync
    const unsubscribeSnapshot = handleSync();

    // Listen for manual updates (from Mark as Read buttons)
    window.addEventListener('youoke_notifications_updated', handleSync);

    return () => {
      unsubscribeSnapshot();
      window.removeEventListener('youoke_notifications_updated', handleSync);
    };
  }, []);

  return unreadCount;
};

