import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/modules/auth/useAuthStore';

export const useFcmToken = () => {
  const { user } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<PermissionState | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const initNotifications = async () => {
      const uid = user.uid;
      if (uid) {
        const newToken = await notificationService.requestPermission(uid as string);
        if (newToken) {
          setToken(newToken);
        }
      }
    };

    initNotifications();

    // Listen for foreground messages
    const unsubscribe = notificationService.listenForMessages((payload) => {
      console.log('🔔 [useFcmToken] Payload:', payload);
      // Optional: Trigger custom toast or global state update
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return { token, notificationPermissionStatus };
};
