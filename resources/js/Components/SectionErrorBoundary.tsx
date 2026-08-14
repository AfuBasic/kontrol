import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

import ErrorState from '@/Components/States/ErrorState';

interface Props {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    onError?: (error: Error, info: ErrorInfo) => void;
    /** Optional label for logging. */
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Per-section error boundary - isolates widget failures so the rest of the page keeps working.
 */
export default class SectionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error(`[SectionErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info);
        this.props.onError?.(error, info);
    }

    reset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (typeof this.props.fallback === 'function') {
                return this.props.fallback(this.state.error, this.reset);
            }

            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="rounded-2xl bg-white ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-white/10">
                    <ErrorState
                        title="This section failed"
                        message={this.state.error.message || 'An unexpected error occurred.'}
                        onRetry={this.reset}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
