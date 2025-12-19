import React, { ReactNode } from 'react';

/**
 * LoadingScreen Component - Loading states for better UX
 *
 * Variants:
 * - fullscreen: Full page loading with logo
 * - inline: Inline loading spinner
 * - skeleton-card: Card skeleton (for lists)
 * - skeleton-text: Text skeleton (for paragraphs)
 *
 * @example
 * ```tsx
 * // Full page loading
 * <LoadingScreen variant="fullscreen" text="กำลังโหลด..." />
 *
 * // Inline loading
 * <LoadingScreen variant="inline" />
 *
 * // Skeleton cards
 * <LoadingScreen variant="skeleton-card" count={3} />
 * ```
 */

export interface LoadingScreenProps {
  /** Loading variant */
  variant?: 'fullscreen' | 'inline' | 'skeleton-card' | 'skeleton-text';
  /** Loading text (for fullscreen/inline) */
  text?: string;
  /** Number of skeleton items (for skeleton variants) */
  count?: number;
  /** Custom size for inline variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export default function LoadingScreen({
  variant = 'fullscreen',
  text = 'กำลังโหลด...',
  count = 3,
  size = 'md',
  className = '',
}: LoadingScreenProps) {

  // Fullscreen loading
  if (variant === 'fullscreen') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-base-100 ${className}`}>
        <div className="text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/icon-512.png"
              alt="YouOke"
              width={120}
              height={120}
              className="mx-auto opacity-80"
            />
          </div>

          {/* Spinner */}
          <span className="loading loading-spinner loading-lg text-primary"></span>

          {/* Text */}
          {text && (
            <p className="mt-4 text-base-content/60 text-sm lg:text-base">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Inline loading
  if (variant === 'inline') {
    const getSizeClass = () => {
      switch (size) {
        case 'sm':
          return 'loading-sm';
        case 'md':
          return 'loading-md';
        case 'lg':
          return 'loading-lg';
        default:
          return 'loading-md';
      }
    };

    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <span className={`loading loading-spinner ${getSizeClass()} text-primary`}></span>
          {text && (
            <p className="mt-3 text-base-content/60 text-sm">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Skeleton Card
  if (variant === 'skeleton-card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex gap-4">
                {/* Avatar skeleton */}
                <div className="skeleton w-16 h-16 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-3">
                  {/* Title skeleton */}
                  <div className="skeleton h-4 w-3/4"></div>
                  {/* Text skeleton */}
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-4 w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Skeleton Text
  if (variant === 'skeleton-text') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-full"></div>
        ))}
      </div>
    );
  }

  return null;
}

/**
 * LoadingScreen.Overlay - Loading overlay for existing content
 *
 * @example
 * ```tsx
 * <LoadingScreen.Overlay loading={isLoading}>
 *   <div>Your content here</div>
 * </LoadingScreen.Overlay>
 * ```
 */
interface OverlayProps {
  loading: boolean;
  children: ReactNode;
  text?: string;
  blur?: boolean;
  className?: string;
}

LoadingScreen.Overlay = function Overlay({
  loading,
  children,
  text = 'กำลังโหลด...',
  blur = true,
  className = '',
}: OverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            {text && (
              <p className="mt-3 text-base-content/60 text-sm">
                {text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * LoadingScreen.Skeleton - Custom skeleton component
 *
 * @example
 * ```tsx
 * <LoadingScreen.Skeleton className="h-32 w-full" />
 * <LoadingScreen.Skeleton className="h-4 w-1/2" circle />
 * ```
 */
interface SkeletonProps {
  circle?: boolean;
  className?: string;
}

LoadingScreen.Skeleton = function Skeleton({
  circle = false,
  className = '',
}: SkeletonProps) {
  return (
    <div className={`skeleton ${circle ? 'rounded-full' : ''} ${className}`}></div>
  );
};
