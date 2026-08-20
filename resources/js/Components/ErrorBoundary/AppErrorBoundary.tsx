import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';
import { reportClientError } from '@/Utils/errorReporter';
import CrashScreen from './CrashScreen';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Enterprise-grade Error Boundary to prevent the "White Screen of Death".
 * Catches rendering errors, async errors, and event handler crashes.
 */
class AppErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo);

        // Immediately report to Zeus Error Logs
        reportClientError({
            message: error.message || 'React Render Crash',
            stack: (error.stack || '') + '\n\nComponent Stack:\n' + (errorInfo.componentStack || ''),
            file: window.location.pathname,
            exception_class: error.name || 'ReactErrorBoundaryError',
        });
    }

    componentDidMount() {
        // Catch errors outside of the React lifecycle (async, event handlers, etc.)
        window.addEventListener('error', this.handleGlobalError);
        window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    }

    componentWillUnmount() {
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    }

    handleGlobalError = (event: ErrorEvent) => {
        // We only want to trigger our crash screen for serious errors
        // that aren't already caught by React or other logic.
        if (event.error) {
            this.setState({ hasError: true, error: event.error });
        }
    };

    handlePromiseRejection = (event: PromiseRejectionEvent) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.setState({ hasError: true, error });
    };

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return <CrashScreen error={this.state.error} resetError={this.resetError} />;
        }

        return this.props.children;
    }
}

export default AppErrorBoundary;
