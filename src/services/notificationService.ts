import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

export type NotificationType = 'info' | 'warning' | 'success' | 'system';

export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
}

export const createNotification = async ({ userId, title, message, type = 'info' }: CreateNotificationParams) => {
    if (!db) return;
    try {
        const notifRef = collection(db, `users/${userId}/notifications`);
        await addDoc(notifRef, {
            title,
            message,
            type,
            read: false,
            createdAt: serverTimestamp()
        });
        console.log(`🔔 Notification Created: ${title}`);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
