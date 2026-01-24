import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNavigation from '../BottomNavigation';

/**
 * MainLayout Component - Universal layout with Sidebar
 *
 * Provides consistent layout across all pages:
 * - Desktop: Sidebar (left) + Content (center) + Optional right panel
 * - Mobile: Full-width content + Bottom Navigation
 *
 * @example
 * // Login page (centered form)
 * <MainLayout centered maxWidth="md">
 *   <LoginForm />
 * </MainLayout>
 *
 * // Account page (full width)
 * <MainLayout maxWidth="xl">
 *   <PageHeader />
 *   <UserProfile />
 * </MainLayout>
 */

export interface MainLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Active tab index for Sidebar (undefined = no active tab) */
  activeTab?: number;
  /** Max width of content container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Center content vertically and horizontally (for forms) */
  centered?: boolean;
  /** Additional CSS classes for content wrapper */
  className?: string;
  /** Padding size for content area */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function MainLayout({
  children,
  activeTab,
  maxWidth = 'full',
  centered = false,
  className = '',
  padding = 'md',
}: MainLayoutProps) {

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
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-full';
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-2 lg:p-4';
      case 'md':
        return 'p-4 lg:p-6';
      case 'lg':
        return 'p-6 lg:p-8';
      default:
        return 'p-4 lg:p-6';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <Sidebar
        className="hidden lg:flex"
        activeTab={activeTab}
      />

      {/* Main Content Area */}
      <main
        className={`
          flex-1 bg-base-100 overflow-y-auto
          ${centered ? 'flex items-center justify-center' : ''}
        `}
      >
        <div
          className={`
            ${centered ? 'w-full' : 'mx-auto'}
            ${getMaxWidthClass()}
            ${getPaddingClass()}
            ${className}
          `}
        >
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
}

/**
 * MainLayout.Content - Optional content wrapper with spacing
 *
 * @example
 * <MainLayout>
 *   <MainLayout.Content className="space-y-6">
 *     <Card>...</Card>
 *     <Card>...</Card>
 *   </MainLayout.Content>
 * </MainLayout>
 */
interface ContentProps {
  children: ReactNode;
  className?: string;
}

MainLayout.Content = function Content({ children, className = '' }: ContentProps) {
  return <div className={className}>{children}</div>;
};
