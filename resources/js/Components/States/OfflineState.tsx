import { WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    title?: string;
    message?: string;
    /** ISO timestamp of last successful cache, if available. */
    lastCachedAt?: string | null;
    action?: ReactNode;
    className?: string;
}

function formatCachedAt(iso: string): string {
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

/**
 * Feature unavailable offline (with optional last-cached hint).
 */
export default function OfflineState({
    title = 'Unavailable offline',
    message = 'This section needs an internet connection.',
    lastCachedAt,
    action,
    className = '',
}: Props) {
    return (
        <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <WifiOff className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
            {lastCachedAt && (
                <p className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                    Last updated {formatCachedAt(lastCachedAt)}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
