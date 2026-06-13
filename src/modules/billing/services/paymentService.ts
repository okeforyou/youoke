import { db, realtimeDb } from "../../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import {
  ref,
  update,
  serverTimestamp as rtdbServerTimestamp
} from "firebase/database";
import { PaymentSlip } from "../types"; // Use local module type

// Collection names
const PAYMENTS_COLLECTION = "payment_proofs"; // Matches orders.tsx
const USERS_COLLECTION = "users";

// 🛠️ v5.3.43: Localized Date Formatter for Notifications
const formatThaiDate = (date: Date | null) => {
  if (!date) return "ไม่มีวันหมดอายุ (Life Time)";
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Approve a Payment (Admin Action)
 * 1. Updates payment status to 'approved'
 * 2. Updates user membership in Firestore
 * 3. Sends notification
 */
export async function approvePayment(
  paymentId: string,
  userId: string,
  packageId: string,
  adminUid: string
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  // 1. Get Package Details for Duration
  const pkgRef = doc(db, "packages", packageId);
  const pkgSnap = await getDoc(pkgRef);

  // Default fallback if package missing (safety net)
  let durationDays = 30;
  let pkgName = "Premium Package";

  if (pkgSnap.exists()) {
    durationDays = pkgSnap.data().durationDays ?? 30;
    pkgName = pkgSnap.data().name || pkgName;
  }

  // 2. Calculate Membership
  const now = new Date();
  let expiresAt: Date | null = new Date();

  if (durationDays === 0) {
    expiresAt = null; // Lifetime
  } else {
    expiresAt.setDate(now.getDate() + durationDays);
  }

  let membershipType = pkgSnap.data()?.planId || 'monthly';
  
  // Fallback if planId not set on package
  if (!pkgSnap.data()?.planId) {
    if (durationDays <= 3) membershipType = 'day_pass';
    else if (durationDays > 300) membershipType = 'yearly';
    if (durationDays === 0) membershipType = 'lifetime';
  }

  // 3. Update User Membership (Firestore)
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef); // Get user data to extract lineUserId

  let maxDailySongs = 100; // ค่าเริ่มต้นหากเกิดข้อผิดพลาด
  try {
      const sysSnap = await getDoc(doc(db, "settings", "default"));
      if (sysSnap.exists()) {
          const sysConfig = sysSnap.data();
          maxDailySongs = sysConfig?.membership?.[membershipType]?.max_daily_songs || 100;
      }
  } catch (e) {
      console.warn("⚠️ Failed to fetch quota config during web approval:", e);
  }

  const quotaData = {
      daily_limit: maxDailySongs,
      used: 0,
      last_reset: new Date().toISOString()
  };

  const membershipData = {
    type: membershipType,
    status: 'active',
    startedAt: serverTimestamp(),
    expiresAt: expiresAt,
    autoRenew: false,
    lastPaymentId: paymentId
  };

  await updateDoc(userRef, {
    membership: membershipData,
    isPremium: true,
    role: 'premium',
    tier: membershipType,
    quota: quotaData,
    updatedAt: serverTimestamp()
  });

  // 3.5 Sync to Realtime Database
  if (realtimeDb) {
    try {
      const rtdbUserRef = ref(realtimeDb, `users/${userId}`);
      await update(rtdbUserRef, {
        role: 'premium',
        tier: membershipType,
        'quota/daily_limit': maxDailySongs,
        'quota/used': 0,
        'quota/last_reset': quotaData.last_reset,
        subscription: {
          plan: membershipType,
          status: 'active',
          startDate: now.toISOString(),
          endDate: expiresAt ? expiresAt.toISOString() : null
        },
        updatedAt: rtdbServerTimestamp()
      });
      console.log("✅ Synced approval to RealtimeDB for user:", userId);
    } catch (e) {
      console.error("❌ Failed to sync to RealtimeDB:", e);
    }
  }

  // 4. Update Payment Status
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, {
    status: 'approved',
    processedAt: serverTimestamp(),
    processedBy: adminUid
  });

  // 5. Send Notification (In-App)
  await addDoc(collection(db, `users/${userId}/notifications`), {
    title: "การชำระเงินสำเร็จ!",
    message: `แพ็กเกจ "${pkgName}" ของคุณใช้งานได้แล้ว ขอให้สนุกกับการร้องเพลง!`,
    type: 'success',
    read: false,
    createdAt: serverTimestamp()
  });

  // 6. Send LINE Notification (If connected)
  const lineUserId = userSnap.exists() ? userSnap.data().lineUserId : null;
  if (lineUserId) {
    try {
      const startDateStr = formatThaiDate(now);
      const endDateStr = formatThaiDate(expiresAt);

      const lineMessage = `ยืนยันการชำระเงินและอนุมัติการใช้งานแล้ว ✅\n` +
        `คุณเริ่มใช้งานพรีเมียมได้ทันทีครับ\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📌 แพ็กเกจ: ${pkgName}\n` +
        `📅 เริ่ม: ${startDateStr}\n` +
        `⌛ หมดอายุ: ${endDateStr}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `ขอให้สนุกกับการร้องเพลงนะครับ! 🎤✨`;

      await fetch('/api/notify/line-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lineUserId,
          message: lineMessage
        })
      });
      console.log(`✅ LINE notification sent to ${lineUserId}`);
    } catch (err) {
      console.error(`❌ Failed to send LINE notification:`, err);
    }
  }

  console.log(`Payment ${paymentId} approved. User ${userId} upgraded.`);
}

/**
 * Reject a Payment
 */
export async function rejectPayment(
  paymentId: string,
  userId: string,
  reason: string,
  adminUid: string
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  // 1. Update Payment Status
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, {
    status: 'rejected',
    processedAt: serverTimestamp(),
    processedBy: adminUid,
    rejectionReason: reason
  });

  // 2. Send Notification (In-App)
  await addDoc(collection(db, `users/${userId}/notifications`), {
    title: "การชำระเงินถูกปฏิเสธ",
    message: `รายการของคุณถูกปฏิเสธเนื่องจาก: ${reason} กรุณาติดต่อทีมงาน`,
    type: 'warning',
    read: false,
    createdAt: serverTimestamp()
  });

  // 3. Send LINE Notification (If connected)
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  const lineUserId = userSnap.exists() ? userSnap.data().lineUserId : null;

  if (lineUserId) {
    try {
      await fetch('/api/notify/line-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lineUserId,
          message: `แจ้งเตือนบิลการชำระเงิน ⚠️\nระบบปฏิเสธรายการของคุณเนื่องจาก: ${reason}\n\nหากมีข้อสงสัย สามารถพิมพ์สอบถามแอดมินในแชทนี้ได้เลยครับ`
        })
      });
    } catch (err) {
      console.error(`❌ Failed to send LINE notification:`, err);
    }
  }

  console.log(`Payment ${paymentId} rejected.`);
}

/**
 * Fetch All Orders (for Admin Dashboard)
 */
export async function getAllOrders(): Promise<PaymentSlip[]> {
  if (!db) return [];

  // Note: 'payment_proofs' is the new collection we are using in V2
  const q = query(collection(db, PAYMENTS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PaymentSlip));
}
/**
 * Create a Module Payment (Pending)
 */
export async function createModulePayment(
  userId: string,
  moduleId: string,
  moduleName: string,
  amount: number,
  slipUrl: string = 'mock_url'
): Promise<string> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
    userId,
    moduleId,
    moduleName,
    amount,
    slipUrl,
    status: 'pending',
    createdAt: serverTimestamp(),
    type: 'module_purchase'
  });

  return docRef.id;
}

/**
 * Approve a Module Payment
 * 1. Updates payment status
 * 2. Adds module to user's installed_modules
 */
export async function approveModulePayment(
  paymentId: string,
  userId: string,
  moduleId: string
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const { arrayUnion } = await import("firebase/firestore");

  // 1. Update User (Provisioning)
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    installed_modules: arrayUnion(moduleId),
    updatedAt: serverTimestamp()
  });

  // 2. Update Payment Status
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, {
    status: 'approved',
    processedAt: serverTimestamp(),
    processedBy: 'system' // Auto-approved
  });

  // 3. Notification
  await addDoc(collection(db, `users/${userId}/notifications`), {
    title: "Purchase Successful!",
    message: `You have successfully unlocked ${moduleId}. Enjoy!`,
    type: 'success',
    read: false,
    createdAt: serverTimestamp()
  });

  console.log(`Module Payment ${paymentId} approved. User ${userId} got ${moduleId}.`);
}
/**
 * Activate a Free Package (Trial) instantly
 */
export async function activateFreePackage(
  userId: string,
  packageId: string
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  // 1. Get Package Details
  const pkgRef = doc(db, "packages", packageId);
  const pkgSnap = await getDoc(pkgRef);

  let durationDays = 1;
  let pkgName = "Free Trial";

  if (pkgSnap.exists()) {
    durationDays = pkgSnap.data().durationDays || 1;
    pkgName = pkgSnap.data().name || pkgName;
  }

  // 2. Calculate Expiry
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(now.getDate() + durationDays);

  let membershipType = pkgSnap.data()?.planId || 'trial';

  // 3. Update User (Use setDoc merge to be robust)
  const userRef = doc(db, USERS_COLLECTION, userId);
  const membershipData = {
    type: membershipType,
    status: 'active',
    startedAt: serverTimestamp(),
    expiresAt: expiresAt,
    autoRenew: false,
    activatedBy: 'self'
  };

  try {
    await setDoc(userRef, {
        membership: membershipData,
        isPremium: true,
        role: 'premium',
        tier: membershipType,
        updatedAt: serverTimestamp()
    }, { merge: true });

    // 3.5 Sync to Realtime Database
    if (realtimeDb) {
      try {
        const rtdbUserRef = ref(realtimeDb, `users/${userId}`);
        await update(rtdbUserRef, {
          role: 'premium',
          tier: membershipType,
          subscription: {
            plan: membershipType,
            status: 'active',
            startDate: now.toISOString(),
            endDate: expiresAt ? expiresAt.toISOString() : null
          },
          updatedAt: rtdbServerTimestamp()
        });
        console.log("✅ Synced activation to RealtimeDB for user:", userId);
      } catch (e) {
        console.error("❌ Failed to sync to RealtimeDB:", e);
      }
    }

    // 4. Notification
    const startDateStr = formatThaiDate(now);
    const endDateStr = formatThaiDate(expiresAt);

    await addDoc(collection(db, `users/${userId}/notifications`), {
        title: "สมัครทดลองใช้สำเร็จ!",
        message: `คุณเริ่มใช้งานแพ็กเกจ "${pkgName}" แล้ว \n🗓️ หมดอายุวันที่: ${endDateStr}`,
        type: 'success',
        read: false,
        createdAt: serverTimestamp()
    });

    const userSnap = await getDoc(userRef);
    const lineUserId = userSnap.exists() ? userSnap.data().lineUserId : null;
    if (lineUserId) {
      try {
        const lineMessage = `อนุมัติสิทธิ์ทดลองใช้งานพรีเมียมแล้ว 🎉\n` +
          `━━━━━━━━━━━━━━━\n` +
          `📌 แพ็กเกจ: ${pkgName}\n` +
          `📅 เริ่ม: ${startDateStr}\n` +
          `⌛ หมดอายุ: ${endDateStr}\n` +
          `━━━━━━━━━━━━━━━\n` +
          `คุณสามารถใช้งานฟีเจอร์พรีเมียมได้ทันทีครับ!`;

        await fetch('/api/notify/line-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: lineUserId,
            message: lineMessage
          })
        });
      } catch (err) {
        console.warn('⚠️ [LINE] Failed to send trial notification');
      }
    }

    console.log(`Free package ${packageId} activated for user ${userId}.`);
  } catch (error) {
    console.error("Error in activateFreePackage:", error);
    throw error;
  }
}
