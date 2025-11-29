import { database as db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

const SHARE_TOKENS_COLLECTION = "shareTokens";

export interface ShareToken {
  id: string;
  roomId: string;
  ownerId: string;
  ownerName: string;
  createdAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
}

/**
 * สร้าง share token ใหม่สำหรับห้อง
 */
export async function createShareToken(
  roomId: string,
  ownerId: string,
  ownerName: string
): Promise<ShareToken> {
  if (!db) throw new Error("Firebase not initialized");

  // Generate random token ID (8 characters)
  const tokenId = Math.random().toString(36).substring(2, 10);

  const shareToken: ShareToken = {
    id: tokenId,
    roomId,
    ownerId,
    ownerName,
    createdAt: new Date(),
    expiresAt: null, // No expiration
    isActive: true,
  };

  const tokenRef = doc(db, SHARE_TOKENS_COLLECTION, tokenId);
  await setDoc(tokenRef, {
    ...shareToken,
    createdAt: serverTimestamp(),
  });

  return shareToken;
}

/**
 * ตรวจสอบว่า token ยังใช้งานได้หรือไม่
 */
export async function validateShareToken(
  tokenId: string
): Promise<ShareToken | null> {
  if (!db) {
    console.warn("Firebase not initialized");
    return null;
  }

  try {
    const tokenRef = doc(db, SHARE_TOKENS_COLLECTION, tokenId);
    const snapshot = await getDoc(tokenRef);

    if (!snapshot.exists()) {
      return null;
    }

    const token = snapshot.data() as ShareToken;

    // Check if active
    if (!token.isActive) {
      return null;
    }

    // Check if expired
    if (token.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(token.expiresAt);
      if (now > expiresAt) {
        return null;
      }
    }

    return token;
  } catch (error) {
    console.error("Error validating share token:", error);
    return null;
  }
}

/**
 * ยกเลิก token (revoke)
 */
export async function revokeShareToken(tokenId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const tokenRef = doc(db, SHARE_TOKENS_COLLECTION, tokenId);
  await updateDoc(tokenRef, {
    isActive: false,
    revokedAt: serverTimestamp(),
  });
}

/**
 * ยกเลิก tokens ทั้งหมดของห้อง
 */
export async function revokeAllTokensForRoom(roomId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const tokensRef = collection(db, SHARE_TOKENS_COLLECTION);
  const q = query(
    tokensRef,
    where("roomId", "==", roomId),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  const revokePromises = snapshot.docs.map(async (docSnapshot) => {
    const tokenRef = doc(db, SHARE_TOKENS_COLLECTION, docSnapshot.id);
    await updateDoc(tokenRef, {
      isActive: false,
      revokedAt: serverTimestamp(),
    });
  });

  await Promise.all(revokePromises);
}

/**
 * ดึง active tokens ทั้งหมดของห้อง
 */
export async function getActiveTokensForRoom(
  roomId: string
): Promise<ShareToken[]> {
  if (!db) throw new Error("Firebase not initialized");

  const tokensRef = collection(db, SHARE_TOKENS_COLLECTION);
  const q = query(
    tokensRef,
    where("roomId", "==", roomId),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as ShareToken);
}

/**
 * ลบ token ถาวร (delete)
 */
export async function deleteShareToken(tokenId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const tokenRef = doc(db, SHARE_TOKENS_COLLECTION, tokenId);
  await deleteDoc(tokenRef);
}
