import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

/**
 * ErrorBoundary Component - Catch React errors gracefully
 *
 * Features:
 * - Catches errors in child components
 * - Displays friendly error message
 * - Reset button to recover
 * - Logs errors in development
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 *
 * <ErrorBoundary
 *   fallback={<CustomErrorUI />}
 *   onError={(error, errorInfo) => logToService(error, errorInfo)}
 * >
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 */

interface Props {
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Error callback for logging */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body items-center text-center">
                {/* Icon */}
                <div className="rounded-full bg-error/10 p-4 mb-4">
                  <ExclamationTriangleIcon className="w-16 h-16 text-error" />
                </div>

                {/* Title */}
                <h2 className="card-title text-2xl mb-2">เกิดข้อผิดพลาด</h2>

                {/* Description */}
                <p className="text-base-content/60 mb-6">
                  เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้งหรือรีเฟรชหน้าเว็บ
                </p>

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="alert alert-error mb-4 text-left w-full">
                    <div className="flex flex-col gap-2 w-full">
                      <p className="font-bold text-sm">Error:</p>
                      <p className="text-xs font-mono break-all">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <>
                          <p className="font-bold text-sm mt-2">Component Stack:</p>
                          <pre className="text-xs overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="card-actions flex-col sm:flex-row gap-2 w-full">
                  <Button
                    onClick={this.handleReset}
                    variant="primary"
                    size="lg"
                    block
                  >
                    ลองใหม่อีกครั้ง
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    size="lg"
                    block
                  >
                    รีเฟรชหน้าเว็บ
                  </Button>
                </div>

                {/* Help Link */}
                <div className="mt-4">
                  <a
                    href="/"
                    className="link link-primary text-sm"
                  >
                    กลับไปหน้าหลัก
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error fallback component
 * Can be used as custom fallback for ErrorBoundary
 */
export function ErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="alert alert-error">
      <ExclamationTriangleIcon className="w-6 h-6" />
      <div className="flex-1">
        <h3 className="font-bold">เกิดข้อผิดพลาด</h3>
        <p className="text-sm">{error.message}</p>
      </div>
      <Button onClick={resetError} variant="outline" size="sm">
        ลองใหม่
      </Button>
    </div>
  );
}
