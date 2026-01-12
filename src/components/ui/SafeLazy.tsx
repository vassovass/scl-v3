"use client";

import React, { Suspense, Component, ErrorInfo, ReactNode } from "react";
import { reportErrorClient } from "@/lib/errors";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * Internal Error Boundary to catch lazy loading failures (e.g., chunk load error)
 */
class LazyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error but don't crash the app
        // We treat third-party widget failures as non-critical
        reportErrorClient({
            name: "LazyLoadError",
            message: error.message,
            cause: error,
            context: { info: errorInfo },
        } as any);
    }

    render() {
        if (this.state.hasError) {
            // Fail silently for widgets, or render fallback if provided
            return this.props.fallback || null;
        }

        return this.props.children;
    }
}

interface SafeLazyProps {
    children: ReactNode;
    /** Optional placeholder while loading */
    fallback?: ReactNode;
    /** Optional fallback if error occurs (default: null/hidden) */
    errorFallback?: ReactNode;
}

/**
 * SafeLazy Wrapper
 * 
 * use this to wrap any third-party widget or heavy component that:
 * 1. Is loaded via React.lazy() or dynamic()
 * 2. Should NOT crash the page if it fails to load (e.g. ad blocker, network error)
 * 3. Should show a placeholder while loading (Skeleton)
 */
export function SafeLazy({ children, fallback = null, errorFallback = null }: SafeLazyProps) {
    // Optimization: Check for offline status could be added here
    // const isOnline = useOnlineStatus(); // if we had this hook
    // if (!isOnline) return null;

    return (
        <LazyErrorBoundary fallback={errorFallback}>
            <Suspense fallback={fallback}>
                {children}
            </Suspense>
        </LazyErrorBoundary>
    );
}
