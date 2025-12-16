import React, { HTMLAttributes, ReactNode } from 'react';

/**
 * Badge Component - Reusable badge/label with DaisyUI styling
 *
 * Variants:
 * - primary: Primary color badge
 * - secondary: Secondary color badge
 * - success: Success/green badge (approved, active)
 * - warning: Warning/yellow badge (pending)
 * - error: Error/red badge (rejected, expired)
 * - info: Info/blue badge
 * - ghost: Transparent badge
 * - outline: Outlined badge
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" size="lg">Pending</Badge>
 * <Badge variant="outline">Free</Badge>
 * ```
 */

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Badge variant style */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'outline';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Badge children (text or icons) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export default function Badge({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: BadgeProps) {

  const getBadgeClasses = () => {
    const classes = ['badge'];

    // Variant classes
    if (variant === 'primary') classes.push('badge-primary');
    else if (variant === 'secondary') classes.push('badge-secondary');
    else if (variant === 'success') classes.push('badge-success');
    else if (variant === 'warning') classes.push('badge-warning');
    else if (variant === 'error') classes.push('badge-error');
    else if (variant === 'info') classes.push('badge-info');
    else if (variant === 'ghost') classes.push('badge-ghost');
    else if (variant === 'outline') classes.push('badge-outline');

    // Size classes
    if (size === 'sm') classes.push('badge-sm');
    else if (size === 'lg') classes.push('badge-lg');
    // md is default, no class needed

    // Additional custom classes
    if (className) classes.push(className);

    return classes.join(' ');
  };

  return (
    <div className={getBadgeClasses()} {...props}>
      {children}
    </div>
  );
}
