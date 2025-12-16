import React, { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Button Component - Reusable button with DaisyUI styling
 *
 * Supports all common button patterns used in the app:
 * - Variants: primary, secondary, success, error, outline, ghost
 * - Sizes: sm, md (default), lg
 * - States: loading, disabled
 * - Modifiers: block (full width), circle (icon button)
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg">เลือกแพ็กเกจ</Button>
 * <Button variant="success" loading>กำลังโหลด...</Button>
 * <Button variant="outline" block>ปุ่มเต็มความกว้าง</Button>
 * <Button variant="ghost" size="sm" circle><XMarkIcon /></Button>
 * ```
 */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading spinner */
  loading?: boolean;
  /** Full width button */
  block?: boolean;
  /** Circle button (for icons) */
  circle?: boolean;
  /** Button children (text or icons) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  circle = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {

  // Build DaisyUI class string
  const getButtonClasses = () => {
    const classes = ['btn'];

    // Variant classes
    if (variant === 'primary') classes.push('btn-primary');
    else if (variant === 'secondary') classes.push('btn-secondary');
    else if (variant === 'success') classes.push('btn-success');
    else if (variant === 'error') classes.push('btn-error');
    else if (variant === 'warning') classes.push('btn-warning');
    else if (variant === 'info') classes.push('btn-info');
    else if (variant === 'outline') classes.push('btn-outline');
    else if (variant === 'ghost') classes.push('btn-ghost');

    // Size classes
    if (size === 'sm') classes.push('btn-sm');
    else if (size === 'lg') classes.push('btn-lg');

    // Modifier classes
    if (block) classes.push('btn-block');
    if (circle) classes.push('btn-circle');

    // Additional custom classes
    if (className) classes.push(className);

    return classes.join(' ');
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={getButtonClasses()}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        children
      )}
    </button>
  );
}
