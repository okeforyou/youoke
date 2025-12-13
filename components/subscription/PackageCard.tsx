import React from 'react';
import { PricingPackage } from '../../types/subscription';

/**
 * Package Card Component - Displays subscription plan in a card format
 *
 * Variants:
 * 1. Current Plan: Green border, "กำลังใช้งาน" badge, disabled button
 * 2. Popular Plan: Primary border, "คุ้มที่สุด" badge, primary button
 * 3. Regular Plan: Base border, no badge, outline button
 *
 * Design System: See CONTRIBUTING.md
 */

export interface PackageCardProps {
  /** The pricing package to display */
  plan: PricingPackage;

  /** Whether this is the user's current plan */
  isCurrentPlan?: boolean;

  /** Callback when user selects this plan */
  onSelect?: (planId: string) => void;

  /** Optional: Number of features to show (default: 3) */
  maxFeatures?: number;

  /** Optional: Custom button text */
  buttonText?: string;
}

export default function PackageCard({
  plan,
  isCurrentPlan = false,
  onSelect,
  maxFeatures = 3,
  buttonText,
}: PackageCardProps) {

  const handleClick = () => {
    if (!isCurrentPlan && onSelect) {
      onSelect(String(plan.id));
    }
  };

  // Determine card styling based on variant
  const getCardClasses = () => {
    if (isCurrentPlan) {
      return "border-success bg-success/10";
    }
    if (plan.popular) {
      return "border-primary bg-primary/5 hover:border-primary hover:shadow-lg";
    }
    return "border-base-300 hover:border-primary/50 hover:shadow-md";
  };

  // Determine button styling
  const getButtonClasses = () => {
    if (isCurrentPlan) {
      return "btn-disabled opacity-50 cursor-not-allowed";
    }
    if (plan.popular) {
      return "btn-primary";
    }
    return "btn-outline btn-primary";
  };

  // Get button text
  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (isCurrentPlan) return "แพ็คเกจปัจจุบัน";
    return "เลือกแพ็คเกจนี้";
  };

  return (
    <div
      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${getCardClasses()}`}
      onClick={!isCurrentPlan ? handleClick : undefined}
    >
      {/* Badges Row */}
      <div className="flex gap-2 mb-3">
        {isCurrentPlan && (
          <div className="badge badge-success badge-sm px-2 py-1 font-medium">
            กำลังใช้งาน
          </div>
        )}
        {plan.popular && !isCurrentPlan && (
          <div className="badge badge-warning badge-sm px-2 py-1 font-medium">
            คุ้มที่สุด
          </div>
        )}
      </div>

      {/* Plan Name & Price */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-lg">{plan.displayName || plan.name}</div>
          <div className="text-sm text-base-content/60">{String(plan.duration)}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">฿{plan.price}</div>
        </div>
      </div>

      {/* Features List - Show only first N features */}
      <ul className="space-y-1.5 mb-4">
        {plan.features.slice(0, maxFeatures).map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-xs">
            <svg
              className="w-4 h-4 text-success flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}

        {/* Show "and N more features" if there are more */}
        {plan.features.length > maxFeatures && (
          <li className="text-xs text-base-content/60 ml-6">
            และอีก {plan.features.length - maxFeatures} ฟีเจอร์
          </li>
        )}
      </ul>

      {/* Action Button */}
      <button
        onClick={handleClick}
        disabled={isCurrentPlan}
        className={`btn btn-block btn-sm ${getButtonClasses()}`}
      >
        {getButtonText()}
      </button>
    </div>
  );
}
