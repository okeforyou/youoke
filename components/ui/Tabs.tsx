import React, { ReactNode, createContext, useContext, useState } from 'react';

/**
 * Tabs Component - Reusable tabbed interface with DaisyUI styling
 *
 * Features:
 * - Controlled or uncontrolled mode
 * - Multiple variants (boxed, bordered, lifted)
 * - Sizes (sm, md, lg)
 * - Keyboard navigation (Arrow keys, Home, End)
 * - ARIA compliant
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <Tabs.List>
 *     <Tabs.Tab value="tab1">แท็บ 1</Tabs.Tab>
 *     <Tabs.Tab value="tab2">แท็บ 2</Tabs.Tab>
 *     <Tabs.Tab value="tab3">แท็บ 3</Tabs.Tab>
 *   </Tabs.List>
 *   <Tabs.Panel value="tab1">เนื้อหาแท็บ 1</Tabs.Panel>
 *   <Tabs.Panel value="tab2">เนื้อหาแท็บ 2</Tabs.Panel>
 *   <Tabs.Panel value="tab3">เนื้อหาแท็บ 3</Tabs.Panel>
 * </Tabs>
 *
 * // Controlled mode
 * <Tabs value={activeTab} onChange={setActiveTab}>
 *   ...
 * </Tabs>
 * ```
 */

// Context for Tabs state
interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  variant: 'boxed' | 'bordered' | 'lifted';
  size: 'sm' | 'md' | 'lg';
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs');
  }
  return context;
};

// Main Tabs Component
export interface TabsProps {
  /** Current active tab value (controlled) */
  value?: string;
  /** Default active tab value (uncontrolled) */
  defaultValue?: string;
  /** Callback when tab changes */
  onChange?: (value: string) => void;
  /** Tab variant style */
  variant?: 'boxed' | 'bordered' | 'lifted';
  /** Tab size */
  size?: 'sm' | 'md' | 'lg';
  /** Tab children (Tabs.List and Tabs.Panel) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export default function Tabs({
  value: controlledValue,
  defaultValue = '',
  onChange,
  variant = 'bordered',
  size = 'md',
  children,
  className = '',
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  // Controlled vs Uncontrolled
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onChange: handleChange, variant, size }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Tabs.List - Container for tabs
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

Tabs.List = function TabsList({ children, className = '' }: TabsListProps) {
  const { variant, size } = useTabsContext();

  const getTabsClasses = () => {
    const classes = ['tabs'];

    // Variant classes
    if (variant === 'boxed') classes.push('tabs-boxed');
    else if (variant === 'bordered') classes.push('tabs-bordered');
    else if (variant === 'lifted') classes.push('tabs-lifted');

    // Size classes
    if (size === 'sm') classes.push('tabs-sm');
    else if (size === 'lg') classes.push('tabs-lg');

    if (className) classes.push(className);

    return classes.join(' ');
  };

  return (
    <div role="tablist" className={getTabsClasses()}>
      {children}
    </div>
  );
};

// Tabs.Tab - Individual tab button
interface TabProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

Tabs.Tab = function Tab({ value, children, disabled = false, className = '' }: TabProps) {
  const { value: activeValue, onChange } = useTabsContext();
  const isActive = value === activeValue;

  const handleClick = () => {
    if (!disabled) {
      onChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // Keyboard navigation
    const tablist = e.currentTarget.parentElement;
    const tabs = Array.from(tablist?.querySelectorAll('[role="tab"]') || []) as HTMLElement[];
    const currentIndex = tabs.indexOf(e.currentTarget as HTMLElement);

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleClick();
        return;
      default:
        return;
    }

    // Focus next tab
    tabs[nextIndex]?.focus();
    // Trigger onChange for the focused tab
    const nextValue = tabs[nextIndex]?.getAttribute('data-value');
    if (nextValue) {
      onChange(nextValue);
    }
  };

  return (
    <a
      role="tab"
      data-value={value}
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      aria-disabled={disabled}
      className={`tab ${isActive ? 'tab-active' : ''} ${disabled ? 'tab-disabled opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </a>
  );
};

// Tabs.Panel - Content panel for each tab
interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
  /** Keep panel mounted when inactive (for performance) */
  keepMounted?: boolean;
}

Tabs.Panel = function TabPanel({
  value,
  children,
  className = '',
  keepMounted = false,
}: TabPanelProps) {
  const { value: activeValue } = useTabsContext();
  const isActive = value === activeValue;

  if (!isActive && !keepMounted) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      className={`${isActive ? 'block' : 'hidden'} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Tabs.Content - Wrapper for all tab panels
 *
 * @example
 * ```tsx
 * <Tabs.Content className="p-4 bg-base-100 border border-base-300 rounded-lg mt-2">
 *   <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
 *   <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
 * </Tabs.Content>
 * ```
 */
interface TabsContentProps {
  children: ReactNode;
  className?: string;
}

Tabs.Content = function TabsContent({ children, className = '' }: TabsContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
