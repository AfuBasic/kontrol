import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    title?: string;
    message?: string;
    onRetry?: () => void;
    /** Prop names for router.reload({ only }) when onRetry is omitted. */
    only?: string[];
    action?: ReactNode;
    className?: string;
}

/**
 * Section failed to load - with retry.
 */
export default function ErrorState({
    title = 'Failed to load',
    message = 'Something went wrong loading this section. Please try again.',
    onRetry,
    only,
    action,
    className = '',
}: Props) {
    const handleRetry =
        onRetry ??
        (() => {
            if (only?.length) {
                router.reload({ only });
            } else {
                router.reload();
            }
        });

    return (
        <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
            {action ?? (
                <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-5 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
