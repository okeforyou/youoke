import React, { HTMLAttributes, ReactNode } from 'react';

/**
 * Card Component - Reusable card container with DaisyUI styling
 *
 * Variants:
 * - default: Standard card with shadow and border (most common)
 * - elevated: Card with deeper shadow, no border
 * - bordered: Card with border only, minimal shadow
 * - gradient: Card with gradient background (for highlights/CTAs)
 *
 * @example
 * ```tsx
 * <Card variant="default">
 *   <Card.Body>
 *     <Card.Title>Title</Card.Title>
 *     <p>Content</p>
 *   </Card.Body>
 * </Card>
 *
 * <Card variant="gradient">
 *   <Card.Body>Content with gradient background</Card.Body>
 * </Card>
 * ```
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant style */
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  /** Card children */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export default function Card({
  variant = 'default',
  children,
  className = '',
  ...props
}: CardProps) {

  const getCardClasses = () => {
    const classes = ['card', 'bg-base-100'];

    // Variant classes
    if (variant === 'default') {
      classes.push('shadow-xl', 'border', 'border-base-300');
    } else if (variant === 'elevated') {
      classes.push('shadow-2xl');
    } else if (variant === 'bordered') {
      classes.push('border', 'border-base-300');
    } else if (variant === 'gradient') {
      classes.push('bg-gradient-to-br', 'from-primary/10', 'to-primary/5', 'border', 'border-primary/20');
    }

    // Additional custom classes
    if (className) classes.push(className);

    return classes.join(' ');
  };

  return (
    <div className={getCardClasses()} {...props}>
      {children}
    </div>
  );
}

/**
 * Card.Body - Card body section with padding
 */
interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  /** Custom padding (default: standard card-body padding) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

Card.Body = function CardBody({
  children,
  className = '',
  padding,
  ...props
}: CardBodyProps) {
  const classes = ['card-body'];

  // Custom padding
  if (padding === 'none') {
    classes.push('p-0');
  } else if (padding === 'sm') {
    classes.push('p-4');
  } else if (padding === 'md') {
    classes.push('p-6');
  } else if (padding === 'lg') {
    classes.push('p-8');
  }
  // If no padding specified, use default card-body padding

  if (className) classes.push(className);

  return (
    <div className={classes.join(' ')} {...props}>
      {children}
    </div>
  );
};

/**
 * Card.Title - Card title with consistent styling
 */
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  className?: string;
  /** Title size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

Card.Title = function CardTitle({
  children,
  className = '',
  size = 'lg',
  ...props
}: CardTitleProps) {
  const classes = ['card-title'];

  // Size classes
  if (size === 'sm') classes.push('text-lg');
  else if (size === 'md') classes.push('text-xl');
  else if (size === 'lg') classes.push('text-2xl');
  else if (size === 'xl') classes.push('text-3xl');

  if (className) classes.push(className);

  return (
    <h2 className={classes.join(' ')} {...props}>
      {children}
    </h2>
  );
};
