import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ComponentType, ReactNode } from 'react';

interface Props {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    nextStep?: string;
    action?: {
        label: string;
        href: string;
    };
    secondaryAction?: {
        label: string;
        href: string;
    };
    children?: ReactNode;
    className?: string;
    /** Visual density */
    size?: 'sm' | 'md';
}

/**
 * Premium empty state - illustration, clear message, motivating CTA.
 */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    nextStep,
    action,
    secondaryAction,
    children,
    className = '',
    size = 'md',
}: Props) {
    const isSm = size === 'sm';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-col items-center text-center ${isSm ? 'px-4 py-8' : 'px-6 py-12'} ${className}`}
        >
            {/* Soft illustration frame */}
            <div className="relative mb-5">
                <div
                    className="absolute -inset-3 rounded-[1.75rem] bg-linear-to-br from-blue-500/10 via-indigo-500/5 to-emerald-500/10 blur-xl dark:from-blue-500/15 dark:via-indigo-500/10 dark:to-emerald-500/10"
                    aria-hidden
                />
                <div
                    className={`relative flex items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_-12px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/[0.05] dark:bg-slate-900 dark:shadow-none dark:ring-white/10 ${
                        isSm ? 'h-14 w-14' : 'h-16 w-16'
                    }`}
                >
                    {/* Decorative rings */}
                    <svg
                        className="absolute inset-0 h-full w-full text-stone-200/80 dark:text-slate-700/80"
                        viewBox="0 0 64 64"
                        fill="none"
                        aria-hidden
                    >
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
                    </svg>
                    <Icon className={`relative text-primary-600 dark:text-primary-400 ${isSm ? 'h-6 w-6' : 'h-7 w-7'}`} />
                </div>
            </div>

            <h3
                className={`font-semibold tracking-tight text-stone-900 dark:text-white ${
                    isSm ? 'text-[14px]' : 'text-[15px]'
                }`}
            >
                {title}
            </h3>
            <p
                className={`mt-1.5 max-w-sm leading-relaxed text-stone-500 dark:text-slate-400 ${
                    isSm ? 'text-[12px]' : 'text-[13px]'
                }`}
            >
                {description}
            </p>

            {nextStep && (
                <p className="mt-3 max-w-sm rounded-full bg-stone-100/80 px-3 py-1.5 text-[12px] font-medium text-stone-600 dark:bg-white/[0.05] dark:text-slate-300">
                    <span className="text-primary-600 dark:text-primary-400">Next · </span>
                    {nextStep}
                </p>
            )}

            {children}

            {(action || secondaryAction) && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                    {action && (
                        <Link
                            href={action.href}
                            className="inline-flex items-center rounded-xl bg-stone-900 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-stone-900/15 transition hover:bg-stone-800 active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                        >
                            {action.label}
                        </Link>
                    )}
                    {secondaryAction && (
                        <Link
                            href={secondaryAction.href}
                            className="inline-flex items-center rounded-xl px-4 py-2.5 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                            {secondaryAction.label}
                        </Link>
                    )}
                </div>
            )}
        </motion.div>
    );
}
