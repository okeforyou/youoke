import React from 'react';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Subscription, PricingPackage } from '../../types/subscription';
import { getDaysRemaining, isSubscriptionExpired } from '../../services/pricingService';

/**
 * SubscriptionStatusCard Component
 *
 * Display current subscription status with:
 * - Plan name and status
 * - Expiry date and days remaining
 * - Upgrade/Renew actions
 *
 * @example
 * ```tsx
 * <SubscriptionStatusCard
 *   subscription={user.subscription}
 *   currentPlan={currentPlanDetails}
 *   onUpgrade={() => router.push('/pricing')}
 *   onRenew={() => router.push('/pricing')}
 * />
 * ```
 */

export interface SubscriptionStatusCardProps {
  /** User's subscription data */
  subscription: Subscription;
  /** Current plan details (optional, for display name and features) */
  currentPlan?: PricingPackage;
  /** Callback when user clicks upgrade */
  onUpgrade?: () => void;
  /** Callback when user clicks renew */
  onRenew?: () => void;
  /** Show features list */
  showFeatures?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function SubscriptionStatusCard({
  subscription,
  currentPlan,
  onUpgrade,
  onRenew,
  showFeatures = true,
  className = '',
}: SubscriptionStatusCardProps) {
  const { plan, status, endDate } = subscription;

  // Calculate days remaining
  const daysRemaining = getDaysRemaining(endDate);
  const isExpired = isSubscriptionExpired(endDate);

  // Status badge variant
  const getStatusBadge = () => {
    if (plan === 'lifetime') {
      return <Badge variant="success" size="lg">ตลอดชีพ</Badge>;
    }

    if (isExpired || status === 'expired') {
      return <Badge variant="error" size="lg">หมดอายุ</Badge>;
    }

    if (status === 'pending') {
      return <Badge variant="warning" size="lg">รอการอนุมัติ</Badge>;
    }

    if (status === 'cancelled') {
      return <Badge variant="secondary" size="lg">ยกเลิก</Badge>;
    }

    // Active
    if (daysRemaining !== null && daysRemaining <= 7) {
      return <Badge variant="warning" size="lg">ใกล้หมดอายุ ({daysRemaining} วัน)</Badge>;
    }

    return <Badge variant="success" size="lg">ใช้งานอยู่</Badge>;
  };

  // Status icon
  const getStatusIcon = () => {
    if (plan === 'lifetime') {
      return <CheckCircleIcon className="w-8 h-8 text-success" />;
    }

    if (isExpired || status === 'expired') {
      return <XCircleIcon className="w-8 h-8 text-error" />;
    }

    if (status === 'pending') {
      return <ClockIcon className="w-8 h-8 text-warning" />;
    }

    if (status === 'cancelled') {
      return <XCircleIcon className="w-8 h-8 text-secondary" />;
    }

    if (daysRemaining !== null && daysRemaining <= 7) {
      return <ExclamationTriangleIcon className="w-8 h-8 text-warning" />;
    }

    return <CheckCircleIcon className="w-8 h-8 text-success" />;
  };

  // Format expiry date
  const formatExpiryDate = () => {
    if (!endDate) return 'ไม่มีกำหนด';

    const date = endDate instanceof Date ? endDate : new Date(endDate);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get plan display name
  const getPlanDisplayName = () => {
    if (currentPlan?.displayName) return currentPlan.displayName;
    if (currentPlan?.name) return currentPlan.name;

    // Fallback names
    const planNames: Record<string, string> = {
      free: 'แพ็กเกจฟรี',
      monthly: 'แพ็กเกจรายเดือน',
      yearly: 'แพ็กเกจรายปี',
      lifetime: 'แพ็กเกจตลอดชีพ',
    };

    return planNames[plan] || plan;
  };

  // Show upgrade button?
  const showUpgradeButton = plan === 'free' || (plan === 'monthly' && status === 'active');

  // Show renew button?
  const showRenewButton = (isExpired || (daysRemaining !== null && daysRemaining <= 30)) && plan !== 'free' && plan !== 'lifetime';

  return (
    <Card variant="default" className={`${className}`}>
      <Card.Body>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div>
              <Card.Title size="lg">{getPlanDisplayName()}</Card.Title>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>
          </div>
        </div>

        {/* Expiry Information */}
        {plan !== 'lifetime' && endDate && (
          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">วันหมดอายุ</p>
                <p className="text-lg font-semibold">{formatExpiryDate()}</p>
              </div>
              {daysRemaining !== null && !isExpired && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">เหลือเวลา</p>
                  <p className={`text-2xl font-bold ${daysRemaining <= 7 ? 'text-warning' : 'text-success'}`}>
                    {daysRemaining} <span className="text-sm font-normal">วัน</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plan Features */}
        {showFeatures && currentPlan?.features && currentPlan.features.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-600 mb-2">คุณสมบัติ</h4>
            <ul className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {showUpgradeButton && onUpgrade && (
            <Button
              variant="primary"
              size="md"
              block
              className="btn-hover"
              onClick={onUpgrade}
            >
              อัปเกรดแพ็กเกจ
            </Button>
          )}

          {showRenewButton && onRenew && (
            <Button
              variant={isExpired ? 'error' : 'warning'}
              size="md"
              block
              className="btn-hover"
              onClick={onRenew}
            >
              {isExpired ? 'ต่ออายุเลย' : 'ต่ออายุแพ็กเกจ'}
            </Button>
          )}

          {!showUpgradeButton && !showRenewButton && plan === 'lifetime' && (
            <div className="text-center w-full py-2 text-sm text-gray-600">
              <CheckCircleIcon className="w-6 h-6 text-success inline mr-2" />
              คุณใช้งานแพ็กเกจตลอดชีพ ไม่ต้องต่ออายุ
            </div>
          )}
        </div>

        {/* Pending Status Message */}
        {status === 'pending' && (
          <div className="alert alert-warning mt-4">
            <ClockIcon className="w-5 h-5" />
            <div className="text-sm">
              <p className="font-semibold">รอการตรวจสอบ</p>
              <p>การชำระเงินของคุณอยู่ระหว่างการตรวจสอบ กรุณารอสักครู่</p>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
