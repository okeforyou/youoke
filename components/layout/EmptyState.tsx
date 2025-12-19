import React, { ReactNode } from 'react';
import {
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  QueueListIcon,
  CreditCardIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';

/**
 * EmptyState Component - Display when no data/results
 *
 * Common Use Cases:
 * - No search results
 * - Empty playlist/queue
 * - No payment history
 * - Empty folder
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="search"
 *   title="ไม่พบผลการค้นหา"
 *   description="ลองค้นหาด้วยคำอื่นดูนะคะ"
 * />
 *
 * <EmptyState
 *   icon="queue"
 *   title="คิวเพลงว่างเปล่า"
 *   description="เพิ่มเพลงเข้าคิวเพื่อเริ่มร้องคาราโอเกะ"
 *   action={<Button onClick={handleAdd}>เพิ่มเพลง</Button>}
 * />
 * ```
 */

export interface EmptyStateProps {
  /** Icon type or custom icon */
  icon?: 'search' | 'playlist' | 'queue' | 'payment' | 'folder' | ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button */
  action?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export default function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {

  const getIcon = () => {
    // If icon is ReactNode, use it directly
    if (typeof icon !== 'string') {
      return icon;
    }

    // Get icon size
    const iconSize = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';

    // Predefined icons
    switch (icon) {
      case 'search':
        return <MagnifyingGlassIcon className={`${iconSize} text-base-content/30`} />;
      case 'playlist':
        return <MusicalNoteIcon className={`${iconSize} text-base-content/30`} />;
      case 'queue':
        return <QueueListIcon className={`${iconSize} text-base-content/30`} />;
      case 'payment':
        return <CreditCardIcon className={`${iconSize} text-base-content/30`} />;
      case 'folder':
        return <FolderIcon className={`${iconSize} text-base-content/30`} />;
      default:
        return <MagnifyingGlassIcon className={`${iconSize} text-base-content/30`} />;
    }
  };

  const getTitleClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-base lg:text-lg';
      case 'md':
        return 'text-lg lg:text-xl';
      case 'lg':
        return 'text-xl lg:text-2xl';
      default:
        return 'text-lg lg:text-xl';
    }
  };

  const getDescriptionClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs lg:text-sm';
      case 'md':
        return 'text-sm lg:text-base';
      case 'lg':
        return 'text-base lg:text-lg';
      default:
        return 'text-sm lg:text-base';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return 'py-8';
      case 'md':
        return 'py-12';
      case 'lg':
        return 'py-16 lg:py-24';
      default:
        return 'py-12';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${getPadding()} ${className}`}>
      {/* Icon */}
      <div className="mb-4">
        {getIcon()}
      </div>

      {/* Title */}
      <h3 className={`font-bold text-base-content mb-2 ${getTitleClasses()}`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`text-base-content/60 max-w-md ${getDescriptionClasses()}`}>
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyState.Card - EmptyState wrapped in a card
 *
 * @example
 * ```tsx
 * <EmptyState.Card
 *   icon="queue"
 *   title="ไม่มีเพลงในคิว"
 *   description="เริ่มเพิ่มเพลงเข้าคิวเพื่อเริ่มร้องคาราโอเกะ"
 * />
 * ```
 */
interface CardProps extends EmptyStateProps {}

EmptyState.Card = function Card(props: CardProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <EmptyState {...props} />
      </div>
    </div>
  );
};

/**
 * EmptyState.Inline - Compact inline variant
 *
 * @example
 * ```tsx
 * <EmptyState.Inline
 *   icon="search"
 *   text="ไม่พบผลการค้นหา"
 * />
 * ```
 */
interface InlineProps {
  icon?: 'search' | 'playlist' | 'queue' | 'payment' | 'folder' | ReactNode;
  text: string;
  action?: ReactNode;
  className?: string;
}

EmptyState.Inline = function Inline({
  icon = 'search',
  text,
  action,
  className = '',
}: InlineProps) {
  const getIcon = () => {
    if (typeof icon !== 'string') {
      return icon;
    }

    const iconSize = 'w-5 h-5';
    switch (icon) {
      case 'search':
        return <MagnifyingGlassIcon className={`${iconSize} text-base-content/40`} />;
      case 'playlist':
        return <MusicalNoteIcon className={`${iconSize} text-base-content/40`} />;
      case 'queue':
        return <QueueListIcon className={`${iconSize} text-base-content/40`} />;
      case 'payment':
        return <CreditCardIcon className={`${iconSize} text-base-content/40`} />;
      case 'folder':
        return <FolderIcon className={`${iconSize} text-base-content/40`} />;
      default:
        return <MagnifyingGlassIcon className={`${iconSize} text-base-content/40`} />;
    }
  };

  return (
    <div className={`flex items-center justify-center gap-3 py-4 ${className}`}>
      {getIcon()}
      <span className="text-base-content/60 text-sm">{text}</span>
      {action}
    </div>
  );
};
