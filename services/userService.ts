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
  getDocFromCache,
  getDocFromServer,
} from "firebase/firestore";
import {
  UserProfile,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from "../types/subscription";

const USERS_COLLECTION = "users";

// In-memory cache for user profiles (5 minutes TTL)
const profileCache = new Map<string, { data: UserProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * สร้าง user profile ใหม่ (เรียกหลัง Firebase Auth สร้าง user แล้ว)
 */
export async function createUserProfile(data: {
  uid: string;
  email: string;
  fullName?: string;
  phone?: string;
  plan: SubscriptionPlan;
}): Promise<UserProfile> {
  if (!db) throw new Error("Firebase not initialized");

  const subscription: Subscription = {
    plan: data.plan,
    startDate: null,
    endDate: null,
    status: data.plan === "free" ? "active" : "pending", // FREE = active ทันที, ที่เหลือรอ payment
  };

  // Use email username as displayName if fullName not provided
  const emailUsername = data.email.split("@")[0];
  const displayName = data.fullName || emailUsername || "ผู้ใช้";

  const userProfile: UserProfile = {
    uid: data.uid,
    email: data.email,
    displayName,
    phone: data.phone,
    role: data.plan === "free" ? "free" : "premium",
    subscription,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Remove undefined fields before saving to Firestore
  const firestoreData: any = {
    uid: data.uid,
    email: data.email,
    displayName,
    role: data.plan === "free" ? "free" : "premium",
    subscription,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only add phone if it's not undefined
  if (data.phone !== undefined) {
    firestoreData.phone = data.phone;
  }

  const userRef = doc(db, USERS_COLLECTION, data.uid);
  await setDoc(userRef, firestoreData);

  return userProfile;
}

/**
 * ดึงข้อมูล user profile (with caching)
 */
export async function getUserProfile(uid: string, forceRefresh = false): Promise<UserProfile | null> {
  if (!db) {
    console.warn("Firebase not initialized");
    return null;
  }

  // Check memory cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = profileCache.get(uid);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Using cached profile for:', uid);
      return cached.data;
    }
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    // Try cache first, then server
    let snapshot;
    try {
      snapshot = await getDocFromCache(userRef);
      console.log('📦 Using Firestore cache for:', uid);
    } catch {
      snapshot = await getDocFromServer(userRef);
      console.log('🌐 Fetched from server for:', uid);
    }

    if (!snapshot.exists()) {
      return null;
    }

    const profile = snapshot.data() as UserProfile;

    // Update memory cache
    profileCache.set(uid, { data: profile, timestamp: Date.now() });

    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Clear profile cache (call after profile update)
 */
export function clearProfileCache(uid?: string) {
  if (uid) {
    profileCache.delete(uid);
  } else {
    profileCache.clear();
  }
}

/**
 * อัปเดต subscription หลังจาก payment approved
 */
export async function updateUserSubscription(
  uid: string,
  subscription: Partial<Subscription>
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    subscription: subscription,
    updatedAt: serverTimestamp(),
  });

  // Clear cache after update
  clearProfileCache(uid);
}

/**
 * Activate subscription (เรียกเมื่อ admin approve payment)
 */
export async function activateSubscription(
  uid: string,
  plan: SubscriptionPlan,
  startDate: Date,
  endDate: Date | null
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, uid);

  const subscription: Subscription = {
    plan,
    startDate,
    endDate,
    status: "active",
  };

  await updateDoc(userRef, {
    subscription,
    role: "premium", // เปลี่ยนเป็น premium
    updatedAt: serverTimestamp(),
  });
}

/**
 * ยกเลิก subscription
 */
export async function cancelSubscription(uid: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    "subscription.status": "cancelled",
    updatedAt: serverTimestamp(),
  });
}

/**
 * เช็คว่า subscription หมดอายุแล้วหรือยัง และอัปเดตสถานะ
 */
export async function checkAndUpdateExpiredSubscriptions(): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(
    usersRef,
    where("subscription.status", "==", "active")
  );

  const snapshot = await getDocs(q);
  const now = new Date();

  const updatePromises = snapshot.docs.map(async (docSnapshot) => {
    const user = docSnapshot.data() as UserProfile;

    // Skip lifetime subscriptions
    if (!user.subscription.endDate) {
      return;
    }

    const endDate = new Date(user.subscription.endDate);

    // ถ้าหมดอายุแล้ว
    if (now > endDate) {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, {
        "subscription.status": "expired",
        role: "free", // ลดเป็น free
        updatedAt: serverTimestamp(),
      });
      console.log(`Expired subscription for user ${user.uid}`);
    }
  });

  await Promise.all(updatePromises);
}

/**
 * อัปเดตข้อมูล profile
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "uid" | "email" | "createdAt">>
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // Clear cache after update
  clearProfileCache(uid);
}

/**
 * ดึง users ทั้งหมด (สำหรับ admin)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  if (!db) throw new Error("Firebase not initialized");

  const usersRef = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(usersRef);

  return snapshot.docs.map((doc) => doc.data() as UserProfile);
}

/**
 * ดึง users ตาม role
 */
export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  if (!db) throw new Error("Firebase not initialized");

  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where("role", "==", role));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as UserProfile);
}

/**
 * ดึง users ตาม subscription status
 */
export async function getUsersBySubscriptionStatus(
  status: SubscriptionStatus
): Promise<UserProfile[]> {
  if (!db) throw new Error("Firebase not initialized");

  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where("subscription.status", "==", status));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as UserProfile);
}
