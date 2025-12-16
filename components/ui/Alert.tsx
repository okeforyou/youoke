import React, { HTMLAttributes, ReactNode } from 'react';
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/**
 * Alert Component - Reusable notification/message box with DaisyUI styling
 *
 * Variants:
 * - info: Information message (blue)
 * - success: Success message (green)
 * - warning: Warning message (yellow/orange)
 * - error: Error message (red)
 *
 * Features:
 * - Title and description
 * - Icon support (auto or custom)
 * - Dismissible with close button
 * - Sizes: sm, md, lg
 *
 * @example
 * ```tsx
 * <Alert variant="success" title="สำเร็จ!">
 *   บันทึกข้อมูลเรียบร้อยแล้ว
 * </Alert>
 *
 * <Alert
 *   variant="error"
 *   title="เกิดข้อผิดพลาด"
 *   onClose={() => setShowAlert(false)}
 * >
 *   กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง
 * </Alert>
 * ```
 */

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Alert variant style */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Alert title */
  title?: string;
  /** Alert content/description */
  children?: ReactNode;
  /** Custom icon (if not provided, uses default icon based on variant) */
  icon?: ReactNode;
  /** Size of the alert */
  size?: 'sm' | 'md' | 'lg';
  /** Show close button */
  dismissible?: boolean;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export default function Alert({
  variant = 'info',
  title,
  children,
  icon,
  size = 'md',
  dismissible = false,
  onClose,
  className = '',
  ...props
}: AlertProps) {

  // Default icons based on variant
  const getDefaultIcon = () => {
    const iconClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6';

    switch (variant) {
      case 'success':
        return <CheckCircleIcon className={iconClass} />;
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />;
      case 'error':
        return <XCircleIcon className={iconClass} />;
      case 'info':
      default:
        return <InformationCircleIcon className={iconClass} />;
    }
  };

  const getAlertClasses = () => {
    const classes = ['alert'];

    // Variant classes
    if (variant === 'info') classes.push('alert-info');
    else if (variant === 'success') classes.push('alert-success');
    else if (variant === 'warning') classes.push('alert-warning');
    else if (variant === 'error') classes.push('alert-error');

    // Size classes
    if (size === 'sm') classes.push('text-sm py-2');
    else if (size === 'lg') classes.push('text-lg py-6');

    // Additional custom classes
    if (className) classes.push(className);

    return classes.join(' ');
  };

  return (
    <div role="alert" className={getAlertClasses()} {...props}>
      {/* Icon */}
      {icon || getDefaultIcon()}

      {/* Content */}
      <div className="flex-1">
        {title && <h3 className="font-bold">{title}</h3>}
        {children && <div className={title ? 'text-sm mt-1' : ''}>{children}</div>}
      </div>

      {/* Close Button */}
      {dismissible && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-ghost btn-circle"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/**
 * Alert.Container - Wrapper for positioning alerts (e.g., toast notifications)
 *
 * @example
 * ```tsx
 * <Alert.Container position="top-right">
 *   <Alert variant="success">Saved!</Alert>
 * </Alert.Container>
 * ```
 */
interface AlertContainerProps {
  children: ReactNode;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  className?: string;
}

Alert.Container = function AlertContainer({
  children,
  position = 'top-right',
  className = '',
}: AlertContainerProps) {
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 p-4 space-y-4';

    switch (position) {
      case 'top-left':
        return `${baseClasses} top-0 left-0`;
      case 'top-center':
        return `${baseClasses} top-0 left-1/2 -translate-x-1/2`;
      case 'top-right':
        return `${baseClasses} top-0 right-0`;
      case 'bottom-left':
        return `${baseClasses} bottom-0 left-0`;
      case 'bottom-center':
        return `${baseClasses} bottom-0 left-1/2 -translate-x-1/2`;
      case 'bottom-right':
        return `${baseClasses} bottom-0 right-0`;
      default:
        return `${baseClasses} top-0 right-0`;
    }
  };

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      {children}
    </div>
  );
};
