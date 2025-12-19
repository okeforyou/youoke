/**
 * Subscription Utilities
 *
 * Common functions for subscription management
 */

import type {
  PricingPackage,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../types/subscription';

/**
 * Calculate expiry date from package and start date
 *
 * @example
 * calculateExpiryDate(monthlyPackage) // 30 days from now
 * calculateExpiryDate(lifetimePackage) // null (no expiry)
 */
export function calculateExpiryDate(
  plan: PricingPackage,
  startDate = new Date()
): Date | null {
  // Convert duration to number
  const durationDays =
    typeof plan.duration === 'number'
      ? plan.duration
      : parseInt(String(plan.duration), 10);

  // Check if duration is 0 or invalid
  if (durationDays === 0 || isNaN(durationDays)) {
    // Lifetime or invalid - no expiry date
    return null;
  }

  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  return expiryDate;
}

/**
 * Check if subscription is expired
 *
 * @example
 * isSubscriptionExpired(yesterday) // true
 * isSubscriptionExpired(tomorrow) // false
 * isSubscriptionExpired(null) // false (lifetime)
 */
export function isSubscriptionExpired(endDate: Date | null): boolean {
  if (!endDate) return false; // Lifetime doesn't expire

  return new Date() > new Date(endDate);
}

/**
 * Get days remaining until expiry
 *
 * @example
 * getDaysRemaining(tomorrow) // 1
 * getDaysRemaining(nextWeek) // 7
 * getDaysRemaining(null) // null (lifetime)
 */
export function getDaysRemaining(endDate: Date | null): number | null {
  if (!endDate) return null; // Lifetime

  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Get display name for plan
 *
 * @example
 * getPlanDisplayName({ name: 'Premium', displayName: 'แพ็กเกจพรีเมียม' }) // "แพ็กเกจพรีเมียม"
 * getPlanDisplayName({ name: 'Premium' }) // "Premium"
 */
export function getPlanDisplayName(
  plan: PricingPackage | SubscriptionPlan | string
): string {
  // Handle string plan ID
  if (typeof plan === 'string') {
    const planNames: Record<SubscriptionPlan, string> = {
      free: 'ฟรี',
      monthly: 'รายเดือน',
      yearly: 'รายปี',
      lifetime: 'ตลอดชีพ',
    };
    return planNames[plan as SubscriptionPlan] || plan;
  }

  // Handle PricingPackage object
  if (typeof plan === 'object' && 'name' in plan) {
    return plan.displayName || plan.name;
  }

  return 'ไม่ทราบ';
}

/**
 * Check if user can upgrade to target plan
 *
 * Upgrade rules:
 * - Free can upgrade to any paid plan
 * - Monthly can upgrade to Yearly or Lifetime
 * - Yearly can upgrade to Lifetime
 * - Lifetime cannot upgrade (already highest)
 *
 * @example
 * canUpgradeTo('free', 'monthly') // true
 * canUpgradeTo('monthly', 'yearly') // true
 * canUpgradeTo('lifetime', 'yearly') // false
 */
export function canUpgradeTo(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan
): boolean {
  // Define plan hierarchy (higher number = better plan)
  const planLevel: Record<SubscriptionPlan, number> = {
    free: 0,
    monthly: 1,
    yearly: 2,
    lifetime: 3,
  };

  const currentLevel = planLevel[currentPlan] || 0;
  const targetLevel = planLevel[targetPlan] || 0;

  // Can only upgrade to higher tier
  return targetLevel > currentLevel;
}

/**
 * Get subscription status based on subscription data
 *
 * @example
 * getSubscriptionStatus({ endDate: yesterday, ... }) // 'expired'
 * getSubscriptionStatus({ endDate: tomorrow, ... }) // 'active'
 * getSubscriptionStatus({ endDate: null, ... }) // 'active' (lifetime)
 */
export function getSubscriptionStatus(
  subscription: Subscription
): SubscriptionStatus {
  // Check if manually set to cancelled or pending
  if (subscription.status === 'cancelled' || subscription.status === 'pending') {
    return subscription.status;
  }

  // Check if expired
  if (isSubscriptionExpired(subscription.endDate)) {
    return 'expired';
  }

  // Active subscription
  return 'active';
}

/**
 * Check if subscription is expiring soon
 *
 * @param endDate - Subscription end date
 * @param days - Number of days to consider "soon" (default: 7)
 *
 * @example
 * isExpiringSoon(tomorrow, 7) // true
 * isExpiringSoon(nextMonth, 7) // false
 * isExpiringSoon(null, 7) // false (lifetime)
 */
export function isExpiringSoon(endDate: Date | null, days: number = 7): boolean {
  if (!endDate) return false; // Lifetime doesn't expire

  const daysRemaining = getDaysRemaining(endDate);

  if (daysRemaining === null) return false;

  return daysRemaining > 0 && daysRemaining <= days;
}

/**
 * Get plan price per day
 *
 * Useful for comparing value between plans
 *
 * @example
 * getPricePerDay({ price: 990, duration: 365 }) // 2.71 (฿/day)
 * getPricePerDay({ price: 99, duration: 30 }) // 3.30 (฿/day)
 * getPricePerDay({ price: 0, duration: 0 }) // 0 (free/lifetime)
 */
export function getPricePerDay(plan: PricingPackage): number {
  if (plan.price === 0) return 0; // Free

  const duration =
    typeof plan.duration === 'number'
      ? plan.duration
      : parseInt(String(plan.duration), 10);

  if (duration === 0 || isNaN(duration)) return 0; // Lifetime (one-time payment)

  return parseFloat((plan.price / duration).toFixed(2));
}

/**
 * Calculate savings compared to monthly plan
 *
 * @example
 * calculateSavings(yearlyPlan, monthlyPlan) // { amount: 198, percentage: 17 }
 */
export function calculateSavings(
  plan: PricingPackage,
  basePlan: PricingPackage
): { amount: number; percentage: number } {
  const planDuration =
    typeof plan.duration === 'number'
      ? plan.duration
      : parseInt(String(plan.duration), 10);

  const baseDuration =
    typeof basePlan.duration === 'number'
      ? basePlan.duration
      : parseInt(String(basePlan.duration), 10);

  if (planDuration === 0 || baseDuration === 0) {
    return { amount: 0, percentage: 0 };
  }

  // Calculate equivalent cost
  const periods = planDuration / baseDuration;
  const equivalentCost = basePlan.price * periods;
  const savings = equivalentCost - plan.price;
  const percentage = Math.round((savings / equivalentCost) * 100);

  return {
    amount: Math.max(0, savings),
    percentage: Math.max(0, percentage),
  };
}

/**
 * Check if plan is popular
 *
 * @example
 * isPlanPopular({ popular: true }) // true
 * isPlanPopular({ popular: false }) // false
 */
export function isPlanPopular(plan: PricingPackage): boolean {
  return plan.popular === true;
}

/**
 * Get plan duration display text
 *
 * @example
 * getPlanDurationText({ duration: 30 }) // "30 วัน"
 * getPlanDurationText({ duration: 365 }) // "1 ปี"
 * getPlanDurationText({ duration: 0 }) // "ตลอดชีพ"
 */
export function getPlanDurationText(plan: PricingPackage): string {
  const duration =
    typeof plan.duration === 'number'
      ? plan.duration
      : parseInt(String(plan.duration), 10);

  if (duration === 0 || isNaN(duration)) {
    return 'ตลอดชีพ';
  }

  if (duration === 30) return '1 เดือน';
  if (duration === 365) return '1 ปี';
  if (duration < 30) return `${duration} วัน`;
  if (duration < 365) {
    const months = Math.floor(duration / 30);
    return `${months} เดือน`;
  }

  const years = Math.floor(duration / 365);
  return `${years} ปี`;
}
