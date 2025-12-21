import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { PricingPackage } from '../../types/subscription';

/**
 * PricingComparison Component
 *
 * Side-by-side comparison table for pricing packages.
 * Shows features comparison with checkmarks/crosses.
 *
 * @example
 * ```tsx
 * <PricingComparison
 *   packages={[freePlan, monthlyPlan, yearlyPlan, lifetimePlan]}
 *   currentPlanId="monthly"
 *   onSelect={(pkg) => handleSelectPackage(pkg)}
 *   featureComparison={[
 *     { name: 'เพลงไม่จำกัด', free: true, monthly: true, yearly: true, lifetime: true },
 *     { name: 'ไม่มีโฆษณา', free: false, monthly: true, yearly: true, lifetime: true },
 *     { name: 'ห้องพิเศษ', free: false, monthly: false, yearly: true, lifetime: true },
 *   ]}
 * />
 * ```
 */

export interface FeatureComparison {
  /** Feature name */
  name: string;
  /** Description (optional) */
  description?: string;
  /** Value for each plan (true/false for checkmark, string for custom value) */
  [key: string]: boolean | string | undefined;
}

export interface PricingComparisonProps {
  /** Pricing packages to compare */
  packages: PricingPackage[];
  /** Current user's plan ID (to highlight) */
  currentPlanId?: string;
  /** Callback when user selects a package */
  onSelect?: (pkg: PricingPackage) => void;
  /** Feature comparison data */
  featureComparison?: FeatureComparison[];
  /** Additional CSS classes */
  className?: string;
}

export default function PricingComparison({
  packages,
  currentPlanId,
  onSelect,
  featureComparison,
  className = '',
}: PricingComparisonProps) {
  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'ฟรี';
    return `฿${price.toLocaleString()}`;
  };

  // Format duration
  const formatDuration = (duration: number | string) => {
    if (duration === 0 || duration === 'lifetime') return 'ตลอดชีพ';
    if (typeof duration === 'number') {
      if (duration >= 365) return `${Math.floor(duration / 365)} ปี`;
      if (duration >= 30) return `${Math.floor(duration / 30)} เดือน`;
      return `${duration} วัน`;
    }
    return duration;
  };

  // Render feature value (checkmark, cross, or custom text)
  const renderFeatureValue = (value: boolean | string | undefined) => {
    if (value === true) {
      return <CheckCircleIcon className="w-6 h-6 text-success mx-auto" />;
    }
    if (value === false) {
      return <XCircleIcon className="w-6 h-6 text-gray-300 mx-auto" />;
    }
    if (typeof value === 'string') {
      return <span className="text-sm text-gray-700">{value}</span>;
    }
    return <XCircleIcon className="w-6 h-6 text-gray-300 mx-auto" />;
  };

  return (
    <div className={className}>
      <Table pinHeader responsive={false} className="table-fixed">
        {/* Header Row - Package Names */}
        <Table.Header>
          <Table.Row>
            <Table.Head className="w-1/4 bg-base-200 sticky left-0 z-10">
              <span className="text-sm font-semibold">คุณสมบัติ</span>
            </Table.Head>
            {packages.map((pkg) => {
              const isCurrent = pkg.id === currentPlanId;
              return (
                <Table.Head
                  key={pkg.id}
                  align="center"
                  className={`${isCurrent ? 'bg-primary/10' : ''}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{pkg.displayName || pkg.name}</span>
                      {pkg.popular && (
                        <Badge variant="primary" size="sm">ยอดนิยม</Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="success" size="sm">ปัจจุบัน</Badge>
                      )}
                    </div>
                    {pkg.discount && (
                      <Badge variant="warning" size="sm">
                        ลด {pkg.discount.percentage}%
                      </Badge>
                    )}
                  </div>
                </Table.Head>
              );
            })}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {/* Price Row */}
          <Table.Row>
            <Table.Cell className="font-semibold bg-base-200 sticky left-0 z-10">
              ราคา
            </Table.Cell>
            {packages.map((pkg) => {
              const isCurrent = pkg.id === currentPlanId;
              return (
                <Table.Cell
                  key={pkg.id}
                  align="center"
                  className={`${isCurrent ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(pkg.price)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(pkg.duration)}
                    </span>
                  </div>
                </Table.Cell>
              );
            })}
          </Table.Row>

          {/* Feature Comparison Rows */}
          {featureComparison && featureComparison.map((feature, index) => (
            <Table.Row key={index}>
              <Table.Cell className="bg-base-200 sticky left-0 z-10">
                <div>
                  <p className="font-medium text-sm">{feature.name}</p>
                  {feature.description && (
                    <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                  )}
                </div>
              </Table.Cell>
              {packages.map((pkg) => {
                const isCurrent = pkg.id === currentPlanId;
                const featureValue = feature[pkg.id];
                return (
                  <Table.Cell
                    key={pkg.id}
                    align="center"
                    className={`${isCurrent ? 'bg-primary/5' : ''}`}
                  >
                    {renderFeatureValue(featureValue)}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}

          {/* Default Features (from package.features if no featureComparison) */}
          {!featureComparison && (
            <>
              {/* Get all unique features */}
              {Array.from(
                new Set(packages.flatMap((pkg) => pkg.features))
              ).map((featureName, index) => (
                <Table.Row key={index}>
                  <Table.Cell className="bg-base-200 sticky left-0 z-10">
                    <p className="font-medium text-sm">{featureName}</p>
                  </Table.Cell>
                  {packages.map((pkg) => {
                    const isCurrent = pkg.id === currentPlanId;
                    const hasFeature = pkg.features.includes(featureName);
                    return (
                      <Table.Cell
                        key={pkg.id}
                        align="center"
                        className={`${isCurrent ? 'bg-primary/5' : ''}`}
                      >
                        {hasFeature ? (
                          <CheckCircleIcon className="w-6 h-6 text-success mx-auto" />
                        ) : (
                          <XCircleIcon className="w-6 h-6 text-gray-300 mx-auto" />
                        )}
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              ))}
            </>
          )}

          {/* Action Row - Select Buttons */}
          {onSelect && (
            <Table.Row>
              <Table.Cell className="bg-base-200 sticky left-0 z-10">
                <span className="font-semibold text-sm">เลือกแพ็กเกจ</span>
              </Table.Cell>
              {packages.map((pkg) => {
                const isCurrent = pkg.id === currentPlanId;
                return (
                  <Table.Cell
                    key={pkg.id}
                    align="center"
                    className={`${isCurrent ? 'bg-primary/5' : ''}`}
                  >
                    <Button
                      variant={isCurrent ? 'secondary' : pkg.popular ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onSelect(pkg)}
                      disabled={isCurrent}
                      className="btn-hover"
                    >
                      {isCurrent ? 'แพ็กเกจปัจจุบัน' : 'เลือกแพ็กเกจนี้'}
                    </Button>
                  </Table.Cell>
                );
              })}
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}

/**
 * PricingComparison.Mobile - Mobile-friendly card view for pricing comparison
 *
 * @example
 * ```tsx
 * <PricingComparison.Mobile
 *   packages={packages}
 *   currentPlanId="monthly"
 *   onSelect={handleSelect}
 * />
 * ```
 */
interface PricingComparisonMobileProps {
  packages: PricingPackage[];
  currentPlanId?: string;
  onSelect?: (pkg: PricingPackage) => void;
  className?: string;
}

PricingComparison.Mobile = function PricingComparisonMobile({
  packages,
  currentPlanId,
  onSelect,
  className = '',
}: PricingComparisonMobileProps) {
  const formatPrice = (price: number) => {
    if (price === 0) return 'ฟรี';
    return `฿${price.toLocaleString()}`;
  };

  const formatDuration = (duration: number | string) => {
    if (duration === 0 || duration === 'lifetime') return 'ตลอดชีพ';
    if (typeof duration === 'number') {
      if (duration >= 365) return `${Math.floor(duration / 365)} ปี`;
      if (duration >= 30) return `${Math.floor(duration / 30)} เดือน`;
      return `${duration} วัน`;
    }
    return duration;
  };

  return (
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      {packages.map((pkg) => {
        const isCurrent = pkg.id === currentPlanId;
        return (
          <div
            key={pkg.id}
            className={`card bg-white shadow-lg border-2 ${isCurrent ? 'border-success' : pkg.popular ? 'border-primary' : 'border-base-300'}`}
          >
            <div className="card-body">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="card-title text-xl">{pkg.displayName || pkg.name}</h3>
                <div className="flex gap-1">
                  {pkg.popular && <Badge variant="primary" size="sm">ยอดนิยม</Badge>}
                  {isCurrent && <Badge variant="success" size="sm">ปัจจุบัน</Badge>}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="text-3xl font-bold text-primary">{formatPrice(pkg.price)}</div>
                <div className="text-sm text-gray-500">{formatDuration(pkg.duration)}</div>
                {pkg.discount && (
                  <Badge variant="warning" size="sm" className="mt-2">
                    ลด {pkg.discount.percentage}%
                  </Badge>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action */}
              {onSelect && (
                <Button
                  variant={isCurrent ? 'secondary' : pkg.popular ? 'primary' : 'outline'}
                  size="md"
                  block
                  onClick={() => onSelect(pkg)}
                  disabled={isCurrent}
                  className="btn-hover"
                >
                  {isCurrent ? 'แพ็กเกจปัจจุบัน' : 'เลือกแพ็กเกจนี้'}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
