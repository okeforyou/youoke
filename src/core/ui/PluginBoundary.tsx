import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    name: string;
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * PluginBoundary
 * 
 * The "Sandbox" for Plugins.
 * Wraps any modular plugin to ensure that if it crashes, 
 * it does not take down the entire application.
 * 
 * Usage:
 * <PluginBoundary name="AdsPlugin">
 *   <AdsPlugin />
 * </PluginBoundary>
 */
export class PluginBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[PluginBoundary:${this.props.name}] Crashed:`, error, errorInfo);
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        // In a real scenario, we might send this to Sentry/LogRocket
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default: Render nothing (Headless crash), so the UI remains clean
            // or render a small debug badge if in dev mode
            if (process.env.NODE_ENV === 'development') {
                return (
                    <div className="p-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded">
                        Plugin "{this.props.name}" Failed
                    </div>
                );
            }
            return null;
        }

        return this.props.children;
    }
}
