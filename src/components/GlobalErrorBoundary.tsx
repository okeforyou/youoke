import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: _, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="max-w-xl w-full bg-white rounded-lg shadow-xl overflow-hidden border border-red-200">
                        <div className="bg-red-500 p-4 text-white">
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                ⚠️ Client-side Exception Detected
                            </h1>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 p-4 rounded-md border border-red-100">
                                <p className="text-red-800 font-medium mb-2">{this.state.error?.toString()}</p>
                                <div className="text-xs text-red-600 font-mono overflow-auto max-h-40 bg-white p-2 rounded border border-red-100">
                                    {this.state.errorInfo?.componentStack}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
                                >
                                    Reload Page
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition font-medium"
                                >
                                    Reset Storage & Reload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
