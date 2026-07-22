import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
    title?: string;
    message?: string;
    action?: ReactNode;
    className?: string;
}

/**
 * User lacks access to this section.
 */
export default function PermissionState({
    title = "You don't have access",
    message = 'Contact your estate admin if you believe this is a mistake.',
    action,
    className = '',
}: Props) {
    return (
        <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{message}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
