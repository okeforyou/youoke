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
import {
  ServiceResult,
  ServiceError,
  ServiceErrorCode,
  success,
  failure,
  retryWithResult,
  withFirestoreWrapper,
  logServiceOperation,
} from "../utils/serviceHelper";

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
}): Promise<ServiceResult<Payment>> {
  return withFirestoreWrapper(async () => {
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

    const paymentRef = doc(db!, PAYMENTS_COLLECTION, paymentId);
    await setDoc(paymentRef, {
      ...payment,
      transactionDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logServiceOperation("createPayment", { paymentId, userId: data.userId, plan: data.plan });
    return success(payment);
  }, "PAYMENT_CREATE_FAILED");
}

/**
 * ดึงข้อมูล payment
 */
export async function getPayment(paymentId: string): Promise<ServiceResult<Payment>> {
  return withFirestoreWrapper(async () => {
    const paymentRef = doc(db!, PAYMENTS_COLLECTION, paymentId);
    const snapshot = await getDoc(paymentRef);

    if (!snapshot.exists()) {
      return failure(
        new ServiceError(
          "Payment not found",
          "PAYMENT_NOT_FOUND"
        )
      );
    }

    const payment = snapshot.data() as Payment;
    logServiceOperation("getPayment", { paymentId });
    return success(payment);
  }, "PAYMENT_FETCH_FAILED");
}

/**
 * ดึง payments ทั้งหมดของ user
 */
export async function getUserPayments(userId: string): Promise<ServiceResult<Payment[]>> {
  return retryWithResult(
    async () => {
      const paymentsRef = collection(db!, PAYMENTS_COLLECTION);
      const q = query(
        paymentsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const payments = snapshot.docs.map((doc) => doc.data() as Payment);
      logServiceOperation("getUserPayments", { userId, count: payments.length });
      return payments;
    },
    "getUserPayments",
    2,
    500
  );
}

/**
 * ดึง payments ตาม status (สำหรับ admin)
 */
export async function getPaymentsByStatus(
  status: PaymentStatus
): Promise<ServiceResult<Payment[]>> {
  return retryWithResult(
    async () => {
      const paymentsRef = collection(db!, PAYMENTS_COLLECTION);
      const q = query(
        paymentsRef,
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const payments = snapshot.docs.map((doc) => doc.data() as Payment);
      logServiceOperation("getPaymentsByStatus", { status, count: payments.length });
      return payments;
    },
    "getPaymentsByStatus",
    2,
    500
  );
}

/**
 * ดึง pending payments ทั้งหมด (สำหรับ admin approval)
 */
export async function getPendingPayments(): Promise<ServiceResult<Payment[]>> {
  return getPaymentsByStatus("pending");
}

/**
 * Approve payment (Admin only)
 */
export async function approvePayment(
  paymentId: string,
  adminUid: string
): Promise<ServiceResult<void>> {
  return withFirestoreWrapper(async () => {
    // 1. Get payment details
    const paymentResult = await getPayment(paymentId);
    if (!paymentResult.success || !paymentResult.data) {
      return failure(
        new ServiceError(
          "Payment not found",
          "PAYMENT_NOT_FOUND"
        )
      );
    }

    const payment = paymentResult.data;
    if (payment.status !== "pending") {
      return failure(
        new ServiceError(
          "Payment is not pending",
          "PAYMENT_NOT_PENDING"
        )
      );
    }

    // 2. Get pricing package to calculate expiry date
    const pricingResult = await getPricingPackage(payment.plan);
    if (!pricingResult.success || !pricingResult.data) {
      return failure(
        new ServiceError(
          "Pricing package not found",
          "PRICING_NOT_FOUND"
        )
      );
    }

    const pricingPackage = pricingResult.data;

    // 3. Calculate subscription dates
    const startDate = new Date();
    const endDate = calculateExpiryDate(pricingPackage, startDate);

    // 4. Update payment status
    const paymentRef = doc(db!, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      status: "approved",
      approvedBy: adminUid,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 5. Activate user subscription
    const activationResult = await activateSubscription(payment.userId, payment.plan, startDate, endDate);
    if (!activationResult.success) {
      return failure(activationResult.error!);
    }

    logServiceOperation("approvePayment", { paymentId, adminUid, userId: payment.userId });
    return success(undefined);
  }, "PAYMENT_APPROVE_FAILED");
}

/**
 * Reject payment (Admin only)
 */
export async function rejectPayment(
  paymentId: string,
  adminUid: string,
  reason: string
): Promise<ServiceResult<void>> {
  return withFirestoreWrapper(async () => {
    const paymentResult = await getPayment(paymentId);
    if (!paymentResult.success || !paymentResult.data) {
      return failure(
        new ServiceError(
          "Payment not found",
          "PAYMENT_NOT_FOUND"
        )
      );
    }

    const payment = paymentResult.data;
    if (payment.status !== "pending") {
      return failure(
        new ServiceError(
          "Payment is not pending",
          "PAYMENT_NOT_PENDING"
        )
      );
    }

    const paymentRef = doc(db!, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      status: "rejected",
      approvedBy: adminUid,
      approvedAt: serverTimestamp(),
      rejectedReason: reason,
      updatedAt: serverTimestamp(),
    });

    logServiceOperation("rejectPayment", { paymentId, adminUid, reason });
    return success(undefined);
  }, "PAYMENT_REJECT_FAILED");
}

/**
 * ดึง payments ทั้งหมด (Admin only)
 */
export async function getAllPayments(): Promise<ServiceResult<Payment[]>> {
  return retryWithResult(
    async () => {
      const paymentsRef = collection(db!, PAYMENTS_COLLECTION);
      const q = query(paymentsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const payments = snapshot.docs.map((doc) => doc.data() as Payment);
      logServiceOperation("getAllPayments", { count: payments.length });
      return payments;
    },
    "getAllPayments",
    2,
    500
  );
}

/**
 * Get payment statistics (Admin dashboard)
 */
export async function getPaymentStats(): Promise<ServiceResult<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
}>> {
  return withFirestoreWrapper(async () => {
    const allPaymentsResult = await getAllPayments();
    if (!allPaymentsResult.success || !allPaymentsResult.data) {
      return failure(allPaymentsResult.error!);
    }

    const allPayments = allPaymentsResult.data;

    const stats = {
      total: allPayments.length,
      pending: allPayments.filter((p) => p.status === "pending").length,
      approved: allPayments.filter((p) => p.status === "approved").length,
      rejected: allPayments.filter((p) => p.status === "rejected").length,
      totalRevenue: allPayments
        .filter((p) => p.status === "approved")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    logServiceOperation("getPaymentStats", stats);
    return success(stats);
  }, "PAYMENT_STATS_FAILED");
}
