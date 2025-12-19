export type SubscriptionPlan = "free" | "monthly" | "yearly" | "lifetime";
export type SubscriptionStatus = "active" | "expired" | "pending" | "cancelled";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type UserRole = "admin" | "premium" | "free";

export interface Subscription {
  plan: SubscriptionPlan;
  startDate: Date | null;
  endDate: Date | null;
  status: SubscriptionStatus;
  paymentProof?: string;
}

export interface Payment {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  amount: number;
  paymentProof: string;
  status: PaymentStatus;
  transactionDate: Date;
  bankName?: string;
  transferTime?: string;
  note?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  subscription: Subscription;
  settings?: {
    autoPlayQueue: boolean;
    defaultVolume: number;
    quality: "auto" | "720p" | "480p" | "360p";
    theme: "light" | "dark";
    notifications: {
      expiryReminder: boolean;
      newAds: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingPackage {
  id: SubscriptionPlan | string;
  name: string;
  displayName?: string; // For display purposes (fallback to name if not set)
  price: number;
  duration: number | string; // days (number) or label (string), 0 = lifetime
  features: string[];
  popular?: boolean;
  discount?: {
    percentage: number;
    label: string;
  };
}

// Re-export constants from utils for backward compatibility
// These are now centralized in utils/constants.ts
export { DEFAULT_PRICING_PACKAGES, BANK_INFO } from "../utils/constants";
