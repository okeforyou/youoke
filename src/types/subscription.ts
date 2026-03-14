export type SubscriptionPlan = "free" | "trial" | "day_pass" | "monthly" | "yearly" | "lifetime";
export type SubscriptionStatus = "active" | "expired" | "pending" | "cancelled";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type UserRole = "admin" | "premium" | "free" | "guest";

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

export interface UserQuota {
  daily_limit: number; // Max songs per day (0 = unlimited)
  used: number;        // Songs played today
  last_reset: string;  // ISO Date of last reset
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  subscription: Subscription;

  // Marketplace Extensions
  installed_modules?: string[]; // IDs of installed apps/modules
  quota?: UserQuota;            // For 'Guest/Member' tiers limits

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
    name: "ทดลองใช้งานฟรี",
    price: 0,
    duration: 1,
    features: [
      "ร้องเพลงไม่จำกัด (1 วัน)",
      "ไม่มีโฆษณา",
      "ส่งขึ้นจอ TV / Remote ได้",
      "บันทึก Playlist ได้ไม่จำกัด",
    ],
  },
  {
    id: "day_pass",
    name: "บัตรผ่านรายวัน (Day Pass)",
    price: 19,
    duration: 1,
    features: [
      "ใช้งานได้ 24 ชั่วโมง",
      "ไม่มีโฆษณา",
      "ส่งขึ้นจอ TV / Remote ได้",
      "เหมาะสำหรับจัดปาร์ตี้",
    ],
  },
  {
    id: "monthly",
    name: "รายเดือน (Premium)",
    price: 99,
    duration: 30,
    features: [
      "ใช้งานได้ 30 วัน",
      "ไม่มีโฆษณา",
      "คุณภาพวิดีโอสูงสุด 1080p",
      "บันทึก Playlist ไม่จำกัด",
      "รองรับ Cast / Remote ครบทุกฟีเจอร์",
    ],
  },
  {
    id: "yearly",
    name: "รายปี (Super Premium)",
    price: 990,
    duration: 365,
    popular: true,
    discount: {
      percentage: 17,
      label: "ประหยัด 198 บาท",
    },
    features: [
      "ใช้งานได้ 365 วัน",
      "ประหยัดกว่ารายเดือน 17%",
      "ซัพพอร์ตพิเศษจากทีมงาน",
      "อัพเดทฟีเจอร์ใหม่ก่อนใคร",
    ],
  },
  {
    id: "lifetime",
    name: "ตลอดชีพ (Ultimate)",
    price: 2990,
    duration: 0,
    features: [
      "จ่ายครั้งเดียว จบ!",
      "ใช้ได้ตลอดชีพ ไม่ต้องต่ออายุ",
      "รองรับ 5 อุปกรณ์พร้อมกัน",
      "ทุกความสามารถที่มีในระบบ",
    ],
  },
];

export const BANK_INFO = {
  bankName: "ธนาคารกสิกรไทย",
  accountNumber: "012-3-45678-9",
  accountName: "บริษัท โอเคฟอร์ยู จำกัด",
  promptPayId: "081-234-5678",
};
