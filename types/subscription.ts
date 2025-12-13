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

// Default pricing (for initial setup)
// In production, these will be fetched from Firestore (/pricing collection)
export const DEFAULT_PRICING_PACKAGES: PricingPackage[] = [
  {
    id: "free",
    name: "ฟรี",
    price: 0,
    duration: 0,
    features: [
      "เล่นเพลงไม่จำกัด",
      "มีโฆษณา",
      "คุณภาพวิดีโอ 480p",
      "บันทึก Playlist ได้ 5 รายการ",
    ],
  },
  {
    id: "monthly",
    name: "รายเดือน",
    price: 99,
    duration: 30,
    features: [
      "เล่นเพลงไม่จำกัด",
      "ไม่มีโฆษณา",
      "คุณภาพวิดีโอสูงสุด 1080p",
      "บันทึก Playlist ไม่จำกัด",
      "รองรับ Cast ข้ามอุปกรณ์",
      "Auto-play Queue",
    ],
  },
  {
    id: "yearly",
    name: "รายปี",
    price: 990,
    duration: 365,
    popular: true,
    discount: {
      percentage: 17,
      label: "ประหยัด 198 บาท",
    },
    features: [
      "ทุกฟีเจอร์แบบรายเดือน",
      "ประหยัดกว่า 17%",
      "รองรับ 3 อุปกรณ์พร้อมกัน",
      "ดาวน์โหลดเพลงฟังออฟไลน์",
    ],
  },
  {
    id: "lifetime",
    name: "ตลอดชีพ",
    price: 2990,
    duration: 0,
    features: [
      "ทุกฟีเจอร์แบบรายปี",
      "ชำระเพียงครั้งเดียว ใช้ตลอดไป",
      "รองรับ 5 อุปกรณ์พร้อมกัน",
      "อัพเดทฟีเจอร์ใหม่ฟรีตลอด",
      "ไม่ต้องกังวลเรื่องต่ออายุ",
    ],
  },
];

export const BANK_INFO = {
  bankName: "ธนาคารกสิกรไทย",
  accountNumber: "XXX-X-XXXXX-X", // TODO: ใส่เลขบัญชีจริง
  accountName: "บริษัท โอเคฟอร์ยู จำกัด",
  promptPayId: "0XX-XXX-XXXX", // TODO: ใส่ PromptPay จริง
};
