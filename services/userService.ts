import { realtimeDb } from "../firebase";
import {
  ref,
  get,
  set,
  update,
  query,
  orderByChild,
  equalTo,
  serverTimestamp,
} from "firebase/database";
import {
  UserProfile,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from "../types/subscription";

const USERS_PATH = "users";

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
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const subscription: Subscription = {
    plan: data.plan,
    startDate: null,
    endDate: null,
    status: data.plan === "free" ? "active" : "pending",
  };

  // Use email username as displayName if fullName not provided
  const emailUsername = data.email.split("@")[0];
  const displayName = data.fullName || emailUsername || "ผู้ใช้";

  const dbData: any = {
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
    dbData.phone = data.phone;
  }

  const userRef = ref(realtimeDb, `${USERS_PATH}/${data.uid}`);
  await set(userRef, dbData);

  // Return profile for immediate use
  return {
    uid: data.uid,
    email: data.email,
    displayName,
    phone: data.phone,
    role: data.plan === "free" ? "free" : "premium",
    subscription,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * ดึงข้อมูล user profile (with caching)
 */
export async function getUserProfile(uid: string, forceRefresh = false): Promise<UserProfile | null> {
  if (!realtimeDb) {
    console.warn("Firebase not initialized");
    return null;
  }

  // Check memory cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = profileCache.get(uid);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('⚡ Using memory cache (instant)');
      return cached.data;
    }
  }

  try {
    const userRef = ref(realtimeDb, `${USERS_PATH}/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const profile = snapshot.val() as UserProfile;
    console.log('🚀 Fetched from Realtime DB (fast!)');

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
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const userRef = ref(realtimeDb, `${USERS_PATH}/${uid}`);
  await update(userRef, {
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
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const userRef = ref(realtimeDb, `${USERS_PATH}/${uid}`);

  const subscription: Subscription = {
    plan,
    startDate,
    endDate,
    status: "active",
  };

  await update(userRef, {
    subscription,
    role: "premium",
    updatedAt: serverTimestamp(),
  });

  clearProfileCache(uid);
}

/**
 * ยกเลิก subscription
 */
export async function cancelSubscription(uid: string): Promise<void> {
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const userRef = ref(realtimeDb, `${USERS_PATH}/${uid}/subscription`);
  await update(userRef, {
    status: "cancelled",
  });

  const mainRef = ref(realtimeDb, `${USERS_PATH}/${uid}`);
  await update(mainRef, {
    updatedAt: serverTimestamp(),
  });

  clearProfileCache(uid);
}

/**
 * เช็คว่า subscription หมดอายุแล้วหรือยัง และอัปเดตสถานะ
 */
export async function checkAndUpdateExpiredSubscriptions(): Promise<void> {
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const usersRef = ref(realtimeDb, USERS_PATH);
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return;
  }

  const users = snapshot.val();
  const now = new Date();
  const updatePromises = [];

  for (const uid in users) {
    const user = users[uid] as UserProfile;

    // Skip if not active or lifetime
    if (user.subscription?.status !== "active" || !user.subscription?.endDate) {
      continue;
    }

    const endDate = new Date(user.subscription.endDate);

    // ถ้าหมดอายุแล้ว
    if (now > endDate) {
      const userRef = ref(realtimeDb, `${USERS_PATH}/${uid}`);
      updatePromises.push(
        update(userRef, {
          "subscription/status": "expired",
          role: "free",
          updatedAt: serverTimestamp(),
        }).then(() => {
          console.log(`Expired subscription for user ${uid}`);
          clearProfileCache(uid);
        })
      );
    }
  }

  await Promise.all(updatePromises);
}

/**
 * อัปเดตข้อมูล profile
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "uid" | "email" | "createdAt">>
): Promise<void> {
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const userRef = ref(realtimeDb, `${USERS_PATH}/${uid}`);
  await update(userRef, {
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
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const usersRef = ref(realtimeDb, USERS_PATH);
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return [];
  }

  const users = snapshot.val();
  return Object.values(users);
}

/**
 * ดึง users ตาม role
 */
export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const usersRef = ref(realtimeDb, USERS_PATH);
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return [];
  }

  const users = snapshot.val();
  return Object.values(users).filter((user: any) => user.role === role) as UserProfile[];
}

/**
 * ดึง users ตาม subscription status
 */
export async function getUsersBySubscriptionStatus(
  status: SubscriptionStatus
): Promise<UserProfile[]> {
  if (!realtimeDb) throw new Error("Firebase not initialized");

  const usersRef = ref(realtimeDb, USERS_PATH);
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return [];
  }

  const users = snapshot.val();
  return Object.values(users).filter((user: any) => user.subscription?.status === status) as UserProfile[];
}
