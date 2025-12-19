import React, { ReactNode } from 'react';
import BottomNavigation from '../BottomNavigation';

/**
 * AppShell Component - Main layout wrapper for pages
 *
 * Features:
 * - Consistent page structure
 * - Optional BottomNavigation
 * - Background variants (solid, gradient)
 * - Container max-width options
 * - Responsive padding
 *
 * @example
 * ```tsx
 * <AppShell>
 *   <h1>Page Content</h1>
 * </AppShell>
 *
 * <AppShell
 *   background="gradient"
 *   maxWidth="lg"
 *   showBottomNav={false}
 * >
 *   <h1>Custom Layout</h1>
 * </AppShell>
 * ```
 */

export interface AppShellProps {
  /** Page content */
  children: ReactNode;
  /** Background style */
  background?: 'solid' | 'gradient' | 'transparent';
  /** Max width of content container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | 'full';
  /** Show bottom navigation */
  showBottomNav?: boolean;
  /** Custom container padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export default function AppShell({
  children,
  background = 'solid',
  maxWidth = '5xl',
  showBottomNav = true,
  padding = 'md',
  className = '',
}: AppShellProps) {

  const getBackgroundClasses = () => {
    switch (background) {
      case 'gradient':
        return 'bg-gradient-to-br from-base-200 via-base-100 to-base-200';
      case 'transparent':
        return 'bg-transparent';
      case 'solid':
      default:
        return 'bg-base-100';
    }
  };

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '5xl':
        return 'max-w-5xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-5xl';
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'px-2 py-3 lg:py-6';
      case 'md':
        return 'px-4 py-6 lg:py-12';
      case 'lg':
        return 'px-6 py-8 lg:py-16';
      default:
        return 'px-4 py-6 lg:py-12';
    }
  };

  // Padding bottom for BottomNavigation (mobile: pb-24, desktop: pb-8)
  const bottomPadding = showBottomNav ? 'pb-24 lg:pb-8' : '';

  return (
    <div
      className={`min-h-screen ${getBackgroundClasses()} ${bottomPadding} ${className}`}
    >
      {/* Main Content Container */}
      <div className={`container mx-auto ${getMaxWidthClass()} ${getPaddingClasses()}`}>
        {children}
      </div>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}

/**
 * AppShell.Content - Optional content wrapper for additional styling
 *
 * @example
 * ```tsx
 * <AppShell>
 *   <AppShell.Content className="space-y-6">
 *     <Card>...</Card>
 *     <Card>...</Card>
 *   </AppShell.Content>
 * </AppShell>
 * ```
 */
interface ContentProps {
  children: ReactNode;
  className?: string;
}

AppShell.Content = function Content({ children, className = '' }: ContentProps) {
  return <div className={className}>{children}</div>;
};
