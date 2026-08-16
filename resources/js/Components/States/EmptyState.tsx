import type { ComponentType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
    icon?: ComponentType<{ className?: string }>;
    title?: string;
    message?: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

/**
 * Distinct empty state - no records exist (not an error).
 */
export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, description, action, className = '' }: Props) {
    const body = description ?? message ?? 'When data is available, it will show up here.';

    return (
        <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
