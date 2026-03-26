import { messaging, db } from '../firebase';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

class NotificationService {
  private VAPID_KEY = "BMTxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // TODO: User should provide this or we use a default if available

  /**
   * Request Permission and Get Token
   */
  public async requestPermission(userId: string | null): Promise<string | null> {
    if (typeof window === 'undefined' || !messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || this.VAPID_KEY
        });

        if (token) {
          if (userId) {
            await this.saveTokenToUser(userId, token);
          }
          // 📡 Automatically subscribe to global topic (for both guest and logged in)
          this.subscribeToTopic(token, 'all_users');
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ [NotificationService] Permission/Token error:', error);
      return null;
    }
  }

  /**
   * Save Token to Firestore
   */
  private async saveTokenToUser(userId: string, token: string) {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'metadata.fcmTokens': arrayUnion(token),
        'metadata.lastTokenUpdate': new Date().toISOString()
      });
      console.log('✅ [NotificationService] Token saved to Firestore');
    } catch (error) {
      console.error('❌ [NotificationService] Failed to save token:', error);
    }
  }

  /**
   * Subscribe Token to a Topic (Server-side via API)
   */
  public async subscribeToTopic(token: string, topic: string) {
    try {
      const response = await fetch('/api/notify/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topic })
      });
      const data = await response.json();
      if (data.success) {
        console.log(`✅ [NotificationService] Subscribed to topic: ${topic}`);
      } else {
        console.warn(`⚠️ [NotificationService] Subscription failed for ${topic}:`, data.error);
      }
    } catch (error) {
      console.error(`❌ [NotificationService] API Error subscribing to ${topic}:`, error);
    }
  }

  /**
   * Listen for Foreground Messages
   */
  public listenForMessages(callback: (payload: any) => void) {
    if (!messaging) return () => {};

    return onMessage(messaging, (payload) => {
      console.log('🔔 [NotificationService] Foreground message received:', payload);
      callback(payload);
    });
  }
}

export const notificationService = new NotificationService();
