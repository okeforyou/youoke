import React, { InputHTMLAttributes, ReactNode } from 'react';

/**
 * Input Component - Reusable form input with DaisyUI styling
 *
 * Features:
 * - Label, placeholder, helper text, error message support
 * - Multiple input types (text, email, password, number, tel)
 * - Error state with visual feedback
 * - Icon support (left/right)
 * - Sizes: sm, md, lg
 *
 * @example
 * ```tsx
 * <Input
 *   type="email"
 *   label="อีเมล"
 *   placeholder="name@example.com"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error="อีเมลไม่ถูกต้อง"
 *   required
 * />
 * ```
 */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (if string) or error state (if boolean) */
  error?: string | boolean;
  /** Icon on the left side */
  leftIcon?: ReactNode;
  /** Icon on the right side */
  rightIcon?: ReactNode;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes for the input */
  className?: string;
  /** Additional CSS classes for the container */
  containerClassName?: string;
}

export default function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  size = 'md',
  className = '',
  containerClassName = '',
  type = 'text',
  disabled = false,
  ...props
}: InputProps) {

  const getSizeClasses = () => {
    if (size === 'sm') return 'input-sm';
    if (size === 'lg') return 'input-lg';
    return ''; // md is default
  };

  const getInputClasses = () => {
    const classes = [
      'input',
      'input-bordered',
      'w-full',
      getSizeClasses(),
    ];

    // Error state
    if (error) {
      classes.push('input-error');
    }

    // Disabled state
    if (disabled) {
      classes.push('input-disabled');
    }

    // Icon padding
    if (leftIcon) classes.push('pl-10');
    if (rightIcon) classes.push('pr-10');

    // Additional custom classes
    if (className) classes.push(className);

    return classes.join(' ');
  };

  return (
    <div className={`form-control ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label className="label">
          <span className="label-text font-medium">{label}</span>
        </label>
      )}

      {/* Input Container (for icons) */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
            {leftIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={type}
          disabled={disabled}
          className={getInputClasses()}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <label className="label">
          <span className={`label-text-alt ${error ? 'text-error' : 'text-base-content/60'}`}>
            {typeof error === 'string' ? error : helperText}
          </span>
        </label>
      )}
    </div>
  );
}
