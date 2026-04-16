import { realtimeDb } from "@/firebase";
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
import {
  ServiceResult,
  ServiceError,
  success,
  failure,
  retryWithResult,
  withRealtimeDBWrapper,
  logServiceOperation,
  SimpleCache,
} from "../utils/serviceHelper";
import { safeSplit } from "../utils/stringUtils";


const USERS_PATH = "users";

// Use SimpleCache instead of custom Map
const profileCache = new SimpleCache<UserProfile>(5 * 60 * 1000); // 5 minutes TTL

/**
 * สร้าง user profile ใหม่ (เรียกหลัง Firebase Auth สร้าง user แล้ว)
 */
export async function createUserProfile(data: {
  uid: string;
  email: string;
  fullName?: string;
  phone?: string;
  photoURL?: string;
  plan: SubscriptionPlan;
}): Promise<ServiceResult<UserProfile>> {
  return withRealtimeDBWrapper(async () => {
    const subscription: Subscription = {
      plan: data.plan,
      startDate: null,
      endDate: null,
      status: data.plan === "free" ? "active" : "pending",
    };

    // Use email username as displayName if fullName not provided
    const emailUsername = safeSplit(typeof data.email === 'string' ? data.email : '', "@")[0] || 'User';
    const displayName = data.fullName || emailUsername || "ผู้ใช้";

    const dbData: any = {
      uid: data.uid,
      email: data.email,
      displayName,
      photoURL: data.photoURL || null,
      role: data.plan === "free" ? "free" : "premium",
      subscription,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add phone if it's not undefined
    if (data.phone !== undefined) {
      dbData.phone = data.phone;
    }

    const userRef = ref(realtimeDb!, `${USERS_PATH}/${data.uid}`);
    await set(userRef, dbData);

    // Return profile for immediate use
    const profile: UserProfile = {
      uid: data.uid,
      email: data.email,
      displayName,
      phone: data.phone,
      photoURL: data.photoURL,
      role: data.plan === "free" ? "free" : "premium",
      subscription,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Cache the new profile
    profileCache.set(data.uid, profile);

    logServiceOperation("createUserProfile", { uid: data.uid, email: data.email, plan: data.plan });
    return success(profile);
  }, "USER_CREATE_FAILED");
}

/**
 * ดึงข้อมูล user profile (with caching)
 */
export async function getUserProfile(uid: string, forceRefresh = false): Promise<ServiceResult<UserProfile>> {
  // Check memory cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = profileCache.get(uid);
    if (cached) {
      console.log('⚡ Using memory cache (instant)');
      logServiceOperation("getUserProfile", { uid, source: "cache" });
      return success(cached);
    }
  }

  return retryWithResult(
    async () => {
      const userRef = ref(realtimeDb!, `${USERS_PATH}/${uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new ServiceError(
          "User profile not found",
          "USER_NOT_FOUND"
        );
      }

      const profile = snapshot.val() as UserProfile;
      console.log('🚀 Fetched from Realtime DB (fast!)');

      // Update memory cache
      profileCache.set(uid, profile);

      logServiceOperation("getUserProfile", { uid, source: "database" });
      return profile;
    },
    "getUserProfile",
    2,
    500
  );
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
  logServiceOperation("clearProfileCache", { uid: uid || "all" });
}

/**
 * อัปเดต subscription หลังจาก payment approved
 */
export async function updateUserSubscription(
  uid: string,
  subscription: Partial<Subscription>
): Promise<ServiceResult<void>> {
  return withRealtimeDBWrapper(async () => {
    const userRef = ref(realtimeDb!, `${USERS_PATH}/${uid}`);
    await update(userRef, {
      subscription: subscription,
      updatedAt: serverTimestamp(),
    });

    // Clear cache after update
    clearProfileCache(uid);

    logServiceOperation("updateUserSubscription", { uid, subscription });
    return success(undefined);
  }, "USER_SUBSCRIPTION_UPDATE_FAILED");
}

/**
 * Activate subscription (เรียกเมื่อ admin approve payment)
 */
export async function activateSubscription(
  uid: string,
  plan: SubscriptionPlan,
  startDate: Date,
  endDate: Date | null
): Promise<ServiceResult<void>> {
  return withRealtimeDBWrapper(async () => {
    const userRef = ref(realtimeDb!, `${USERS_PATH}/${uid}`);

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

    logServiceOperation("activateSubscription", { uid, plan });
    return success(undefined);
  }, "USER_SUBSCRIPTION_ACTIVATE_FAILED");
}

/**
 * ยกเลิก subscription
 */
export async function cancelSubscription(uid: string): Promise<ServiceResult<void>> {
  return withRealtimeDBWrapper(async () => {
    const userRef = ref(realtimeDb!, `${USERS_PATH}/${uid}/subscription`);
    await update(userRef, {
      status: "cancelled",
    });

    const mainRef = ref(realtimeDb!, `${USERS_PATH}/${uid}`);
    await update(mainRef, {
      updatedAt: serverTimestamp(),
    });

    clearProfileCache(uid);

    logServiceOperation("cancelSubscription", { uid });
    return success(undefined);
  }, "USER_SUBSCRIPTION_CANCEL_FAILED");
}

/**
 * เช็คว่า subscription หมดอายุแล้วหรือยัง และอัปเดตสถานะ
 */
export async function checkAndUpdateExpiredSubscriptions(): Promise<ServiceResult<number>> {
  return withRealtimeDBWrapper(async () => {
    const usersRef = ref(realtimeDb!, USERS_PATH);
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      logServiceOperation("checkAndUpdateExpiredSubscriptions", { expiredCount: 0 });
      return success(0);
    }

    const users = snapshot.val();
    const now = new Date();
    const updatePromises = [];
    let expiredCount = 0;

    for (const uid in users) {
      const user = users[uid] as UserProfile;

      // Skip if not active or lifetime
      if (user.subscription?.status !== "active" || !user.subscription?.endDate) {
        continue;
      }

      const endDate = new Date(user.subscription.endDate);

      // ถ้าหมดอายุแล้ว
      if (now > endDate) {
        const userRef = ref(realtimeDb!, `${USERS_PATH}/${uid}`);
        updatePromises.push(
          update(userRef, {
            "subscription/status": "expired",
            role: "free",
            updatedAt: serverTimestamp(),
          }).then(() => {
            console.log(`Expired subscription for user ${uid}`);
            clearProfileCache(uid);
            expiredCount++;
          })
        );
      }
    }

    await Promise.all(updatePromises);

    logServiceOperation("checkAndUpdateExpiredSubscriptions", { expiredCount });
    return success(expiredCount);
  }, "USER_EXPIRY_CHECK_FAILED");
}

/**
 * อัปเดตข้อมูล profile
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "uid" | "email" | "createdAt">>
): Promise<ServiceResult<void>> {
  return withRealtimeDBWrapper(async () => {
    const userRef = ref(realtimeDb!, `${USERS_PATH}/${uid}`);
    await update(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Clear cache after update
    clearProfileCache(uid);

    logServiceOperation("updateUserProfile", { uid, fields: Object.keys(data) });
    return success(undefined);
  }, "USER_PROFILE_UPDATE_FAILED");
}

/**
 * ดึง users ทั้งหมด (สำหรับ admin)
 */
export async function getAllUsers(): Promise<ServiceResult<UserProfile[]>> {
  return retryWithResult(
    async () => {
      const usersRef = ref(realtimeDb!, USERS_PATH);
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        logServiceOperation("getAllUsers", { count: 0 });
        return [];
      }

      const users = Object.values(snapshot.val()) as UserProfile[];
      logServiceOperation("getAllUsers", { count: users.length });
      return users;
    },
    "getAllUsers",
    2,
    500
  );
}

/**
 * ดึง users ตาม role
 */
export async function getUsersByRole(role: UserRole): Promise<ServiceResult<UserProfile[]>> {
  return retryWithResult(
    async () => {
      const usersRef = ref(realtimeDb!, USERS_PATH);
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        logServiceOperation("getUsersByRole", { role, count: 0 });
        return [];
      }

      const users = Object.values(snapshot.val()).filter((user: any) => user.role === role) as UserProfile[];
      logServiceOperation("getUsersByRole", { role, count: users.length });
      return users;
    },
    "getUsersByRole",
    2,
    500
  );
}

/**
 * ดึง users ตาม subscription status
 */
export async function getUsersBySubscriptionStatus(
  status: SubscriptionStatus
): Promise<ServiceResult<UserProfile[]>> {
  return retryWithResult(
    async () => {
      const usersRef = ref(realtimeDb!, USERS_PATH);
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        logServiceOperation("getUsersBySubscriptionStatus", { status, count: 0 });
        return [];
      }

      const users = Object.values(snapshot.val()).filter((user: any) => user.subscription?.status === status) as UserProfile[];
      logServiceOperation("getUsersBySubscriptionStatus", { status, count: users.length });
      return users;
    },
    "getUsersBySubscriptionStatus",
    2,
    500
  );
}
