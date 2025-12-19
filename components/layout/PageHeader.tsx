import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * PageHeader Component - Consistent page headers
 *
 * Features:
 * - Title with optional subtitle
 * - Optional back button
 * - Optional action buttons (settings, help, etc.)
 * - Sizes: sm, md, lg
 * - Responsive design
 *
 * @example
 * ```tsx
 * <PageHeader title="บัญชีของฉัน" />
 *
 * <PageHeader
 *   title="ชำระเงิน"
 *   subtitle="อัปโหลดหลักฐานการชำระเงิน"
 *   showBack
 * />
 *
 * <PageHeader
 *   title="ตั้งค่า"
 *   actions={
 *     <Button size="sm" variant="outline">
 *       <CogIcon className="w-4 h-4" />
 *     </Button>
 *   }
 * />
 * ```
 */

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back button handler */
  onBack?: () => void;
  /** Action buttons (right side) */
  actions?: ReactNode;
  /** Header size */
  size?: 'sm' | 'md' | 'lg';
  /** Center align content */
  centered?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions,
  size = 'md',
  centered = false,
  className = '',
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const getTitleClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xl lg:text-2xl';
      case 'md':
        return 'text-2xl lg:text-3xl';
      case 'lg':
        return 'text-3xl lg:text-4xl';
      default:
        return 'text-2xl lg:text-3xl';
    }
  };

  const getSubtitleClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-sm lg:text-base';
      case 'lg':
        return 'text-base lg:text-lg';
      default:
        return 'text-sm lg:text-base';
    }
  };

  const containerClasses = centered
    ? 'flex flex-col items-center text-center'
    : 'flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4';

  return (
    <div className={`mb-6 lg:mb-8 ${className}`}>
      <div className={containerClasses}>
        {/* Title Section */}
        <div className={centered ? 'text-center' : ''}>
          {/* Back Button + Title */}
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={handleBack}
                className="btn btn-ghost btn-circle btn-sm"
                aria-label="Back"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h1 className={`font-bold text-base-content ${getTitleClasses()}`}>
              {title}
            </h1>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className={`text-base-content/60 mt-2 ${getSubtitleClasses()}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className={centered ? 'mt-4' : 'flex items-center gap-2'}>
            {actions}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="divider my-4 lg:my-6"></div>
    </div>
  );
}

/**
 * PageHeader.Breadcrumbs - Optional breadcrumbs for navigation
 *
 * @example
 * ```tsx
 * <PageHeader title="แพ็กเกจ Premium">
 *   <PageHeader.Breadcrumbs>
 *     <Link href="/">หน้าหลัก</Link>
 *     <Link href="/pricing">แพ็กเกจ</Link>
 *     <span>Premium</span>
 *   </PageHeader.Breadcrumbs>
 * </PageHeader>
 * ```
 */
interface BreadcrumbsProps {
  children: ReactNode;
  className?: string;
}

PageHeader.Breadcrumbs = function Breadcrumbs({
  children,
  className = '',
}: BreadcrumbsProps) {
  return (
    <div className={`text-sm breadcrumbs mb-4 ${className}`}>
      <ul>{children}</ul>
    </div>
  );
};
