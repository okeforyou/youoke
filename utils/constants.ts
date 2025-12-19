/**
 * Application Constants
 *
 * Centralized constants for the application
 */

import type { PricingPackage } from '../types/subscription';

/**
 * Default pricing packages
 *
 * These are the default packages used when Firestore doesn't have pricing data
 * In production, these will be fetched from Firestore (/pricing collection)
 */
export const DEFAULT_PRICING_PACKAGES: PricingPackage[] = [
  {
    id: 'free',
    name: 'ฟรี',
    price: 0,
    duration: 0,
    features: [
      'เล่นเพลงไม่จำกัด',
      'มีโฆษณา',
      'คุณภาพวิดีโอ 480p',
      'บันทึก Playlist ได้ 5 รายการ',
    ],
  },
  {
    id: 'monthly',
    name: 'รายเดือน',
    price: 99,
    duration: 30,
    features: [
      'เล่นเพลงไม่จำกัด',
      'ไม่มีโฆษณา',
      'คุณภาพวิดีโอสูงสุด 1080p',
      'บันทึก Playlist ไม่จำกัด',
      'รองรับ Cast ข้ามอุปกรณ์',
      'Auto-play Queue',
    ],
  },
  {
    id: 'yearly',
    name: 'รายปี',
    price: 990,
    duration: 365,
    popular: true,
    discount: {
      percentage: 17,
      label: 'ประหยัด 198 บาท',
    },
    features: [
      'ทุกฟีเจอร์แบบรายเดือน',
      'ประหยัดกว่า 17%',
      'รองรับ 3 อุปกรณ์พร้อมกัน',
      'ดาวน์โหลดเพลงฟังออฟไลน์',
    ],
  },
  {
    id: 'lifetime',
    name: 'ตลอดชีพ',
    price: 2990,
    duration: 0,
    features: [
      'ทุกฟีเจอร์แบบรายปี',
      'ชำระเพียงครั้งเดียว ใช้ตลอดไป',
      'รองรับ 5 อุปกรณ์พร้อมกัน',
      'อัพเดทฟีเจอร์ใหม่ฟรีตลอด',
      'ไม่ต้องกังวลเรื่องต่ออายุ',
    ],
  },
];

/**
 * Bank account information for payments
 */
export const BANK_INFO = {
  bankName: 'ธนาคารกรุงเทพ',
  accountNumber: '090-0-601717',
  accountName: 'บุญยานันทน์ ชูพินิจ',
  promptPayId: '', // Optional PromptPay ID
};

/**
 * Application configuration
 */
export const APP_CONFIG = {
  name: 'YouOke',
  fullName: 'YouOke Home Version',
  version: '1.0.0',
  description: 'YouTube Karaoke Player for Home Use',

  // Support & Contact
  support: {
    email: 'support@okeforyou.com',
    lineOfficialAccount: '@243lercy',
    lineUrl: 'https://line.me/R/ti/p/@243lercy',
  },

  // Social Media
  social: {
    facebook: '',
    twitter: '',
    instagram: '',
  },

  // Features
  features: {
    maxFreePlaylists: 5,
    maxPremiumDevices: 3,
    maxLifetimeDevices: 5,
  },

  // API Configuration
  api: {
    invidiousUrl: process.env.NEXT_PUBLIC_INVIDIOUS_URL || 'https://invidious.fdn.fr',
    firebaseConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
    },
  },

  // UI Configuration
  ui: {
    defaultTheme: 'dark',
    bottomNavHeight: 64, // pixels
    pageTransitionDuration: 300, // milliseconds
  },

  // Limits
  limits: {
    searchResultsPerPage: 20,
    playlistNameMaxLength: 50,
    playlistDescriptionMaxLength: 200,
  },
};

/**
 * Subscription expiry warning thresholds
 */
export const EXPIRY_WARNING_DAYS = {
  critical: 3, // Show urgent warning
  warning: 7, // Show standard warning
  notice: 30, // Show gentle reminder
};

/**
 * Payment status colors for UI
 */
export const PAYMENT_STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
} as const;

/**
 * Subscription status colors for UI
 */
export const SUBSCRIPTION_STATUS_COLORS = {
  active: 'success',
  expired: 'error',
  pending: 'warning',
  cancelled: 'ghost',
} as const;

/**
 * Video quality options
 */
export const VIDEO_QUALITY_OPTIONS = [
  { value: 'auto', label: 'อัตโนมัติ' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '720p', label: '720p (HD)' },
  { value: '480p', label: '480p (SD)' },
  { value: '360p', label: '360p' },
] as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // Authentication
  AUTH_INVALID_EMAIL: 'อีเมลไม่ถูกต้อง',
  AUTH_USER_NOT_FOUND: 'ไม่พบผู้ใช้งาน',
  AUTH_WRONG_PASSWORD: 'รหัสผ่านไม่ถูกต้อง',
  AUTH_EMAIL_ALREADY_IN_USE: 'อีเมลนี้ถูกใช้งานแล้ว',
  AUTH_WEAK_PASSWORD: 'รหัสผ่านไม่ปลอดภัย',
  AUTH_TOO_MANY_REQUESTS: 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่',

  // Network
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อเครือข่ายได้',
  NETWORK_TIMEOUT: 'หมดเวลาในการเชื่อมต่อ',

  // Payment
  PAYMENT_REQUIRED: 'กรุณาชำระเงินเพื่อใช้งานฟีเจอร์นี้',
  PAYMENT_UPLOAD_FAILED: 'ไม่สามารถอัปโหลดหลักฐานการชำระเงินได้',

  // Playlist
  PLAYLIST_NOT_FOUND: 'ไม่พบ Playlist',
  PLAYLIST_LIMIT_REACHED: 'คุณสร้าง Playlist ถึงขีดจำกัดแล้ว',
  PLAYLIST_EMPTY: 'Playlist ว่างเปล่า',

  // Generic
  UNKNOWN_ERROR: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
  PERMISSION_DENIED: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
  LOGOUT_SUCCESS: 'ออกจากระบบสำเร็จ',
  REGISTER_SUCCESS: 'ลงทะเบียนสำเร็จ',

  // Payment
  PAYMENT_SUBMITTED: 'ส่งหลักฐานการชำระเงินเรียบร้อย',
  PAYMENT_APPROVED: 'การชำระเงินได้รับการอนุมัติแล้ว',

  // Playlist
  PLAYLIST_CREATED: 'สร้าง Playlist สำเร็จ',
  PLAYLIST_UPDATED: 'อัปเดต Playlist สำเร็จ',
  PLAYLIST_DELETED: 'ลบ Playlist สำเร็จ',

  // Generic
  SAVE_SUCCESS: 'บันทึกสำเร็จ',
  UPDATE_SUCCESS: 'อัปเดตสำเร็จ',
  DELETE_SUCCESS: 'ลบสำเร็จ',
} as const;
