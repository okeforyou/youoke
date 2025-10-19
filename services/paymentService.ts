import { database as db } from "../firebase";
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
  Timestamp,
} from "firebase/firestore";
import { Payment, PaymentStatus, SubscriptionPlan } from "../types/subscription";
import { activateSubscription } from "./userService";
import { getPricingPackage, calculateExpiryDate } from "./pricingService";

const PAYMENTS_COLLECTION = "payments";

/**
 * สร้าง payment record ใหม่
 */
export async function createPayment(data: {
  userId: string;
  plan: SubscriptionPlan;
  amount: number;
  paymentProof: string;
  bankName?: string;
  transferDate?: string;
  transferTime?: string;
  note?: string;
}): Promise<Payment> {
  if (!db) throw new Error("Firebase not initialized");

  // Generate payment ID
  const paymentId = `PAY-${Date.now()}-${data.userId.substring(0, 6)}`;

  const payment: Payment = {
    id: paymentId,
    userId: data.userId,
    plan: data.plan,
    amount: data.amount,
    paymentProof: data.paymentProof,
    status: "pending",
    transactionDate: new Date(),
    bankName: data.bankName,
    transferTime: data.transferTime
      ? `${data.transferDate} ${data.transferTime}`
      : data.transferDate,
    note: data.note,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await setDoc(paymentRef, {
    ...payment,
    transactionDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return payment;
}

/**
 * ดึงข้อมูล payment
 */
export async function getPayment(paymentId: string): Promise<Payment | null> {
  if (!db) {
    console.warn("Firebase not initialized");
    return null;
  }

  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const snapshot = await getDoc(paymentRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as Payment;
  } catch (error) {
    console.error("Error fetching payment:", error);
    return null;
  }
}

/**
 * ดึง payments ทั้งหมดของ user
 */
export async function getUserPayments(userId: string): Promise<Payment[]> {
  if (!db) {
    console.warn("Firebase not initialized");
    return [];
  }

  try {
    const paymentsRef = collection(db, PAYMENTS_COLLECTION);
    const q = query(
      paymentsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as Payment);
  } catch (error) {
    console.error("Error fetching user payments:", error);
    return [];
  }
}

/**
 * ดึง payments ตาม status (สำหรับ admin)
 */
export async function getPaymentsByStatus(
  status: PaymentStatus
): Promise<Payment[]> {
  if (!db) throw new Error("Firebase not initialized");

  const paymentsRef = collection(db, PAYMENTS_COLLECTION);
  const q = query(
    paymentsRef,
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as Payment);
}

/**
 * ดึง pending payments ทั้งหมด (สำหรับ admin approval)
 */
export async function getPendingPayments(): Promise<Payment[]> {
  return getPaymentsByStatus("pending");
}

/**
 * Approve payment (Admin only)
 */
export async function approvePayment(
  paymentId: string,
  adminUid: string
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  // 1. Get payment details
  const payment = await getPayment(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "pending") {
    throw new Error("Payment is not pending");
  }

  // 2. Get pricing package to calculate expiry date
  const pricingPackage = await getPricingPackage(payment.plan);
  if (!pricingPackage) {
    throw new Error("Pricing package not found");
  }

  // 3. Calculate subscription dates
  const startDate = new Date();
  const endDate = calculateExpiryDate(pricingPackage, startDate);

  // 4. Update payment status
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, {
    status: "approved",
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 5. Activate user subscription
  await activateSubscription(payment.userId, payment.plan, startDate, endDate);

  console.log(
    `Payment ${paymentId} approved by admin ${adminUid}, subscription activated`
  );
}

/**
 * Reject payment (Admin only)
 */
export async function rejectPayment(
  paymentId: string,
  adminUid: string,
  reason: string
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const payment = await getPayment(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "pending") {
    throw new Error("Payment is not pending");
  }

  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await updateDoc(paymentRef, {
    status: "rejected",
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
    rejectedReason: reason,
    updatedAt: serverTimestamp(),
  });

  console.log(`Payment ${paymentId} rejected by admin ${adminUid}: ${reason}`);
}

/**
 * ดึง payments ทั้งหมด (Admin only)
 */
export async function getAllPayments(): Promise<Payment[]> {
  if (!db) throw new Error("Firebase not initialized");

  const paymentsRef = collection(db, PAYMENTS_COLLECTION);
  const q = query(paymentsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data() as Payment);
}

/**
 * Get payment statistics (Admin dashboard)
 */
export async function getPaymentStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
}> {
  if (!db) throw new Error("Firebase not initialized");

  const allPayments = await getAllPayments();

  const stats = {
    total: allPayments.length,
    pending: allPayments.filter((p) => p.status === "pending").length,
    approved: allPayments.filter((p) => p.status === "approved").length,
    rejected: allPayments.filter((p) => p.status === "rejected").length,
    totalRevenue: allPayments
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return stats;
}
