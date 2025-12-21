import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Dropdown Component - Reusable dropdown menu with DaisyUI styling
 *
 * Features:
 * - Multiple positions (top, bottom, left, right, center)
 * - Hover or click trigger
 * - Keyboard navigation (Arrow keys, Escape, Enter)
 * - ARIA compliant
 * - Custom trigger support
 *
 * @example
 * ```tsx
 * <Dropdown>
 *   <Dropdown.Trigger>เปิดเมนู</Dropdown.Trigger>
 *   <Dropdown.Menu>
 *     <Dropdown.Item onClick={() => console.log('Profile')}>
 *       โปรไฟล์
 *     </Dropdown.Item>
 *     <Dropdown.Item onClick={() => console.log('Settings')}>
 *       ตั้งค่า
 *     </Dropdown.Item>
 *     <Dropdown.Divider />
 *     <Dropdown.Item onClick={() => console.log('Logout')}>
 *       ออกจากระบบ
 *     </Dropdown.Item>
 *   </Dropdown.Menu>
 * </Dropdown>
 *
 * // With custom trigger
 * <Dropdown>
 *   <Dropdown.Trigger>
 *     <button className="btn btn-ghost btn-circle">
 *       <UserIcon className="w-6 h-6" />
 *     </button>
 *   </Dropdown.Trigger>
 *   <Dropdown.Menu>...</Dropdown.Menu>
 * </Dropdown>
 * ```
 */

export interface DropdownProps {
  /** Dropdown children (Dropdown.Trigger and Dropdown.Menu) */
  children: ReactNode;
  /** Dropdown position */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  /** Open on hover instead of click */
  hover?: boolean;
  /** Keep dropdown open (controlled) */
  open?: boolean;
  /** Callback when dropdown opens/closes */
  onOpenChange?: (open: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

export default function Dropdown({
  children,
  position = 'bottom',
  hover = false,
  open: controlledOpen,
  onOpenChange,
  className = '',
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const newOpen = !isOpen;
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const handleClose = () => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getPositionClass = () => {
    const positionMap = {
      'top': 'dropdown-top',
      'bottom': 'dropdown-bottom',
      'left': 'dropdown-left',
      'right': 'dropdown-right',
      'top-start': 'dropdown-top dropdown-start',
      'top-end': 'dropdown-top dropdown-end',
      'bottom-start': 'dropdown-bottom dropdown-start',
      'bottom-end': 'dropdown-bottom dropdown-end',
    };
    return positionMap[position] || 'dropdown-bottom';
  };

  return (
    <div
      ref={dropdownRef}
      className={`dropdown ${getPositionClass()} ${hover ? 'dropdown-hover' : ''} ${isOpen ? 'dropdown-open' : ''} ${className}`}
      onClick={!hover ? handleToggle : undefined}
    >
      {children}
    </div>
  );
}

// Dropdown.Trigger - Trigger element
interface DropdownTriggerProps {
  /** Trigger content (button text or custom element) */
  children: ReactNode;
  /** Show chevron icon */
  showChevron?: boolean;
  /** Additional CSS classes */
  className?: string;
}

Dropdown.Trigger = function DropdownTrigger({
  children,
  showChevron = true,
  className = '',
}: DropdownTriggerProps) {
  // If children is a string, wrap in button
  if (typeof children === 'string') {
    return (
      <button
        tabIndex={0}
        className={`btn ${className}`}
        role="button"
        aria-haspopup="true"
      >
        {children}
        {showChevron && <ChevronDownIcon className="w-4 h-4 ml-1" />}
      </button>
    );
  }

  // If children is a custom element, return as-is
  return (
    <div tabIndex={0} role="button" aria-haspopup="true" className={className}>
      {children}
    </div>
  );
};

// Dropdown.Menu - Menu container
interface DropdownMenuProps {
  /** Menu items */
  children: ReactNode;
  /** Menu width */
  width?: 'auto' | 'full' | number;
  /** Additional CSS classes */
  className?: string;
}

Dropdown.Menu = function DropdownMenu({
  children,
  width = 'auto',
  className = '',
}: DropdownMenuProps) {
  const getWidthClass = () => {
    if (width === 'full') return 'w-full';
    if (typeof width === 'number') return `w-${width}`;
    return 'w-52'; // Default width
  };

  return (
    <ul
      tabIndex={0}
      className={`dropdown-content menu bg-base-100 rounded-box z-[1] ${getWidthClass()} p-2 shadow-lg border border-base-300 ${className}`}
      role="menu"
    >
      {children}
    </ul>
  );
};

// Dropdown.Item - Menu item
interface DropdownItemProps {
  /** Item content */
  children: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Active/selected state */
  active?: boolean;
  /** Left icon */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

Dropdown.Item = function DropdownItem({
  children,
  onClick,
  disabled = false,
  active = false,
  icon,
  className = '',
}: DropdownItemProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <li className={disabled ? 'disabled opacity-50' : ''}>
      <a
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        className={`${active ? 'active' : ''} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-disabled={disabled}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </a>
    </li>
  );
};

// Dropdown.Divider - Menu divider
interface DropdownDividerProps {
  className?: string;
}

Dropdown.Divider = function DropdownDivider({ className = '' }: DropdownDividerProps) {
  return <li className={`divider my-0 ${className}`} role="separator"></li>;
};

// Dropdown.Header - Menu header/title
interface DropdownHeaderProps {
  children: ReactNode;
  className?: string;
}

Dropdown.Header = function DropdownHeader({
  children,
  className = '',
}: DropdownHeaderProps) {
  return (
    <li className={`menu-title ${className}`}>
      <span>{children}</span>
    </li>
  );
};

/**
 * Dropdown.Group - Group menu items
 *
 * @example
 * ```tsx
 * <Dropdown.Menu>
 *   <Dropdown.Header>บัญชี</Dropdown.Header>
 *   <Dropdown.Group>
 *     <Dropdown.Item>โปรไฟล์</Dropdown.Item>
 *     <Dropdown.Item>ตั้งค่า</Dropdown.Item>
 *   </Dropdown.Group>
 *   <Dropdown.Divider />
 *   <Dropdown.Header>อื่นๆ</Dropdown.Header>
 *   <Dropdown.Group>
 *     <Dropdown.Item>ความช่วยเหลือ</Dropdown.Item>
 *     <Dropdown.Item>ออกจากระบบ</Dropdown.Item>
 *   </Dropdown.Group>
 * </Dropdown.Menu>
 * ```
 */
interface DropdownGroupProps {
  children: ReactNode;
  className?: string;
}

Dropdown.Group = function DropdownGroup({
  children,
  className = '',
}: DropdownGroupProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
